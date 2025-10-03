<?php

namespace App\Policies\Api\V1;

use App\Models\Booking;
use App\Models\User;

class BookingPolicy
{
    public function viewAny(User $user): bool
    {
        // Hosts: can view bookings for their properties
        // Guests: can view their own bookings
        return $user->isHost() || $user->isGuest();
    }

    public function view(User $user, Booking $booking): bool
    {
        return $user->id === $booking->user_id   // guest sees own booking
            || ($user->isHost() && $user->id === $booking->property->host_id); // host sees property booking
    }

    public function create(User $user): bool
    {
        // Only guests can create new bookings
        return $user->isGuest();
    }

    public function update(User $user, Booking $booking): bool
    {
        // Hosts can update bookings for their properties
        return $user->isHost() && $user->id === $booking->property->host_id;
    }

    public function delete(User $user, Booking $booking): bool
    {
        // Guests can cancel their own booking if still pending
        return $user->isGuest()
            && $user->id === $booking->user_id
            && $booking->status === 'pending';
    }

    public function restore(User $user, Booking $booking): bool
    {
        return false;
    }

    public function forceDelete(User $user, Booking $booking): bool
    {
        return false;
    }

    public function confirm(User $user, Booking $booking): bool
    {
        // Host confirms only pending bookings
        return $user->isHost()
            && $user->id === $booking->property->host_id
            && $booking->status === 'pending';
    }

    public function checkIn(User $user, Booking $booking): bool
    {
        // Host can check in guests for their properties
        return $user->isHost()
            && $user->id === $booking->property->host_id
            && $booking->status === 'confirmed';
    }

    public function checkOut(User $user, Booking $booking): bool
    {
        // Host can check out guests for their properties
        return $user->isHost()
            && $user->id === $booking->property->host_id
            && $booking->status === 'checked_in';
    }
}
