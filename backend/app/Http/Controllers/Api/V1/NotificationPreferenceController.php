<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\NotificationPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationPreferenceController extends Controller
{
    /**
     * Get the authenticated user's notification preferences.
     * Creates defaults if none exist.
     */
    public function show(): JsonResponse
    {
        $preferences = Auth::user()->getNotificationPreferences();

        return response()->json([
            'preferences' => $preferences,
        ]);
    }

    /**
     * Update the authenticated user's notification preferences.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            // Global channel toggles
            'email_enabled' => 'boolean',
            'push_enabled' => 'boolean',
            'in_app_enabled' => 'boolean',
            
            // Booking notifications
            'booking_new_request' => 'boolean',
            'booking_confirmed' => 'boolean',
            'booking_rejected' => 'boolean',
            'booking_cancelled' => 'boolean',
            'booking_reminder' => 'boolean',
            
            // Other notifications
            'messages_enabled' => 'boolean',
            'reviews_enabled' => 'boolean',
            'promotions_enabled' => 'boolean',
        ]);

        $preferences = Auth::user()->getNotificationPreferences();
        $preferences->update($validated);

        return response()->json([
            'message' => 'Notification preferences updated.',
            'preferences' => $preferences->fresh(),
        ]);
    }

    /**
     * Reset preferences to defaults.
     */
    public function reset(): JsonResponse
    {
        $preferences = Auth::user()->getNotificationPreferences();
        $preferences->update(NotificationPreference::defaults());

        return response()->json([
            'message' => 'Notification preferences reset to defaults.',
            'preferences' => $preferences->fresh(),
        ]);
    }
}
