<?php

namespace App\Http\Controllers;

use App\Models\MacroPreset;
use Illuminate\Http\Request;

class MacroPresetController extends Controller
{
    /**
     * GET /api/macro-presets
     */
    public function index()
    {
        try {
            $presets = MacroPreset::where('is_active', true)->orderBy('name')->get();
            return response()->json(['success' => true, 'data' => $presets, 'count' => $presets->count()]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false, 'message' => 'Failed to fetch presets', 'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/macro-presets/{id}
     */
    public function show($id)
    {
        try {
            $preset = MacroPreset::findOrFail($id);
            return response()->json(['success' => true, 'data' => $preset]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Preset not found'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false, 'message' => 'Failed to fetch preset', 'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/macro-presets/{id}/calculate
     * Body: { "calories": 2000 }
     * Returns exact gram targets for that calorie level
     */
    public function calculate(Request $request, $id)
    {
        try {
            $request->validate([
                'calories' => 'required|numeric|min:500|max:10000',
            ]);

            $preset   = MacroPreset::findOrFail($id);
            $calories = (float) $request->calories;

            return response()->json([
                'success' => true,
                'data'    => [
                    'preset'         => $preset->name,
                    'total_calories' => $calories,
                    'macros'         => $this->calcMacros($calories, $preset),
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['success' => false, 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false, 'message' => 'Calculation failed', 'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ── Helper ────────────────────────────────────────────────────────────────
    private function calcMacros(float $calories, MacroPreset $preset): array
    {
        return [
            'protein' => [
                'grams'    => round(($calories * $preset->protein_percent / 100) / 4),
                'calories' => round($calories * $preset->protein_percent / 100),
                'percent'  => $preset->protein_percent,
            ],
            'carbs' => [
                'grams'    => round(($calories * $preset->carbs_percent / 100) / 4),
                'calories' => round($calories * $preset->carbs_percent / 100),
                'percent'  => $preset->carbs_percent,
            ],
            'fats' => [
                'grams'    => round(($calories * $preset->fats_percent / 100) / 9),
                'calories' => round($calories * $preset->fats_percent / 100),
                'percent'  => $preset->fats_percent,
            ],
        ];
    }
}