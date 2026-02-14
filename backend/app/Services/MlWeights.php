<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class MlWeights
{
    public static function defaultWeights(): array
    {
        return [
            'equipment' => 0.33,
            'amenity'   => 0.22,
            'travel'    => 0.20,
            'price'     => 0.20,
            'penalty'   => 0.05,
        ];
    }

    private static function normalize(array $w): array
    {
        $keys = ['equipment', 'amenity', 'travel', 'price', 'penalty'];
        $out = [];

        foreach ($keys as $k) {
            $out[$k] = isset($w[$k]) ? max(0.0, (float) $w[$k]) : 0.0;
        }

        $sum = array_sum($out);
        if ($sum <= 0) return $out;

        foreach ($out as $k => $v) {
            $out[$k] = $v / $sum;
        }

        return $out;
    }

    /**
     * Global weights for now (trained_global or default).
     * Cached so recommend endpoint stays fast.
     */
    public static function get(User $user, array $gymRowsForContext = []): array
    {
        $cacheKey = 'ml:weights:global:v1';

        return Cache::remember($cacheKey, now()->addMinutes(10), function () use ($user, $gymRowsForContext) {
            $base = rtrim((string) config('services.ml.url'), '/');
            $url = $base . '/weights';

            try {
                $payload = [
                    'user_id' => (int) $user->user_id,
                    'gyms' => array_map(function ($g) {
                        return [
                            'gym_id' => (int) ($g['gym_id'] ?? 0),
                            'equipment_match' => (float) ($g['equipment_match'] ?? 0),
                            'amenity_match' => (float) ($g['amenity_match'] ?? 0),
                            'travel_time_min' => (float) ($g['travel_time_min'] ?? 0),
                            'price' => (float) ($g['price'] ?? 0),
                            'budget_penalty' => (float) ($g['budget_penalty'] ?? 0),
                        ];
                    }, $gymRowsForContext),
                ];

                $res = Http::timeout((int) config('services.ml.timeout', 2))
                    ->acceptJson()
                    ->post($url, $payload);

                if ($res->successful()) {
                    $weights = $res->json('weights');
                    if (is_array($weights)) {
                        return self::normalize($weights);
                    }
                }
            } catch (\Throwable $e) {
                // silent fallback
            }

            return self::defaultWeights();
        });
    }
}
