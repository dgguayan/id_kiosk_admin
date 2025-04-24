<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LogUserActivity
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        if (Auth::check()) {
            $user = Auth::user();
            // Log the user's activity here
            // You can store in database, file, or use Laravel's logging system
            // Example: activity()->causedBy($user)->log('User accessed ' . $request->path());
        }
        
        return $next($request);
    }
}
