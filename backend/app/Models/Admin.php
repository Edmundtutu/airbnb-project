<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;

class Admin extends Authenticatable
{
    use HasUlids, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'admin_role_id',
        'is_active',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(AdminRole::class, 'admin_role_id');
    }

    public function permissions(): BelongsToMany
    {
        return $this->role->permissions();
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->role->name === 'super_admin') {
            return true;
        }

        return $this->role->permissions()->where('name', $permission)->exists();
    }

    public function hasRole(string $roleName): bool
    {
        return $this->role->name === $roleName;
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(AdminActivityLog::class);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(AdminNote::class);
    }

    public function vendorReviews(): HasMany
    {
        return $this->hasMany(VendorOnboardingState::class, 'reviewed_by');
    }

    public function kycReviews(): HasMany
    {
        return $this->hasMany(KYCSubmission::class, 'reviewed_by');
    }
}
