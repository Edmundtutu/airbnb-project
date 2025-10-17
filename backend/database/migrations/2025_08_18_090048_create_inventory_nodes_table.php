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
        Schema::create('inventory_nodes', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('shop_id')->constrained('shops')->cascadeOnDelete();
            $table->enum('entity_type', ['category', 'product', 'modification', 'addon']);
            $table->foreignUlid('entity_id')->nullable();
            $table->integer('x')->nullable();
            $table->integer('y')->nullable();
            $table->string('display_name', 120)->nullable();
            $table->string('color_code', 16)->nullable();
            $table->string('icon', 64)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['shop_id', 'entity_type', 'entity_id']);
            $table->index('shop_id');
            $table->index(['entity_type', 'entity_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_nodes');
    }
};
