<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Contracts\Auth\MustVerifyEmail;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, Notifiable;

    protected $table = 'users';
    protected $primaryKey = 'user_id';
    public $timestamps = true;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role', // user | owner | admin | superadmin
        // 'onboarded_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'onboarded_at' => 'datetime',
    ];

    // Regular gym user profile
    public function userProfile()
    {
        return $this->hasOne(UserProfile::class, 'user_id', 'user_id');
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

    public function gyms()
    {
        return $this->hasMany(Gym::class, 'owner_id', 'user_id');
    }

    public function gymOwnerApplication()
    {
        return $this->hasOne(GymOwnerApplication::class, 'user_id', 'user_id');
    }

    public function isGymUser(): bool
    {
        return $this->role === 'user';
    }

    public function isOwner(): bool
    {
        return $this->role === 'owner';
    }

    public function isAdmin(): bool
    {
        return in_array($this->role, ['admin', 'superadmin']);
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'superadmin';
    }

    public function savedGyms()
    {
        return $this->hasMany(\App\Models\SavedGym::class, 'user_id', 'user_id');
    }

    public function savedGymDetails()
    {
        return $this->belongsToMany(
            \App\Models\Gym::class,
            'saved_gyms',
            'user_id',
            'gym_id',
            'user_id',
            'gym_id'
        )->withTimestamps();
    }
}