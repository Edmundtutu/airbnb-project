<?php

namespace App\Events;

use App\Models\Booking;

/**
 * Dispatched when a new booking is created.
 * 
 * Listeners can:
 * - Log activity
 * - Send confirmation email to guest
 * - Notify host of new booking request
 * - Update analytics/metrics
 */
class BookingCreated extends BookingEvent
{
    public function __construct(
        Booking $booking,
        ?string $triggeredBy = null,
        array $metadata = []
    ) {
        parent::__construct(
            $booking,
            'created',
            $triggeredBy,
            null,
            array_merge([
                'initial_status' => $booking->status,
            ], $metadata)
        );
    }
}
