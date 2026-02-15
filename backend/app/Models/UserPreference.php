<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserPreference extends Model
{
    protected $table = 'user_preferences';
    protected $primaryKey = 'pref_id';

    protected $fillable = [
        'user_id',
        'goal',
        'activity_level',
        'budget',
        'plan_type',
        'workout_days',
        'workout_time',
        'food_budget',
        'dietary_restrictions',
        'workout_level',
        'session_minutes',
        'workout_place',
        'preferred_style',
        'injuries',
    ];

    protected $casts = [
        'budget' => 'float',
        'food_budget' => 'float',
        'workout_days' => 'integer',
        'session_minutes' => 'integer',
        'dietary_restrictions' => 'array',
        'injuries' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
