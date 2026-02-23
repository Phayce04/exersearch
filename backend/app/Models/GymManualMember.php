<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GymManualMember extends Model
{
    protected $table = 'gym_manual_members';
    protected $primaryKey = 'manual_member_id';

    protected $fillable = [
        'gym_id',
        'full_name',
        'contact_number',
        'email',
        'status',
        'start_date',
        'end_date',
        'plan_type',
        'notes',
        'linked_user_id',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function gym()
    {
        return $this->belongsTo(Gym::class, 'gym_id', 'gym_id');
    }

    public function linkedUser()
    {
        return $this->belongsTo(User::class, 'linked_user_id', 'user_id');
    }
}