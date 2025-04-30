<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckUserRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // Check if user is authenticated and has one of the allowed roles
        if (!$request->user() || !in_array(strtolower($request->user()->role), array_map('strtolower', $roles))) {
            // For Inertia requests, redirect with a flash message
            if ($request->header('X-Inertia')) {
                return redirect()->route('dashboard')->with('error', 'You do not have permission to access this page.');
            }
            
            // For API requests
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
            
            // For regular requests
            return abort(403, 'Unauthorized access');
        }

        return $next($request);
    }
}
