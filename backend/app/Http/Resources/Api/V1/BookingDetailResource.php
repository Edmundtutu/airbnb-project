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
            'price' => (float) $this->price,
            'price_per_night' => (float) $this->price_per_night,
            'nights' => $this->nights,
            'subtotal' => (float) $this->subtotal,
            'cleaning_fee' => (float) $this->cleaning_fee,
            'service_fee' => (float) $this->service_fee,
            'selected_amenities' => $this->selected_amenities,
            'addon_services' => $this->addon_services,
            'listing' => new ListingResource($this->whenLoaded('listing')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}