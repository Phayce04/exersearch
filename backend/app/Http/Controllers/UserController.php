<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;

class UserController extends Controller
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

    /**
     * GET /api/users
     * Superadmin-only list of gym users
     */
    public function index(Request $request)
    {
        $me = $request->user();
        if (!$me || !$this->hasAtLeastRole($me->role, 'superadmin')) {
            abort(403, 'Unauthorized');
        }

        return UserResource::collection(
            User::where('role', 'user')
                ->with(['preference', 'preferredEquipments', 'preferredAmenities', 'userProfile'])
                ->paginate(10)
        );
    }

    /**
     * GET /api/users/{user_id}
     * Always returns logged-in user (ignores user_id)
     */
    public function show(Request $request, $user_id)
    {
        $me = $request->user();
        if (!$me) abort(401, 'Unauthenticated');

        // ✅ allow upgraded roles as well
        if (!$this->hasAtLeastRole($me->role, 'user')) {
            abort(403, 'Forbidden');
        }

        $user = User::with(['preference', 'preferredEquipments', 'preferredAmenities', 'userProfile'])
            ->findOrFail($me->user_id);

        return new UserResource($user);
    }

    public function preferences(Request $request, $user_id)
    {
        $me = $request->user();
        if (!$me) abort(401, 'Unauthenticated');

        // ✅ allow upgraded roles as well
        if (!$this->hasAtLeastRole($me->role, 'user')) {
            abort(403, 'Forbidden');
        }

        $user = User::with(['preference', 'preferredAmenities', 'preferredEquipments'])
            ->findOrFail($me->user_id);

        return response()->json([
            'data' => [
                'user_id' => $user->user_id,
                'name' => $user->name,
                'email' => $user->email,
                'onboarded_at' => $user->onboarded_at,
                'role' => $user->role,
            ],
            'preferences' => $user->preference,
            'preferred_equipments' => $user->preferredEquipments,
            'preferred_amenities' => $user->preferredAmenities,
        ]);
    }

    public function updatePreferences(Request $request, $user_id)
    {
        $me = $request->user();
        if (!$me) abort(401, 'Unauthenticated');

        // ✅ allow upgraded roles as well
        if (!$this->hasAtLeastRole($me->role, 'user')) {
            abort(403, 'Forbidden');
        }

        // ✅ IMPORTANT: remove role filter (owner/admin/superadmin should still update their own prefs)
        $user = User::findOrFail($me->user_id);

        $validated = $request->validate([
            'goal' => 'nullable|string|max:100',
            'activity_level' => 'nullable|string|max:50',
            'budget' => 'nullable|numeric|min:0',

            'preferred_amenities' => 'nullable|array',
            'preferred_amenities.*' => 'integer',

            'preferred_equipments' => 'nullable|array',
            'preferred_equipments.*' => 'integer',
        ]);

        $prefData = [];
        if (array_key_exists('goal', $validated)) $prefData['goal'] = $validated['goal'];
        if (array_key_exists('activity_level', $validated)) $prefData['activity_level'] = $validated['activity_level'];
        if (array_key_exists('budget', $validated)) $prefData['budget'] = $validated['budget'];

        if (!empty($prefData)) {
            $user->preference()->updateOrCreate(
                ['user_id' => $user->user_id],
                $prefData
            );
        }

        if (array_key_exists('preferred_amenities', $validated)) {
            $user->preferredAmenities()->sync($validated['preferred_amenities'] ?? []);
        }

        if (array_key_exists('preferred_equipments', $validated)) {
            $user->preferredEquipments()->sync($validated['preferred_equipments'] ?? []);
        }

        return response()->json([
            'message' => 'Preferences updated successfully',
            'user' => $user->load(['preference', 'preferredAmenities', 'preferredEquipments']),
        ]);
    }

    /**
     * Mark onboarding as completed
     * ✅ Changed: allow upgraded roles to complete onboarding too (they still use user app)
     *
     * If you truly want ONLY pure users to have onboarding, keep the old check.
     */
    public function markOnboarded(Request $request)
    {
        $me = $request->user();
        if (!$me) abort(401, 'Unauthenticated');

        // ✅ allow upgraded roles as well
        if (!$this->hasAtLeastRole($me->role, 'user')) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $me->onboarded_at = now();
        $me->save();

        return response()->json([
            'message' => 'Onboarding completed.',
            'onboarded_at' => $me->onboarded_at,
        ]);
    }
}
