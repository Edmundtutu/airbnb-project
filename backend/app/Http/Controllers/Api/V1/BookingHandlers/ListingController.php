<?php

namespace App\Http\Controllers\Api\V1\BookingHandlers;

use App\Http\Controllers\Controller;
use App\Http\Filters\V1\ListingFilter;
use App\Http\Requests\Api\V1\StoreListingRequest;
use App\Http\Requests\Api\V1\UpdateListingRequest;
use App\Http\Resources\Api\V1\ListingResource;
use App\Http\Resources\Api\V1\ReviewResource;
use App\Models\Listing;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ListingController extends Controller
{
    public function index(Request $request)
    {
        // Instantiate the filter
        $filter = new ListingFilter();
        // Transform the request parameters into filter conditions
        $filterItems = $filter->transform($request);

        // Start building the query
        $query = Listing::query();

        // Separate search filters and other filters
        $searchFilters = [];
        $otherFilters = [];
        foreach ($filterItems as $item) {
            if (in_array($item[0], ['name', 'description', 'tags']) && $item[1] === 'LIKE') {
                $searchFilters[] = $item;
            } else {
                $otherFilters[] = $item;
            }
        }

        // Apply non-search filters
        $query->where($otherFilters);

        // Apply search filters within an orWhere group
        if (!empty($searchFilters)) {
            $query->where(function ($q) use ($searchFilters) {
                foreach ($searchFilters as $searchItem) {
                    $q->orWhere($searchItem[0], $searchItem[1], $searchItem[2]);
                }
            });
        }

        // Handle JSON array filtering for amenities (AND logic - must have ALL selected amenities)
        if ($request->has('amenities')) {
            $amenities = is_array($request->input('amenities'))
                ? $request->input('amenities')
                : explode(',', $request->input('amenities'));

            foreach ($amenities as $amenity) {
                $amenity = trim($amenity);
                if (!empty($amenity)) {
                    $query->whereJsonContains('amenities', $amenity);
                }
            }
        }

        // Handle JSON array filtering for house_rules
        if ($request->has('house_rules')) {
            $rules = is_array($request->input('house_rules'))
                ? $request->input('house_rules')
                : explode(',', $request->input('house_rules'));

            foreach ($rules as $rule) {
                $rule = trim($rule);
                if (!empty($rule)) {
                    $query->whereJsonContains('house_rules', $rule);
                }
            }
        }

        // Handle JSON array filtering for accessibility_features
        if ($request->has('accessibility')) {
            $features = is_array($request->input('accessibility'))
                ? $request->input('accessibility')
                : explode(',', $request->input('accessibility'));

            foreach ($features as $feature) {
                $feature = trim($feature);
                if (!empty($feature)) {
                    $query->whereJsonContains('accessibility_features', $feature);
                }
            }
        }

        // Simple parameter aliases for cleaner frontend requests
        // Price range filtering via minPrice/maxPrice
        if ($request->has('minPrice')) {
            $query->where('price_per_night', '>=', (float) $request->input('minPrice'));
        }
        if ($request->has('maxPrice')) {
            $query->where('price_per_night', '<=', (float) $request->input('maxPrice'));
        }

        // Simple search parameter (searches name, description, tags)
        if ($request->has('search') && !empty($request->input('search'))) {
            $searchTerm = '%' . $request->input('search') . '%';
            $rawSearchTerm = $request->input('search');
            $query->where(function ($q) use ($searchTerm, $rawSearchTerm) {
                $q->where('name', 'LIKE', $searchTerm)
                    ->orWhere('description', 'LIKE', $searchTerm)
                    ->orWhereJsonContains('tags', $rawSearchTerm);
            });
        }

        // Apply eager loading for the property and reviews relationships
        $query->with(['property', 'reviews']);

        // Pagination (default 10 per page)
        $perPage = (int) ($request->query('per_page', 10));
        $listings = $query->paginate($perPage)->appends($request->query());

        return ListingResource::collection($listings);
    }

    public function store(StoreListingRequest $request)
    {
        $validated = $request->validated();
        $property = Property::findOrFail($validated['property_id']);

        $this->authorize('create', [Listing::class, $property]);

        $categoryIds = $validated['category_ids'] ?? [];
        unset($validated['category_ids']);

        $listing = Listing::create($validated);
        if (!empty($categoryIds)) {
            $listing->categories()->sync($categoryIds);
        }

        return new ListingResource($listing);
    }

    public function show(Listing $listing)
    {
        return new ListingResource($listing->load(['property', 'reviews']));
    }

    public function update(UpdateListingRequest $request, Listing $listing)
    {
        $this->authorize('update', $listing);

        $validated = $request->validated();
        $categoryIds = $validated['category_ids'] ?? null;
        unset($validated['category_ids']);
        $listing->update($validated);
        if (is_array($categoryIds)) {
            $listing->categories()->sync($categoryIds);
        }

        return new ListingResource($listing);
    }

    public function destroy(Listing $listing)
    {
        $this->authorize('delete', $listing);

        $listing->delete();

        return response()->noContent();
    }

    public function hostListings(Request $request)
    {
        $this->authorize('viewAny', Listing::class);

        $listings = Listing::with(['property', 'reviews'])
            ->whereHas('property', fn($query) => $query->where('host_id', Auth::id()))
            ->orderByDesc('created_at')
            ->get();

        return ListingResource::collection($listings);
    }

    public function listingReviews(Request $request, Listing $listing)
    {
        $query = $listing->reviews()->with('user');

        // Filter by rating if provided
        if ($request->has('rating')) {
            $query->where('rating', $request->rating);
        }

        // Sort by field if provided
        if ($request->has('sort') && $request->has('order')) {
            $query->orderBy($request->sort, $request->order);
        } else {
            $query->latest();
        }

        $reviews = $query->paginate();

        return ReviewResource::collection($reviews);
    }
}
