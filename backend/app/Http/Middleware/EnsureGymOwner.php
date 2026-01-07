<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureGymOwner
{
    public function handle(Request $request, Closure $next)
    {
        if (!auth()->guard('gym_owner')->check()) {
            abort(403, 'Gym owner access only');
        }

        return $next($request);
    }
}