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
        Schema::create('conversations', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('user1_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUlid('user2_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUlid('property_id')->nullable()->constrained('properties')->nullOnDelete();
            $table->string('subject')->nullable();
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();
            
            $table->index('user1_id');
            $table->index('user2_id');
            $table->index('property_id');
            $table->index('last_message_at');
            $table->unique(['user1_id', 'user2_id', 'property_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};