<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Http\Resources\GymGoerResource; // You can rename this to UserResource if you want
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        return GymGoerResource::collection(
            User::where('role', 'user')
                ->with(['preference', 'preferredEquipments', 'preferredAmenities'])
                ->paginate(10)
        );
    }

    /**
     * GET /api/users/{user_id}
     */
    public function show($user_id)
    {
        $user = User::where('role', 'user')
            ->with(['preference', 'preferredEquipments', 'preferredAmenities'])
            ->findOrFail($user_id);

        return new GymGoerResource($user);
    }

    /**
     * GET /api/users/{user_id}/preferences
     */
    public function preferences($user_id)
    {
        $user = User::where('role', 'user')
            ->with(['preference', 'preferredAmenities', 'preferredEquipments'])
            ->findOrFail($user_id);

        return response()->json($user);
    }

    /**
     * PUT /api/users/{user_id}/preferences
     */
    public function updatePreferences(Request $request, $user_id)
    {
        $user = User::where('role', 'user')->findOrFail($user_id);

        $validated = $request->validate([
            'goal' => 'nullable|string|max:100',
            'activity_level' => 'nullable|string|max:50',
            'budget' => 'nullable|numeric|min:0',
            'preferred_amenities' => 'nullable|array',
            'preferred_equipments' => 'nullable|array',
        ]);

        $user->preference()->updateOrCreate(
            ['user_id' => $user->user_id],
            $validated
        );

        if (isset($validated['preferred_amenities'])) {
            $user->preferredAmenities()->sync($validated['preferred_amenities']);
        }

        if (isset($validated['preferred_equipments'])) {
            $user->preferredEquipments()->sync($validated['preferred_equipments']);
        }

        return response()->json([
            'message' => 'Preferences updated successfully',
            'user' => $user->load(['preference', 'preferredAmenities', 'preferredEquipments'])
        ]);
    }
}
