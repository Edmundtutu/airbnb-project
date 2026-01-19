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
        Schema::create('vendor_onboarding_states', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('state', ['pending', 'under_review', 'approved', 'rejected', 'suspended']);
            $table->enum('previous_state', ['pending', 'under_review', 'approved', 'rejected', 'suspended'])->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignUlid('reviewed_by')->nullable()->constrained('admins')->onDelete('set null');
            $table->text('rejection_reason')->nullable();
            $table->text('suspension_reason')->nullable();
            $table->timestamp('kyc_submitted_at')->nullable();
            $table->timestamp('kyc_verified_at')->nullable();
            $table->foreignUlid('kyc_verified_by')->nullable()->constrained('admins')->onDelete('set null');
            $table->text('internal_notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('user_id');
            $table->index('state');
            $table->index('reviewed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vendor_onboarding_states');
    }
};
