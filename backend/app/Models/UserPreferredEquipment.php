<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserPreferredEquipment extends Model
{
    protected $table = 'user_preferred_equipments';
    protected $primaryKey = 'pref_equipment_id';
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'equipment_id',
    ];
        public function equipment()
    {
        return $this->belongsTo(Equipment::class, 'equipment_id');
    }
}
