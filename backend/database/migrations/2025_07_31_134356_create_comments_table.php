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
        Schema::create('comments', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->constrained('users')->cascadeOnDelete();
            $table->ulidMorphs('commentable'); // This creates commentable_id and commentable_type
            $table->text('body');
            $table->foreignUlid('parent_id')->nullable()->constrained('comments')->cascadeOnDelete();
            $table->integer('depth')->default(0);
            $table->timestamps();
            $table->softDeletes();
            $table->index(['commentable_id', 'commentable_type', 'parent_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('comments');
    }
};
