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
        // Rename order_items table to booking_details
        Schema::rename('order_items', 'booking_details');
        
        // Update booking_details table structure
        Schema::table('booking_details', function (Blueprint $table) {
            // Rename foreign key columns
            $table->renameColumn('order_id', 'booking_id');
            // listing_id was already renamed in the previous migration
            
            // Remove quantity column as bookings are typically for the entire listing
            $table->dropColumn('quantity');
            
            // Add booking detail specific fields
            $table->decimal('price_per_night', 8, 2)->after('price');
            $table->integer('nights')->after('price_per_night');
            $table->decimal('subtotal', 8, 2)->after('nights'); // price_per_night * nights
            $table->decimal('cleaning_fee', 8, 2)->default(0)->after('subtotal');
            $table->decimal('service_fee', 8, 2)->default(0)->after('cleaning_fee');
            $table->json('selected_amenities')->nullable()->after('service_fee');
            $table->json('addon_services')->nullable()->after('selected_amenities');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore original order_items table structure
        Schema::table('booking_details', function (Blueprint $table) {
            // Remove booking-specific fields
            $table->dropColumn([
                'price_per_night',
                'nights',
                'subtotal',
                'cleaning_fee',
                'service_fee',
                'selected_amenities',
                'addon_services'
            ]);
            
            // Add back quantity column
            $table->integer('quantity')->default(1)->after('price');
            
            // Rename back to original foreign key column names
            $table->renameColumn('booking_id', 'order_id');
            // product_id will be renamed back in the reverse of the listings migration
        });
        
        // Rename booking_details table back to order_items
        Schema::rename('booking_details', 'order_items');
    }
};