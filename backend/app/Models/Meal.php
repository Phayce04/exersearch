<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Meal extends Model
{
    protected $fillable = [
        'name',
        'meal_type',
        'description',
        'total_calories',
        'total_protein',
        'total_carbs',
        'total_fats',
        'estimated_cost',
        'diet_tags',
        'allergens',
        'is_active',
    ];

    protected $casts = [
        'diet_tags'      => 'array',
        'allergens'      => 'array',
        'is_active'      => 'boolean',
        'total_calories' => 'float',
        'total_protein'  => 'float',
        'total_carbs'    => 'float',
        'total_fats'     => 'float',
        'estimated_cost' => 'float',
    ];

    // ── Aliases so old code using ->calories still works ──────────────────────
    public function getCaloriesAttribute()   { return $this->total_calories; }
    public function getProteinAttribute()    { return $this->total_protein;  }
    public function getCarbsAttribute()      { return $this->total_carbs;    }
    public function getFatsAttribute()       { return $this->total_fats;     }

    // ── Relationships ─────────────────────────────────────────────────────────
    public function ingredients()
    {
        return $this->belongsToMany(Ingredient::class, 'meal_ingredients')
            ->withPivot([
                'amount_grams', 'display_amount', 'display_unit',
                'calories', 'protein', 'carbs', 'fats', 'cost',
            ]);
    }
}