<?php

namespace App\Listeners;

use App\Events\BookingCreated;
use App\Events\BookingConfirmed;
use App\Events\BookingRejected;
use App\Events\BookingCancelled;
use App\Events\BookingStatusChanged;
use App\Events\BookingEvent;
use App\Models\BookingActivityLog;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * Listener that logs all booking events to the activity log.
 * 
 * This creates an immutable audit trail for:
 * - Debugging and support investigations
 * - Compliance requirements
 * - Analytics and reporting
 * - Future notification system event source
 */
class LogBookingActivity implements ShouldQueue
{
    /**
     * Handle booking created events.
     */
    public function handleBookingCreated(BookingCreated $event): void
    {
        $this->logActivity($event, BookingActivityLog::ACTOR_GUEST);
    }

    /**
     * Handle booking confirmed events.
     */
    public function handleBookingConfirmed(BookingConfirmed $event): void
    {
        $this->logActivity($event, BookingActivityLog::ACTOR_HOST);
    }

    /**
     * Handle booking rejected events.
     */
    public function handleBookingRejected(BookingRejected $event): void
    {
        $this->logActivity($event, BookingActivityLog::ACTOR_HOST);
    }

    /**
     * Handle booking cancelled events.
     */
    public function handleBookingCancelled(BookingCancelled $event): void
    {
        $actorType = $event->cancelledBy === 'guest' 
            ? BookingActivityLog::ACTOR_GUEST 
            : BookingActivityLog::ACTOR_HOST;
            
        $this->logActivity($event, $actorType);
    }

    /**
     * Handle generic status change events.
     */
    public function handleBookingStatusChanged(BookingStatusChanged $event): void
    {
        $this->logActivity($event, BookingActivityLog::ACTOR_SYSTEM);
    }

    /**
     * Create the activity log entry.
     */
    protected function logActivity(BookingEvent $event, string $actorType): void
    {
        try {
            BookingActivityLog::fromEvent(
                $event,
                $actorType,
                request()?->ip(),
                request()?->userAgent()
            );

            Log::info('Booking activity logged', [
                'event_type' => $event->eventType,
                'booking_id' => $event->booking->id,
                'actor_type' => $actorType,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to log booking activity', [
                'event_type' => $event->eventType,
                'booking_id' => $event->booking->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Register the listeners for the subscriber.
     *
     * @param \Illuminate\Events\Dispatcher $events
     * @return array<string, string>
     */
    public function subscribe($events): array
    {
        return [
            BookingCreated::class => 'handleBookingCreated',
            BookingConfirmed::class => 'handleBookingConfirmed',
            BookingRejected::class => 'handleBookingRejected',
            BookingCancelled::class => 'handleBookingCancelled',
            BookingStatusChanged::class => 'handleBookingStatusChanged',
        ];
    }
}
