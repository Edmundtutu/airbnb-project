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
        // Rename shops table to properties
        Schema::rename('shops', 'properties');
        
        // Update the foreign key column name in related tables
        Schema::table('products', function (Blueprint $table) {
            $table->renameColumn('shop_id', 'property_id');
        });
        
        Schema::table('orders', function (Blueprint $table) {
            $table->renameColumn('shop_id', 'property_id');
        });
        
        Schema::table('reviews', function (Blueprint $table) {
            $table->renameColumn('shop_id', 'property_id');
        });
        
        Schema::table('posts', function (Blueprint $table) {
            $table->renameColumn('shop_id', 'property_id');
        });
        
        // Update inventory nodes table if it references shops
        if (Schema::hasColumn('inventory_nodes', 'shop_id')) {
            Schema::table('inventory_nodes', function (Blueprint $table) {
                $table->renameColumn('shop_id', 'property_id');
            });
        }
        
        // Update conversations table if it references shops
        if (Schema::hasColumn('conversations', 'shop_id')) {
            Schema::table('conversations', function (Blueprint $table) {
                $table->renameColumn('shop_id', 'property_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse the foreign key column name changes
        Schema::table('products', function (Blueprint $table) {
            $table->renameColumn('property_id', 'shop_id');
        });
        
        Schema::table('orders', function (Blueprint $table) {
            $table->renameColumn('property_id', 'shop_id');
        });
        
        Schema::table('reviews', function (Blueprint $table) {
            $table->renameColumn('property_id', 'shop_id');
        });
        
        Schema::table('posts', function (Blueprint $table) {
            $table->renameColumn('property_id', 'shop_id');
        });
        
        // Reverse inventory nodes table if it was changed
        if (Schema::hasColumn('inventory_nodes', 'property_id')) {
            Schema::table('inventory_nodes', function (Blueprint $table) {
                $table->renameColumn('property_id', 'shop_id');
            });
        }
        
        // Reverse conversations table if it was changed
        if (Schema::hasColumn('conversations', 'property_id')) {
            Schema::table('conversations', function (Blueprint $table) {
                $table->renameColumn('property_id', 'shop_id');
            });
        }
        
        // Rename properties table back to shops
        Schema::rename('properties', 'shops');
    }
};