<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\DeviceToken;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class DeviceTokenController extends Controller
{
    /**
     * Register a new device token for push notifications.
     * If token already exists, updates its metadata.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string|max:500',
            'device_type' => ['nullable', 'string', Rule::in(['web', 'ios', 'android'])],
            'device_name' => 'nullable|string|max:255',
        ]);

        /** @var User $user */
        $user = Auth::user();

        // Upsert: update if token exists, create if not
        $deviceToken = DeviceToken::updateOrCreate(
            ['token' => $validated['token']],
            [
                'user_id' => $user->id,
                'device_type' => $validated['device_type'] ?? 'web',
                'device_name' => $validated['device_name'] ?? $this->detectDeviceName($request),
                'is_active' => true,
                'last_used_at' => now(),
            ]
        );

        return response()->json([
            'message' => 'Device token registered successfully.',
            'device_token' => $deviceToken,
        ], 201);
    }

    /**
     * List all device tokens for the authenticated user.
     */
    public function index(): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();
        $deviceTokens = $user
            ->deviceTokens()
            ->orderBy('last_used_at', 'desc')
            ->get();

        return response()->json([
            'device_tokens' => $deviceTokens,
        ]);
    }

    /**
     * Remove a device token (logout from push notifications).
     */
    public function destroy(string $token): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();
        $deleted = $user
            ->deviceTokens()
            ->where('token', $token)
            ->delete();

        if (!$deleted) {
            return response()->json([
                'message' => 'Device token not found.',
            ], 404);
        }

        return response()->json([
            'message' => 'Device token removed successfully.',
        ]);
    }

    /**
     * Deactivate a device token (soft disable).
     */
    public function deactivate(string $token): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();
        $deviceToken = $user
            ->deviceTokens()
            ->where('token', $token)
            ->first();

        if (!$deviceToken) {
            return response()->json([
                'message' => 'Device token not found.',
            ], 404);
        }

        $deviceToken->deactivate();

        return response()->json([
            'message' => 'Device token deactivated.',
        ]);
    }

    /**
     * Remove all device tokens for the authenticated user.
     * Useful when user wants to sign out of all devices.
     */
    public function destroyAll(): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();
        $deleted = $user->deviceTokens()->delete();

        return response()->json([
            'message' => "Removed {$deleted} device tokens.",
            'deleted_count' => $deleted,
        ]);
    }

    /**
     * Attempt to detect device name from user agent.
     */
    private function detectDeviceName(Request $request): string
    {
        $userAgent = $request->userAgent() ?? '';

        // Simple detection - can be enhanced with a proper parser
        if (str_contains($userAgent, 'iPhone')) {
            return 'iPhone';
        }
        if (str_contains($userAgent, 'iPad')) {
            return 'iPad';
        }
        if (str_contains($userAgent, 'Android')) {
            return 'Android Device';
        }
        if (str_contains($userAgent, 'Chrome')) {
            return 'Chrome Browser';
        }
        if (str_contains($userAgent, 'Firefox')) {
            return 'Firefox Browser';
        }
        if (str_contains($userAgent, 'Safari')) {
            return 'Safari Browser';
        }

        return 'Unknown Device';
    }
}
