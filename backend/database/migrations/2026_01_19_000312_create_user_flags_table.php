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
        Schema::create('user_flags', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignUlid('flagged_by')->constrained('admins')->onDelete('cascade');
            $table->enum('flag_type', ['suspicious_activity', 'policy_violation', 'payment_issue', 'other']);
            $table->text('reason');
            $table->enum('severity', ['low', 'medium', 'high', 'critical']);
            $table->boolean('is_resolved')->default(false);
            $table->timestamp('resolved_at')->nullable();
            $table->foreignUlid('resolved_by')->nullable()->constrained('admins')->onDelete('set null');
            $table->text('resolution_notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('user_id');
            $table->index('flag_type');
            $table->index('is_resolved');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_flags');
    }
};
