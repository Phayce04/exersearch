<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MacroPreset extends Model
{
    protected $fillable = [
        'name', 'description',
        'protein_percent', 'carbs_percent', 'fats_percent',
        'min_calories', 'max_calories',
        'fitness_goal', 'diet_type',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}