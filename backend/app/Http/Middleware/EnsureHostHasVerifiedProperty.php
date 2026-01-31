<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureHostHasVerifiedProperty
{
    /**
     * Handle an incoming request.
     *
     * Ensure that the authenticated user is a host and has at least one verified property.
     * If not, return a 403 Forbidden response.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Check if user is authenticated
        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        // Check if user is a host
        if (!$user->isHost()) {
            return response()->json([
                'message' => 'Access denied. This route is only available for hosts.'
            ], 403);
        }

        // Check if host has at least one verified property
        if (!$user->canAccessHostDashboard()) {
            return response()->json([
                'message' => 'Access denied. You must have at least one verified property to access the host dashboard.',
                'can_access_host_dashboard' => false,
                'redirect_to' => '/pre-onboard/pending-review'
            ], 403);
        }

        return $next($request);
    }
}
