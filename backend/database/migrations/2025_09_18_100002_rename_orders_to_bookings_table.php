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
        // Rename orders table to bookings
        Schema::rename('orders', 'bookings');
        
        // Update bookings table structure for Airbnb domain
        Schema::table('bookings', function (Blueprint $table) {
            // Rename user_id to guest_id for clarity
            $table->renameColumn('user_id', 'guest_id');
            
            // Rename total to total_price
            $table->renameColumn('total', 'total_price');
            
            // Replace delivery fields with booking-specific fields
            $table->dropColumn(['delivery_type', 'delivery_address']);
            
            // Add booking-specific fields
            $table->date('check_in')->after('total_price');
            $table->date('check_out')->after('check_in');
            $table->integer('guests')->default(1)->after('check_out');
            $table->integer('nights')->after('guests');
            $table->decimal('price_per_night', 8, 2)->after('nights');
            $table->decimal('cleaning_fee', 8, 2)->default(0)->after('price_per_night');
            $table->decimal('service_fee', 8, 2)->default(0)->after('cleaning_fee');
            $table->text('special_requests')->nullable()->after('notes');
            $table->string('arrival_time')->nullable()->after('special_requests');
            
            // Update status enum values for booking workflow
            $table->dropColumn('status');
            $table->enum('status', [
                'pending', 
                'confirmed', 
                'rejected', 
                'cancelled',
                'checked_in',
                'checked_out', 
                'completed'
            ])->default('pending')->after('service_fee');
        });
        
        // Update foreign key references in related tables
        Schema::table('reviews', function (Blueprint $table) {
            if (Schema::hasColumn('reviews', 'order_id')) {
                $table->renameColumn('order_id', 'booking_id');
            }
        });
        
        Schema::table('conversations', function (Blueprint $table) {
            if (Schema::hasColumn('conversations', 'order_id')) {
                $table->renameColumn('order_id', 'booking_id');
            }
        });
        
        Schema::table('posts', function (Blueprint $table) {
            if (Schema::hasColumn('posts', 'order_id')) {
                $table->renameColumn('order_id', 'booking_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse foreign key references
        Schema::table('reviews', function (Blueprint $table) {
            if (Schema::hasColumn('reviews', 'booking_id')) {
                $table->renameColumn('booking_id', 'order_id');
            }
        });
        
        Schema::table('conversations', function (Blueprint $table) {
            if (Schema::hasColumn('conversations', 'booking_id')) {
                $table->renameColumn('booking_id', 'order_id');
            }
        });
        
        Schema::table('posts', function (Blueprint $table) {
            if (Schema::hasColumn('posts', 'booking_id')) {
                $table->renameColumn('booking_id', 'order_id');
            }
        });
        
        // Restore original orders table structure
        Schema::table('bookings', function (Blueprint $table) {
            // Remove booking-specific fields
            $table->dropColumn([
                'check_in',
                'check_out',
                'guests',
                'nights',
                'price_per_night',
                'cleaning_fee',
                'service_fee',
                'special_requests',
                'arrival_time'
            ]);
            
            // Restore original status enum
            $table->dropColumn('status');
            $table->enum('status', [
                'pending', 
                'confirmed', 
                'processing', 
                'shipped', 
                'delivered', 
                'cancelled'
            ])->default('pending');
            
            // Restore delivery fields
            $table->enum('delivery_type', ['pickup', 'delivery', 'express'])->after('status');
            $table->string('delivery_address')->nullable()->after('delivery_type');
            
            // Rename back to original column names
            $table->renameColumn('total_price', 'total');
            $table->renameColumn('guest_id', 'user_id');
        });
        
        // Rename bookings table back to orders
        Schema::rename('bookings', 'orders');
    }
};