<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkoutTemplateDay extends Model
{
    protected $table = 'workout_template_days';
    protected $primaryKey = 'template_day_id';

    protected $fillable = [
        'template_id',
        'day_number',
        'focus',
    ];

    protected $casts = [
        'template_id' => 'integer',
        'day_number' => 'integer',
    ];

    public function template()
    {
        return $this->belongsTo(WorkoutTemplate::class, 'template_id', 'template_id');
    }

    public function items()
    {
        return $this->hasMany(WorkoutTemplateDayExercise::class, 'template_day_id', 'template_day_id');
    }
}
