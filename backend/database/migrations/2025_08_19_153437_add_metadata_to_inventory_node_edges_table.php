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
        Schema::table('inventory_node_edges', function (Blueprint $table) {
            if (!Schema::hasColumn('inventory_node_edges', 'metadata')) {
                $table->json('metadata')->nullable()->after('label');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_node_edges', function (Blueprint $table) {
            if (Schema::hasColumn('inventory_node_edges', 'metadata')) {
                $table->dropColumn('metadata');
            }
        });
    }
};
