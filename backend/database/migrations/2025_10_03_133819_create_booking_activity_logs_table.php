<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This table provides an audit trail for all booking lifecycle events.
     * Used for:
     * - Debugging and support investigations
     * - Analytics and reporting
     * - Compliance and audit requirements
     * - Notification system event source
     */
    public function up(): void
    {
        Schema::create('booking_activity_logs', function (Blueprint $table) {
            $table->ulid('id')->primary();
            
            // Foreign key to booking
            $table->foreignUlid('booking_id')
                ->constrained('bookings')
                ->onDelete('cascade');
            
            // Event details
            $table->string('event_type', 50); // created, confirmed, rejected, cancelled, status_changed, etc.
            $table->string('previous_status', 30)->nullable();
            $table->string('new_status', 30)->nullable();
            
            // Actor information
            $table->foreignUlid('triggered_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->string('actor_type', 20)->nullable(); // guest, host, system, admin
            
            // Additional context
            $table->text('reason')->nullable();
            $table->json('metadata')->nullable(); // Flexible storage for event-specific data
            
            // IP and user agent for security auditing
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            
            $table->timestamps();
            
            // Indexes for common queries
            $table->index(['booking_id', 'created_at']);
            $table->index(['event_type', 'created_at']);
            $table->index(['triggered_by', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('booking_activity_logs');
    }
};
