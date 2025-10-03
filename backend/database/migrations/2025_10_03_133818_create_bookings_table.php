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
        Schema::create('bookings', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('guest_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUlid('property_id')->constrained('properties')->cascadeOnDelete();
            $table->decimal('total_price', 10, 2);
            $table->text('notes')->nullable();
            $table->date('check_in');
            $table->date('check_out');
            $table->integer('guests');
            $table->integer('nights');
            $table->decimal('price_per_night', 8, 2);
            $table->decimal('cleaning_fee', 8, 2)->default(0);
            $table->decimal('service_fee', 8, 2)->default(0);
            $table->text('special_requests')->nullable();
            $table->time('arrival_time')->nullable();
            $table->enum('status', ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'])->default('pending');
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('guest_id');
            $table->index('property_id');
            $table->index('status');
            $table->index(['check_in', 'check_out']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};