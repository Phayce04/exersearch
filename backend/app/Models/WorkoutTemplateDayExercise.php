<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkoutTemplateDayExercise extends Model
{
    protected $table = 'workout_template_day_exercises';
    protected $primaryKey = 'tde_id';

    protected $fillable = [
        'template_day_id',
        'slot_type',
        'exercise_id',
        'sets',
        'reps_min',
        'reps_max',
        'rest_seconds',
        'order_index',
    ];

    protected $casts = [
        'template_day_id' => 'integer',
        'exercise_id' => 'integer',
        'sets' => 'integer',
        'reps_min' => 'integer',
        'reps_max' => 'integer',
        'rest_seconds' => 'integer',
        'order_index' => 'integer',
    ];

    public function day()
    {
        return $this->belongsTo(WorkoutTemplateDay::class, 'template_day_id', 'template_day_id');
    }

    public function exercise()
    {
        return $this->belongsTo(Exercise::class, 'exercise_id', 'exercise_id');
    }
}
