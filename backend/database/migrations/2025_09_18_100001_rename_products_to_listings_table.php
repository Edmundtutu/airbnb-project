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
        // Rename products table to listings
        Schema::rename('products', 'listings');
        
        // Add Airbnb-specific columns to listings table
        Schema::table('listings', function (Blueprint $table) {
            // Rename price to price_per_night for clarity
            $table->renameColumn('price', 'price_per_night');
            
            // Rename stock to max_guests (capacity)
            $table->renameColumn('stock', 'max_guests');
            
            // Add accommodation-specific fields
            $table->integer('bedrooms')->default(1)->after('max_guests');
            $table->integer('bathrooms')->default(1)->after('bedrooms');
            $table->json('amenities')->nullable()->after('tags');
            $table->json('house_rules')->nullable()->after('amenities');
            $table->string('check_in_time')->default('15:00')->after('house_rules');
            $table->string('check_out_time')->default('11:00')->after('check_in_time');
            $table->decimal('cleaning_fee', 8, 2)->default(0)->after('check_out_time');
            $table->decimal('service_fee', 8, 2)->default(0)->after('cleaning_fee');
            $table->boolean('instant_book')->default(false)->after('service_fee');
            
            // Remove unit column as it's not needed for accommodations
            $table->dropColumn('unit');
        });
        
        // Update foreign key references in related tables
        Schema::table('order_items', function (Blueprint $table) {
            $table->renameColumn('product_id', 'listing_id');
        });
        
        Schema::table('reviews', function (Blueprint $table) {
            $table->renameColumn('product_id', 'listing_id');
        });
        
        Schema::table('posts', function (Blueprint $table) {
            $table->renameColumn('product_id', 'listing_id');
        });
        
        // Update category_product pivot table to category_listing
        if (Schema::hasTable('category_product')) {
            Schema::rename('category_product', 'category_listing');
            Schema::table('category_listing', function (Blueprint $table) {
                $table->renameColumn('product_id', 'listing_id');
            });
        }
        
        // Update inventory nodes if they reference products
        if (Schema::hasColumn('inventory_nodes', 'product_id')) {
            Schema::table('inventory_nodes', function (Blueprint $table) {
                $table->renameColumn('product_id', 'listing_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse the foreign key references
        Schema::table('order_items', function (Blueprint $table) {
            $table->renameColumn('listing_id', 'product_id');
        });
        
        Schema::table('reviews', function (Blueprint $table) {
            $table->renameColumn('listing_id', 'product_id');
        });
        
        Schema::table('posts', function (Blueprint $table) {
            $table->renameColumn('listing_id', 'product_id');
        });
        
        // Reverse category_listing pivot table
        if (Schema::hasTable('category_listing')) {
            Schema::table('category_listing', function (Blueprint $table) {
                $table->renameColumn('listing_id', 'product_id');
            });
            Schema::rename('category_listing', 'category_product');
        }
        
        // Reverse inventory nodes if they were changed
        if (Schema::hasColumn('inventory_nodes', 'listing_id')) {
            Schema::table('inventory_nodes', function (Blueprint $table) {
                $table->renameColumn('listing_id', 'product_id');
            });
        }
        
        // Remove Airbnb-specific columns and restore original structure
        Schema::table('listings', function (Blueprint $table) {
            // Add back unit column
            $table->string('unit', 20)->default('pcs');
            
            // Remove Airbnb-specific columns
            $table->dropColumn([
                'bedrooms',
                'bathrooms', 
                'amenities',
                'house_rules',
                'check_in_time',
                'check_out_time',
                'cleaning_fee',
                'service_fee',
                'instant_book'
            ]);
            
            // Rename back to original column names
            $table->renameColumn('max_guests', 'stock');
            $table->renameColumn('price_per_night', 'price');
        });
        
        // Rename listings table back to products
        Schema::rename('listings', 'products');
    }
};