<?php

namespace App\Notifications;

use App\Models\Booking;
use Carbon\Carbon;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Notification sent to hosts when a new booking request is received.
 */
class NewBookingRequestNotification extends BookingNotification
{
    protected string $notificationType = 'booking_new_request';

    public function __construct(Booking $booking)
    {
        parent::__construct($booking);
        $this->booking->load(['guest', 'property', 'details.listing']);
    }

    protected function getPreferenceKey(): string
    {
        return 'booking_new_request';
    }

    public function getTitle(): string
    {
        return 'New Booking Request';
    }

    public function getMessage(): string
    {
        $guestName = $this->booking->guest?->name ?? 'A guest';
        $propertyName = $this->booking->property?->name ?? 'your property';
        /** @var Carbon|null $checkIn */
        $checkIn = $this->booking->check_in_date;
        /** @var Carbon|null $checkOut */
        $checkOut = $this->booking->check_out_date;
        
        return "{$guestName} has requested to book {$propertyName} from " . ($checkIn?->format('M d') ?? 'N/A') . " to " . ($checkOut?->format('M d') ?? 'N/A') . ".";
    }

    public function getActionUrl(): string
    {
        return "{$this->getFrontendUrl()}/host/bookings/{$this->booking->id}";
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $guestName = $this->booking->guest?->name ?? 'A guest';
        /** @var Carbon|null $checkIn */
        $checkIn = $this->booking->check_in_date;
        /** @var Carbon|null $checkOut */
        $checkOut = $this->booking->check_out_date;
        $nights = $checkIn && $checkOut ? $checkIn->diffInDays($checkOut) : 0;
        $total = (float) ($this->booking->total ?? 0);
        
        return $this->buildMailMessage()
            ->subject("New Booking Request - {$this->booking->property?->name}")
            ->greeting("Hello {$notifiable->name}!")
            ->line("Great news! You have received a new booking request.")
            ->line("**Guest:** {$guestName}")
            ->line("**Property:** {$this->booking->property?->name}")
            ->line("**Dates:** " . ($checkIn?->format('M d, Y') ?? 'N/A') . " - " . ($checkOut?->format('M d, Y') ?? 'N/A') . " ({$nights} nights)")
            ->line("**Guests:** {$this->booking->guest_count}")
            ->line("**Total:** UGX " . number_format($total))
            ->action('Review & Respond', $this->getActionUrl())
            ->line('Please respond within 24 hours to maintain a good response rate.');
    }

    protected function getRecipientName(): string
    {
        return $this->booking->property?->host?->name ?? 'Host';
    }
}
