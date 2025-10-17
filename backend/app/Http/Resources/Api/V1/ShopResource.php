<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @deprecated Use PropertyResource instead
 */
class ShopResource extends JsonResource
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
            'owner_id' => $this->owner_id,
            'name' => $this->name,
            'description' => $this->description,
            'address' => $this->address,
            'lat' => $this->lat,
            'lng' => $this->lng,
            'avatar' => $this->avatar,
            'cover_image' => $this->cover_image,
            'phone' => $this->phone,
            'hours' => $this->hours,
            'verified' => $this->verified,
            'distance' => $this->when(isset($this->distance), (float) $this->distance),
 'rating' => $this->whenLoaded('reviews', fn () => round($this->reviews->avg('rating'), 1), 0),
 'total_reviews' => $this->whenLoaded('reviews', fn () => $this->reviews->count(), 0),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
