<?php

namespace App\Policies\Admin;

use App\Models\Admin;
use App\Models\KYCSubmission;

class KYCPolicy
{
    public function viewAny(Admin $admin): bool
    {
        return $admin->hasPermission('kyc.view') || $admin->hasRole('super_admin');
    }

    public function view(Admin $admin, KYCSubmission $submission): bool
    {
        return $admin->hasPermission('kyc.view') || $admin->hasRole('super_admin');
    }

    public function approve(Admin $admin, KYCSubmission $submission): bool
    {
        return $admin->hasPermission('kyc.approve') || $admin->hasRole('super_admin');
    }

    public function reject(Admin $admin, KYCSubmission $submission): bool
    {
        return $admin->hasPermission('kyc.reject') || $admin->hasRole('super_admin');
    }
}
