<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookingReservationResource extends JsonResource
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
            'listing_id' => $this->listing_id ?? optional($this->details->first())->listing_id,
            'check_in_date' => optional($this->check_in_date)->toDateString(),
            'check_out_date' => optional($this->check_out_date)->toDateString(),
            'status' => $this->status,
            'guest_count' => $this->guest_count,
        ];
    }
}
