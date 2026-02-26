<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use Illuminate\Http\Request;

class IngredientController extends Controller
{
    /**
     * GET /api/ingredients
     * List all active ingredients with optional filters
     */
    public function index(Request $request)
    {
        try {
            $query = Ingredient::where('is_active', true);

            if ($request->filled('category')) {
                $query->where('category', $request->category);
            }

            if ($request->filled('search')) {
                $query->where('name', 'ilike', '%' . $request->search . '%');
            }

            $ingredients = $query->select([
                'id', 'name', 'category',
                'calories_per_100g', 'protein_per_100g', 'carbs_per_100g', 'fats_per_100g',
                'average_cost_per_kg', 'typical_unit',
                'common_stores', 'diet_compatible', 'allergen_tags',
            ])->orderBy('category')->orderBy('name')->get();

            return response()->json([
                'success' => true,
                'data'    => $ingredients,
                'count'   => $ingredients->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false, 'message' => 'Failed to fetch ingredients', 'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/ingredients/{id}
     */
    public function show($id)
    {
        try {
            $ingredient = Ingredient::findOrFail($id);
            return response()->json(['success' => true, 'data' => $ingredient]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Ingredient not found'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false, 'message' => 'Failed to fetch ingredient', 'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/ingredients/categories
     */
    public function categories()
    {
        try {
            $categories = Ingredient::where('is_active', true)
                ->distinct()->orderBy('category')->pluck('category');

            return response()->json(['success' => true, 'data' => $categories]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false, 'message' => 'Failed to fetch categories', 'error' => $e->getMessage(),
            ], 500);
        }
    }
}