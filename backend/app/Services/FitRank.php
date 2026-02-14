<?php

namespace App\Services;

use App\Models\User;
use App\Models\Gym;
use Illuminate\Support\Facades\Http;

class FitRank
{
    /* -----------------------------
     * Core feature helpers
     * ----------------------------- */

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

    public static function computeEquipmentMatch(array $userEquipIds, array $gymEquipIds)
    {
        if (empty($userEquipIds)) return 0.0;
        return count(array_intersect($userEquipIds, $gymEquipIds)) / max(1, count($userEquipIds));
    }

    public static function computeAmenityMatch(array $userAmenityIds, array $gymAmenityIds)
    {
        if (empty($userAmenityIds)) return 0.0;
        return count(array_intersect($userAmenityIds, $gymAmenityIds)) / max(1, count($userAmenityIds));
    }

    private static function getPriceForPlan(string $planType, Gym $gym): ?float
    {
        return match ($planType) {
            'daily'   => $gym->daily_price   !== null ? (float) $gym->daily_price   : null,
            'monthly' => $gym->monthly_price !== null ? (float) $gym->monthly_price : null,
            'annual'  => $gym->annual_price  !== null ? (float) $gym->annual_price  : null,
            default   => null,
        };
    }

    public static function isPlanCompatible($userPlan, Gym $gym)
    {
        return self::getPriceForPlan((string) $userPlan, $gym) !== null;
    }

    private static function budgetPenalty(?float $budget, ?float $price): float
    {
        if (!$budget || $budget <= 0) return 1.0;
        if (!$price  || $price  <= 0) return 0.0;

        if ($price <= $budget) return 1.0;

        $overRatio = ($price - $budget) / $budget;
        return max(0.0, 1.0 - $overRatio);
    }

    /* -----------------------------
     * Google Distance Matrix
     * ----------------------------- */

    public static function getGoogleTravelData(
        float $originLat,
        float $originLng,
        float $destLat,
        float $destLng,
        string $mode = 'driving'
    ): ?array {
        $key = config('services.google_maps.key');
        if (!$key) return null;

        $response = Http::get(
            'https://maps.googleapis.com/maps/api/distancematrix/json',
            [
                'origins' => "{$originLat},{$originLng}",
                'destinations' => "{$destLat},{$destLng}",
                'mode' => $mode,
                'units' => 'metric',
                'key' => $key,
            ]
        );

        if (!$response->successful()) return null;

        $data = $response->json();
        if (($data['status'] ?? '') !== 'OK') return null;

        $element = $data['rows'][0]['elements'][0] ?? null;
        if (!$element || ($element['status'] ?? '') !== 'OK') return null;

        $durationSeconds = $element['duration']['value'] ?? null;
        $distanceMeters  = $element['distance']['value'] ?? null;

        if ($durationSeconds === null || $distanceMeters === null) return null;

        return [
            'travel_time_min' => (int) round($durationSeconds / 60),
            'google_distance_km' => round($distanceMeters / 1000, 2),
        ];
    }

    /* -----------------------------
     * TOPSIS helpers
     * ----------------------------- */

    private static function normalizeVector(array $values): array
    {
        $denom = sqrt(array_sum(array_map(fn($v) => $v * $v, $values)));
        if ($denom <= 0) $denom = 1;

        return array_map(fn($v) => $v / $denom, $values);
    }

    private static function estimateTravelTime(array $gym): float
    {
        if (!empty($gym['travel_time_min'])) return (float) $gym['travel_time_min'];
        return ((float) ($gym['distance_km'] ?? 0)) * 3.0;
    }

    public static function applyTopsis(array $gyms, array $weights): array
    {
        if (count($gyms) === 0) return $gyms;

        $equip   = array_map(fn($g) => (float) ($g['equipment_match'] ?? 0), $gyms);
        $amen    = array_map(fn($g) => (float) ($g['amenity_match'] ?? 0), $gyms);
        $penalty = array_map(fn($g) => (float) ($g['budget_penalty'] ?? 1), $gyms);

        $travel  = array_map(fn($g) => (float) self::estimateTravelTime($g), $gyms);
        $price   = array_map(fn($g) => (float) ($g['price'] ?? 0), $gyms);

        $equipN   = self::normalizeVector($equip);
        $amenN    = self::normalizeVector($amen);
        $penN     = self::normalizeVector($penalty);
        $travelN  = self::normalizeVector($travel);
        $priceN   = self::normalizeVector($price);

        foreach ($gyms as $i => &$g) {
            $g['_v'] = [
                'equip'  => ($weights['equipment'] ?? 0) * $equipN[$i],
                'amen'   => ($weights['amenity']   ?? 0) * $amenN[$i],
                'pen'    => ($weights['penalty']   ?? 0) * $penN[$i],
                'travel' => ($weights['travel']    ?? 0) * $travelN[$i],
                'price'  => ($weights['price']     ?? 0) * $priceN[$i],
            ];
        }
        unset($g);

        $vEquip  = array_map(fn($g) => $g['_v']['equip'],  $gyms);
        $vAmen   = array_map(fn($g) => $g['_v']['amen'],   $gyms);
        $vPen    = array_map(fn($g) => $g['_v']['pen'],    $gyms);
        $vTravel = array_map(fn($g) => $g['_v']['travel'], $gyms);
        $vPrice  = array_map(fn($g) => $g['_v']['price'],  $gyms);

        $Aplus = [
            'equip'  => max($vEquip),
            'amen'   => max($vAmen),
            'pen'    => max($vPen),
            'travel' => min($vTravel),
            'price'  => min($vPrice),
        ];

        $Aminus = [
            'equip'  => min($vEquip),
            'amen'   => min($vAmen),
            'pen'    => min($vPen),
            'travel' => max($vTravel),
            'price'  => max($vPrice),
        ];

        foreach ($gyms as &$g) {
            $Dp = sqrt(
                pow($g['_v']['equip']  - $Aplus['equip'], 2) +
                pow($g['_v']['amen']   - $Aplus['amen'], 2) +
                pow($g['_v']['pen']    - $Aplus['pen'], 2) +
                pow($g['_v']['travel'] - $Aplus['travel'], 2) +
                pow($g['_v']['price']  - $Aplus['price'], 2)
            );

            $Dm = sqrt(
                pow($g['_v']['equip']  - $Aminus['equip'], 2) +
                pow($g['_v']['amen']   - $Aminus['amen'], 2) +
                pow($g['_v']['pen']    - $Aminus['pen'], 2) +
                pow($g['_v']['travel'] - $Aminus['travel'], 2) +
                pow($g['_v']['price']  - $Aminus['price'], 2)
            );

            $denom = $Dp + $Dm;
            $g['topsis_score'] = $denom > 0 ? round($Dm / $denom, 6) : 0.0;

            unset($g['_v']);
        }
        unset($g);

        usort($gyms, fn($a, $b) => $b['topsis_score'] <=> $a['topsis_score']);

        return $gyms;
    }

    /* -----------------------------
     * Main entry: build features + rank
     * ----------------------------- */

    // ✅ NOW RETURNS: [ rankedGyms, weightsUsed ]
    public static function getGymFeatures(User $user, $gyms, string $mode = 'driving')
    {
        $profile = $user->userProfile;
        $preferences = $user->preference;

        $userEquipIds = $user->preferredEquipments->pluck('equipment_id')->toArray();
        $userAmenityIds = $user->preferredAmenities->pluck('amenity_id')->toArray();

        $planType = (string) $preferences->plan_type;
        $budget   = $preferences->budget !== null ? (float) $preferences->budget : null;

        $results = [];

        foreach ($gyms as $gym) {
            $gymEquipIds   = $gym->equipments->pluck('equipment_id')->toArray();
            $gymAmenityIds = $gym->amenities->pluck('amenity_id')->toArray();

            $matchedEquipIds = array_values(array_intersect($userEquipIds, $gymEquipIds));
            $matchedAmenityIds = array_values(array_intersect($userAmenityIds, $gymAmenityIds));

            $distanceKm = self::computeDistance(
                (float) $profile->latitude,
                (float) $profile->longitude,
                (float) $gym->latitude,
                (float) $gym->longitude
            );

            $gymPrice = self::getPriceForPlan($planType, $gym);

            $google = null;
            if ($distanceKm <= 15) {
                $google = self::getGoogleTravelData(
                    (float) $profile->latitude,
                    (float) $profile->longitude,
                    (float) $gym->latitude,
                    (float) $gym->longitude,
                    $mode
                );
            }

            $gymEquipments = $gym->equipments
                ->map(fn($e) => [
                    'equipment_id' => $e->equipment_id,
                    'name' => $e->name,
                    'image_url' => $e->image_url,
                    'category' => $e->category ?? null,
                ])
                ->values();

            $gymAmenities = $gym->amenities
                ->map(fn($a) => [
                    'amenity_id' => $a->amenity_id,
                    'name' => $a->name,
                    'image_url' => $a->image_url,
                ])
                ->values();

            $results[] = [
                'gym_id' => $gym->gym_id,
                'name' => $gym->name,
                'latitude' => $gym->latitude,
                'longitude' => $gym->longitude,

                'distance_km' => round($distanceKm, 2),

                'google_distance_km' => $google['google_distance_km'] ?? null,
                'travel_time_min' => $google['travel_time_min'] ?? null,

                'price' => $gymPrice,
                'budget_penalty' => self::budgetPenalty($budget, $gymPrice),

                'equipment_match' => self::computeEquipmentMatch($userEquipIds, $gymEquipIds),
                'amenity_match'   => self::computeAmenityMatch($userAmenityIds, $gymAmenityIds),

                'plan_compatible' => self::isPlanCompatible($planType, $gym) ? 1 : 0,

                'gym_equipments' => $gymEquipments,
                'gym_amenities' => $gymAmenities,
                'matched_equipment_ids' => $matchedEquipIds,
                'matched_amenity_ids' => $matchedAmenityIds,
            ];
        }

        $results = array_values(array_filter($results, fn($g) =>
            ($g['plan_compatible'] ?? 0) == 1 && ($g['price'] ?? null) !== null
        ));

        $weights = \App\Services\MlWeights::get($user, $results);
        $ranked = self::applyTopsis($results, $weights);

        return [$ranked, $weights];
    }
}
