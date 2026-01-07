<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class GymOwner extends Authenticatable
{
    use HasFactory, HasApiTokens;

    protected $table = 'gym_owners';
    protected $primaryKey = 'owner_id';
    public $incrementing = true;
    protected $keyType = 'int';
    protected $fillable = [
        'username',
        'email',
        'password',
        'full_name',
        'profile_photo_url',
        'contact_number',
        'address',
        'company_name',
        'verified',
        'role',
        'last_login',
        'login_attempts',
    ];

    protected $hidden = [
        'password',
    ];
    protected $casts = [
        'verified'   => 'boolean',
        'last_login' => 'datetime',
    ];

    public function gyms()
    {
        return $this->hasMany(Gym::class, 'owner_id', 'owner_id');
    }
}
