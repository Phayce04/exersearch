<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ingredient extends Model
{
    protected $fillable = [
        'name', 'category',
        'calories_per_100g', 'protein_per_100g',
        'carbs_per_100g', 'fats_per_100g',
        'fiber_per_100g', 'sodium_per_100g',
        'average_cost_per_kg', 'typical_unit', 'unit_weight_grams',
        'common_stores', 'seasonality',
        'allergen_tags', 'diet_compatible',
        'is_active',
    ];

    protected $casts = [
        'common_stores'   => 'array',
        'allergen_tags'   => 'array',
        'diet_compatible' => 'array',
        'is_active'       => 'boolean',
    ];

    public function meals()
    {
        return $this->belongsToMany(Meal::class, 'meal_ingredients')
            ->withPivot([
                'amount_grams', 'display_amount', 'display_unit',
                'calories', 'protein', 'carbs', 'fats', 'cost',
            ]);
    }
}