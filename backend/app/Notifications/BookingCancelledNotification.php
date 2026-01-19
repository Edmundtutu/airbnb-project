<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Notification sent when a booking is cancelled.
 * Sent to the OTHER party (host if guest cancelled, guest if host cancelled).
 */
class BookingCancelledNotification extends BookingNotification
{
    protected string $notificationType = 'booking_cancelled';
    protected string $cancelledBy; // 'guest' or 'host'
    protected ?string $reason;

    public function __construct(Booking $booking, string $cancelledBy, ?string $reason = null)
    {
        parent::__construct($booking);
        $this->cancelledBy = $cancelledBy;
        $this->reason = $reason;
        $this->booking->load(['guest', 'property.host', 'details.listing']);
    }

    protected function getPreferenceKey(): string
    {
        return 'booking_cancelled';
    }

    public function getTitle(): string
    {
        return 'Booking Cancelled';
    }

    public function getMessage(): string
    {
        $propertyName = $this->booking->property?->name ?? 'the property';
        $who = $this->cancelledBy === 'guest' ? 'The guest has' : 'The host has';
        
        return "{$who} cancelled the booking for {$propertyName}.";
    }

    public function getActionUrl(): string
    {
        // Direct to appropriate dashboard based on who's receiving
        if ($this->cancelledBy === 'guest') {
            // Host is receiving this, direct to host bookings
            return "{$this->getFrontendUrl()}/host/bookings";
        }
        // Guest is receiving this, direct to explore
        return "{$this->getFrontendUrl()}/explore";
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $isHost = $this->cancelledBy === 'guest';
        $cancellerName = $isHost 
            ? ($this->booking->guest?->name ?? 'The guest')
            : ($this->booking->property?->host?->name ?? 'The host');
        
        $mail = (new MailMessage)
            ->subject("Booking Cancelled - {$this->booking->property?->name}")
            ->greeting("Hello {$notifiable->name},")
            ->line("{$cancellerName} has cancelled the booking.")
            ->line("**Property:** {$this->booking->property?->name}")
            ->line("**Original Dates:** {$this->booking->check_in_date?->format('M d, Y')} - {$this->booking->check_out_date?->format('M d, Y')}");

        if ($this->reason) {
            $mail->line("**Reason:** {$this->reason}");
        }

        if ($isHost) {
            // Email to host (guest cancelled)
            $mail->line("The dates are now available for other bookings.")
                 ->action('View Your Calendar', "{$this->getFrontendUrl()}/host/calendar");
        } else {
            // Email to guest (host cancelled)
            $mail->line("We apologize for any inconvenience. If you were charged, a full refund will be processed.")
                 ->action('Find Another Property', "{$this->getFrontendUrl()}/explore");
        }

        return $mail;
    }

    /**
     * Get the array representation with cancellation details.
     */
    public function toArray(object $notifiable): array
    {
        return array_merge(parent::toArray($notifiable), [
            'cancelled_by' => $this->cancelledBy,
            'reason' => $this->reason,
        ]);
    }
}
