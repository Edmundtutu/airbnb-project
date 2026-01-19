<?php

namespace App\Providers;

use App\Models\User;
use App\Policies\Admin\CustomerPolicy;
use App\Policies\Admin\KYCPolicy;
use App\Policies\Admin\VendorPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AdminServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Note: Policies are checked via middleware and service methods
        // Gate policies can be registered here if needed for additional checks
    }
}
