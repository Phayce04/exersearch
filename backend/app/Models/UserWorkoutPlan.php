<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserWorkoutPlan extends Model
{
    protected $table = 'user_workout_plans';
    protected $primaryKey = 'user_plan_id';

    public $timestamps = false; // ✅ IMPORTANT if table has no created_at/updated_at

    protected $fillable = [
        'user_id',
        'template_id',
        'start_date',
        'gym_id',
        'status',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'template_id' => 'integer',
        'gym_id' => 'integer',
        'start_date' => 'date',
    ];

    public function template()
    {
        return $this->belongsTo(WorkoutTemplate::class, 'template_id', 'template_id');
    }

    public function days()
    {
        return $this->hasMany(UserWorkoutPlanDay::class, 'user_plan_id', 'user_plan_id')
            ->orderBy('day_number', 'asc');
    }
}
