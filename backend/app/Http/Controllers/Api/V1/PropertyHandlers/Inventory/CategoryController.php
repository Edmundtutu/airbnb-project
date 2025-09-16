<?php

namespace App\Http\Controllers\Api\V1\ShopHandlers\Inventory;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\CategoryResource;
use App\Models\Category;
use App\Models\Shop;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::query();

        if ($request->filled('shop_id')) {
            $query->where('shop_id', $request->query('shop_id'));
        }

        return CategoryResource::collection($query->latest()->paginate());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'shop_id' => 'required|ulid|exists:shops,id',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
        ]);

        $shop = Shop::findOrFail($validated['shop_id']);
        $this->authorize('update', $shop);

        // enforce unique name per shop
        if (Category::where('shop_id', $validated['shop_id'])->where('name', $validated['name'])->exists()) {
            return response()->json(['message' => 'Category name already exists for this shop.'], 422);
        }

        $category = Category::create($validated);

        return new CategoryResource($category);
    }

    public function show(Category $category)
    {
        return new CategoryResource($category);
    }

    public function update(Request $request, Category $category)
    {
        $this->authorize('update', $category->shop);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'description' => 'sometimes|nullable|string',
        ]);

        if (isset($validated['name'])) {
            $exists = Category::where('shop_id', $category->shop_id)
                ->where('name', $validated['name'])
                ->where('id', '!=', $category->id)
                ->exists();
            if ($exists) {
                return response()->json(['message' => 'Category name already exists for this shop.'], 422);
            }
        }

        $category->update($validated);

        return new CategoryResource($category);
    }

    public function destroy(Category $category)
    {
        $this->authorize('update', $category->shop);

        $category->delete();

        return response()->noContent();
    }
}


