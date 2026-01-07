<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserPreference extends Model
{
    protected $table = 'user_preferences';

    protected $primaryKey = 'pref_id';

    protected $fillable = [
        'user_id',
        'goal',
        'activity_level',
        'budget',
    ];

    public function user()
    {
        return $this->belongsTo(GymGoer::class, 'user_id');
    }
}