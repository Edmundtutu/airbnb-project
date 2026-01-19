<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminHasRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $admin = Auth::guard('admin')->user();

        if (!$admin) {
            abort(401, 'Unauthenticated.');
        }

        foreach ($roles as $role) {
            if ($admin->hasRole($role)) {
                return $next($request);
            }
        }

        abort(403, 'You do not have the required role to access this resource.');
    }
}
