<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GymOwnerApplication extends Model
{
    protected $fillable = [
        'user_id',
        'gym_name',
        'address',
        'document_path',
        'status'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
