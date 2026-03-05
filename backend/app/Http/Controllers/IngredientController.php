<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class IngredientController extends Controller
{
    /**
     * GET /api/v1/ingredients
     * Public: List all active ingredients with optional filters
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
                'is_active',
            ])->orderBy('category')->orderBy('name')->get();

            return response()->json([
                'success' => true,
                'data'    => $ingredients,
                'count'   => $ingredients->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch ingredients',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/v1/ingredients/{id}
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
                'success' => false,
                'message' => 'Failed to fetch ingredient',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/v1/ingredients/categories
     */
    public function categories()
    {
        try {
            $categories = Ingredient::where('is_active', true)
                ->distinct()->orderBy('category')->pluck('category');

            return response()->json(['success' => true, 'data' => $categories]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch categories',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /* ==========================================================
     * ADMIN ENDPOINTS
     * ========================================================== */

    /**
     * GET /api/v1/admin/ingredients
     * Admin: list ingredients (optionally include inactive)
     */
    public function adminIndex(Request $request)
    {
        $limit = (int) $request->query('limit', 2000);
        if ($limit < 1) $limit = 1;
        if ($limit > 5000) $limit = 5000;

        $q = trim((string) $request->query('q', ''));
        $category = trim((string) $request->query('category', ''));
        $active = $request->query('active'); // "1" | "0" | null (all)

        $query = Ingredient::query();

        if ($active === "1") $query->where('is_active', true);
        if ($active === "0") $query->where('is_active', false);

        if ($category !== '' && $category !== 'All') {
            $query->where('category', $category);
        }

        if ($q !== '') {
            $query->where(function ($w) use ($q) {
                $like = '%' . $q . '%';
                $w->where('name', 'ilike', $like)
                  ->orWhere('category', 'ilike', $like)
                  ->orWhere(DB::raw('CAST(id AS TEXT)'), 'ilike', $like);
            });
        }

        $rows = $query->orderBy('category')->orderBy('name')->limit($limit)->get();

        return response()->json($rows, 200);
    }

    /**
     * POST /api/v1/admin/ingredients
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],

            'calories_per_100g' => ['nullable', 'numeric'],
            'protein_per_100g' => ['nullable', 'numeric'],
            'carbs_per_100g' => ['nullable', 'numeric'],
            'fats_per_100g' => ['nullable', 'numeric'],

            'average_cost_per_kg' => ['nullable', 'numeric'],
            'typical_unit' => ['nullable', 'string', 'max:60'],

            'common_stores' => ['nullable'],      // could be array/json/string depending on your casts
            'diet_compatible' => ['nullable'],
            'allergen_tags' => ['nullable'],

            'is_active' => ['nullable', 'boolean'],
        ]);

        // default active true if not provided
        if (!array_key_exists('is_active', $data)) $data['is_active'] = true;

        $ingredient = Ingredient::create($data);

        return response()->json([
            'success' => true,
            'data' => $ingredient,
            'message' => 'Ingredient created',
        ], 201);
    }

    /**
     * PATCH /api/v1/admin/ingredients/{id}
     */
    public function update(Request $request, $id)
    {
        $ingredient = Ingredient::findOrFail((int) $id);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],

            'calories_per_100g' => ['nullable', 'numeric'],
            'protein_per_100g' => ['nullable', 'numeric'],
            'carbs_per_100g' => ['nullable', 'numeric'],
            'fats_per_100g' => ['nullable', 'numeric'],

            'average_cost_per_kg' => ['nullable', 'numeric'],
            'typical_unit' => ['nullable', 'string', 'max:60'],

            'common_stores' => ['nullable'],
            'diet_compatible' => ['nullable'],
            'allergen_tags' => ['nullable'],

            'is_active' => ['nullable', 'boolean'],
        ]);

        $ingredient->fill($data);
        $ingredient->save();

        return response()->json([
            'success' => true,
            'data' => $ingredient,
            'message' => 'Ingredient updated',
        ], 200);
    }

    /**
     * DELETE /api/v1/admin/ingredients/{id}
     */
    public function destroy($id)
    {
        $ingredient = Ingredient::findOrFail((int) $id);
        $ingredient->delete();

        return response()->json([
            'success' => true,
            'message' => 'Ingredient deleted',
        ], 200);
    }

    /**
     * PATCH /api/v1/admin/ingredients/{id}/toggle
     */
    public function toggle(Request $request, $id)
    {
        $ingredient = Ingredient::findOrFail((int) $id);
        $ingredient->is_active = !$ingredient->is_active;
        $ingredient->save();

        return response()->json([
            'success' => true,
            'data' => $ingredient,
            'message' => 'Ingredient toggled',
        ], 200);
    }
}