<?php

namespace App\Http\Controllers;

use App\Models\AppSetting;

class AppSettingsPublicController extends Controller
{
    public function show()
    {
        $settings = AppSetting::query()->find(1);

        if (!$settings) {
            $settings = AppSetting::query()->create([
                'settings_id' => 1,
                'app_name' => 'ExerSearch',
            ]);
        }

        return response()->json([
            'data' => [
                'app_name' => $settings->app_name,
                'logo_url' => $settings->logo_url,
                'user_logo_url' => $settings->user_logo_url,
                'letter_logo' => $settings->letter_logo,
                'favicon_url' => $settings->favicon_url,
                'contact_phone' => $settings->contact_phone,
                'contact_email' => $settings->contact_email,
                'support_email' => $settings->support_email,
                'address' => $settings->address,
                'facebook_url' => $settings->facebook_url,
                'instagram_url' => $settings->instagram_url,
                'tiktok_url' => $settings->tiktok_url,
                'youtube_url' => $settings->youtube_url,
                'twitter_url' => $settings->twitter_url,
                'website_url' => $settings->website_url,
            ],
        ]);
    }
}