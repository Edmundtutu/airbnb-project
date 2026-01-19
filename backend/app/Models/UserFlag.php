<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserFlag extends Model
{
    use HasUlids, HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'flagged_by',
        'flag_type',
        'reason',
        'severity',
        'is_resolved',
        'resolved_at',
        'resolved_by',
        'resolution_notes',
    ];

    protected function casts(): array
    {
        return [
            'is_resolved' => 'boolean',
            'resolved_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function flaggedBy(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'flagged_by');
    }

    public function resolvedBy(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'resolved_by');
    }
}
