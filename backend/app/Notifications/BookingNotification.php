<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Base class for all booking-related notifications.
 * Provides shared functionality for email templates, push payloads, and database storage.
 */
abstract class BookingNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected Booking $booking;
    protected string $notificationType;

    public function __construct(Booking $booking)
    {
        $this->booking = $booking;
    }

    /**
     * Get the notification's delivery channels.
     * Respects user's notification preferences.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database']; // Always store in database for notification center

        $preferences = $notifiable->getNotificationPreferences();
        $preferenceKey = $this->getPreferenceKey();

        // Check if this notification type is enabled for each channel
        if ($preferences->isEnabled($preferenceKey, 'email')) {
            $channels[] = 'mail';
        }

        // Push notifications will be handled by a custom channel
        if ($preferences->isEnabled($preferenceKey, 'push') && $notifiable->activeDeviceTokens()->exists()) {
            $channels[] = 'fcm';
        }

        return $channels;
    }

    /**
     * Get the preference key for this notification type.
     * Override in child classes.
     */
    abstract protected function getPreferenceKey(): string;

    /**
     * Get the notification title for push/in-app display.
     */
    abstract public function getTitle(): string;

    /**
     * Get the notification body/message.
     */
    abstract public function getMessage(): string;

    /**
     * Get the action URL for the notification.
     */
    abstract public function getActionUrl(): string;

    /**
     * Get the array representation of the notification for database storage.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => $this->notificationType,
            'title' => $this->getTitle(),
            'message' => $this->getMessage(),
            'action_url' => $this->getActionUrl(),
            'booking_id' => $this->booking->id,
            'property_id' => $this->booking->property_id,
            'property_name' => $this->booking->property?->name,
            'check_in_date' => $this->booking->check_in_date?->toDateString(),
            'check_out_date' => $this->booking->check_out_date?->toDateString(),
            'total' => $this->booking->total,
            'guest_count' => $this->booking->guest_count,
        ];
    }

    /**
     * Get the FCM push notification payload.
     */
    public function toFcm(object $notifiable): array
    {
        return [
            'notification' => [
                'title' => $this->getTitle(),
                'body' => $this->getMessage(),
            ],
            'data' => [
                'type' => $this->notificationType,
                'booking_id' => $this->booking->id,
                'action_url' => $this->getActionUrl(),
                'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
            ],
        ];
    }

    /**
     * Build the base mail message with CavaYo branding.
     */
    protected function buildMailMessage(): MailMessage
    {
        return (new MailMessage)
            ->subject($this->getTitle())
            ->greeting("Hello {$this->getRecipientName()}!")
            ->line($this->getMessage())
            ->line("**Property:** {$this->booking->property?->name}")
            ->line("**Check-in:** {$this->booking->check_in_date?->format('M d, Y')}")
            ->line("**Check-out:** {$this->booking->check_out_date?->format('M d, Y')}")
            ->line("**Guests:** {$this->booking->guest_count}")
            ->action('View Booking', $this->getActionUrl());
    }

    /**
     * Get the recipient's name for personalization.
     * Override if needed.
     */
    protected function getRecipientName(): string
    {
        return 'there';
    }

    /**
     * Get the frontend URL base.
     */
    protected function getFrontendUrl(): string
    {
        return config('app.frontend_url', 'http://localhost:5173');
    }
}
