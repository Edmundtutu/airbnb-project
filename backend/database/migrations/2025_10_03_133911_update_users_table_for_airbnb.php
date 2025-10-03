<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Update role enum to include host/guest instead of vendor/customer
            $table->dropColumn('role');
            $table->enum('role', ['guest', 'host', 'admin'])->default('guest')->after('email_verified_at');
            
            // Add Airbnb-specific user fields (only new ones not in original table)
            $table->text('bio')->nullable()->after('role');
            $table->date('date_of_birth')->nullable()->after('bio');
            $table->json('languages')->nullable()->after('date_of_birth');
            $table->string('government_id')->nullable()->after('languages');
            $table->boolean('identity_verified')->default(false)->after('government_id');
            $table->boolean('phone_verified')->default(false)->after('identity_verified');
            $table->boolean('email_verified')->default(false)->after('phone_verified');
            $table->json('host_settings')->nullable()->after('email_verified'); // For hosts: response time, house rules, etc.
            $table->decimal('host_rating', 3, 2)->nullable()->after('host_settings');
            $table->integer('total_bookings_as_guest')->default(0)->after('host_rating');
            $table->integer('total_bookings_as_host')->default(0)->after('total_bookings_as_guest');
            $table->timestamp('last_active_at')->nullable()->after('total_bookings_as_host');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Remove Airbnb-specific fields (only new ones added)
            $table->dropColumn([
                'bio', 'date_of_birth', 'languages', 'government_id',
                'identity_verified', 'phone_verified', 'email_verified',
                'host_settings', 'host_rating', 'total_bookings_as_guest',
                'total_bookings_as_host', 'last_active_at'
            ]);
            
            // Revert role enum
            $table->dropColumn('role');
            $table->enum('role', ['customer', 'vendor', 'admin'])->default('customer')->after('email_verified_at');
        });
    }
};