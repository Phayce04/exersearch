<?php

namespace App\Http\Controllers;

use App\Models\AppSetting;
use Illuminate\Http\Request;

class AdminAppSettingsController extends Controller
{
    // GET /api/v1/admin/settings
    public function show()
    {
        $settings = AppSetting::query()->find(1);

        if (!$settings) {
            $settings = AppSetting::query()->create([
                'settings_id' => 1,
                'app_name' => 'ExerSearch',
            ]);
        }

        return response()->json(['data' => $settings]);
    }

    // PUT /api/v1/admin/settings
    public function update(Request $request)
    {
        $settings = AppSetting::query()->find(1);

        if (!$settings) {
            $settings = AppSetting::query()->create([
                'settings_id' => 1,
                'app_name' => 'ExerSearch',
            ]);
        }

        $validated = $request->validate([
            'app_name' => ['sometimes', 'string', 'max:120'],

            'logo_url' => ['sometimes', 'nullable', 'string'],
            'user_logo_url' => ['sometimes', 'nullable', 'string'], // ✅ NEW
            'favicon_url' => ['sometimes', 'nullable', 'string'],

            'contact_phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'contact_email' => ['sometimes', 'nullable', 'email', 'max:120'],
            'support_email' => ['sometimes', 'nullable', 'email', 'max:120'],
            'address' => ['sometimes', 'nullable', 'string'],

            'facebook_url' => ['sometimes', 'nullable', 'string'],
            'instagram_url' => ['sometimes', 'nullable', 'string'],
            'tiktok_url' => ['sometimes', 'nullable', 'string'],
            'website_url' => ['sometimes', 'nullable', 'string'],

            'maintenance_mode' => ['sometimes', 'boolean'],
            'signup_enabled' => ['sometimes', 'boolean'],
            'owner_application_enabled' => ['sometimes', 'boolean'],

            // allow object/associative array
            'extras' => ['sometimes', 'array'],
        ]);

        $settings->fill($validated);
        $settings->updated_at = now(); // since timestamps are off
        $settings->save();

        return response()->json([
            'message' => 'App settings updated.',
            'data' => $settings,
        ]);
    }
}
