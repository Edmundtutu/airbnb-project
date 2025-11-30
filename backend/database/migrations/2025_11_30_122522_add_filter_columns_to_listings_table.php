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
        Schema::table('listings', function (Blueprint $table) {
            // Add beds column (separate from bedrooms for sofa beds, etc.)
            $table->integer('beds')->default(1)->after('bedrooms');
            
            // Booking options
            $table->boolean('self_check_in')->default(false)->after('instant_book');
            $table->boolean('allows_pets')->default(false)->after('self_check_in');
            
            // Accessibility features (JSON array for flexible storage)
            $table->json('accessibility_features')->nullable()->after('house_rules');
            
            // Add index for commonly filtered boolean columns
            $table->index('self_check_in');
            $table->index('allows_pets');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->dropIndex(['self_check_in']);
            $table->dropIndex(['allows_pets']);
            
            $table->dropColumn([
                'beds',
                'self_check_in',
                'allows_pets',
                'accessibility_features',
            ]);
        });
    }
};
