<?php

namespace App\Models;

use App\Models\Category;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Listing extends Model
{
    use HasFactory, HasUlids, SoftDeletes;

    protected $fillable = [
        'property_id',
        'name',
        'description',
        'price_per_night',
        'images',
        'category',
        'max_guests',
        'bedrooms',
        'beds',
        'bathrooms',
        'amenities',
        'house_rules',
        'accessibility_features',
        'tags',
        'is_active',
        'instant_book',
        'self_check_in',
        'allows_pets',
    ];

    protected $casts = [
        'price_per_night' => 'decimal:2',
        'images' => 'array',
        'tags' => 'array',
        'amenities' => 'array',
        'house_rules' => 'array',
        'accessibility_features' => 'array',
        'is_active' => 'boolean',
        'instant_book' => 'boolean',
        'self_check_in' => 'boolean',
        'allows_pets' => 'boolean',
        'bedrooms' => 'integer',
        'beds' => 'integer',
        'bathrooms' => 'decimal:1',
    ];

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function reviews(): MorphMany
    {
        return $this->morphMany(Review::class, 'reviewable');
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }

    public function categories()
    {
        return $this->belongsToMany(Category::class, 'category_listing');
    }
}
