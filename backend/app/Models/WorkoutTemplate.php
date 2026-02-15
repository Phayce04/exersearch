<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkoutTemplate extends Model
{
    protected $table = 'workout_templates';
    protected $primaryKey = 'template_id';

    protected $fillable = [
        'goal',
        'level',
        'days_per_week',
        'session_minutes_min',
        'session_minutes_max',
        'split_type',
        'duration_weeks',
        'notes',
    ];

    protected $casts = [
        'days_per_week' => 'integer',
        'session_minutes_min' => 'integer',
        'session_minutes_max' => 'integer',
        'duration_weeks' => 'integer',
    ];

    public function days()
    {
        return $this->hasMany(WorkoutTemplateDay::class, 'template_id', 'template_id');
    }
}
