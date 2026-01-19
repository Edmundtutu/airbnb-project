<?php

namespace App\Policies\Admin;

use App\Models\Admin;
use App\Models\User;

class VendorPolicy
{
    public function viewAny(Admin $admin): bool
    {
        return $admin->hasPermission('vendor.view') || $admin->hasRole('super_admin');
    }

    public function view(Admin $admin, User $user): bool
    {
        if ($user->role !== 'host') {
            return false;
        }
        return $admin->hasPermission('vendor.view') || $admin->hasRole('super_admin');
    }

    public function approve(Admin $admin, User $user): bool
    {
        if ($user->role !== 'host') {
            return false;
        }
        return $admin->hasPermission('vendor.approve') || $admin->hasRole('super_admin');
    }

    public function reject(Admin $admin, User $user): bool
    {
        if ($user->role !== 'host') {
            return false;
        }
        return $admin->hasPermission('vendor.reject') || $admin->hasRole('super_admin');
    }

    public function suspend(Admin $admin, User $user): bool
    {
        if ($user->role !== 'host') {
            return false;
        }
        return $admin->hasPermission('vendor.suspend') || $admin->hasRole('super_admin');
    }
}
