<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppSetting extends Model
{
    protected $table = 'app_settings';
    protected $primaryKey = 'settings_id';
    public $incrementing = false;
    protected $keyType = 'int';

    // Your table only has updated_at, not created_at
    public $timestamps = false;

    protected $fillable = [
        'settings_id',
        'app_name',

        'logo_url',
        'user_logo_url',   // ✅ NEW
        'favicon_url',

        'contact_phone',
        'contact_email',
        'support_email',
        'address',

        'facebook_url',
        'instagram_url',
        'tiktok_url',
        'website_url',

        'maintenance_mode',
        'signup_enabled',
        'owner_application_enabled',

        'extras',
        'updated_at',
    ];

    protected $casts = [
        'maintenance_mode' => 'boolean',
        'signup_enabled' => 'boolean',
        'owner_application_enabled' => 'boolean',
        'extras' => 'array',
        'updated_at' => 'datetime',
    ];
}
