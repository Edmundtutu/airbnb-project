<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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
        'onboarding_state_id',
        'flagged_at',
        'restricted_at',
        'restriction_reason',
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
            'flagged_at' => 'datetime',
            'restricted_at' => 'datetime',
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

    public function onboardingState(): BelongsTo
    {
        return $this->belongsTo(VendorOnboardingState::class, 'onboarding_state_id');
    }

    public function flags(): HasMany
    {
        return $this->hasMany(UserFlag::class);
    }

    public function kycSubmissions(): HasMany
    {
        return $this->hasMany(KYCSubmission::class, 'user_id');
    }

    /**
     * Get the user's device tokens for push notifications.
     */
    public function deviceTokens(): HasMany
    {
        return $this->hasMany(DeviceToken::class);
    }

    /**
     * Get active device tokens only.
     */
    public function activeDeviceTokens(): HasMany
    {
        return $this->deviceTokens()->where('is_active', true);
    }

    /**
     * Get the user's notification preferences.
     */
    public function notificationPreferences(): HasOne
    {
        return $this->hasOne(NotificationPreference::class);
    }

    /**
     * Get or create notification preferences with defaults.
     */
    public function getNotificationPreferences(): NotificationPreference
    {
        return $this->notificationPreferences ?? $this->notificationPreferences()->create(
            NotificationPreference::defaults()
        );
    }
}
