<?php

use App\Http\Controllers\Api\V1\PostHandlers\CommentController;
use App\Http\Controllers\Api\V1\PostHandlers\CommentLikeController;
use App\Http\Controllers\Api\V1\PostHandlers\LikeController;
use App\Http\Controllers\Api\V1\PostHandlers\PostCommentController;
use App\Http\Controllers\Api\V1\UserHandlers\AuthController;
use App\Http\Controllers\Api\V1\PostHandlers\PostController;
use App\Http\Controllers\Api\V1\BookingHandlers\BookingController;
use App\Http\Controllers\Api\V1\BookingHandlers\ListingController;
use App\Http\Controllers\Api\V1\PropertyHandlers\Inventory\AddonController;
use App\Http\Controllers\Api\V1\PropertyHandlers\Inventory\CategoryController;
use App\Http\Controllers\Api\V1\PropertyHandlers\Inventory\InventoryController;
use App\Http\Controllers\Api\V1\PropertyHandlers\Inventory\ModificationController;
use App\Http\Controllers\Api\V1\PropertyHandlers\ReviewController;
use App\Http\Controllers\Api\V1\PropertyHandlers\PropertyController;
use App\Http\Controllers\Api\V1\UserHandlers\FollowController;
use App\Http\Controllers\Api\V1\ChatController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Authentication routes
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);

        // Inventory react flow nodes and edges routes
        Route::get('/inventory/{property}/graph', [InventoryController::class, 'getGraph']);

        Route::post('/inventory/nodes', [InventoryController::class, 'storeNode']);
        Route::patch('/inventory/nodes/{node}', [InventoryController::class, 'updateNode'])->middleware('can:update,node');
        Route::delete('/inventory/nodes/{node}', [InventoryController::class, 'destroyNode'])->middleware('can:delete,node');

        Route::post('/inventory/edges', [InventoryController::class, 'storeEdge']);
        Route::delete('/inventory/edges/{edge}', [InventoryController::class, 'destroyEdge'])->middleware('can:delete,edge');

        Route::patch('/nodes/{node}/position', [InventoryController::class, 'updateNodePosition'])->middleware('can:update,node');
    });

    // Property routes
    Route::apiResource('properties', PropertyController::class)->only(['index', 'show']);
    Route::apiResource('properties', PropertyController::class)->middleware('auth:sanctum')->except(['index', 'show']);

    // Listing routes
    Route::apiResource('listings', ListingController::class)->only(['index', 'show']);
    Route::apiResource('listings', ListingController::class)->middleware('auth:sanctum')->except(['index', 'show']);

    // Category routes
    Route::apiResource('categories', CategoryController::class)->only(['index', 'show']);
    Route::apiResource('categories', CategoryController::class)->middleware('auth:sanctum')->except(['index', 'show']);

    // Modifications & Addons routes
    Route::apiResource('modifications', ModificationController::class)->only(['index']);
    Route::apiResource('modifications', ModificationController::class)->middleware('auth:sanctum')->except(['index', 'show']);
    Route::apiResource('addons', AddonController::class)->only(['index']);
    Route::apiResource('addons', AddonController::class)->middleware('auth:sanctum')->except(['index', 'show']);

    // Post routes
    Route::apiResource('posts', PostController::class)->only(['index', 'show']);
    Route::apiResource('posts', PostController::class)->middleware('auth:sanctum')->except(['index', 'show']);
    Route::post('/posts/{post}/like', [PostController::class, 'likeOrUnlike'])->middleware('auth:sanctum');

    // Order routes
    Route::apiResource('posts.comments', PostCommentController::class)->middleware('auth:sanctum');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/host/bookings', [BookingController::class, 'hostBookings']);
        Route::patch('/host/bookings/{booking}/confirm', [BookingController::class, 'confirmBooking']);
        Route::patch('/host/bookings/{booking}/reject', [BookingController::class, 'rejectBooking']);
    });
    Route::apiResource('bookings', BookingController::class);

    // Review routes
    Route::apiResource('reviews', ReviewController::class);

    // Comment routes
    Route::apiResource('comments', CommentController::class);

    // Comment like routes
    Route::post('/comments/{comment}/like', [CommentLikeController::class, 'toggle'])->middleware('auth:sanctum');

    // Like routes
    Route::post('likes', [LikeController::class, 'store']);
    Route::delete('likes', [LikeController::class, 'destroy']);

    // Follow routes
    Route::post('follows', [FollowController::class, 'store']);
    Route::delete('follows/{user}', [FollowController::class, 'destroy']);
    Route::get('users/{user}/followers', [FollowController::class, 'followers']);
    Route::get('users/{user}/following', [FollowController::class, 'following']);

    // Chat routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/chat/conversation', [ChatController::class, 'getConversation']);
        Route::post('/chat/message', [ChatController::class, 'sendMessage']);
        Route::get('/chat/conversations/{conversationId}/messages', [ChatController::class, 'getMessages']);
        Route::patch('/chat/conversations/{conversationId}/read', [ChatController::class, 'markAsRead']);
        Route::get('/chat/conversations/user', [ChatController::class, 'getUserConversations']);
        Route::get('/chat/conversations/property', [ChatController::class, 'getPropertyConversations']);
        Route::post('/chat/typing/start', [ChatController::class, 'startTyping']);
        Route::post('/chat/typing/stop', [ChatController::class, 'stopTyping']);
        Route::post('/chat/presence', [ChatController::class, 'updatePresence']);
    });
});
