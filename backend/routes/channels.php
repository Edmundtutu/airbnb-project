<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Conversation;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Authorize vendors to listen to their shop's private Inventory channel
Broadcast::channel('shopInventory.{shopId}', function ($user, string $shopId) {
    return Shop::where('id', $shopId)->where('owner_id', $user->id)->exists();
});

// Authorize users to listen to conversation channels
Broadcast::channel('conversation.{conversationId}', function ($user, int $conversationId) {
    $conversation = Conversation::find($conversationId);
    
    if (!$conversation) {
        return false;
    }
    
    // Allow access if user is the customer or a shop owner of the conversation
    return $user->id === $conversation->user_id || 
           $user->shops->contains('id', $conversation->shop_id);
});
