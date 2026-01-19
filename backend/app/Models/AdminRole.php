<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdminRole extends Model
{
    use HasUlids, HasFactory;

    protected $fillable = [
        'name',
        'display_name',
        'description',
    ];

    public function admins(): HasMany
    {
        return $this->hasMany(Admin::class, 'admin_role_id');
    }

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(AdminPermission::class, 'admin_role_permissions', 'admin_role_id', 'admin_permission_id');
    }
}
