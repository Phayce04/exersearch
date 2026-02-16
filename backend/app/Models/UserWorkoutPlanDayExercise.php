<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserWorkoutPlanDayExercise extends Model
{
    protected $table = 'user_workout_plan_day_exercises';
    protected $primaryKey = 'user_plan_exercise_id';

    // Your table has created_at but no updated_at
    public $timestamps = false;

    protected $fillable = [
        'user_plan_day_id',
        'template_day_exercise_id', // nullable
        'exercise_id',
        'slot_type',
        'sets',
        'reps_min',
        'reps_max',
        'rest_seconds',
        'order_index',
        'is_modified',
        'original_exercise_id',
    ];

    protected $casts = [
        'user_plan_day_id' => 'integer',
        'template_day_exercise_id' => 'integer',
        'exercise_id' => 'integer',
        'sets' => 'integer',
        'reps_min' => 'integer',
        'reps_max' => 'integer',
        'rest_seconds' => 'integer',
        'order_index' => 'integer',
        'is_modified' => 'boolean',
        'original_exercise_id' => 'integer',
        'created_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function planDay()
    {
        return $this->belongsTo(
            UserWorkoutPlanDay::class,
            'user_plan_day_id',
            'user_plan_day_id'
        );
    }

    public function exercise()
    {
        return $this->belongsTo(
            Exercise::class,
            'exercise_id',
            'exercise_id'
        );
    }

    public function originalExercise()
    {
        return $this->belongsTo(
            Exercise::class,
            'original_exercise_id',
            'exercise_id'
        );
    }

    public function templateItem()
    {
        return $this->belongsTo(
            WorkoutTemplateDayExercise::class,
            'template_day_exercise_id',
            'tde_id'
        );
    }
}
