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
        Schema::create('properties', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('host_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->text('description');
            $table->string('address');
            $table->decimal('lat', 10, 8);
            $table->decimal('lng', 11, 8);
            $table->string('avatar')->nullable();
            $table->string('cover_image')->nullable();
            $table->string('phone')->nullable();
            $table->json('hours')->nullable();
            $table->string('category');
            $table->boolean('verified')->default(false);
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('host_id');
            $table->index(['lat', 'lng']);
            $table->index('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('properties');
    }
};