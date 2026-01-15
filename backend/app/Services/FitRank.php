<?php

namespace App\Services;

use App\Models\User;
use App\Models\Gym;

class GymRecommendationService
{
    // 1️⃣ Compute Haversine distance
    public static function computeDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371; // km

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    // 2️⃣ Compute equipment match percentage
    public static function computeEquipmentMatch(array $userEquipIds, array $gymEquipIds)
    {
        if (empty($userEquipIds)) return 0;
        return count(array_intersect($userEquipIds, $gymEquipIds)) / count($userEquipIds);
    }

    // 3️⃣ Compute amenity match percentage
    public static function computeAmenityMatch(array $userAmenityIds, array $gymAmenityIds)
    {
        if (empty($userAmenityIds)) return 0;
        return count(array_intersect($userAmenityIds, $gymAmenityIds)) / count($userAmenityIds);
    }

    // 4️⃣ Compute plan type compatibility
    public static function isPlanCompatible($userPlan, Gym $gym)
    {
        return ($userPlan === 'daily' && $gym->daily_price !== null) ||
               ($userPlan === 'monthly' && $gym->monthly_price !== null);
    }

    // 5️⃣ Generate features for all gyms
    public static function getGymFeatures(User $user, $gyms)
    {
        $profile = $user->profile;
        $preferences = $user->preference;

        $userEquipIds = $user->preferredEquipments()->pluck('equipments.equipment_id')->toArray();
        $userAmenityIds = $user->preferredAmenities()->pluck('amenities.amenity_id')->toArray();

        $results = [];

        foreach ($gyms as $gym) {
            $gymEquipIds = $gym->equipments->pluck('equipment_id')->toArray();
            $gymAmenityIds = $gym->amenities->pluck('amenity_id')->toArray();

            $distanceKm = self::computeDistance(
                $profile->latitude,
                $profile->longitude,
                $gym->latitude,
                $gym->longitude
            );

            $results[] = [
                'gym_id' => $gym->gym_id,
                'name' => $gym->name,
                'latitude' => $gym->latitude,
                'longitude' => $gym->longitude,
                'distance_km' => round($distanceKm, 2),
                'budget_score' => $preferences->budget > 0 ? min(1, ($preferences->budget / ($user->preference->plan_type === 'daily' ? $gym->daily_price : $gym->monthly_price))) : 0,
                'equipment_match' => self::computeEquipmentMatch($userEquipIds, $gymEquipIds),
                'amenity_match' => self::computeAmenityMatch($userAmenityIds, $gymAmenityIds),
                'plan_compatible' => self::isPlanCompatible($preferences->plan_type, $gym) ? 1 : 0
            ];
        }

        return $results;
    }
}
