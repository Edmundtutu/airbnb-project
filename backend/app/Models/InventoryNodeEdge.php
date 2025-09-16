<?php
namespace App\Models;

use App\Models\Property;
use App\Models\InventoryNode;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class InventoryNodeEdge extends Model
{
    use HasFactory, HasUlids, SoftDeletes;

    protected $fillable = [
        'property_id',
        'source_node_id', 
        'target_node_id', 
        'label',
        'metadata'
    ];

    protected $casts = [
        'metadata' => 'array'
    ];

    public function property()
    {
        return $this->belongsTo(Property::class, 'property_id');
    }

    public function sourceNode()
    {
        return $this->belongsTo(InventoryNode::class, 'source_node_id');
    }

    public function targetNode()
    {
        return $this->belongsTo(InventoryNode::class, 'target_node_id');
    }
}
