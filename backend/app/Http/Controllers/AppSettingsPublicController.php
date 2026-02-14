<?php

namespace App\Http\Controllers;

use App\Models\AppSetting;

class AppSettingsPublicController extends Controller
{
    // GET /api/v1/settings/public
    public function show()
    {
        $settings = AppSetting::query()->find(1);

        if (!$settings) {
            $settings = AppSetting::query()->create([
                'settings_id' => 1,
                'app_name' => 'ExerSearch',
            ]);
        }

        // ✅ Return ONLY safe/public fields
        return response()->json([
            'data' => [
                'app_name' => $settings->app_name,
                'logo_url' => $settings->logo_url,
                'user_logo_url' => $settings->user_logo_url,
                'favicon_url' => $settings->favicon_url,
                'contact_phone' => $settings->contact_phone,
                'contact_email' => $settings->contact_email,
                'support_email' => $settings->support_email,
                'address' => $settings->address,
                'facebook_url' => $settings->facebook_url,
                'instagram_url' => $settings->instagram_url,
                'tiktok_url' => $settings->tiktok_url,
                'website_url' => $settings->website_url,
            ],
        ]);
    }
}
