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
        Schema::create('category_listing', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('category_id')->constrained('categories')->cascadeOnDelete();
            $table->foreignUlid('listing_id')->constrained('listings')->cascadeOnDelete();
            $table->timestamps();
            
            $table->index('category_id');
            $table->index('listing_id');
            $table->unique(['category_id', 'listing_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('category_listing');
    }
};