<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        return UserResource::collection(
            User::query()
                ->whereIn('role', ['user', 'owner'])
                ->with([
                    'userProfile',          // ✅ FIXED
                    'ownerProfile',
                    'preference',
                    'preferredEquipments',
                    'preferredAmenities',
                ])
                ->orderByDesc('user_id')
                ->paginate(10)
        );
    }

    public function show($user_id)
    {
        $user = User::query()
            ->whereIn('role', ['user', 'owner'])
            ->with([
                'userProfile',           // ✅ FIXED
                'ownerProfile',
                'preference',
                'preferredEquipments',
                'preferredAmenities',
            ])
            ->findOrFail($user_id);

        return new UserResource($user);
    }

    public function preferences($user_id)
    {
        $user = User::query()
            ->whereIn('role', ['user', 'owner'])
            ->with([
                'preference',
                'preferredEquipments',
                'preferredAmenities',
            ])
            ->findOrFail($user_id);

        return response()->json([
            'data' => [
                'user_id' => $user->user_id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'preferences' => $user->preference,
            'preferred_equipments' => $user->preferredEquipments,
            'preferred_amenities' => $user->preferredAmenities,
        ]);
    }

    public function updatePreferences(Request $request, $user_id)
    {
        $user = User::query()
            ->whereIn('role', ['user', 'owner'])
            ->with(['preference'])
            ->findOrFail($user_id);

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
            'message' => 'User preferences updated by admin.',
            'data' => new UserResource(
                $user->load([
                    'userProfile',        // ✅ FIXED
                    'ownerProfile',
                    'preference',
                    'preferredEquipments',
                    'preferredAmenities',
                ])
            ),
        ]);
    }
}
