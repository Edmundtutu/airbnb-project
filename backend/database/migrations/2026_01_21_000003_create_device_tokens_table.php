<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Stores FCM device tokens for push notifications.
     * Users can have multiple devices (phone, tablet, multiple browsers).
     */
    public function up(): void
    {
        Schema::create('device_tokens', function (Blueprint $table) {
            $table->ulid('id')->primary();
            
            $table->foreignUlid('user_id')
                ->constrained('users')
                ->onDelete('cascade');
            
            // FCM registration token (can be quite long)
            $table->string('token', 500)->unique();
            
            // Device metadata for management UI
            $table->string('device_type', 20)->default('web'); // web, ios, android
            $table->string('device_name')->nullable(); // "Chrome on Windows", "iPhone 15"
            
            // Track token validity
            $table->timestamp('last_used_at')->nullable();
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            
            $table->index(['user_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('device_tokens');
    }
};
