<?php

namespace App\Events;

use App\Models\Booking;

/**
 * Dispatched when a booking is rejected by the host.
 * 
 * Listeners can:
 * - Log activity
 * - Send rejection notification to guest
 * - Release any held calendar dates
 * - Trigger refund (if payment was captured)
 */
class BookingRejected extends BookingEvent
{
    public string $previousStatus;

    public function __construct(
        Booking $booking,
        string $previousStatus,
        ?string $triggeredBy = null,
        ?string $reason = null,
        array $metadata = []
    ) {
        parent::__construct(
            $booking,
            'rejected',
            $triggeredBy,
            $reason,
            array_merge([
                'previous_status' => $previousStatus,
            ], $metadata)
        );
        
        $this->previousStatus = $previousStatus;
    }
}
