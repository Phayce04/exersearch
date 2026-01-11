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

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    // Gym-goer preference
    public function preference()
    {
        return $this->hasOne(UserPreference::class, 'user_id', 'user_id');
    }

    // Gym-goer preferred amenities
    public function preferredAmenities()
    {
        return $this->belongsToMany(
            Amenity::class,
            'user_preferred_amenities',
            'user_id',
            'amenity_id'
        );
    }

    // Gym-goer preferred equipment
    public function preferredEquipments()
    {
        return $this->belongsToMany(
            Equipment::class,
            'user_preferred_equipments',
            'user_id',
            'equipment_id'
        );
    }

    // Owner profile
    public function ownerProfile()
    {
        return $this->hasOne(OwnerProfile::class, 'user_id', 'user_id');
    }

    // Admin profile
    public function adminProfile()
    {
        return $this->hasOne(AdminProfile::class, 'user_id', 'user_id');
    }

    // User profile (age, weight, height, address)
    public function profile()
    {
        return $this->hasOne(UserProfile::class, 'user_id', 'user_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Role check helpers (optional)
    |--------------------------------------------------------------------------
    */
    
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
}
