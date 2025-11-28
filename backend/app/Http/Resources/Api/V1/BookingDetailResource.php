<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookingDetailResource extends JsonResource
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
            'booking_id' => $this->booking_id,
            'listing_id' => $this->listing_id,
            'price_per_night' => (float) $this->price_per_night,
            'nights' => $this->nights,
            'line_total' => (float) ($this->price_per_night * $this->nights),
            'listing' => new ListingResource($this->whenLoaded('listing')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}