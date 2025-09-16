<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Booking extends Model
{
    use HasFactory, HasUlids, SoftDeletes;

    protected $fillable = [
        'guest_id',
        'property_id',
        'total',
        'status',
        'check_in_date',
        'check_out_date',
        'guest_count',
        'notes',
    ];

    protected $casts = [
        'total' => 'decimal:2',
        'check_in_date' => 'date',
        'check_out_date' => 'date',
    ];

    public function guest(): BelongsTo
    {
        return $this->belongsTo(User::class, 'guest_id');
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function details(): HasMany
    {
        return $this->hasMany(BookingDetails::class);
    }
}
