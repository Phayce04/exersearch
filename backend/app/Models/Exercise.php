<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Exercise extends Model
{
    protected $table = 'exercises';
    protected $primaryKey = 'exercise_id';

    protected $fillable = [
        'name',
        'primary_muscle',
        'secondary_muscles',
        'equipment',
        'difficulty',
        'instructions',
        'external_source',
        'external_id',
    ];

    protected $casts = [
        'secondary_muscles' => 'array',
        'instructions' => 'array',
    ];

    public function equipments()
    {
        return $this->belongsToMany(
            Equipment::class,
            'exercise_equipments',
            'exercise_id',
            'equipment_id'
        );
    }
}
