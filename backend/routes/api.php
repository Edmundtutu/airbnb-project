<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\ChatController;
use App\Http\Controllers\Api\V1\PostHandlers\LikeController;
use App\Http\Controllers\Api\V1\PostHandlers\PostController;
use App\Http\Controllers\Api\V1\UserHandlers\AuthController;
use App\Http\Controllers\Api\V1\UserHandlers\FollowController;
use App\Http\Controllers\Api\V1\PostHandlers\CommentController;
use App\Http\Controllers\Api\V1\BookingHandlers\BookingController;
use App\Http\Controllers\Api\V1\BookingHandlers\ListingController;
use App\Http\Controllers\Api\V1\UserHandlers\SubscriberController;
use App\Http\Controllers\Api\V1\PostHandlers\CommentLikeController;
use App\Http\Controllers\Api\V1\PostHandlers\PostCommentController;
use App\Http\Controllers\Api\V1\PropertyHandlers\PropertyController;
use App\Http\Controllers\Api\V1\PropertyHandlers\ReviewController;

Route::prefix('v1')->group(function () {
    // Authentication routes
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    // Subscription and News Updates routes
    Route::post('/subscribe', [SubscriberController::class, 'subscribe'])
        ->withoutMiddleware([\Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class])
        ->name('subscribe');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
    });

    // Property routes
    Route::apiResource('properties', PropertyController::class)->only(['index', 'show']);
    Route::apiResource('properties', PropertyController::class)->middleware('auth:sanctum')->except(['index', 'show']);

    // Listing routes
    Route::apiResource('listings', ListingController::class)->only(['index', 'show']);
    Route::apiResource('listings', ListingController::class)->middleware('auth:sanctum')->except(['index', 'show']);

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
