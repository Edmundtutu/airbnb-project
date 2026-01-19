<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * User notification preferences for controlling which notifications
     * they receive and through which channels.
     */
    public function up(): void
    {
        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->ulid('id')->primary();
            
            $table->foreignUlid('user_id')
                ->unique() // One preferences record per user
                ->constrained('users')
                ->onDelete('cascade');
            
            // Global channel toggles
            $table->boolean('email_enabled')->default(true);
            $table->boolean('push_enabled')->default(true);
            $table->boolean('in_app_enabled')->default(true);
            
            // Booking notification preferences
            $table->boolean('booking_new_request')->default(true);      // Host: new booking request
            $table->boolean('booking_confirmed')->default(true);        // Guest: booking confirmed
            $table->boolean('booking_rejected')->default(true);         // Guest: booking rejected
            $table->boolean('booking_cancelled')->default(true);        // Both: booking cancelled
            $table->boolean('booking_reminder')->default(true);         // Both: upcoming check-in reminder
            
            // Future notification types (extendable)
            $table->boolean('messages_enabled')->default(true);         // Chat messages
            $table->boolean('reviews_enabled')->default(true);          // Review requests/responses
            $table->boolean('promotions_enabled')->default(false);      // Marketing (opt-in)
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notification_preferences');
    }
};
