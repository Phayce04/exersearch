<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ($user->role !== 'user') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $profile = DB::table('user_profiles')
            ->where('user_id', $user->user_id)
            ->first();

        return response()->json([
            'user' => [
                'user_id' => $user->user_id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'user_profile' => $profile,
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ($user->role !== 'user') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'age' => ['nullable', 'integer', 'min:1'],
            'weight' => ['nullable', 'numeric', 'min:0.01'],
            'height' => ['nullable', 'numeric', 'min:0.01'],
            'address' => ['nullable', 'string'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        // ✅ Only update fields that were ACTUALLY sent in the request
        // This prevents wiping age/height/weight when you only send address/lat/lng.
        $update = [
            'updated_at' => now(),
            'created_at' => DB::raw('COALESCE(created_at, NOW())'),
        ];

        foreach (['age', 'weight', 'height', 'address', 'latitude', 'longitude'] as $k) {
            if ($request->has($k)) {
                // if key exists but null, allow clearing intentionally
                $update[$k] = $data[$k] ?? null;
            }
        }

        DB::table('user_profiles')->updateOrInsert(
            ['user_id' => $user->user_id],
            $update
        );

        $profile = DB::table('user_profiles')
            ->where('user_id', $user->user_id)
            ->first();

        return response()->json([
            'message' => 'User profile updated.',
            'user_profile' => $profile,
        ]);
    }
}
