<?php

namespace App\Models;

use App\Models\Shop;
use App\Models\InventoryNodeEdge;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class InventoryNode extends Model
{
    use HasFactory, HasUlids, SoftDeletes;

    protected $fillable = [
        'shop_id',
        'entity_type',
        'entity_id',
        'x',
        'y',
        'display_name',
        'color_code',
        'icon',
        'metadata'
    ];
    
    protected $casts = [
        'metadata' => 'array'
    ];
    
    public function shop()
    {
        return $this->belongsTo(Shop::class, 'shop_id');
    }
    
    public function sourceEdges()
    {
        return $this->hasMany(InventoryNodeEdge::class, 'source_node_id');
    }
    
    public function targetEdges()
    {
        return $this->hasMany(InventoryNodeEdge::class, 'target_node_id');
    }
}
