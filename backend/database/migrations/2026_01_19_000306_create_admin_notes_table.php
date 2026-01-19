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
        Schema::create('admin_notes', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('noteable_type');
            $table->string('noteable_id');
            $table->foreignUlid('admin_id')->constrained('admins')->onDelete('cascade');
            $table->text('note');
            $table->boolean('is_internal')->default(true);
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['noteable_type', 'noteable_id']);
            $table->index('admin_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admin_notes');
    }
};
