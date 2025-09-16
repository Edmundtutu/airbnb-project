<?php

namespace App\Http\Controllers\Api\V1\BookingHandlers;

use App\Http\Controllers\Controller;
use App\Http\Filters\V1\ListingFilter;
use App\Http\Requests\Api\V1\StoreListingRequest;
use App\Http\Requests\Api\V1\UpdateListingRequest;
use App\Http\Resources\Api\V1\ListingResource;
use App\Models\Listing;
use App\Models\Property;
use Illuminate\Http\Request;

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
}
