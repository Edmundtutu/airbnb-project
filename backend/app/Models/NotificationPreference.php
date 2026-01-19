<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * User notification preferences.
 *
 * @property string $id
 * @property string $user_id
 * @property bool $email_enabled
 * @property bool $push_enabled
 * @property bool $in_app_enabled
 * @property bool $booking_new_request
 * @property bool $booking_confirmed
 * @property bool $booking_rejected
 * @property bool $booking_cancelled
 * @property bool $booking_reminder
 * @property bool $messages_enabled
 * @property bool $reviews_enabled
 * @property bool $promotions_enabled
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class NotificationPreference extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'user_id',
        'email_enabled',
        'push_enabled',
        'in_app_enabled',
        'booking_new_request',
        'booking_confirmed',
        'booking_rejected',
        'booking_cancelled',
        'booking_reminder',
        'messages_enabled',
        'reviews_enabled',
        'promotions_enabled',
    ];

    protected $casts = [
        'email_enabled' => 'boolean',
        'push_enabled' => 'boolean',
        'in_app_enabled' => 'boolean',
        'booking_new_request' => 'boolean',
        'booking_confirmed' => 'boolean',
        'booking_rejected' => 'boolean',
        'booking_cancelled' => 'boolean',
        'booking_reminder' => 'boolean',
        'messages_enabled' => 'boolean',
        'reviews_enabled' => 'boolean',
        'promotions_enabled' => 'boolean',
    ];

    /**
     * Get the user that owns these preferences.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if a specific notification type is enabled for a channel.
     *
     * @param string $type Notification type (e.g., 'booking_confirmed')
     * @param string $channel Channel (e.g., 'email', 'push', 'in_app')
     * @return bool
     */
    public function isEnabled(string $type, string $channel): bool
    {
        // Check global channel toggle first
        $channelKey = "{$channel}_enabled";
        if (!$this->{$channelKey}) {
            return false;
        }

        // Check specific notification type
        if (isset($this->{$type})) {
            return (bool) $this->{$type};
        }

        // Default to enabled if type not found
        return true;
    }

    /**
     * Get default preferences for a new user.
     */
    public static function defaults(): array
    {
        return [
            'email_enabled' => true,
            'push_enabled' => true,
            'in_app_enabled' => true,
            'booking_new_request' => true,
            'booking_confirmed' => true,
            'booking_rejected' => true,
            'booking_cancelled' => true,
            'booking_reminder' => true,
            'messages_enabled' => true,
            'reviews_enabled' => true,
            'promotions_enabled' => false,
        ];
    }
}
