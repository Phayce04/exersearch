<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeoController extends Controller
{
    public function search(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $limit = (int) $request->query('limit', 5);
        $lon = $request->query('lon');
        $lat = $request->query('lat');

        if ($q === '') {
            return response()->json([
                'features' => [],
            ]);
        }

        try {
            $response = Http::timeout(15)
                ->acceptJson()
                ->withHeaders([
                    'User-Agent' => 'ExerSearch/1.0',
                ])
                ->get('https://photon.komoot.io/api/', [
                    'q' => $q,
                    'limit' => max(1, min($limit, 10)),
                    'lon' => $lon,
                    'lat' => $lat,
                ]);

            if (!$response->successful()) {
                Log::warning('Photon search failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'query' => $q,
                    'lat' => $lat,
                    'lon' => $lon,
                ]);

                return response()->json([
                    'features' => [],
                    'message' => 'Location search service is unavailable.',
                ], 200);
            }

            return response()->json($response->json() ?? ['features' => []]);
        } catch (\Throwable $e) {
            Log::error('Geo search exception', [
                'message' => $e->getMessage(),
                'query' => $q,
                'lat' => $lat,
                'lon' => $lon,
            ]);

            return response()->json([
                'features' => [],
                'message' => 'Location search failed.',
            ], 200);
        }
    }

    public function reverse(Request $request)
    {
        $lon = $request->query('lon');
        $lat = $request->query('lat');

        if ($lon === null || $lat === null) {
            return response()->json([
                'message' => 'lat and lon are required',
                'features' => [],
            ], 422);
        }

        try {
            $response = Http::timeout(15)
                ->acceptJson()
                ->withHeaders([
                    'User-Agent' => 'ExerSearch/1.0',
                ])
                ->get('https://photon.komoot.io/reverse', [
                    'lon' => $lon,
                    'lat' => $lat,
                ]);

            if (!$response->successful()) {
                Log::warning('Photon reverse failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'lat' => $lat,
                    'lon' => $lon,
                ]);

                return response()->json([
                    'features' => [],
                    'message' => 'Reverse geocoding service is unavailable.',
                ], 200);
            }

            return response()->json($response->json() ?? ['features' => []]);
        } catch (\Throwable $e) {
            Log::error('Geo reverse exception', [
                'message' => $e->getMessage(),
                'lat' => $lat,
                'lon' => $lon,
            ]);

            return response()->json([
                'features' => [],
                'message' => 'Reverse geocoding failed.',
            ], 200);
        }
    }
}