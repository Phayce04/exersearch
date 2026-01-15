<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $primaryKey = 'user_id';
    public $timestamps = true;

    // Mass assignable attributes
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',          // 'user', 'owner', 'superadmin'
        'age',           // gym-goer
        'weight',        // gym-goer
        'height',        // gym-goer
        'activity_level',// gym-goer
        'address',       // gym-goer
    ];

    // Hidden attributes
    protected $hidden = [
        'password',
        'remember_token',
    ];

    // Attribute casting
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
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

    public function ownerProfile()
    {
        return $this->hasOne(OwnerProfile::class, 'user_id', 'user_id');
    }

    public function adminProfile()
    {
        return $this->hasOne(AdminProfile::class, 'user_id', 'user_id');
    }

    public function profile()
    {
        return $this->hasOne(UserProfile::class, 'user_id', 'user_id');
    }


    
    public function isOwner(): bool
    {
        return $this->role === 'owner';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'superadmin';
    }

    public function isGymUser(): bool
    {
        return $this->role === 'user';
    }
    public function gymOwnerApplication()
{
    return $this->hasOne(GymOwnerApplication::class, 'user_id', 'user_id');
}

}
