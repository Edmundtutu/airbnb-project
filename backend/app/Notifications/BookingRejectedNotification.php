<?php

namespace App\Notifications;

use App\Models\Booking;
use Carbon\Carbon;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Notification sent to guests when their booking is rejected by the host.
 */
class BookingRejectedNotification extends BookingNotification
{
    protected string $notificationType = 'booking_rejected';
    protected ?string $reason;

    public function __construct(Booking $booking, ?string $reason = null)
    {
        parent::__construct($booking);
        $this->reason = $reason;
        $this->booking->load(['property', 'details.listing']);
    }

    protected function getPreferenceKey(): string
    {
        return 'booking_rejected';
    }

    public function getTitle(): string
    {
        return 'Booking Request Declined';
    }

    public function getMessage(): string
    {
        $propertyName = $this->booking->property?->name ?? 'the property';
        
        return "Unfortunately, your booking request for {$propertyName} was not accepted.";
    }

    public function getActionUrl(): string
    {
        return "{$this->getFrontendUrl()}/explore";
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        /** @var Carbon|null $checkIn */
        $checkIn = $this->booking->check_in_date;
        /** @var Carbon|null $checkOut */
        $checkOut = $this->booking->check_out_date;

        $mail = (new MailMessage)
            ->subject("Booking Request Declined - {$this->booking->property?->name}")
            ->greeting("Hello {$notifiable->name},")
            ->line("We're sorry to inform you that your booking request was declined.")
            ->line("**Property:** {$this->booking->property?->name}")
            ->line("**Requested Dates:** " . ($checkIn?->format('M d, Y') ?? 'N/A') . " - " . ($checkOut?->format('M d, Y') ?? 'N/A'));

        if ($this->reason) {
            $mail->line("**Reason:** {$this->reason}");
        }

        return $mail
            ->line("Don't worry! There are plenty of other amazing properties available.")
            ->action('Find Another Property', $this->getActionUrl())
            ->line("If you were charged, a full refund will be processed within 5-10 business days.");
    }

    /**
     * Get the array representation with reason included.
     */
    public function toArray(object $notifiable): array
    {
        return array_merge(parent::toArray($notifiable), [
            'reason' => $this->reason,
        ]);
    }

    protected function getRecipientName(): string
    {
        return $this->booking->guest?->name ?? 'Guest';
    }
}
