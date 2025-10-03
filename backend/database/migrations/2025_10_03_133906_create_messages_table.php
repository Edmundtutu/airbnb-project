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
        Schema::create('messages', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('conversation_id')->constrained('conversations')->cascadeOnDelete();
            $table->foreignUlid('sender_id')->constrained('users')->cascadeOnDelete();
            $table->text('content');
            $table->json('attachments')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            
            $table->index('conversation_id');
            $table->index('sender_id');
            $table->index('is_read');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};