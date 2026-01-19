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
        Schema::table('users', function (Blueprint $table) {
            $table->foreignUlid('onboarding_state_id')->nullable()->after('role')->constrained('vendor_onboarding_states')->onDelete('set null');
            $table->timestamp('flagged_at')->nullable()->after('last_active_at');
            $table->timestamp('restricted_at')->nullable()->after('flagged_at');
            $table->text('restriction_reason')->nullable()->after('restricted_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['onboarding_state_id']);
            $table->dropColumn(['onboarding_state_id', 'flagged_at', 'restricted_at', 'restriction_reason']);
        });
    }
};
