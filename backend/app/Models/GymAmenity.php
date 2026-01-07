<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GymAmenity extends Model
{
    protected $table = 'gym_amenities';

    protected $fillable = [
        'gym_id',
        'amenity_id',
        'availability_status',
        'notes',
        'image_url',
    ];

    public $timestamps = false;

    protected $casts = [
        'availability_status' => 'boolean',
    ];

    public function gym()
    {
        return $this->belongsTo(Gym::class, 'gym_id');
    }

    public function amenity()
    {
        return $this->belongsTo(Amenity::class, 'amenity_id');
    }
}
