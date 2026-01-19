<?php

namespace App\Events;

use App\Models\Booking;

/**
 * Dispatched when a booking is confirmed by the host.
 * 
 * Listeners can:
 * - Log activity
 * - Send confirmation notification to guest
 * - Block calendar availability
 * - Trigger payment capture (if using auth-capture flow)
 */
class BookingConfirmed extends BookingEvent
{
    public string $previousStatus;

    public function __construct(
        Booking $booking,
        string $previousStatus,
        ?string $triggeredBy = null,
        array $metadata = []
    ) {
        parent::__construct(
            $booking,
            'confirmed',
            $triggeredBy,
            null,
            array_merge([
                'previous_status' => $previousStatus,
            ], $metadata)
        );
        
        $this->previousStatus = $previousStatus;
    }
}
