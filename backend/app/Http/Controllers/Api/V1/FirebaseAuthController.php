<?php

/**
 * Firebase Authentication Controller
 * 
 * This controller generates Firebase custom tokens for authenticated users.
 * Place this file in: backend/app/Http/Controllers/Api/FirebaseAuthController.php
 */

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Auth as FirebaseAuth;

class FirebaseAuthController extends Controller
{
    private $auth;

    public function __construct()
    {
        // Initialize Firebase Admin SDK
        try {
            $serviceAccountPath = config('firebase.credentials.file');
            
            if (!file_exists($serviceAccountPath)) {
                Log::error('Firebase service account file not found: ' . $serviceAccountPath);
                throw new \Exception('Firebase service account file not found');
            }

            $factory = (new Factory)->withServiceAccount($serviceAccountPath);
            $this->auth = $factory->createAuth();
        } catch (\Exception $e) {
            Log::error('Failed to initialize Firebase: ' . $e->getMessage());
            $this->auth = null;
        }
    }

    /**
     * Generate a custom token for the authenticated user
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCustomToken(Request $request)
    {
        try {
            // Get authenticated user
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'User not authenticated'
                ], 401);
            }

            if (!$this->auth) {
                return response()->json([
                    'error' => 'Service Unavailable',
                    'message' => 'Firebase service not initialized'
                ], 503);
            }

            // Create custom token with user claims
            $customToken = $this->auth->createCustomToken($user->id, [
                'email' => $user->email,
                'name' => $user->name,
                'role' => $user->role ?? 'guest',
                'avatar' => $user->avatar ?? null,
                'created_at' => now()->timestamp,
            ]);

            return response()->json([
                'token' => $customToken->toString(),
                'uid' => $user->id,
                'expires_in' => 3600, // Token valid for 1 hour
            ]);

        } catch (\Exception $e) {
            Log::error('Firebase custom token generation failed', [
                'user_id' => $user->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Internal Server Error',
                'message' => 'Failed to generate authentication token'
            ], 500);
        }
    }

    /**
     * Verify a Firebase ID token (optional - for future use)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifyToken(Request $request)
    {
        try {
            $idToken = $request->input('id_token');

            if (!$idToken) {
                return response()->json([
                    'error' => 'Bad Request',
                    'message' => 'ID token is required'
                ], 400);
            }

            if (!$this->auth) {
                return response()->json([
                    'error' => 'Service Unavailable',
                    'message' => 'Firebase service not initialized'
                ], 503);
            }

            $verifiedIdToken = $this->auth->verifyIdToken($idToken);
            $uid = $verifiedIdToken->claims()->get('sub');

            return response()->json([
                'uid' => $uid,
                'claims' => $verifiedIdToken->claims()->all(),
                'valid' => true,
            ]);

        } catch (\Exception $e) {
            Log::error('Firebase token verification failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Invalid token',
                'valid' => false,
            ], 401);
        }
    }

    /**
     * Revoke user's Firebase tokens (for logout/security)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function revokeTokens(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'User not authenticated'
                ], 401);
            }

            if (!$this->auth) {
                return response()->json([
                    'error' => 'Service Unavailable',
                    'message' => 'Firebase service not initialized'
                ], 503);
            }

            $this->auth->revokeRefreshTokens($user->id);

            return response()->json([
                'message' => 'Tokens revoked successfully',
                'uid' => $user->id,
            ]);

        } catch (\Exception $e) {
            Log::error('Firebase token revocation failed', [
                'user_id' => $user->id ?? null,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Internal Server Error',
                'message' => 'Failed to revoke tokens'
            ], 500);
        }
    }
}
