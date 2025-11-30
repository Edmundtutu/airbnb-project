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
        Schema::create('listings', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('property_id')->constrained('properties')->cascadeOnDelete();
            $table->string('name');
            $table->text('description');
            $table->decimal('price_per_night', 8, 2);
            $table->json('images')->nullable();
            $table->string('category');
            $table->integer('max_guests');
            $table->boolean('is_active')->default(true);
            $table->json('tags')->nullable();
            $table->integer('bedrooms')->default(1);
            $table->decimal('bathrooms', 3, 1)->default(1);
            $table->json('amenities')->nullable();
            $table->json('house_rules')->nullable();
            $table->string('check_in_time')->default('15:00');
            $table->string('check_out_time')->default('11:00');
            $table->decimal('cleaning_fee', 8, 2)->default(0);
            $table->decimal('service_fee', 8, 2)->default(0);
            $table->boolean('instant_book')->default(false);
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('property_id');
            $table->index('category');
            $table->index('is_active');
            $table->index('price_per_night');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('listings');
    }
};