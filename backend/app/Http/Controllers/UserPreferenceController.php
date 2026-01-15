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
        $validated = $request->validate([
            'goal' => 'nullable|string|max:100',
            'activity_level' => 'nullable|string|max:50',
            'budget' => 'nullable|numeric|min:0',
            'plan_type' => 'nullable|string|in:daily,monthly', // <-- added validation

        ]);

        $preference = UserPreference::updateOrCreate(
            ['user_id' => $request->user()->user_id],
            $validated
        );

        return response()->json([
            'message' => 'Preferences saved successfully',
            'data' => $preference
        ]);
    }
}
