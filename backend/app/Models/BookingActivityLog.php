<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Represents an activity log entry for a booking.
 * Provides immutable audit trail of all booking lifecycle events.
 *
 * @property string $id
 * @property string $booking_id
 * @property string $event_type
 * @property string|null $previous_status
 * @property string|null $new_status
 * @property string|null $triggered_by
 * @property string|null $actor_type
 * @property string|null $reason
 * @property array|null $metadata
 * @property string|null $ip_address
 * @property string|null $user_agent
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class BookingActivityLog extends Model
{
    use HasFactory, HasUlids;

    protected $table = 'booking_activity_logs';

    protected $fillable = [
        'booking_id',
        'event_type',
        'previous_status',
        'new_status',
        'triggered_by',
        'actor_type',
        'reason',
        'metadata',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    // Event types
    public const EVENT_CREATED = 'created';
    public const EVENT_CONFIRMED = 'confirmed';
    public const EVENT_REJECTED = 'rejected';
    public const EVENT_CANCELLED = 'cancelled';
    public const EVENT_STATUS_CHANGED = 'status_changed';
    public const EVENT_CHECKED_IN = 'checked_in';
    public const EVENT_CHECKED_OUT = 'checked_out';
    public const EVENT_COMPLETED = 'completed';

    // Actor types
    public const ACTOR_GUEST = 'guest';
    public const ACTOR_HOST = 'host';
    public const ACTOR_SYSTEM = 'system';
    public const ACTOR_ADMIN = 'admin';

    /**
     * Get the booking this activity log belongs to.
     */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    /**
     * Get the user who triggered this activity.
     */
    public function triggeredByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'triggered_by');
    }

    /**
     * Create a log entry from a booking event.
     *
     * @param \App\Events\BookingEvent $event
     * @param string|null $actorType
     * @param string|null $ipAddress
     * @param string|null $userAgent
     * @return static
     */
    public static function fromEvent(
        \App\Events\BookingEvent $event,
        ?string $actorType = null,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): static {
        return static::create([
            'booking_id' => $event->booking->id,
            'event_type' => $event->eventType,
            'previous_status' => $event->metadata['previous_status'] ?? null,
            'new_status' => $event->booking->status,
            'triggered_by' => $event->triggeredBy,
            'actor_type' => $actorType,
            'reason' => $event->reason,
            'metadata' => $event->metadata,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
        ]);
    }

    /**
     * Scope to filter by event type.
     */
    public function scopeOfType($query, string $eventType)
    {
        return $query->where('event_type', $eventType);
    }

    /**
     * Scope to filter by booking.
     */
    public function scopeForBooking($query, string $bookingId)
    {
        return $query->where('booking_id', $bookingId);
    }

    /**
     * Scope to filter by actor.
     */
    public function scopeTriggeredBy($query, string $userId)
    {
        return $query->where('triggered_by', $userId);
    }
}
