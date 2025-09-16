<?php

namespace App\Models;

use App\Models\Category;
use App\Models\InventoryNode;
use App\Models\InventoryNodeEdge;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

class Property extends Model
{
    use HasFactory, HasUlids, SoftDeletes;

    protected $fillable = [
        'host_id',
        'name',
        'description',
        'address',
        'lat',
        'lng',
        'avatar',
        'cover_image',
        'phone',
        'hours',
        'category',
        'verified',
    ];

    protected $casts = [
        'lat' => 'decimal:7',
        'lng' => 'decimal:7',
        'hours' => 'json',
        'verified' => 'boolean',
    ];

    public function host(): BelongsTo
    {
        return $this->belongsTo(User::class, 'host_id');
    }

    public function listings(): HasMany
    {
        return $this->hasMany(Listing::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function reviews(): MorphMany
    {
        return $this->morphMany(Review::class, 'reviewable');
    }

    public function followers(): MorphToMany
    {
        return $this->morphToMany(User::class, 'followable', 'follows');
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class, 'property_id');
    }

    public function inventoryNodes(): HasMany
    {
        return $this->hasMany(InventoryNode::class, 'property_id');
    }

    public function inventoryNodeEdges(): HasMany
    {
        return $this->hasMany(InventoryNodeEdge::class);
    }
}
