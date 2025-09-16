<?php

namespace App\Http\Controllers\Api\V1\ShopHandlers\Inventory;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\AddonResource;
use App\Models\Addon;
use App\Models\Product;
use Illuminate\Http\Request;

class AddonController extends Controller
{
    public function index(Request $request)
    {
        $query = Addon::query();
        if ($request->filled('product_id')) {
            $query->where('product_id', $request->query('product_id'));
        }
        return AddonResource::collection($query->latest()->paginate());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|ulid|exists:products,id',
            'name' => 'required|string|max:100',
            'price' => 'nullable|numeric',
        ]);

        $product = Product::findOrFail($validated['product_id']);
        $this->authorize('update', $product);

        if (Addon::where('product_id', $validated['product_id'])->where('name', $validated['name'])->exists()) {
            return response()->json(['message' => 'Addon already exists for this product.'], 422);
        }

        $addon = Addon::create($validated);
        return new AddonResource($addon);
    }

    public function update(Request $request, Addon $addon)
    {
        $this->authorize('update', $addon->product);
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'price' => 'sometimes|nullable|numeric',
        ]);
        if (isset($validated['name'])) {
            $exists = Addon::where('product_id', $addon->product_id)
                ->where('name', $validated['name'])
                ->where('id', '!=', $addon->id)
                ->exists();
            if ($exists) {
                return response()->json(['message' => 'Addon already exists for this product.'], 422);
            }
        }
        $addon->update($validated);
        return new AddonResource($addon);
    }

    public function destroy(Addon $addon)
    {
        $this->authorize('update', $addon->product);
        $addon->delete();
        return response()->noContent();
    }
}


