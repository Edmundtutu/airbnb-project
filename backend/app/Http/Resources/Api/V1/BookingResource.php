<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookingResource extends JsonResource
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
            'guest_id' => $this->guest_id,
            'property_id' => $this->property_id,
            'listing_id' => $this->listing_id,
            'total_price' => (float) $this->total_price,
            'price_per_night' => (float) $this->price_per_night,
            'nights' => $this->nights,
            'cleaning_fee' => (float) $this->cleaning_fee,
            'service_fee' => (float) $this->service_fee,
            'check_in' => $this->check_in,
            'check_out' => $this->check_out,
            'guests' => $this->guests,
            'status' => $this->status,
            'notes' => $this->notes,
            'special_requests' => $this->special_requests,
            'arrival_time' => $this->arrival_time,
            'guest' => $this->when(
                str_contains($request->route()->uri(), 'host/bookings'), 
                new UserResource($this->whenLoaded('guest'))
            ),
            'host' => $this->when(
                str_contains($request->route()->uri(), 'guest/bookings'), 
                new UserResource($this->whenLoaded('host'))
            ),
            'listing' => new ListingResource($this->whenLoaded('listing')),
            'property' => new PropertyResource($this->whenLoaded('property')),
            'booking_details' => BookingDetailResource::collection($this->whenLoaded('bookingDetails')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}