<?php

namespace App\Events;

use App\Models\Booking;

/**
 * Dispatched when a booking is cancelled.
 * 
 * Listeners can:
 * - Log activity
 * - Notify the other party (host if guest cancelled, guest if host cancelled)
 * - Release blocked calendar dates
 * - Process refund based on cancellation policy
 */
class BookingCancelled extends BookingEvent
{
    public string $previousStatus;
    public string $cancelledBy; // 'guest' or 'host'

    public function __construct(
        Booking $booking,
        string $previousStatus,
        string $cancelledBy,
        ?string $triggeredBy = null,
        ?string $reason = null,
        array $metadata = []
    ) {
        parent::__construct(
            $booking,
            'cancelled',
            $triggeredBy,
            $reason,
            array_merge([
                'previous_status' => $previousStatus,
                'cancelled_by' => $cancelledBy,
            ], $metadata)
        );
        
        $this->previousStatus = $previousStatus;
        $this->cancelledBy = $cancelledBy;
    }
}
