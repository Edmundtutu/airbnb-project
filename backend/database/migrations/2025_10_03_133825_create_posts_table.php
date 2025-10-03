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
        Schema::create('posts', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('content');
            $table->json('images')->nullable();
            $table->foreignUlid('listing_id')->nullable()->constrained('listings')->nullOnDelete();
            $table->foreignUlid('property_id')->nullable()->constrained('properties')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('user_id');
            $table->index('listing_id');
            $table->index('property_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};