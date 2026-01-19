<?php

namespace Database\Seeders;

use App\Models\AdminRole;
use Illuminate\Database\Seeder;

class AdminRoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'name' => 'super_admin',
                'display_name' => 'Super Admin',
                'description' => 'Full access to all features and can manage other admins',
            ],
            [
                'name' => 'compliance_admin',
                'display_name' => 'Compliance Admin',
                'description' => 'Vendor onboarding and KYC review focus',
            ],
            [
                'name' => 'support_admin',
                'display_name' => 'Support Admin',
                'description' => 'Customer and vendor support',
            ],
            [
                'name' => 'read_only_analyst',
                'display_name' => 'Read-only Analyst',
                'description' => 'Analytics and reporting only',
            ],
        ];

        foreach ($roles as $role) {
            AdminRole::firstOrCreate(
                ['name' => $role['name']],
                $role
            );
        }
    }
}
