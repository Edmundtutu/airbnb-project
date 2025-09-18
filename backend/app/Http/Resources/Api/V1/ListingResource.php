<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ListingResource extends JsonResource
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
            'property_id' => $this->property_id,
            'name' => $this->name,
            'description' => $this->description ?? '',
            'price_per_night' => (float) $this->price_per_night,
            'max_guests' => $this->max_guests,
            'bedrooms' => $this->bedrooms,
            'bathrooms' => $this->bathrooms,
            'images' => $this->images,
            'category' => $this->category,
            'amenities' => $this->amenities,
            'house_rules' => $this->house_rules,
            'tags' => $this->tags,
            'check_in_time' => $this->check_in_time,
            'check_out_time' => $this->check_out_time,
            'cleaning_fee' => (float) $this->cleaning_fee,
            'service_fee' => (float) $this->service_fee,
            'instant_book' => $this->instant_book,
            'is_active' => $this->is_active,
            'rating' => $this->whenLoaded('reviews', fn () => round($this->reviews->avg('rating'), 1), 0),
            'total_reviews' => $this->whenLoaded('reviews', fn () => $this->reviews->count(), 0),
            'property' => new PropertyResource($this->whenLoaded('property')),
            'availability' => $this->when(isset($this->availability), $this->availability),
            'distance' => $this->when(isset($this->distance), (float) $this->distance),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}