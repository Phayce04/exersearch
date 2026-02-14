<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GymInteractionController extends Controller
{
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $validated = $request->validate([
            'gym_id' => ['required', 'integer'],
            'event' => ['required', 'string', 'max:30'],
            'source' => ['nullable', 'string', 'max:30'],
            'session_id' => ['nullable', 'string', 'max:64'],
            'meta' => ['nullable'], // ✅ accept array OR object OR string JSON
        ]);

        $allowed = ['view', 'click', 'save', 'contact', 'visit', 'subscribe'];
        if (!in_array($validated['event'], $allowed, true)) {
            return response()->json(['message' => 'Invalid event'], 422);
        }

        $meta = $validated['meta'] ?? null;
        if (is_array($meta)) $meta = json_encode($meta);
        if (is_object($meta)) $meta = json_encode($meta);
        if (is_string($meta) && $meta !== '') {
            // keep string as-is (already JSON or just text)
        }

        DB::table('gym_interactions')->insert([
            'user_id' => $user->user_id,
            'gym_id' => (int) $validated['gym_id'],
            'event' => $validated['event'],
            'source' => $validated['source'] ?? null,
            'session_id' => $validated['session_id'] ?? null,
            'meta' => $meta,
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Logged'], 201);
    }
}
