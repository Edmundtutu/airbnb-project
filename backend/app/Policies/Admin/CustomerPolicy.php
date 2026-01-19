<?php

namespace App\Policies\Admin;

use App\Models\Admin;
use App\Models\User;

class CustomerPolicy
{
    public function viewAny(Admin $admin): bool
    {
        return $admin->hasPermission('customer.view') || $admin->hasRole('super_admin');
    }

    public function view(Admin $admin, User $user): bool
    {
        if ($user->role !== 'guest') {
            return false;
        }
        return $admin->hasPermission('customer.view') || $admin->hasRole('super_admin');
    }

    public function flag(Admin $admin, User $user): bool
    {
        if ($user->role !== 'guest') {
            return false;
        }
        return $admin->hasPermission('customer.flag') || $admin->hasRole('super_admin');
    }

    public function restrict(Admin $admin, User $user): bool
    {
        if ($user->role !== 'guest') {
            return false;
        }
        return $admin->hasPermission('customer.restrict') || $admin->hasRole('super_admin');
    }
}
