<?php

namespace App\Services;

use App\Events\BookingConfirmed;
use App\Events\BookingRejected;
use App\Events\BookingCancelled;
use App\Events\BookingStatusChanged;
use App\Models\Booking;
use App\Models\BookingDetails;
use App\Models\Listing;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * BookingService
 * 
 * Centralized service for booking operations including:
 * - Availability checking with overlap prevention
 * - Server-authoritative pricing computation
 * - State machine transitions with guards
 * - Domain event dispatching
 */
class BookingService
{
    /**
     * Canonical booking status constants
     */
    public const STATUS_PENDING = 'pending';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_CHECKED_IN = 'checked_in';
    public const STATUS_CHECKED_OUT = 'checked_out';
    public const STATUS_COMPLETED = 'completed';

    /**
     * Allowed state transitions matrix
     * Format: [from_status => [allowed_to_statuses]]
     */
    public const ALLOWED_TRANSITIONS = [
        self::STATUS_PENDING => [
            self::STATUS_CONFIRMED,   // Host confirms
            self::STATUS_REJECTED,    // Host rejects
            self::STATUS_CANCELLED,   // Guest cancels
        ],
        self::STATUS_CONFIRMED => [
            self::STATUS_CHECKED_IN,  // Guest arrives
            self::STATUS_CANCELLED,   // Guest cancels (may have penalties)
            self::STATUS_REJECTED,    // Host cancels (exceptional)
        ],
        self::STATUS_CHECKED_IN => [
            self::STATUS_CHECKED_OUT, // Guest departs
        ],
        self::STATUS_CHECKED_OUT => [
            self::STATUS_COMPLETED,   // Final state after review period
        ],
        // Terminal states - no further transitions
        self::STATUS_REJECTED => [],
        self::STATUS_CANCELLED => [],
        self::STATUS_COMPLETED => [],
    ];

    /**
     * Statuses that block availability (active reservations)
     */
    public const BLOCKING_STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_CONFIRMED,
        self::STATUS_CHECKED_IN,
    ];

    /**
     * Check if a listing is available for the given date range.
     * 
     * @param string $listingId The listing ULID
     * @param Carbon $checkIn Check-in date
     * @param Carbon $checkOut Check-out date
     * @param string|null $excludeBookingId Booking ID to exclude (for updates)
     * @return bool
     */
    public function isListingAvailable(
        string $listingId,
        Carbon $checkIn,
        Carbon $checkOut,
        ?string $excludeBookingId = null
    ): bool {
        $query = BookingDetails::where('listing_id', $listingId)
            ->whereHas('booking', function ($q) use ($checkIn, $checkOut, $excludeBookingId) {
                $q->whereIn('status', self::BLOCKING_STATUSES);
                
                // Exclude a specific booking (useful for updates)
                if ($excludeBookingId) {
                    $q->where('id', '!=', $excludeBookingId);
                }

                // Check for date overlap
                // Overlap exists if: existing.check_in < new.check_out AND existing.check_out > new.check_in
                $q->where(function ($subQ) use ($checkIn, $checkOut) {
                    $subQ->where('check_in_date', '<', $checkOut)
                         ->where('check_out_date', '>', $checkIn);
                });
            });

        return !$query->exists();
    }

    /**
     * Check availability for multiple listings at once.
     * 
     * @param array $listingIds Array of listing ULIDs
     * @param Carbon $checkIn Check-in date
     * @param Carbon $checkOut Check-out date
     * @param string|null $excludeBookingId Booking ID to exclude
     * @return array Array of unavailable listing IDs
     */
    public function getUnavailableListings(
        array $listingIds,
        Carbon $checkIn,
        Carbon $checkOut,
        ?string $excludeBookingId = null
    ): array {
        $unavailable = [];
        
        foreach ($listingIds as $listingId) {
            if (!$this->isListingAvailable($listingId, $checkIn, $checkOut, $excludeBookingId)) {
                $unavailable[] = $listingId;
            }
        }
        
        return $unavailable;
    }

    /**
     * Validate availability for all listings in a booking request.
     * Uses row-level locking within a transaction for concurrency safety.
     * 
     * @param array $listingIds
     * @param Carbon $checkIn
     * @param Carbon $checkOut
     * @param string|null $excludeBookingId
     * @throws ValidationException if any listing is unavailable
     */
    public function validateAvailabilityWithLock(
        array $listingIds,
        Carbon $checkIn,
        Carbon $checkOut,
        ?string $excludeBookingId = null
    ): void {
        // Lock existing conflicting booking details for update to prevent race conditions
        $conflictingDetails = BookingDetails::whereIn('listing_id', $listingIds)
            ->whereHas('booking', function ($q) use ($checkIn, $checkOut, $excludeBookingId) {
                $q->whereIn('status', self::BLOCKING_STATUSES);
                
                if ($excludeBookingId) {
                    $q->where('id', '!=', $excludeBookingId);
                }

                $q->where(function ($subQ) use ($checkIn, $checkOut) {
                    $subQ->where('check_in_date', '<', $checkOut)
                         ->where('check_out_date', '>', $checkIn);
                });
            })
            ->lockForUpdate()
            ->get();

        if ($conflictingDetails->isNotEmpty()) {
            $conflictingListingIds = $conflictingDetails->pluck('listing_id')->unique()->values()->toArray();
            $listingNames = Listing::whereIn('id', $conflictingListingIds)->pluck('name', 'id');
            
            $messages = [];
            foreach ($conflictingListingIds as $listingId) {
                $name = $listingNames->get($listingId, 'Listing');
                $messages[] = "{$name} is not available for the selected dates.";
            }

            throw ValidationException::withMessages([
                'availability' => $messages,
            ]);
        }
    }

    /**
     * Calculate nights between check-in and check-out dates.
     * Server-authoritative calculation.
     * 
     * @param Carbon $checkIn
     * @param Carbon $checkOut
     * @return int
     */
    public function calculateNights(Carbon $checkIn, Carbon $checkOut): int
    {
        return $checkIn->diffInDays($checkOut);
    }

    /**
     * Compute the total price for a booking.
     * Server-authoritative: fetches current listing prices from database.
     * 
     * @param Collection $details Collection with 'listing_id' and 'nights'
     * @param Collection $listings Keyed collection of Listing models
     * @return array ['total' => float, 'computed_details' => array]
     */
    public function computePricing(Collection $details, Collection $listings): array
    {
        $total = 0;
        $computedDetails = [];

        foreach ($details as $detail) {
            $listing = $listings->get($detail['listing_id']);
            
            if (!$listing) {
                continue;
            }

            // Server-authoritative: always use listing's current price
            $pricePerNight = (float) $listing->price_per_night;
            $nights = (int) $detail['nights'];
            $lineTotal = $pricePerNight * $nights;
            
            $computedDetails[] = [
                'listing' => $listing,
                'listing_id' => $listing->id,
                'nights' => $nights,
                'price_per_night' => $pricePerNight,
                'line_total' => $lineTotal,
            ];
            
            $total += $lineTotal;
        }

        return [
            'total' => $total,
            'computed_details' => $computedDetails,
        ];
    }

    /**
     * Check if a status transition is allowed.
     * 
     * @param string $fromStatus
     * @param string $toStatus
     * @return bool
     */
    public function canTransition(string $fromStatus, string $toStatus): bool
    {
        $allowedTo = self::ALLOWED_TRANSITIONS[$fromStatus] ?? [];
        return in_array($toStatus, $allowedTo, true);
    }

    /**
     * Transition a booking to a new status with guards.
     * Dispatches appropriate domain events after successful transition.
     * 
     * @param Booking $booking
     * @param string $newStatus
     * @param string|null $triggeredBy User ID who triggered the transition (null for system)
     * @param string|null $reason Optional reason for the transition
     * @param array $metadata Additional metadata for the event
     * @return Booking
     * @throws ValidationException if transition is not allowed
     */
    public function transitionStatus(
        Booking $booking,
        string $newStatus,
        ?string $triggeredBy = null,
        ?string $reason = null,
        array $metadata = []
    ): Booking {
        $currentStatus = $booking->status;

        if ($currentStatus === $newStatus) {
            return $booking; // No-op, already in target state
        }

        if (!$this->canTransition($currentStatus, $newStatus)) {
            throw ValidationException::withMessages([
                'status' => [
                    "Cannot transition booking from '{$currentStatus}' to '{$newStatus}'. " .
                    "Allowed transitions: " . implode(', ', self::ALLOWED_TRANSITIONS[$currentStatus] ?? ['none'])
                ],
            ]);
        }

        $booking->update(['status' => $newStatus]);
        $booking = $booking->fresh();

        // Dispatch appropriate domain event
        $this->dispatchTransitionEvent($booking, $currentStatus, $newStatus, $triggeredBy, $reason, $metadata);

        return $booking;
    }

    /**
     * Dispatch the appropriate domain event for a status transition.
     * 
     * @param Booking $booking
     * @param string $previousStatus
     * @param string $newStatus
     * @param string|null $triggeredBy
     * @param string|null $reason
     * @param array $metadata
     */
    protected function dispatchTransitionEvent(
        Booking $booking,
        string $previousStatus,
        string $newStatus,
        ?string $triggeredBy,
        ?string $reason,
        array $metadata
    ): void {
        // Dispatch specific event based on the new status
        match ($newStatus) {
            self::STATUS_CONFIRMED => BookingConfirmed::dispatch(
                $booking,
                $previousStatus,
                $triggeredBy,
                $metadata
            ),
            self::STATUS_REJECTED => BookingRejected::dispatch(
                $booking,
                $previousStatus,
                $triggeredBy,
                $reason,
                $metadata
            ),
            self::STATUS_CANCELLED => BookingCancelled::dispatch(
                $booking,
                $previousStatus,
                $metadata['cancelled_by'] ?? 'guest',
                $triggeredBy,
                $reason,
                $metadata
            ),
            // For all other transitions, dispatch generic status change event
            default => BookingStatusChanged::dispatch(
                $booking,
                $previousStatus,
                $newStatus,
                $triggeredBy,
                $reason,
                $metadata
            ),
        };
    }

    /**
     * Get human-readable status label.
     * 
     * @param string $status
     * @return string
     */
    public function getStatusLabel(string $status): string
    {
        return match ($status) {
            self::STATUS_PENDING => 'Pending',
            self::STATUS_CONFIRMED => 'Confirmed',
            self::STATUS_REJECTED => 'Rejected',
            self::STATUS_CANCELLED => 'Cancelled',
            self::STATUS_CHECKED_IN => 'Checked In',
            self::STATUS_CHECKED_OUT => 'Checked Out',
            self::STATUS_COMPLETED => 'Completed',
            default => ucfirst($status),
        };
    }

    /**
     * Determine if a booking is in a terminal (final) state.
     * 
     * @param string $status
     * @return bool
     */
    public function isTerminalStatus(string $status): bool
    {
        return empty(self::ALLOWED_TRANSITIONS[$status] ?? []);
    }

    /**
     * Get all valid booking statuses.
     * 
     * @return array
     */
    public function getAllStatuses(): array
    {
        return array_keys(self::ALLOWED_TRANSITIONS);
    }
}
