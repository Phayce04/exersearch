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

        $profile = $user->profile;
        if (!$profile || !$profile->latitude || !$profile->longitude) {
            return response()->json(['message' => 'User location not set'], 422);
        }

        $preferences = $user->preference;
        if (!$preferences) {
            return response()->json(['message' => 'User preferences not set'], 422);
        }

        $mode = $request->query('mode', 'driving');
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
                'annual_price',     // ✅ include this
            ])
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->get();

        // ✅ pass mode
        $gymsWithFeatures = FitRank::getGymFeatures($user, $gyms, $mode);

        return response()->json([
            'user' => [
                'latitude' => $profile->latitude,
                'longitude' => $profile->longitude,
                'budget' => $preferences->budget,
                'plan_type' => $preferences->plan_type,
                'mode' => $mode,
            ],
            'gyms' => $gymsWithFeatures,
        ]);
    }
}
