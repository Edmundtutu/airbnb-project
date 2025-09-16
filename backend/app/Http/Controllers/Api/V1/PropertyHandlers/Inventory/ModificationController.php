<?php

namespace App\Http\Controllers\Api\V1\ShopHandlers\Inventory;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\ModificationResource;
use App\Models\Modification;
use App\Models\Product;
use Illuminate\Http\Request;

class ModificationController extends Controller
{
    public function index(Request $request)
    {
        $query = Modification::query();
        if ($request->filled('product_id')) {
            $query->where('product_id', $request->query('product_id'));
        }
        return ModificationResource::collection($query->latest()->paginate());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|ulid|exists:products,id',
            'name' => 'required|string|max:100',
            'cost' => 'nullable|numeric',
        ]);

        $product = Product::findOrFail($validated['product_id']);
        $this->authorize('update', $product);

        if (Modification::where('product_id', $validated['product_id'])->where('name', $validated['name'])->exists()) {
            return response()->json(['message' => 'Modification already exists for this product.'], 422);
        }

        $mod = Modification::create($validated);
        return new ModificationResource($mod);
    }

    public function update(Request $request, Modification $modification)
    {
        $this->authorize('update', $modification->product);
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'cost' => 'sometimes|nullable|numeric',
        ]);
        if (isset($validated['name'])) {
            $exists = Modification::where('product_id', $modification->product_id)
                ->where('name', $validated['name'])
                ->where('id', '!=', $modification->id)
                ->exists();
            if ($exists) {
                return response()->json(['message' => 'Modification already exists for this product.'], 422);
            }
        }
        $modification->update($validated);
        return new ModificationResource($modification);
    }

    public function destroy(Modification $modification)
    {
        $this->authorize('update', $modification->product);
        $modification->delete();
        return response()->noContent();
    }
}


