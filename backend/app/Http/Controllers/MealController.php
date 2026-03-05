<?php

namespace App\Http\Controllers;

use App\Models\Meal;
use App\Models\Ingredient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MealController extends Controller
{
    public function index()
    {
        try {
            $meals = Meal::where('is_active', true)
                ->with('ingredients')
                ->get()
                ->map(function ($meal) {
                    return $this->formatMealWithIngredients($meal);
                });

            return response()->json([
                'success' => true,
                'data' => $meals,
                'count' => $meals->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch meals',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $meal = Meal::with('ingredients')->findOrFail((int)$id);

            if (!$meal->is_active) {
                return response()->json(['success' => false, 'message' => 'Meal not found'], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $this->formatMealWithIngredients($meal),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Meal not found'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch meal',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getByType($type)
    {
        try {
            $validTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
            if (!in_array($type, $validTypes, true)) {
                return response()->json(['success' => false, 'message' => 'Invalid meal type'], 400);
            }

            $meals = Meal::where('is_active', true)
                ->where('meal_type', $type)
                ->with('ingredients')
                ->get()
                ->map(function ($meal) {
                    return $this->formatMealWithIngredients($meal);
                });

            return response()->json([
                'success' => true,
                'data' => $meals,
                'count' => $meals->count(),
                'type' => $type,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch meals',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function filterByDiet(Request $request)
    {
        try {
            $dietTags = $request->input('tags', []);
            if (empty($dietTags)) return $this->index();

            $meals = Meal::where('is_active', true)
                ->with('ingredients')
                ->get()
                ->filter(function ($meal) use ($dietTags) {
                    $tags = $meal->diet_tags ?? [];
                    foreach ($dietTags as $tag) {
                        if (!in_array($tag, $tags, true)) return false;
                    }
                    return true;
                })
                ->values()
                ->map(function ($meal) {
                    return $this->formatMealWithIngredients($meal);
                });

            return response()->json([
                'success' => true,
                'data' => $meals,
                'count' => $meals->count(),
                'filters' => $dietTags,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to filter meals',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function stats()
    {
        try {
            $stats = [
                'total_meals' => Meal::where('is_active', true)->count(),
                'by_type' => [
                    'breakfast' => Meal::where('is_active', true)->where('meal_type', 'breakfast')->count(),
                    'lunch' => Meal::where('is_active', true)->where('meal_type', 'lunch')->count(),
                    'dinner' => Meal::where('is_active', true)->where('meal_type', 'dinner')->count(),
                    'snack' => Meal::where('is_active', true)->where('meal_type', 'snack')->count(),
                ],
                'avg_cost' => round(Meal::where('is_active', true)->avg('estimated_cost'), 2),
                'avg_calories' => round(Meal::where('is_active', true)->avg('total_calories'), 1),
                'avg_protein' => round(Meal::where('is_active', true)->avg('total_protein'), 1),
                'avg_carbs' => round(Meal::where('is_active', true)->avg('total_carbs'), 1),
                'avg_fats' => round(Meal::where('is_active', true)->avg('total_fats'), 1),
            ];

            return response()->json(['success' => true, 'data' => $stats]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get stats',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function adminIndex(Request $request)
    {
        $limit = (int) $request->query('limit', 2000);
        if ($limit < 1) $limit = 1;
        if ($limit > 5000) $limit = 5000;

        $q = trim((string) $request->query('q', ''));
        $type = trim((string) $request->query('type', ''));
        $active = $request->query('active', null);

        $query = Meal::query()
            ->select([
                'id',
                'name',
                'meal_type',
                'total_calories',
                'total_protein',
                'total_carbs',
                'total_fats',
                'estimated_cost',
                'diet_tags',
                'allergens',
                'serving_size',
                'prep_time',
                'cook_time',
                'instructions',
                'cooking_tips',
                'is_active',
                'created_at',
                'updated_at',
            ])
            ->orderByDesc('updated_at')
            ->limit($limit);

        if ($type !== '' && $type !== 'All') {
            $query->where('meal_type', $type);
        }

        if ($active !== null && $active !== '' && $active !== 'All') {
            $bool = $active === '1' || $active === 1 || $active === true || $active === 'true';
            $query->where('is_active', $bool);
        }

        if ($q !== '') {
            $like = '%' . str_replace('%', '\\%', $q) . '%';
            $query->where(function ($w) use ($like) {
                $w->where('name', 'ilike', $like)
                  ->orWhere('meal_type', 'ilike', $like);
            });
        }

        $rows = $query->get();
        return response()->json($rows, 200);
    }

    public function adminShow($id)
    {
        try {
            $meal = Meal::with('ingredients')->findOrFail((int)$id);

            return response()->json([
                'success' => true,
                'data' => $this->formatMealWithIngredients($meal),
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Meal not found'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch meal',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => ['required', 'string', 'max:140'],
                'meal_type' => ['required', 'string', 'max:40'],
                'description' => ['nullable', 'string'],
                'serving_size' => ['nullable', 'string', 'max:120'],
                'prep_time' => ['nullable', 'string', 'max:120'],
                'cook_time' => ['nullable', 'string', 'max:120'],
                'instructions' => ['nullable', 'string'],
                'cooking_tips' => ['nullable', 'string'],

                'diet_tags' => ['nullable', 'array'],
                'allergens' => ['nullable', 'array'],

                'total_calories' => ['nullable', 'numeric', 'min:0'],
                'total_protein' => ['nullable', 'numeric', 'min:0'],
                'total_carbs' => ['nullable', 'numeric', 'min:0'],
                'total_fats' => ['nullable', 'numeric', 'min:0'],
                'estimated_cost' => ['nullable', 'numeric', 'min:0'],

                'is_active' => ['nullable', 'boolean'],

                'ingredients' => ['nullable', 'array'],
                'ingredients.*.id' => ['required', 'integer', 'exists:ingredients,id'],
                'ingredients.*.amount_grams' => ['required', 'numeric', 'min:0'],
                'ingredients.*.display_amount' => ['nullable', 'string', 'max:60'],
                'ingredients.*.display_unit' => ['nullable', 'string', 'max:40'],
                'ingredients.*.calories' => ['nullable', 'numeric', 'min:0'],
                'ingredients.*.protein' => ['nullable', 'numeric', 'min:0'],
                'ingredients.*.carbs' => ['nullable', 'numeric', 'min:0'],
                'ingredients.*.fats' => ['nullable', 'numeric', 'min:0'],
                'ingredients.*.cost' => ['nullable', 'numeric', 'min:0'],
            ]);

            $meal = null;

            DB::transaction(function () use ($validated, &$meal) {
                $meal = Meal::create([
                    'name' => $validated['name'],
                    'meal_type' => $validated['meal_type'],
                    'description' => $validated['description'] ?? null,
                    'serving_size' => $validated['serving_size'] ?? null,
                    'prep_time' => $validated['prep_time'] ?? null,
                    'cook_time' => $validated['cook_time'] ?? null,
                    'instructions' => $validated['instructions'] ?? null,
                    'cooking_tips' => $validated['cooking_tips'] ?? null,
                    'diet_tags' => $validated['diet_tags'] ?? [],
                    'allergens' => $validated['allergens'] ?? [],
                    'total_calories' => $validated['total_calories'] ?? 0,
                    'total_protein' => $validated['total_protein'] ?? 0,
                    'total_carbs' => $validated['total_carbs'] ?? 0,
                    'total_fats' => $validated['total_fats'] ?? 0,
                    'estimated_cost' => $validated['estimated_cost'] ?? 0,
                    'is_active' => array_key_exists('is_active', $validated) ? (bool)$validated['is_active'] : true,
                ]);

                $ings = $validated['ingredients'] ?? [];
                if (!empty($ings)) {
                    $sync = [];
                    foreach ($ings as $i) {
                        $sync[(int)$i['id']] = [
                            'amount_grams' => (float)$i['amount_grams'],
                            'display_amount' => $i['display_amount'] ?? null,
                            'display_unit' => $i['display_unit'] ?? null,
                            'calories' => isset($i['calories']) ? (float)$i['calories'] : 0,
                            'protein' => isset($i['protein']) ? (float)$i['protein'] : 0,
                            'carbs' => isset($i['carbs']) ? (float)$i['carbs'] : 0,
                            'fats' => isset($i['fats']) ? (float)$i['fats'] : 0,
                            'cost' => isset($i['cost']) ? (float)$i['cost'] : 0,
                        ];
                    }
                    $meal->ingredients()->sync($sync);
                }
            });

            $meal->load('ingredients');

            return response()->json([
                'success' => true,
                'data' => $this->formatMealWithIngredients($meal),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['success' => false, 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create meal',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $meal = Meal::with('ingredients')->findOrFail((int)$id);

            $validated = $request->validate([
                'name' => ['sometimes', 'required', 'string', 'max:140'],
                'meal_type' => ['sometimes', 'required', 'string', 'max:40'],
                'description' => ['nullable', 'string'],
                'serving_size' => ['nullable', 'string', 'max:120'],
                'prep_time' => ['nullable', 'string', 'max:120'],
                'cook_time' => ['nullable', 'string', 'max:120'],
                'instructions' => ['nullable', 'string'],
                'cooking_tips' => ['nullable', 'string'],

                'diet_tags' => ['nullable', 'array'],
                'allergens' => ['nullable', 'array'],

                'total_calories' => ['nullable', 'numeric', 'min:0'],
                'total_protein' => ['nullable', 'numeric', 'min:0'],
                'total_carbs' => ['nullable', 'numeric', 'min:0'],
                'total_fats' => ['nullable', 'numeric', 'min:0'],
                'estimated_cost' => ['nullable', 'numeric', 'min:0'],

                'is_active' => ['sometimes', 'boolean'],

                'ingredients' => ['nullable', 'array'],
                'ingredients.*.id' => ['required', 'integer', 'exists:ingredients,id'],
                'ingredients.*.amount_grams' => ['required', 'numeric', 'min:0'],
                'ingredients.*.display_amount' => ['nullable', 'string', 'max:60'],
                'ingredients.*.display_unit' => ['nullable', 'string', 'max:40'],
                'ingredients.*.calories' => ['nullable', 'numeric', 'min:0'],
                'ingredients.*.protein' => ['nullable', 'numeric', 'min:0'],
                'ingredients.*.carbs' => ['nullable', 'numeric', 'min:0'],
                'ingredients.*.fats' => ['nullable', 'numeric', 'min:0'],
                'ingredients.*.cost' => ['nullable', 'numeric', 'min:0'],
            ]);

            DB::transaction(function () use (&$meal, $validated) {
                $meal->fill([
                    'name' => $validated['name'] ?? $meal->name,
                    'meal_type' => $validated['meal_type'] ?? $meal->meal_type,
                    'description' => array_key_exists('description', $validated) ? ($validated['description'] ?? null) : $meal->description,
                    'serving_size' => array_key_exists('serving_size', $validated) ? ($validated['serving_size'] ?? null) : $meal->serving_size,
                    'prep_time' => array_key_exists('prep_time', $validated) ? ($validated['prep_time'] ?? null) : $meal->prep_time,
                    'cook_time' => array_key_exists('cook_time', $validated) ? ($validated['cook_time'] ?? null) : $meal->cook_time,
                    'instructions' => array_key_exists('instructions', $validated) ? ($validated['instructions'] ?? null) : $meal->instructions,
                    'cooking_tips' => array_key_exists('cooking_tips', $validated) ? ($validated['cooking_tips'] ?? null) : $meal->cooking_tips,
                    'diet_tags' => array_key_exists('diet_tags', $validated) ? ($validated['diet_tags'] ?? []) : ($meal->diet_tags ?? []),
                    'allergens' => array_key_exists('allergens', $validated) ? ($validated['allergens'] ?? []) : ($meal->allergens ?? []),
                    'total_calories' => array_key_exists('total_calories', $validated) ? ($validated['total_calories'] ?? 0) : $meal->total_calories,
                    'total_protein' => array_key_exists('total_protein', $validated) ? ($validated['total_protein'] ?? 0) : $meal->total_protein,
                    'total_carbs' => array_key_exists('total_carbs', $validated) ? ($validated['total_carbs'] ?? 0) : $meal->total_carbs,
                    'total_fats' => array_key_exists('total_fats', $validated) ? ($validated['total_fats'] ?? 0) : $meal->total_fats,
                    'estimated_cost' => array_key_exists('estimated_cost', $validated) ? ($validated['estimated_cost'] ?? 0) : $meal->estimated_cost,
                ]);

                if (array_key_exists('is_active', $validated)) {
                    $meal->is_active = (bool)$validated['is_active'];
                }

                $meal->save();

                if (array_key_exists('ingredients', $validated)) {
                    $ings = $validated['ingredients'] ?? [];
                    $sync = [];
                    foreach ($ings as $i) {
                        $sync[(int)$i['id']] = [
                            'amount_grams' => (float)$i['amount_grams'],
                            'display_amount' => $i['display_amount'] ?? null,
                            'display_unit' => $i['display_unit'] ?? null,
                            'calories' => isset($i['calories']) ? (float)$i['calories'] : 0,
                            'protein' => isset($i['protein']) ? (float)$i['protein'] : 0,
                            'carbs' => isset($i['carbs']) ? (float)$i['carbs'] : 0,
                            'fats' => isset($i['fats']) ? (float)$i['fats'] : 0,
                            'cost' => isset($i['cost']) ? (float)$i['cost'] : 0,
                        ];
                    }
                    $meal->ingredients()->sync($sync);
                }
            });

            $meal->load('ingredients');

            return response()->json([
                'success' => true,
                'data' => $this->formatMealWithIngredients($meal),
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['success' => false, 'errors' => $e->errors()], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Meal not found'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update meal',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $meal = Meal::findOrFail((int)$id);
            $meal->ingredients()->detach();
            $meal->delete();

            return response()->json(['success' => true, 'message' => 'Deleted'], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Meal not found'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete meal',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function toggle($id)
    {
        try {
            $meal = Meal::findOrFail((int)$id);
            $meal->is_active = !$meal->is_active;
            $meal->save();

            return response()->json(['success' => true, 'data' => ['id' => $meal->id, 'is_active' => $meal->is_active]], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Meal not found'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to toggle meal',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function formatMealWithIngredients($meal): array
    {
        $ingredients = $meal->ingredients->map(function ($ing) use ($meal) {
            return [
                'id' => $ing->id,
                'name' => $ing->name,
                'category' => $ing->category,
                'amount_grams' => (float) $ing->pivot->amount_grams,
                'display_amount' => $ing->pivot->display_amount,
                'display_unit' => $ing->pivot->display_unit,
                'calories' => (float) $ing->pivot->calories,
                'protein' => (float) $ing->pivot->protein,
                'carbs' => (float) $ing->pivot->carbs,
                'fats' => (float) $ing->pivot->fats,
                'cost' => (float) $ing->pivot->cost,
                'pct_of_calories' => $meal->total_calories > 0
                    ? round($ing->pivot->calories / $meal->total_calories * 100)
                    : 0,
            ];
        });

        return [
            'id' => $meal->id,
            'name' => $meal->name,
            'meal_type' => $meal->meal_type,
            'description' => $meal->description,
            'total_calories' => (float) $meal->total_calories,
            'total_protein' => (float) $meal->total_protein,
            'total_carbs' => (float) $meal->total_carbs,
            'total_fats' => (float) $meal->total_fats,
            'estimated_cost' => (float) $meal->estimated_cost,
            'diet_tags' => $meal->diet_tags ?? [],
            'allergens' => $meal->allergens ?? [],
            'serving_size' => $meal->serving_size,
            'prep_time' => $meal->prep_time,
            'cook_time' => $meal->cook_time,
            'instructions' => $meal->instructions,
            'cooking_tips' => $meal->cooking_tips,
            'ingredients' => $ingredients,
            'macro_breakdown' => $this->macroBreakdown(
                (float)$meal->total_protein,
                (float)$meal->total_carbs,
                (float)$meal->total_fats
            ),
        ];
    }

    private function macroBreakdown(float $protein, float $carbs, float $fats): array
    {
        $total = ($protein * 4) + ($carbs * 4) + ($fats * 9);
        if ($total <= 0) return ['protein' => 0, 'carbs' => 0, 'fats' => 0];

        return [
            'protein' => round($protein * 4 / $total * 100),
            'carbs' => round($carbs * 4 / $total * 100),
            'fats' => round($fats * 9 / $total * 100),
        ];
    }
}