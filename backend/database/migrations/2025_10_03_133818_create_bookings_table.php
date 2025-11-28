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
            $table->decimal('total', 10, 2)->default(0);
            $table->text('notes')->nullable();
            $table->date('check_in_date');
            $table->date('check_out_date');
            $table->unsignedTinyInteger('guest_count');
            $table->enum('status', ['pending', 'processing', 'confirmed', 'checked_in', 'checked_out', 'completed', 'cancelled', 'rejected'])->default('pending');
            $table->timestamps();
            $table->softDeletes();

            $table->index('guest_id');
            $table->index('property_id');
            $table->index('status');
            $table->index(['check_in_date', 'check_out_date']);
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