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

                'workout_days' => 'nullable|integer|min:1|max:7',
                'workout_time' => 'nullable|string|in:morning,afternoon,evening',
                'food_budget' => 'nullable|numeric|min:0',

                'workout_level' => 'nullable|string|in:beginner,intermediate,advanced',
                'session_minutes' => 'nullable|integer|min:10|max:240',
                'workout_place' => 'nullable|string|in:home,gym,both',
                'preferred_style' => 'nullable|string|in:strength,hypertrophy,endurance,hiit,mixed',

                'dietary_restrictions' => 'nullable|array',
                'dietary_restrictions.*' => 'string|max:50',

                'injuries' => 'nullable|array',
                'injuries.*' => 'string|max:50',
            ]);

            $preference = UserPreference::updateOrCreate(
                ['user_id' => $user->user_id],
                $validated
            );

            return response()->json([
                'message' => 'Preferences saved successfully',
                'data' => $preference
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Server error saving preferences',
                'error' => $e->getMessage(),
                'file' => basename($e->getFile()),
                'line' => $e->getLine(),
            ], 500);
        }
    }
}
