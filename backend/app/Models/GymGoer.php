<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
class GymGoer extends Authenticatable
{
        
        
    use HasApiTokens, Notifiable;      
    protected $primaryKey = 'user_id';
    public $timestamps = true;

        protected $fillable = [
            'name',
            'email',
            'password',
            'age',
            'weight',
            'height',
            'activity_level',
            'address',
        ];

        protected $hidden = [
            'password',
        ];
        public function preference()
        {
            return $this->hasOne(UserPreference::class, 'user_id', 'user_id');
        }

    public function preferredAmenities()
    {
        return $this->belongsToMany(
            Amenity::class,
            'user_preferred_amenities',
            'user_id',
            'amenity_id'
        );
    }

    public function preferredEquipments()
    {
        return $this->belongsToMany(
            Equipment::class,
            'user_preferred_equipments',
            'user_id',
            'equipment_id'
        );
    }
}
