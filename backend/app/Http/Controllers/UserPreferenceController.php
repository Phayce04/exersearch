<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\UserPreference;
use Illuminate\Http\Request;

class UserPreferenceController extends Controller
{
    public function show(Request $request)
    {
        return response()->json([
            'data' => $request->user()->preference
        ]);
    }

    public function storeOrUpdate(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            $validated = $request->validate([
                'goal' => 'nullable|string|max:100',
                'activity_level' => 'nullable|string|max:50',
                'budget' => 'nullable|numeric|min:0',
                'plan_type' => 'nullable|string|in:daily,monthly',

                // ✅ NEW (from onboarding)
                'workout_days' => 'nullable|integer|min:1|max:7',
                'workout_time' => 'nullable|string|in:morning,afternoon,evening',
                'food_budget' => 'nullable|numeric|min:0',

                // store as JSONB via model cast
                'dietary_restrictions' => 'nullable|array',
                'dietary_restrictions.*' => 'string|max:50',
            ]);

            // DEBUG logs
            \Log::info('storeOrUpdate user/preferences', [
                'user_id' => $user->user_id,
                'validated' => $validated,
            ]);

            $preference = \App\Models\UserPreference::updateOrCreate(
                ['user_id' => $user->user_id],
                $validated
            );

            return response()->json([
                'message' => 'Preferences saved successfully',
                'data' => $preference
            ]);
        } catch (\Throwable $e) {
            \Log::error('storeOrUpdate failed', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'message' => 'Server error saving preferences',
                'error' => $e->getMessage(),
                'file' => basename($e->getFile()),
                'line' => $e->getLine(),
            ], 500);
        }
    }
}
