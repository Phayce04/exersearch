<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Gym;
use App\Models\User;

class GymInquiry extends Model
{
    protected $table = 'gym_inquiries';
    protected $primaryKey = 'inquiry_id';

    protected $fillable = [
        'gym_id',
        'user_id',
        'status',
        'question',
        'answer',
        'attachment_url',
        'answered_at',
        'answered_by_owner_id',
        'closed_at',
        'closed_by_owner_id',
        'user_read_at',
        'owner_read_at',
    ];

    protected $casts = [
        'answered_at' => 'datetime',
        'closed_at' => 'datetime',
        'user_read_at' => 'datetime',
        'owner_read_at' => 'datetime',
        'created_at'  => 'datetime',
        'updated_at'  => 'datetime',
    ];

    public function gym()
    {
        return $this->belongsTo(Gym::class, 'gym_id', 'gym_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function answeredByOwner()
    {
        return $this->belongsTo(User::class, 'answered_by_owner_id', 'user_id');
    }

    public function closedByOwner()
    {
        return $this->belongsTo(User::class, 'closed_by_owner_id', 'user_id');
    }
}