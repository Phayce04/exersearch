<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Gym;

class GymRecommendationController extends Controller
{
public function index(Request $request)
{
    $user = $request->user();

    $profile = $user->profile;
    if (!$profile || !$profile->latitude || !$profile->longitude) {
        return response()->json([
            'message' => 'User location not set'
        ], 422);
    }

    $preferences = $user->preference;
    if (!$preferences) {
        return response()->json([
            'message' => 'User preferences not set'
        ], 422);
    }

    $preferredEquipmentIds = $user->preferredEquipments()
        ->pluck('equipments.equipment_id')
        ->toArray();

    $preferredAmenityIds = $user->preferredAmenities()
        ->pluck('amenities.amenity_id')
        ->toArray();

    $gyms = Gym::with(['equipments', 'amenities'])
        ->select([
            'gym_id',
            'name',
            'latitude',
            'longitude',
            'daily_price',
            'monthly_price'
        ])
        ->get();

    return response()->json([
        'user' => [
            'latitude' => $profile->latitude,
            'longitude' => $profile->longitude,
            'budget' => $preferences->budget,
            'plan_type' => $preferences->plan_type,
            'preferred_equipments' => $preferredEquipmentIds,
            'preferred_amenities' => $preferredAmenityIds,
        ],
        'gyms' => $gyms
    ]);
}

}
