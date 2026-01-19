<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class VendorOnboardingState extends Model
{
    use HasUlids, HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'state',
        'previous_state',
        'submitted_at',
        'reviewed_at',
        'reviewed_by',
        'rejection_reason',
        'suspension_reason',
        'kyc_submitted_at',
        'kyc_verified_at',
        'kyc_verified_by',
        'internal_notes',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'kyc_submitted_at' => 'datetime',
            'kyc_verified_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'reviewed_by');
    }

    public function kycVerifier(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'kyc_verified_by');
    }

    public function canTransitionTo(string $newState): bool
    {
        $validTransitions = [
            'pending' => ['under_review'],
            'under_review' => ['approved', 'rejected'],
            'rejected' => ['pending'],
            'approved' => ['suspended'],
            'suspended' => ['approved'],
        ];

        return in_array($newState, $validTransitions[$this->state] ?? []);
    }
}
