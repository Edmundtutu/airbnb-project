<?php

namespace App\Providers;

use App\Events\BookingCreated;
use App\Events\BookingConfirmed;
use App\Events\BookingRejected;
use App\Events\BookingCancelled;
use App\Events\BookingStatusChanged;
use App\Listeners\LogBookingActivity;
use App\Listeners\SendBookingNotifications;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        // Booking lifecycle events are handled by subscribers
    ];

    /**
     * The subscriber classes to register.
     *
     * @var array<int, class-string>
     */
    protected $subscribe = [
        LogBookingActivity::class,
        SendBookingNotifications::class,
    ];

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
