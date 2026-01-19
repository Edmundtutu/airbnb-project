<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\AdminRole;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $superAdminRole = AdminRole::where('name', 'super_admin')->first();

        if (!$superAdminRole) {
            $this->command->error('Super Admin role not found. Please run AdminRoleSeeder first.');
            return;
        }

        // Create a default super admin (password should be changed in production)
        Admin::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'), // Change this in production!
                'admin_role_id' => $superAdminRole->id,
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        $this->command->info('Default admin user created: admin@example.com / password');
    }
}
