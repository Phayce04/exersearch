<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GymInteractionController extends Controller
{
    /**
     * POST /api/v1/gym-interactions
     * Body: { gym_id, event, source?, session_id?, meta? }
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'gym_id' => ['required', 'integer', 'exists:gyms,gym_id'],
            'event' => ['required', 'string', 'max:30'],
            'source' => ['nullable', 'string', 'max:30'],
            'session_id' => ['nullable', 'string', 'max:64'],
            'meta' => ['nullable', 'array'],
        ]);

        // ✅ add 'unsave' (important for ML + state changes)
        $allowed = ['view', 'click', 'save', 'unsave', 'contact', 'visit', 'subscribe'];

        if (!in_array($validated['event'], $allowed, true)) {
            return response()->json(['message' => 'Invalid event'], 422);
        }

        DB::table('gym_interactions')->insert([
            'user_id' => $user->user_id, // if your PK is "id", change to $user->id
            'gym_id' => (int) $validated['gym_id'],
            'event' => $validated['event'],
            'source' => $validated['source'] ?? null,
            'session_id' => $validated['session_id'] ?? null,

            // ✅ jsonb column: let Laravel/DB handle the array (no json_encode needed)
            'meta' => $validated['meta'] ?? null,

            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Logged'], 201);
    }
}
