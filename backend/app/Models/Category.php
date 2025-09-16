<?php

namespace App\Models;

use App\Models\Property;
use App\Models\Listing;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Category extends Model
{
    use HasFactory, HasUlids, SoftDeletes;

    protected $fillable = [
        'property_id',
        'name',
        'description',
    ];

    public function listings()
    {
        return $this->belongsToMany(Listing::class, 'category_listing');
    }
    
    public function property()
    {
        return $this->belongsTo(Property::class, 'property_id');
    }
}
