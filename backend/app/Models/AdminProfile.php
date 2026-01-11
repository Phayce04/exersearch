<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminProfile extends Model
{
    protected $table = 'admin_profiles';
    protected $primaryKey = 'admin_profile_id';
    public $timestamps = true;

    protected $fillable = [
        'user_id',
        'permission_level',
        'notes',
    ];

    // Relation back to User
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
