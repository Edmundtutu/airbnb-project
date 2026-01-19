<?php

namespace App\Events;

use App\Models\Booking;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Base event for all booking-related events.
 * Provides common structure and payload for booking lifecycle events.
 */
abstract class BookingEvent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Booking $booking;
    public string $eventType;
    public ?string $triggeredBy;
    public ?string $reason;
    public array $metadata;

    /**
     * Create a new event instance.
     *
     * @param Booking $booking The booking that triggered the event
     * @param string $eventType Type of event (created, confirmed, rejected, cancelled, etc.)
     * @param string|null $triggeredBy User ID who triggered the event (null for system)
     * @param string|null $reason Optional reason for the state change
     * @param array $metadata Additional event-specific metadata
     */
    public function __construct(
        Booking $booking,
        string $eventType,
        ?string $triggeredBy = null,
        ?string $reason = null,
        array $metadata = []
    ) {
        $this->booking = $booking;
        $this->eventType = $eventType;
        $this->triggeredBy = $triggeredBy;
        $this->reason = $reason;
        $this->metadata = $metadata;
    }

    /**
     * Get the standardized event payload for logging/notifications.
     *
     * @return array
     */
    public function getPayload(): array
    {
        return [
            'event_type' => $this->eventType,
            'booking_id' => $this->booking->id,
            'property_id' => $this->booking->property_id,
            'guest_id' => $this->booking->guest_id,
            'status' => $this->booking->status,
            'check_in_date' => optional($this->booking->check_in_date)->toDateString(),
            'check_out_date' => optional($this->booking->check_out_date)->toDateString(),
            'guest_count' => $this->booking->guest_count,
            'total' => $this->booking->total,
            'triggered_by' => $this->triggeredBy,
            'reason' => $this->reason,
            'metadata' => $this->metadata,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
