<?php

namespace App\Http\Controllers;

use App\Models\Meal;
use Illuminate\Http\Request;

class MealController extends Controller
{
    /**
     * GET /api/meals
     * Get all active meals
     */
    public function index()
    {
        try {
            $meals = Meal::where('is_active', true)
                ->select([
                    'id', 'name', 'meal_type', 'description',
                    'total_calories', 'total_protein', 'total_carbs', 'total_fats',
                    'estimated_cost', 'diet_tags', 'allergens',
                ])
                ->get();

            return response()->json([
                'success' => true,
                'data'    => $meals,
                'count'   => $meals->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch meals',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/meals/{id}
     * Get single meal with ingredients
     */
    public function show($id)
    {
        try {
            $meal = Meal::with('ingredients')->findOrFail($id);

            $ingredients = $meal->ingredients->map(fn($ing) => [
                'id'             => $ing->id,
                'name'           => $ing->name,
                'category'       => $ing->category,
                'amount_grams'   => $ing->pivot->amount_grams,
                'display_amount' => $ing->pivot->display_amount,
                'display_unit'   => $ing->pivot->display_unit,
                'calories'       => $ing->pivot->calories,
                'protein'        => $ing->pivot->protein,
                'carbs'          => $ing->pivot->carbs,
                'fats'           => $ing->pivot->fats,
                'cost'           => $ing->pivot->cost,
                'pct_of_calories' => $meal->total_calories > 0
                    ? round($ing->pivot->calories / $meal->total_calories * 100)
                    : 0,
            ]);

            return response()->json([
                'success' => true,
                'data'    => [
                    'id'             => $meal->id,
                    'name'           => $meal->name,
                    'meal_type'      => $meal->meal_type,
                    'description'    => $meal->description,
                    'total_calories' => $meal->total_calories,
                    'total_protein'  => $meal->total_protein,
                    'total_carbs'    => $meal->total_carbs,
                    'total_fats'     => $meal->total_fats,
                    'estimated_cost' => $meal->estimated_cost,
                    'diet_tags'      => $meal->diet_tags,
                    'allergens'      => $meal->allergens,
                    'ingredients'    => $ingredients,
                    'macro_breakdown'=> $this->macroBreakdown(
                        $meal->total_protein, $meal->total_carbs, $meal->total_fats
                    ),
                ],
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Meal not found'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false, 'message' => 'Failed to fetch meal', 'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/meals/type/{type}
     * Get meals filtered by type
     */
    public function getByType($type)
    {
        try {
            $validTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

            if (!in_array($type, $validTypes)) {
                return response()->json(['success' => false, 'message' => 'Invalid meal type'], 400);
            }

            $meals = Meal::where('is_active', true)
                ->where('meal_type', $type)
                ->select([
                    'id', 'name', 'meal_type',
                    'total_calories', 'total_protein', 'total_carbs', 'total_fats',
                    'estimated_cost', 'diet_tags', 'allergens',
                ])
                ->get();

            return response()->json([
                'success' => true,
                'data'    => $meals,
                'count'   => $meals->count(),
                'type'    => $type,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false, 'message' => 'Failed to fetch meals', 'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/meals/filter?tags[]=vegetarian&tags[]=halal
     * Filter by diet tags
     */
    public function filterByDiet(Request $request)
    {
        try {
            $dietTags = $request->input('tags', []);

            if (empty($dietTags)) return $this->index();

            $meals = Meal::where('is_active', true)->get()
                ->filter(function ($meal) use ($dietTags) {
                    $tags = $meal->diet_tags ?? [];
                    foreach ($dietTags as $tag) {
                        if (!in_array($tag, $tags)) return false;
                    }
                    return true;
                })->values();

            return response()->json([
                'success' => true,
                'data'    => $meals,
                'count'   => $meals->count(),
                'filters' => $dietTags,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false, 'message' => 'Failed to filter meals', 'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/meals/stats
     * Meal statistics
     */
    public function stats()
    {
        try {
            $stats = [
                'total_meals' => Meal::where('is_active', true)->count(),
                'by_type'     => [
                    'breakfast' => Meal::where('is_active', true)->where('meal_type', 'breakfast')->count(),
                    'lunch'     => Meal::where('is_active', true)->where('meal_type', 'lunch')->count(),
                    'dinner'    => Meal::where('is_active', true)->where('meal_type', 'dinner')->count(),
                    'snack'     => Meal::where('is_active', true)->where('meal_type', 'snack')->count(),
                ],
                // Fixed: use actual column names total_calories etc.
                'avg_cost'     => round(Meal::where('is_active', true)->avg('estimated_cost'), 2),
                'avg_calories' => round(Meal::where('is_active', true)->avg('total_calories'), 1),
                'avg_protein'  => round(Meal::where('is_active', true)->avg('total_protein'),  1),
                'avg_carbs'    => round(Meal::where('is_active', true)->avg('total_carbs'),    1),
                'avg_fats'     => round(Meal::where('is_active', true)->avg('total_fats'),     1),
            ];

            return response()->json(['success' => true, 'data' => $stats]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false, 'message' => 'Failed to get stats', 'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ── Helper ────────────────────────────────────────────────────────────────
    private function macroBreakdown(float $protein, float $carbs, float $fats): array
    {
        $total = ($protein * 4) + ($carbs * 4) + ($fats * 9);
        if ($total <= 0) return ['protein' => 0, 'carbs' => 0, 'fats' => 0];
        return [
            'protein' => round($protein * 4 / $total * 100),
            'carbs'   => round($carbs   * 4 / $total * 100),
            'fats'    => round($fats    * 9 / $total * 100),
        ];
    }
}