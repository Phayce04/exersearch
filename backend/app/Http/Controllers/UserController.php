<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * GET /api/users
     * ⚠️ Recommend: remove this route or move to admin-only later.
     * Keeping it here for now, but making it safe by requiring superadmin.
     */
    public function index(Request $request)
    {
        $me = $request->user();
        if (!$me || $me->role !== 'superadmin') {
            abort(403, 'Unauthorized');
        }

        return UserResource::collection(
            User::where('role', 'user')
                ->with(['preference', 'preferredEquipments', 'preferredAmenities', 'userProfile']) // ✅ changed
                ->paginate(10)
        );
    }

    /**
     * GET /api/users/{user_id}
     * ✅ Minimal change: always return the logged-in user (ignore user_id)
     */
    public function show(Request $request, $user_id)
    {
        $me = $request->user();
        if (!$me) abort(401, 'Unauthenticated');

        $user = User::with(['preference', 'preferredEquipments', 'preferredAmenities', 'userProfile']) // ✅ changed
            ->findOrFail($me->user_id);

        return new UserResource($user);
    }

    public function preferences(Request $request, $user_id)
    {
        $me = $request->user();
        if (!$me) abort(401, 'Unauthenticated');

        $user = User::with(['preference', 'preferredAmenities', 'preferredEquipments'])
            ->findOrFail($me->user_id);

        return response()->json([
            'data' => [
                'user_id' => $user->user_id,
                'name' => $user->name,
                'email' => $user->email,
                'onboarded_at' => $user->onboarded_at, // ✅ added
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

        $user = User::where('role', 'user')->findOrFail($me->user_id);

        $validated = $request->validate([
            'goal' => 'nullable|string|max:100',
            'activity_level' => 'nullable|string|max:50',
            'budget' => 'nullable|numeric|min:0',

            'preferred_amenities' => 'nullable|array',
            'preferred_amenities.*' => 'integer',

            'preferred_equipments' => 'nullable|array',
            'preferred_equipments.*' => 'integer',
        ]);

        // ✅ Only preference table fields
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

        // ✅ Only sync if the key is present (so partial updates don't wipe)
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
     * ✅ NEW: Mark onboarding as completed (only for role=user)
     * Call this AFTER your onboarding wizard saves profile/preferences.
     */
    public function markOnboarded(Request $request)
    {
        $me = $request->user();
        if (!$me) abort(401, 'Unauthenticated');

        if ($me->role !== 'user') {
            return response()->json(['message' => 'Only gym users can complete onboarding.'], 403);
        }

        $me->onboarded_at = now();
        $me->save();

        return response()->json([
            'message' => 'Onboarding completed.',
            'onboarded_at' => $me->onboarded_at,
        ]);
    }
}
