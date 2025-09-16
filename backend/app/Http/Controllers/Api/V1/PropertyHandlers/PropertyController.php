<?php

namespace App\Http\Controllers\Api\V1\PropertyHandlers;

use App\Http\Controllers\Controller;
use App\Http\Filters\V1\PropertyFilter;
use App\Http\Requests\Api\V1\StorePropertyRequest;
use App\Http\Requests\Api\V1\UpdatePropertyRequest;
use App\Http\Resources\Api\V1\PropertyResource;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PropertyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Property::query();

        // Text search across multiple columns using a single 'search' param
        if ($request->filled('search')) {
            $search = '%' . $request->query('search') . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', $search)
                  ->orWhere('description', 'LIKE', $search)
                  ->orWhere('address', 'LIKE', $search);
            });
        }

        // Location filtering using Haversine formula (distance in km)
        if ($request->has(['lat', 'lng', 'radius'])) {
            $lat = (float) $request->query('lat');
            $lng = (float) $request->query('lng');
            $radius = (float) $request->query('radius');

            $haversine = "(6371 * acos(cos(radians(?)) * cos(radians(lat)) * cos(radians(lng) - radians(?)) + sin(radians(?)) * sin(radians(lat))))";
            $query->select('*')
                  ->selectRaw("{$haversine} AS distance", [$lat, $lng, $lat])
                  ->whereRaw("{$haversine} < ?", [$lat, $lng, $lat, $radius])
                  ->orderBy('distance');
        }

        // Structured filters via ApiFilter
        $filter = new PropertyFilter();
        foreach ($filter->transform($request) as $clause) {
            [$column, $op, $value] = $clause;
            switch ($op) {
                case 'IN':
                    $values = is_array($value) ? $value : explode(',', (string) $value);
                    $query->whereIn($column, $values);
                    break;
                case 'NOT IN':
                    $values = is_array($value) ? $value : explode(',', (string) $value);
                    $query->whereNotIn($column, $values);
                    break;
                case 'BETWEEN':
                    $bounds = is_array($value) ? $value : explode(',', (string) $value);
                    if (count($bounds) === 2) {
                        $query->whereBetween($column, [$bounds[0], $bounds[1]]);
                    }
                    break;
                case 'NOT BETWEEN':
                    $bounds = is_array($value) ? $value : explode(',', (string) $value);
                    if (count($bounds) === 2) {
                        $query->whereNotBetween($column, [$bounds[0], $bounds[1]]);
                    }
                    break;
                default:
                    // LIKE should include wildcards if client didn't supply
                    if ($op === 'LIKE' && is_string($value) && strpos($value, '%') === false) {
                        $value = '%' . $value . '%';
                    }
                    $query->where($column, $op, $value);
            }
        }

        $query->with('reviews'); // Eager load reviews for rating/total reviews

        return PropertyResource::collection($query->paginate());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePropertyRequest $request)
    {
        $validated = $request->validated();
        $validated['host_id'] = Auth::id();

        $property = Property::create($validated);

        return new PropertyResource($property);
    }

    /**
     * Display the specified resource.
     */
    public function show(Property $property)
    {
        // Ensure reviews are loaded so rating/total_reviews are populated
        $property->load('reviews');
        return new PropertyResource($property);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePropertyRequest $request, Property $property)
    {
        $this->authorize('update', $property);

        $property->update($request->validated());

        return new PropertyResource($property);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Property $property)
    {
        $this->authorize('delete', $property);

        $property->delete();

        return response()->noContent();
    }
}
