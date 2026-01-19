<?php

namespace App\Listeners;

use App\Events\BookingCreated;
use App\Events\BookingConfirmed;
use App\Events\BookingRejected;
use App\Events\BookingCancelled;
use App\Models\User;
use App\Notifications\NewBookingRequestNotification;
use App\Notifications\BookingConfirmedNotification;
use App\Notifications\BookingRejectedNotification;
use App\Notifications\BookingCancelledNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * Subscriber that dispatches notifications for booking lifecycle events.
 * 
 * Each event triggers a notification to the relevant party:
 * - BookingCreated → Notify host of new request
 * - BookingConfirmed → Notify guest of confirmation
 * - BookingRejected → Notify guest of rejection
 * - BookingCancelled → Notify the OTHER party
 */
class SendBookingNotifications implements ShouldQueue
{
    /**
     * Handle booking created events.
     * Notify the property host of the new booking request.
     */
    public function handleBookingCreated(BookingCreated $event): void
    {
        try {
            $booking = $event->booking->load('property.host');
            $host = $booking->property?->host;

            if (!$host) {
                Log::warning('Cannot send new booking notification: host not found', [
                    'booking_id' => $booking->id,
                    'property_id' => $booking->property_id,
                ]);
                return;
            }

            $host->notify(new NewBookingRequestNotification($booking));

            Log::info('New booking notification sent to host', [
                'booking_id' => $booking->id,
                'host_id' => $host->id,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send new booking notification', [
                'booking_id' => $event->booking->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle booking confirmed events.
     * Notify the guest that their booking was confirmed.
     */
    public function handleBookingConfirmed(BookingConfirmed $event): void
    {
        try {
            $booking = $event->booking->load('guest');
            $guest = $booking->guest;

            if (!$guest) {
                Log::warning('Cannot send booking confirmed notification: guest not found', [
                    'booking_id' => $booking->id,
                ]);
                return;
            }

            $guest->notify(new BookingConfirmedNotification($booking));

            Log::info('Booking confirmed notification sent to guest', [
                'booking_id' => $booking->id,
                'guest_id' => $guest->id,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send booking confirmed notification', [
                'booking_id' => $event->booking->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle booking rejected events.
     * Notify the guest that their booking was rejected.
     */
    public function handleBookingRejected(BookingRejected $event): void
    {
        try {
            $booking = $event->booking->load('guest');
            $guest = $booking->guest;

            if (!$guest) {
                Log::warning('Cannot send booking rejected notification: guest not found', [
                    'booking_id' => $booking->id,
                ]);
                return;
            }

            $guest->notify(new BookingRejectedNotification($booking, $event->reason));

            Log::info('Booking rejected notification sent to guest', [
                'booking_id' => $booking->id,
                'guest_id' => $guest->id,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send booking rejected notification', [
                'booking_id' => $event->booking->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle booking cancelled events.
     * Notify the OTHER party (host if guest cancelled, guest if host cancelled).
     */
    public function handleBookingCancelled(BookingCancelled $event): void
    {
        try {
            $booking = $event->booking->load(['guest', 'property.host']);
            $cancelledBy = $event->cancelledBy;

            // Determine who to notify (the OTHER party)
            if ($cancelledBy === 'guest') {
                // Guest cancelled, notify host
                $recipient = $booking->property?->host;
                $recipientType = 'host';
            } else {
                // Host cancelled, notify guest
                $recipient = $booking->guest;
                $recipientType = 'guest';
            }

            if (!$recipient) {
                Log::warning("Cannot send booking cancelled notification: {$recipientType} not found", [
                    'booking_id' => $booking->id,
                    'cancelled_by' => $cancelledBy,
                ]);
                return;
            }

            $recipient->notify(new BookingCancelledNotification(
                $booking,
                $cancelledBy,
                $event->reason
            ));

            Log::info("Booking cancelled notification sent to {$recipientType}", [
                'booking_id' => $booking->id,
                'recipient_id' => $recipient->id,
                'cancelled_by' => $cancelledBy,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send booking cancelled notification', [
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
        ];
    }
}
