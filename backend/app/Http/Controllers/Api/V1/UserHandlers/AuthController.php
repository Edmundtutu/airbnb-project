<?php

namespace App\Http\Controllers\Api\V1\UserHandlers;

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Password::defaults()],
            'role' => 'sometimes|in:guest,host,customer,vendor',
        ]);

        // Map legacy role values to new values for backward compatibility
        $role = $data['role'] ?? 'guest';
        if ($role === 'customer') {
            $role = 'guest';
        } elseif ($role === 'vendor') {
            $role = 'host';
        }

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => $role,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt($credentials)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $user = $request->user();
        $token = $user->createToken('auth_token')->plainTextToken;

        $response = [
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ];

        // Add host dashboard access flag for hosts
        if ($user->isHost()) {
            $response['can_access_host_dashboard'] = $user->canAccessHostDashboard();
        }

        return response()->json($response);
    }

    public function logout(Request $request)
    {
        $token = $request->user()->currentAccessToken();
        if ($token && isset($token->id)) {
            // Delete the persisted personal access token by id (avoids calling delete() on TransientToken)
            $request->user()->tokens()->where('id', $token->id)->delete();
        }

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function user(Request $request)
    {
        $user = $request->user();
        $response = $user->toArray();
        
        // Add host dashboard access flag for hosts
        if ($user->isHost()) {
            $response['can_access_host_dashboard'] = $user->canAccessHostDashboard();
        }
        
        return response()->json($response);
    }
}
