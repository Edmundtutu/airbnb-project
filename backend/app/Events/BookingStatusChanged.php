<?php

namespace App\Events;

use App\Models\Booking;

/**
 * Dispatched when a booking status changes (generic).
 * Use this for transitions not covered by specific events.
 * 
 * Listeners can:
 * - Log activity for any status change
 * - Update analytics/metrics
 * - Trigger status-specific notifications
 */
class BookingStatusChanged extends BookingEvent
{
    public string $previousStatus;
    public string $newStatus;

    public function __construct(
        Booking $booking,
        string $previousStatus,
        string $newStatus,
        ?string $triggeredBy = null,
        ?string $reason = null,
        array $metadata = []
    ) {
        parent::__construct(
            $booking,
            'status_changed',
            $triggeredBy,
            $reason,
            array_merge([
                'previous_status' => $previousStatus,
                'new_status' => $newStatus,
            ], $metadata)
        );
        
        $this->previousStatus = $previousStatus;
        $this->newStatus = $newStatus;
    }
}
