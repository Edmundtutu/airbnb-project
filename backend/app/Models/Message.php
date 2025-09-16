<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    protected $fillable = [
        'conversation_id',
        'sender_id',
        'sender_type',
        'content',
        'message_type',
        'media_url',
        'read_at',
    ];

    protected $casts = [
        'read_at' => 'datetime',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender(): BelongsTo
    {
        if ($this->sender_type === 'user') {
            return $this->belongsTo(User::class, 'sender_id');
        }
        return $this->belongsTo(Property::class, 'sender_id');
    }

    public function isFromUser(): bool
    {
        return $this->sender_type === 'user';
    }

    public function isFromProperty(): bool
    {
        return $this->sender_type === 'property';
    }
    
    // Legacy method for backward compatibility
    public function isFromShop(): bool
    {
        return $this->sender_type === 'property';
    }
}
