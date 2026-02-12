<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\AppSetting;

class CheckMaintenanceMode
{
    public function handle(Request $request, Closure $next)
    {
        $settings = AppSetting::find(1);

        if (!$settings || !$settings->maintenance_mode) {
            return $next($request);
        }

        // Allow health check
        if ($request->path() === 'up') {
            return $next($request);
        }

        $path = $request->path(); // "api/v1/auth/login" etc.

        // ✅ Always allow login so admin can still get in
        if (str_ends_with($path, 'auth/login')) {
            return $next($request);
        }

        // ✅ Optional: block register during maintenance
        if (str_ends_with($path, 'auth/register')) {
            return response()->json([
                'message' => 'System is under maintenance.'
            ], 503);
        }

        $user = $request->user();

        // ✅ allow admin/superadmin
        if ($user && in_array($user->role, ['admin', 'superadmin'])) {
            return $next($request);
        }

        // ✅ block everyone else
        return response()->json([
            'message' => 'System is under maintenance.'
        ], 503);
    }
}
