<?php

namespace Database\Seeders;

use App\Models\AdminPermission;
use App\Models\AdminRole;
use Illuminate\Database\Seeder;

class AdminPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            // Vendor permissions
            ['name' => 'vendor.view', 'display_name' => 'View Vendors', 'description' => 'View vendor list and details', 'category' => 'vendor'],
            ['name' => 'vendor.approve', 'display_name' => 'Approve Vendors', 'description' => 'Approve vendor onboarding', 'category' => 'vendor'],
            ['name' => 'vendor.reject', 'display_name' => 'Reject Vendors', 'description' => 'Reject vendor onboarding', 'category' => 'vendor'],
            ['name' => 'vendor.suspend', 'display_name' => 'Suspend Vendors', 'description' => 'Suspend approved vendors', 'category' => 'vendor'],
            ['name' => 'vendor.notes.create', 'display_name' => 'Create Vendor Notes', 'description' => 'Create internal notes on vendors', 'category' => 'vendor'],
            ['name' => 'vendor.notes.view', 'display_name' => 'View Vendor Notes', 'description' => 'View internal notes on vendors', 'category' => 'vendor'],

            // KYC permissions
            ['name' => 'kyc.view', 'display_name' => 'View KYC', 'description' => 'View KYC submissions', 'category' => 'kyc'],
            ['name' => 'kyc.approve', 'display_name' => 'Approve KYC', 'description' => 'Approve KYC submissions', 'category' => 'kyc'],
            ['name' => 'kyc.reject', 'display_name' => 'Reject KYC', 'description' => 'Reject KYC submissions', 'category' => 'kyc'],

            // Customer permissions
            ['name' => 'customer.view', 'display_name' => 'View Customers', 'description' => 'View customer list and details', 'category' => 'customer'],
            ['name' => 'customer.flag', 'display_name' => 'Flag Customers', 'description' => 'Flag customers for review', 'category' => 'customer'],
            ['name' => 'customer.restrict', 'display_name' => 'Restrict Customers', 'description' => 'Restrict customer accounts', 'category' => 'customer'],

            // Analytics permissions
            ['name' => 'analytics.view', 'display_name' => 'View Analytics', 'description' => 'View analytics dashboard', 'category' => 'analytics'],

            // Activity logs permissions
            ['name' => 'activity_logs.view', 'display_name' => 'View Activity Logs', 'description' => 'View admin activity logs', 'category' => 'activity_logs'],
        ];

        foreach ($permissions as $permission) {
            AdminPermission::firstOrCreate(
                ['name' => $permission['name']],
                $permission
            );
        }

        // Assign permissions to roles
        $superAdmin = AdminRole::where('name', 'super_admin')->first();
        $complianceAdmin = AdminRole::where('name', 'compliance_admin')->first();
        $supportAdmin = AdminRole::where('name', 'support_admin')->first();
        $readOnlyAnalyst = AdminRole::where('name', 'read_only_analyst')->first();

        // Super Admin gets all permissions
        if ($superAdmin) {
            $superAdmin->permissions()->sync(AdminPermission::pluck('id'));
        }

        // Compliance Admin permissions
        if ($complianceAdmin) {
            $compliancePermissions = AdminPermission::whereIn('name', [
                'vendor.view', 'vendor.approve', 'vendor.reject', 'vendor.suspend',
                'vendor.notes.create', 'vendor.notes.view',
                'kyc.view', 'kyc.approve', 'kyc.reject',
                'customer.view', // read-only
                'analytics.view', // read-only
            ])->pluck('id');
            $complianceAdmin->permissions()->sync($compliancePermissions);
        }

        // Support Admin permissions
        if ($supportAdmin) {
            $supportPermissions = AdminPermission::whereIn('name', [
                'customer.view', 'customer.flag', 'customer.restrict',
                'vendor.view', // read-only
                'activity_logs.view',
                'analytics.view', // read-only
            ])->pluck('id');
            $supportAdmin->permissions()->sync($supportPermissions);
        }

        // Read-only Analyst permissions
        if ($readOnlyAnalyst) {
            $analystPermissions = AdminPermission::whereIn('name', [
                'analytics.view',
                'vendor.view', // read-only
                'customer.view', // read-only
                'activity_logs.view',
            ])->pluck('id');
            $readOnlyAnalyst->permissions()->sync($analystPermissions);
        }
    }
}
