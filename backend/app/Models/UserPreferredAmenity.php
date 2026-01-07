<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserPreferredAmenity extends Model
{
    protected $table = 'user_preferred_amenities';
    protected $primaryKey = 'pref_amenity_id';
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'amenity_id',
    ];
            public function amenity()
    {
        return $this->belongsTo(Amenity::class, 'amenity_id');
    }
}
