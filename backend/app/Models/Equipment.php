<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Equipment extends Model
{
    use HasFactory;

    protected $table = 'equipments';
    protected $primaryKey = 'equipment_id';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = [
        'name',
        'category',
        'difficulty',
        'image_url',
        'target_muscle_group',
    ];

    protected $casts = [
        'category' => 'string',
        'difficulty' => 'string',
    ];

    /**
     * Relationship: equipment belongs to many gyms
     */
    public function gyms()
    {
        return $this->belongsToMany(
            Gym::class,
            'gym_equipments',
            'equipment_id',
            'gym_id'
        )
        ->using(GymEquipment::class)
        ->withPivot([
            'id',
            'quantity',
            'status',
            'date_purchased',
            'last_maintenance',
            'next_maintenance'
        ]);
    }

    public function exercises()
    {
        return $this->belongsToMany(
            Exercise::class,
            'exercise_equipments',
            'equipment_id',
            'exercise_id'
        );
    }
}
