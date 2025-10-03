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
        Schema::create('booking_details', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('booking_id')->constrained('bookings')->cascadeOnDelete();
            $table->foreignUlid('listing_id')->constrained('listings')->cascadeOnDelete();
            $table->integer('quantity')->default(1);
            $table->decimal('price', 8, 2);
            $table->decimal('total', 8, 2);
            $table->timestamps();
            
            $table->index('booking_id');
            $table->index('listing_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('booking_details');
    }
};