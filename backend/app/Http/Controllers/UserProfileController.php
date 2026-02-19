<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserProfileController extends Controller
{
    private const ROLE_LEVEL = [
        'user' => 1,
        'owner' => 2,
        'admin' => 3,
        'superadmin' => 4,
    ];

    private function hasAtLeastRole(?string $role, string $required): bool
    {
        $lvl = self::ROLE_LEVEL[$role ?? ''] ?? 0;
        $req = self::ROLE_LEVEL[$required] ?? PHP_INT_MAX;
        return $lvl >= $req;
    }

    public function show(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // ✅ allow user AND upgraded roles
        if (!$this->hasAtLeastRole($user->role, 'user')) {
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

        if (!$this->hasAtLeastRole($user->role, 'user')) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'age' => ['nullable', 'integer', 'min:1'],
            'weight' => ['nullable', 'numeric', 'min:0.01'],
            'height' => ['nullable', 'numeric', 'min:0.01'],
            'address' => ['nullable', 'string'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'gender' => ['nullable', 'string', 'in:male,female,other'],
        ]);

        $update = ['updated_at' => now()];

        foreach (['age', 'weight', 'height', 'address', 'latitude', 'longitude', 'gender'] as $k) {
            if ($request->has($k)) {
                $update[$k] = $data[$k] ?? null;
            }
        }

        $exists = DB::table('user_profiles')
            ->where('user_id', $user->user_id)
            ->exists();

        if (!$exists) {
            $update['created_at'] = now();
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
