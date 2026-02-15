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
    ];

    protected $casts = [
        'budget' => 'float',
        'food_budget' => 'float',
        'workout_days' => 'integer',
        'dietary_restrictions' => 'array', 
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
