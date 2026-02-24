<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Meal;
use Illuminate\Http\Request;

class MealController extends Controller
{
    /**
     * Get all active meals
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            $meals = Meal::where('is_active', true)
                ->select([
                    'id',
                    'name',
                    'meal_type',
                    'calories',
                    'protein',
                    'carbs',
                    'fats',
                    'estimated_cost',
                    'diet_tags',
                    'allergens'
                ])
                ->get();

            return response()->json([
                'success' => true,
                'data' => $meals,
                'count' => $meals->count()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch meals',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get meals filtered by type
     * 
     * @param string $type
     * @return \Illuminate\Http\JsonResponse
     */
    public function getByType($type)
    {
        try {
            $validTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
            
            if (!in_array($type, $validTypes)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid meal type'
                ], 400);
            }

            $meals = Meal::where('is_active', true)
                ->where('meal_type', $type)
                ->select([
                    'id',
                    'name',
                    'meal_type',
                    'calories',
                    'protein',
                    'carbs',
                    'fats',
                    'estimated_cost',
                    'diet_tags',
                    'allergens'
                ])
                ->get();

            return response()->json([
                'success' => true,
                'data' => $meals,
                'count' => $meals->count(),
                'type' => $type
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch meals',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get meals filtered by dietary tags
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function filterByDiet(Request $request)
    {
        try {
            $dietTags = $request->input('tags', []);
            
            if (empty($dietTags)) {
                return $this->index();
            }

            // Filter meals that have ALL the requested diet tags
            $meals = Meal::where('is_active', true)
                ->get()
                ->filter(function ($meal) use ($dietTags) {
                    $mealTags = $meal->diet_tags ?? [];
                    foreach ($dietTags as $tag) {
                        if (!in_array($tag, $mealTags)) {
                            return false;
                        }
                    }
                    return true;
                })
                ->values();

            return response()->json([
                'success' => true,
                'data' => $meals,
                'count' => $meals->count(),
                'filters' => $dietTags
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to filter meals',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get meal statistics
     * 
     * @return \Illuminate\Http\JsonResponse
     */
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
                'avg_cost' => Meal::where('is_active', true)->avg('estimated_cost'),
                'avg_calories' => Meal::where('is_active', true)->avg('calories'),
                'avg_protein' => Meal::where('is_active', true)->avg('protein'),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}