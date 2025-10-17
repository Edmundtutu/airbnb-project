<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use App\Http\Resources\Api\V1\UserResource;
use App\Http\Resources\Api\V1\ProductResource;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Resources\Json\JsonResource;

class PostResource extends JsonResource
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
            'user' => new UserResource($this->user),
            'product' => ProductResource::make($this->whenLoaded('product')),
            'content' => $this->content,
            'images' => $this->images,
            'likes_count' => $this->whenLoaded('likes', fn () => $this->likes->count(), 0),
            'comments_count' => $this->whenLoaded('comments', fn () => $this->comments->count(), 0),
            'liked_by_user' => $this->whenLoaded('likes', fn () => $this->likes->contains('user_id', Auth::id()), false),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            // Optional: Retain user_id, product_id, shop_id if needed, but they are redundant with the nested resources
            // 'user_id' => $this->user_id,
            // 'product_id' => $this->product_id,
            // 'shop_id' => $this->shop_id,
        ];
    }
}
