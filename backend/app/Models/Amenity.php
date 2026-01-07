<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Amenity extends Model
{
    protected $table = 'amenities';
    protected $primaryKey = 'amenity_id';

    protected $fillable = [
        'name',
        'description',
        'image_url',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];



    public function gyms()
    {
        return $this->belongsToMany(
            Gym::class,
            'gym_amenities',
            'amenity_id',
            'gym_id'
        )
        ->using(GymAmenity::class)
        ->withPivot([
            'id',
            'availability_status',
            'notes',
            'image_url'
        ]);
    }
}
