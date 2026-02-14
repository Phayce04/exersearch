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

        // ✅ load correct relationships (matching your app)
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
                // add if you have it:
                // 'main_image_url',
            ])
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->get();

        // ✅ user preferred lists (names/images) so frontend can render green/red
        // NOTE: we use relationship already loaded; no extra query needed.
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

        $gymsWithFeatures = FitRank::getGymFeatures($user, $gyms, $mode);

        return response()->json([
            'user' => [
                'latitude'  => (float) $profile->latitude,
                'longitude' => (float) $profile->longitude,
                'budget'    => $preferences->budget,
                'plan_type' => $preferences->plan_type,
                'mode'      => $mode,

                // ✅ breakdown data
                'preferred_equipments' => $preferredEquipments,
                'preferred_amenities'  => $preferredAmenities,
            ],
            'gyms' => $gymsWithFeatures,
        ]);
    }
}
