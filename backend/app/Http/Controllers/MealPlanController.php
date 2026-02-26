<?php

namespace App\Http\Controllers;

use App\Models\Meal;
use App\Models\MacroPreset;
use Illuminate\Http\Request;

class MealPlanController extends Controller
{
    const MEAL_DISTRIBUTION = [
        'breakfast' => ['cal' => 0.25, 'budget' => 0.20],
        'lunch'     => ['cal' => 0.40, 'budget' => 0.40],
        'dinner'    => ['cal' => 0.30, 'budget' => 0.35],
        'snack'     => ['cal' => 0.05, 'budget' => 0.05],
    ];

    /**
     * POST /api/meal-plan/generate
     *
     * Body (all optional, defaults shown):
     * {
     *   "days":            1,
     *   "total_calories":  2000,
     *   "budget":          300,
     *   "preset_id":       null,
     *   "custom_macros":   { "protein": 30, "carbs": 40, "fats": 30 },
     *   "meal_types":      ["breakfast","lunch","dinner","snack"],
     *   "diet_tags":       [],
     *   "avoid_allergens": []
     * }
     */
    public function generate(Request $request)
    {
        try {
            $request->validate([
                'days'                  => 'sometimes|integer|min:1|max:7',
                'total_calories'        => 'sometimes|numeric|min:500|max:10000',
                'budget'                => 'sometimes|numeric|min:50',
                'preset_id'             => 'sometimes|nullable|integer|exists:macro_presets,id',
                'custom_macros'         => 'sometimes|nullable|array',
                'custom_macros.protein' => 'required_with:custom_macros|integer|min:1|max:98',
                'custom_macros.carbs'   => 'required_with:custom_macros|integer|min:1|max:98',
                'custom_macros.fats'    => 'required_with:custom_macros|integer|min:1|max:98',
                'meal_types'            => 'sometimes|array',
                'meal_types.*'          => 'in:breakfast,lunch,dinner,snack',
                'diet_tags'             => 'sometimes|array',
                'avoid_allergens'       => 'sometimes|array',
            ]);

            $days           = (int)   $request->input('days', 1);
            $totalCalories  = (float) $request->input('total_calories', 2000);
            $budget         = (float) $request->input('budget', 300);
            $mealTypes      = $request->input('meal_types', ['breakfast', 'lunch', 'dinner', 'snack']);
            $dietTags       = $request->input('diet_tags', []);
            $avoidAllergens = $request->input('avoid_allergens', []);

            // Resolve macro targets
            $macros = $this->resolveMacros($totalCalories, $request);

            // Load all eligible meals once (avoids N+1 queries)
            $allMeals = $this->loadMeals($dietTags, $avoidAllergens);

            $planDays    = [];
            $usedMealIds = [];

            for ($day = 1; $day <= $days; $day++) {
                $planDays[] = $this->buildDay(
                    $day, $allMeals, $mealTypes,
                    $totalCalories, $budget, $macros, $usedMealIds
                );
            }

            $shoppingList = $this->buildShoppingList($planDays);

            return response()->json([
                'success' => true,
                'data'    => [
                    'summary' => [
                        'days'           => $days,
                        'daily_calories' => $totalCalories,
                        'daily_budget'   => $budget,
                        'macro_targets'  => $macros,
                        'meal_types'     => $mealTypes,
                    ],
                    'days'          => $planDays,
                    'shopping_list' => $shoppingList,
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['success' => false, 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false, 'message' => 'Failed to generate plan', 'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ══════════════════════════════════════════════════════════════════════════

    private function resolveMacros(float $calories, Request $request): array
    {
        $p = 30; $c = 40; $f = 30;

        if ($request->filled('preset_id')) {
            $preset = MacroPreset::findOrFail($request->preset_id);
            $p = $preset->protein_percent;
            $c = $preset->carbs_percent;
            $f = $preset->fats_percent;
        } elseif ($request->filled('custom_macros')) {
            $cm = $request->custom_macros;
            $p = $cm['protein'];
            $c = $cm['carbs'];
            $f = $cm['fats'];
        }

        return [
            'protein' => ['grams' => round(($calories * $p / 100) / 4), 'percent' => $p],
            'carbs'   => ['grams' => round(($calories * $c / 100) / 4), 'percent' => $c],
            'fats'    => ['grams' => round(($calories * $f / 100) / 9), 'percent' => $f],
        ];
    }

    private function loadMeals(array $dietTags, array $avoidAllergens)
    {
        $meals = Meal::where('is_active', true)->with('ingredients')->get();

        if (!empty($dietTags)) {
            $meals = $meals->filter(function ($meal) use ($dietTags) {
                $tags = $meal->diet_tags ?? [];
                foreach ($dietTags as $tag) {
                    if (!in_array($tag, $tags)) return false;
                }
                return true;
            });
        }

        if (!empty($avoidAllergens)) {
            $meals = $meals->filter(function ($meal) use ($avoidAllergens) {
                $allergens = $meal->allergens ?? [];
                foreach ($avoidAllergens as $a) {
                    if (in_array($a, $allergens)) return false;
                }
                return true;
            });
        }

        return $meals->values();
    }

    private function buildDay(
        int $dayNum, $allMeals, array $mealTypes,
        float $totalCalories, float $budget, array $macros, array &$usedMealIds
    ): array {
        $meals   = [];
        $totals  = ['calories' => 0, 'protein' => 0, 'carbs' => 0, 'fats' => 0, 'cost' => 0];

        foreach ($mealTypes as $type) {
            $dist = self::MEAL_DISTRIBUTION[$type] ?? ['cal' => 0.25, 'budget' => 0.25];

            $meal = $this->selectMeal($allMeals, $type, [
                'calories' => $totalCalories * $dist['cal'],
                'budget'   => $budget        * $dist['budget'],
                'protein'  => $macros['protein']['grams'] * $dist['cal'],
                'carbs'    => $macros['carbs']['grams']   * $dist['cal'],
                'fats'     => $macros['fats']['grams']    * $dist['cal'],
            ], $usedMealIds);

            if ($meal) {
                $usedMealIds[]        = $meal['id'];
                $meals[]              = $meal;
                $totals['calories']  += $meal['total_calories'];
                $totals['protein']   += $meal['total_protein'];
                $totals['carbs']     += $meal['total_carbs'];
                $totals['fats']      += $meal['total_fats'];
                $totals['cost']      += $meal['estimated_cost'];
            }
        }

        return [
            'day'             => $dayNum,
            'meals'           => $meals,
            'totals'          => array_map('round', $totals),
            'macro_breakdown' => $this->macroBreakdown($totals['protein'], $totals['carbs'], $totals['fats']),
            'adherence'       => $this->adherence($totals, $totalCalories, $macros),
        ];
    }

    private function selectMeal($allMeals, string $type, array $targets, array $usedMealIds): ?array
    {
        // Try with calorie ±50% filter first
        $candidates = $allMeals->filter(fn($m) =>
            $m->meal_type === $type
            && !in_array($m->id, $usedMealIds)
            && $m->total_calories <= $targets['calories'] * 1.5
            && $m->total_calories >= $targets['calories'] * 0.5
            && $m->estimated_cost <= $targets['budget'] * 2
        );

        // Relax to just type + not used if nothing found
        if ($candidates->isEmpty()) {
            $candidates = $allMeals->filter(fn($m) =>
                $m->meal_type === $type && !in_array($m->id, $usedMealIds)
            );
        }

        if ($candidates->isEmpty()) return null;

        // Score each candidate
        $scored = $candidates->map(function ($m) use ($targets) {
            $err = fn($a, $t) => $t > 0 ? abs($a - $t) / $t : 0;

            $weightedError =
                $err($m->total_calories,  $targets['calories']) * 0.30 +
                $err($m->estimated_cost,  $targets['budget'])   * 0.15 +
                $err($m->total_protein,   $targets['protein'])  * 0.30 +
                $err($m->total_carbs,     $targets['carbs'])    * 0.15 +
                $err($m->total_fats,      $targets['fats'])     * 0.10;

            return ['meal' => $m, 'score' => max(0, 100 - $weightedError * 100)];
        })->sortByDesc('score')->values();

        // Random pick from top 5 for variety
        $pick = $scored[rand(0, min(4, $scored->count() - 1))]['meal'];

        return [
            'id'             => $pick->id,
            'name'           => $pick->name,
            'meal_type'      => $pick->meal_type,
            'total_calories' => round((float) $pick->total_calories, 1),
            'total_protein'  => round((float) $pick->total_protein,  1),
            'total_carbs'    => round((float) $pick->total_carbs,    1),
            'total_fats'     => round((float) $pick->total_fats,     1),
            'estimated_cost' => round((float) $pick->estimated_cost, 2),
            'diet_tags'      => $pick->diet_tags,
            'allergens'      => $pick->allergens,
            'ingredients'    => $pick->ingredients->map(fn($ing) => [
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
            ])->values()->toArray(),
        ];
    }

    private function buildShoppingList(array $days): array
    {
        $totals = [];

        foreach ($days as $day) {
            foreach ($day['meals'] as $meal) {
                foreach ($meal['ingredients'] as $ing) {
                    $key = $ing['name'];
                    if (!isset($totals[$key])) {
                        $totals[$key] = ['name' => $ing['name'], 'category' => $ing['category'] ?? 'Other', 'grams' => 0, 'cost' => 0];
                    }
                    $totals[$key]['grams'] += $ing['amount_grams'];
                    $totals[$key]['cost']  += $ing['cost'];
                }
            }
        }

        $list = collect(array_values($totals))->map(fn($i) => [
            'name'           => $i['name'],
            'category'       => $i['category'],
            'amount'         => $i['grams'] >= 1000 ? round($i['grams'] / 1000, 2) . ' kg' : round($i['grams']) . ' g',
            'estimated_cost' => round($i['cost'], 2),
        ])->sortBy('category')->values();

        return [
            'by_category' => $list->groupBy('category')->map(fn($items) => $items->values()),
            'all_items'   => $list,
            'total_items' => $list->count(),
            'total_cost'  => round($list->sum('estimated_cost'), 2),
        ];
    }

    private function macroBreakdown(float $p, float $c, float $f): array
    {
        $total = ($p * 4) + ($c * 4) + ($f * 9);
        if ($total <= 0) return ['protein' => 0, 'carbs' => 0, 'fats' => 0];
        return [
            'protein' => round($p * 4 / $total * 100),
            'carbs'   => round($c * 4 / $total * 100),
            'fats'    => round($f * 9 / $total * 100),
        ];
    }

    private function adherence(array $totals, float $tCal, array $macros): array
    {
        $score = fn($a, $t) => $t > 0 ? max(0, round(100 - abs($a - $t) / $t * 100)) : 100;

        $cal  = $score($totals['calories'], $tCal);
        $prot = $score($totals['protein'],  $macros['protein']['grams']);
        $carb = $score($totals['carbs'],    $macros['carbs']['grams']);
        $fat  = $score($totals['fats'],     $macros['fats']['grams']);

        return [
            'overall'  => round(($cal + $prot + $carb + $fat) / 4),
            'calories' => $cal,
            'protein'  => $prot,
            'carbs'    => $carb,
            'fats'     => $fat,
        ];
    }
}