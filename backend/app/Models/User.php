<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use App\Models\Follow;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasUlids;
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use  HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'avatar',
        'phone',
        'address',
        'lat',
        'lng',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'lat' => 'decimal:7',
            'lng' => 'decimal:7',
        ];
    }

    public function properties(): HasMany
    {
        return $this->hasMany(Property::class, 'host_id');
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'guest_id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function likes(): HasMany
    {
        return $this->hasMany(Like::class);
    }

    /**
     * Get all followers of this user (users who follow this user).
     */
    public function followers(): MorphToMany
    {
        return $this->morphToMany(User::class, 'followable', 'follows');
    }

    /**
     * Get all users and shops that this user follows.
     */
    public function following(): HasMany
    {
        return $this->hasMany(Follow::class, 'user_id');
    }

    /**
     * Check if the current user is following another user or shop.
     */
    public function isFollowing($followable): bool
    {
        return $this->following()
            ->where('followable_id', $followable->id)
            ->where('followable_type', get_class($followable))
            ->exists();
    }

    public function isHost():bool
    {
        return $this->role == 'host';
    }
    public function isGuest():bool
    {
        return $this->role == 'guest';
    }
    
    // Legacy methods for backward compatibility
    public function isVendor():bool
    {
        return $this->role == 'host';
    }
    public function isCustomer():bool
    {
        return $this->role == 'guest';
    }
}
