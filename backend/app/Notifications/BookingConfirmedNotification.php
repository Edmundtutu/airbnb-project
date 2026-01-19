<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Notification sent to guests when their booking is confirmed by the host.
 */
class BookingConfirmedNotification extends BookingNotification
{
    protected string $notificationType = 'booking_confirmed';

    public function __construct(Booking $booking)
    {
        parent::__construct($booking);
        $this->booking->load(['property.host', 'details.listing']);
    }

    protected function getPreferenceKey(): string
    {
        return 'booking_confirmed';
    }

    public function getTitle(): string
    {
        return 'Booking Confirmed! 🎉';
    }

    public function getMessage(): string
    {
        $propertyName = $this->booking->property?->name ?? 'the property';
        $checkIn = $this->booking->check_in_date?->format('M d');
        
        return "Your booking at {$propertyName} has been confirmed. Check-in is on {$checkIn}.";
    }

    public function getActionUrl(): string
    {
        return "{$this->getFrontendUrl()}/bookings/{$this->booking->id}";
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $hostName = $this->booking->property?->host?->name ?? 'Your host';
        $nights = $this->booking->check_in_date?->diffInDays($this->booking->check_out_date) ?? 0;
        
        return (new MailMessage)
            ->subject("Booking Confirmed - {$this->booking->property?->name}")
            ->greeting("Congratulations {$notifiable->name}! 🎉")
            ->line("Your booking has been confirmed by {$hostName}.")
            ->line("---")
            ->line("**Property:** {$this->booking->property?->name}")
            ->line("**Check-in:** {$this->booking->check_in_date?->format('l, M d, Y')}")
            ->line("**Check-out:** {$this->booking->check_out_date?->format('l, M d, Y')}")
            ->line("**Duration:** {$nights} night(s)")
            ->line("**Guests:** {$this->booking->guest_count}")
            ->line("**Total Paid:** UGX " . number_format($this->booking->total))
            ->line("---")
            ->action('View Booking Details', $this->getActionUrl())
            ->line("If you have any questions, you can message your host through the app.")
            ->line("We hope you have a wonderful stay!");
    }

    protected function getRecipientName(): string
    {
        return $this->booking->guest?->name ?? 'Guest';
    }
}
