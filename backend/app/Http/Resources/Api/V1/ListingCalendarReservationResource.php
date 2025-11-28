<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ListingCalendarReservationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this['id'],
            'booking_id' => $this['booking_id'],
            'listing_id' => $this['listing_id'],
            'listing_name' => $this['listing_name'],
            'property_id' => $this['property_id'],
            'property_name' => $this['property_name'],
            'guest_id' => $this['guest_id'],
            'guest_name' => $this['guest_name'],
            'guest_count' => $this['guest_count'],
            'status' => $this['status'],
            'check_in_date' => $this['check_in_date'],
            'check_out_date' => $this['check_out_date'],
        ];
    }
}
