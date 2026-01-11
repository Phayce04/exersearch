<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OwnerProfile extends Model
{
    protected $table = 'owner_profiles';
    protected $primaryKey = 'owner_profile_id';
    public $timestamps = true;

    protected $fillable = [
        'user_id',
        'profile_photo_url',
        'contact_number',
        'address',
        'company_name',
        'verified',
        'last_login',
        'login_attempts',
    ];

    // Relation back to User
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
