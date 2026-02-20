<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GymOwnerApplication extends Model
{
    protected $table = 'gym_owner_applications';

    protected $fillable = [
        'user_id',
        'gym_name',
        'address',
        'latitude',
        'longitude',
        'document_path',
        'status',

        'main_image_url',
        'gallery_urls',

        'description',
        'contact_number',
        'company_name',

        'daily_price',
        'monthly_price',
        'quarterly_price',

        'amenity_ids',
    ];

    protected $casts = [
        'latitude' => 'decimal:6',
        'longitude' => 'decimal:6',

        'daily_price' => 'decimal:2',
        'monthly_price' => 'decimal:2',
        'quarterly_price' => 'decimal:2',

        'gallery_urls' => 'array',
        'amenity_ids' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
