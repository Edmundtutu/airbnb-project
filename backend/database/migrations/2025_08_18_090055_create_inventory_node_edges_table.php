<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('inventory_node_edges', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('shop_id')->constrained('shops')->cascadeOnDelete();
            $table->foreignUlid('source_node_id')->constrained('inventory_nodes')->cascadeOnDelete();
            $table->foreignUlid('target_node_id')->constrained('inventory_nodes')->cascadeOnDelete();
            $table->string('label', 50)->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index('shop_id');
            $table->index(['source_node_id', 'target_node_id']);
        });
        // Raw SQL to enforce source_node_id ≠ target_node_id
        DB::statement('ALTER TABLE inventory_node_edges ADD CONSTRAINT chk_source_target CHECK (source_node_id <> target_node_id)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_node_edges');
    }
};
