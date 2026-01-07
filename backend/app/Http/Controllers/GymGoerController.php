<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\GymGoer;
use App\Http\Resources\GymGoerResource;
use Illuminate\Http\Request;

class GymGoerController extends Controller
{

    public function index()
    {
        return GymGoerResource::collection(
            GymGoer::with([
                'preference',
                'preferredEquipments',
                'preferredAmenities',
            ])->paginate(10)
        );
    }

    /**
     * GET /api/users/{user}
     */
    public function show($user_id)
    {
        $user = GymGoer::with([
            'preference',
            'preferredEquipments',
            'preferredAmenities',
        ])->findOrFail($user_id);

        return new GymGoerResource($user);
    }
    public function preferences($user_id)
{
    $user = GymGoer::with(['preference', 'preferredAmenities', 'preferredEquipments'])
        ->findOrFail($user_id);

    return response()->json($user);
}

public function updatePreferences(Request $request, $user_id)
{
    $user = GymGoer::findOrFail($user_id);

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
