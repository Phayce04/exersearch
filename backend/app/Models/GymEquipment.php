<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class GymEquipment extends Model
{
    protected $table = 'gym_equipments';

    protected $fillable = [
        'id',
        'equipment_id',
        'quantity',
        'status',
        'date_purchased',
        'last_maintenance',
        'next_maintenance',
    ];

    public $timestamps = false;

    protected $casts = [
        'date_purchased' => 'date',
        'last_maintenance' => 'date',
        'next_maintenance' => 'date',
        'quantity' => 'integer',
        'status' => 'string',
    ];

    /**
     * Gym relationship
     */
    public function gym()
    {
        return $this->belongsTo(Gym::class, 'gym_id');
    }

    /**
     * Equipment relationship
     */
    public function equipment()
    {
        return $this->belongsTo(Equipment::class, 'equipment_id');
    }

    /**
     * Business logic example
     */

    public function isMaintenanceDue(): bool
    {
        if (!$this->next_maintenance) {
            return false;
        }

        return Carbon::parse($this->next_maintenance)->isPast();
    }

}
