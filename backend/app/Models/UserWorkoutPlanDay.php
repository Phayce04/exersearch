<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserWorkoutPlanDay extends Model
{
    protected $table = 'user_workout_plan_days';
    protected $primaryKey = 'user_plan_day_id';

    public $timestamps = false;

    protected $fillable = [
        'user_plan_id',
        'template_day_id',   // now nullable (rest days)
        'day_number',        // keep 1..7 on user side
        'focus',             // 'push'/'pull'/'legs'/'rest'
        'weekday',           // 1..7
        'weekday_name',      // Monday..Sunday
        'is_rest',           // true/false
    ];

    protected $casts = [
        'user_plan_id' => 'integer',
        'template_day_id' => 'integer',
        'day_number' => 'integer',
        'weekday' => 'integer',
        'is_rest' => 'boolean',
    ];

    public function plan()
    {
        return $this->belongsTo(UserWorkoutPlan::class, 'user_plan_id', 'user_plan_id');
    }

    public function templateDay()
    {
        return $this->belongsTo(WorkoutTemplateDay::class, 'template_day_id', 'template_day_id');
    }

    public function exercises()
    {
        return $this->hasMany(UserWorkoutPlanDayExercise::class, 'user_plan_day_id', 'user_plan_day_id')
            ->orderBy('order_index', 'asc');
    }
}
