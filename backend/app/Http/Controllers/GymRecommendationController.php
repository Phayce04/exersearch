<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Gym;
use App\Services\FitRank;

class GymRecommendationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $user->load([
            'userProfile',
            'preference',
            'preferredEquipments',
            'preferredAmenities',
        ]);

        $profile = $user->userProfile;

        if (
            !$profile ||
            $profile->latitude === null || $profile->longitude === null ||
            $profile->latitude === ''   || $profile->longitude === ''
        ) {
            return response()->json(['message' => 'User location not set'], 422);
        }

        $preferences = $user->preference;
        if (!$preferences) {
            return response()->json(['message' => 'User preferences not set'], 422);
        }

        $mode = (string) $request->query('mode', 'driving');
        if (!in_array($mode, ['driving', 'walking', 'transit'], true)) {
            $mode = 'driving';
        }

        $gyms = Gym::with(['equipments', 'amenities'])
            ->select([
                'gym_id',
                'name',
                'latitude',
                'longitude',
                'daily_price',
                'monthly_price',
                'annual_price',
            ])
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->get();

        $preferredEquipments = $user->preferredEquipments
            ->map(fn($e) => [
                'equipment_id' => $e->equipment_id,
                'name' => $e->name,
                'image_url' => $e->image_url,
                'category' => $e->category ?? null,
            ])
            ->values();

        $preferredAmenities = $user->preferredAmenities
            ->map(fn($a) => [
                'amenity_id' => $a->amenity_id,
                'name' => $a->name,
                'image_url' => $a->image_url,
            ])
            ->values();

        [$gymsWithFeatures, $weightsUsed] = FitRank::getGymFeatures($user, $gyms, $mode);

        return response()->json([
            'user' => [
                'latitude'  => (float) $profile->latitude,
                'longitude' => (float) $profile->longitude,
                'budget'    => $preferences->budget,
                'plan_type' => $preferences->plan_type,
                'mode'      => $mode,

                'preferred_equipments' => $preferredEquipments,
                'preferred_amenities'  => $preferredAmenities,
            ],
            'weights_used' => $weightsUsed,
            'gyms' => $gymsWithFeatures,
        ]);
    }
}
