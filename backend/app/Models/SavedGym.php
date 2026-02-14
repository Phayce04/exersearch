<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SavedGym extends Model
{
    protected $table = 'saved_gyms';
    protected $primaryKey = 'saved_id';

    protected $fillable = [
        'user_id',
        'gym_id',
    ];

    // Relationships (optional but useful)
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function gym()
    {
        return $this->belongsTo(Gym::class, 'gym_id', 'gym_id');
    }
}
