<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use App\Http\Resources\Api\V1\ShopResource;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @deprecated Use ListingResource instead
 */
class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'shop_id' => $this->shop_id,
            'name' => $this->name,
            'description' => $this->description ?? '', // Ensure description is not null
            'price' => (float) $this->price,
            'stock' => $this->stock,
            'images' => $this->images,
            'category' => $this->category, // Ensure category is included
            'tags' => $this->tags,
            'rating' => $this->whenLoaded('reviews', fn () => round($this->reviews->avg('rating'), 1), 0), // Calculate rating
            'total_reviews' => $this->whenLoaded('reviews', fn () => $this->reviews->count(), 0), // Calculate total reviews
            'shop' => new ShopResource($this->whenLoaded('shop')), // Include shop resource when loaded
            // 'created_at' and 'updated_at' are generally not needed in API lists unless specifically requested
        ];
    }
}
