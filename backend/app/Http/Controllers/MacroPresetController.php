<?php

namespace App\Http\Controllers;

use App\Models\MacroPreset;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MacroPresetController extends Controller
{
    /**
     * GET /api/v1/macro-presets
     */
    public function index()
    {
        try {
            $presets = MacroPreset::where('is_active', true)
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $presets,
                'count' => $presets->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch presets',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/v1/macro-presets/{id}
     */
    public function show($id)
    {
        try {
            $preset = MacroPreset::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $preset,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Preset not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch preset',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/v1/macro-presets/{id}/calculate
     */
    public function calculate(Request $request, $id)
    {
        try {
            $request->validate([
                'calories' => 'required|numeric|min:500|max:10000',
            ]);

            $preset = MacroPreset::findOrFail($id);
            $calories = (float) $request->calories;

            return response()->json([
                'success' => true,
                'data' => [
                    'preset' => $preset->name,
                    'total_calories' => $calories,
                    'macros' => $this->calcMacros($calories, $preset),
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'errors' => $e->errors(),
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Preset not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Calculation failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/v1/admin/macro-presets
     */
    public function adminIndex(Request $request)
    {
        try {
            $q = trim((string) $request->query('q', ''));
            $active = $request->query('active');
            $limit = (int) $request->query('limit', 5000);

            $query = MacroPreset::query();

            if ($q !== '') {
                $query->where(function ($inner) use ($q) {
                    $inner->where('name', 'ILIKE', "%{$q}%");

                    if (is_numeric($q)) {
                        $inner->orWhere('id', (int) $q);
                    }
                });
            }

            if ($active !== null && $active !== '') {
                $query->where('is_active', ((int) $active) === 1);
            }

            $presets = $query
                ->orderBy('name')
                ->limit($limit > 0 ? min($limit, 5000) : 5000)
                ->get();

            return response()->json($presets);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load admin macro presets.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/v1/admin/macro-presets
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => ['required', 'string', 'max:255', 'unique:macro_presets,name'],
                'protein_percent' => ['required', 'numeric', 'min:0', 'max:100'],
                'carbs_percent' => ['required', 'numeric', 'min:0', 'max:100'],
                'fats_percent' => ['required', 'numeric', 'min:0', 'max:100'],
                'is_active' => ['nullable', 'boolean'],
            ]);

            $sum =
                (float) $validated['protein_percent'] +
                (float) $validated['carbs_percent'] +
                (float) $validated['fats_percent'];

            if (abs($sum - 100) > 0.01) {
                return response()->json([
                    'success' => false,
                    'message' => 'Macro percentages must total 100.',
                ], 422);
            }

            $preset = MacroPreset::create([
                'name' => $validated['name'],
                'protein_percent' => $validated['protein_percent'],
                'carbs_percent' => $validated['carbs_percent'],
                'fats_percent' => $validated['fats_percent'],
                'is_active' => $validated['is_active'] ?? true,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Macro preset created successfully.',
                'data' => $preset,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create macro preset.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * PUT/PATCH /api/v1/admin/macro-presets/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $preset = MacroPreset::findOrFail($id);

            $validated = $request->validate([
                'name' => [
                    'required',
                    'string',
                    'max:255',
                    Rule::unique('macro_presets', 'name')->ignore($preset->id, 'id'),
                ],
                'protein_percent' => ['required', 'numeric', 'min:0', 'max:100'],
                'carbs_percent' => ['required', 'numeric', 'min:0', 'max:100'],
                'fats_percent' => ['required', 'numeric', 'min:0', 'max:100'],
                'is_active' => ['required', 'boolean'],
            ]);

            $sum =
                (float) $validated['protein_percent'] +
                (float) $validated['carbs_percent'] +
                (float) $validated['fats_percent'];

            if (abs($sum - 100) > 0.01) {
                return response()->json([
                    'success' => false,
                    'message' => 'Macro percentages must total 100.',
                ], 422);
            }

            $preset->update([
                'name' => $validated['name'],
                'protein_percent' => $validated['protein_percent'],
                'carbs_percent' => $validated['carbs_percent'],
                'fats_percent' => $validated['fats_percent'],
                'is_active' => $validated['is_active'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Macro preset updated successfully.',
                'data' => $preset->fresh(),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Preset not found.',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update macro preset.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * DELETE /api/v1/admin/macro-presets/{id}
     */
    public function destroy($id)
    {
        try {
            $preset = MacroPreset::findOrFail($id);
            $name = $preset->name;
            $preset->delete();

            return response()->json([
                'success' => true,
                'message' => "Macro preset '{$name}' deleted successfully.",
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Preset not found.',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete macro preset.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * PATCH /api/v1/admin/macro-presets/{id}/toggle
     */
    public function toggle($id)
    {
        try {
            $preset = MacroPreset::findOrFail($id);
            $preset->is_active = !$preset->is_active;
            $preset->save();

            return response()->json([
                'success' => true,
                'message' => $preset->is_active
                    ? 'Macro preset activated successfully.'
                    : 'Macro preset deactivated successfully.',
                'data' => $preset,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Preset not found.',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to toggle macro preset.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function calcMacros(float $calories, MacroPreset $preset): array
    {
        return [
            'protein' => [
                'grams' => round(($calories * $preset->protein_percent / 100) / 4),
                'calories' => round($calories * $preset->protein_percent / 100),
                'percent' => $preset->protein_percent,
            ],
            'carbs' => [
                'grams' => round(($calories * $preset->carbs_percent / 100) / 4),
                'calories' => round($calories * $preset->carbs_percent / 100),
                'percent' => $preset->carbs_percent,
            ],
            'fats' => [
                'grams' => round(($calories * $preset->fats_percent / 100) / 9),
                'calories' => round($calories * $preset->fats_percent / 100),
                'percent' => $preset->fats_percent,
            ],
        ];
    }
}