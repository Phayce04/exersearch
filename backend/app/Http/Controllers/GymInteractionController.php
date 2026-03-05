<?php

namespace App\Http\Controllers;

use App\Models\Gym;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GymInteractionController extends Controller
{
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'gym_id' => ['required', 'integer'],
            'event' => ['required', 'string', 'max:30'],
            'source' => ['nullable', 'string', 'max:30'],
            'session_id' => ['nullable', 'string', 'max:64'],
            'meta' => ['nullable'],
        ]);

        $allowed = ['view', 'click', 'save', 'contact', 'visit', 'subscribe'];
        if (!in_array($validated['event'], $allowed, true)) {
            return response()->json(['message' => 'Invalid event'], 422);
        }

        $gym = Gym::where('gym_id', (int) $validated['gym_id'])
            ->where('status', 'approved')
            ->first();

        if (!$gym) return response()->json(['message' => 'Gym not found'], 404);

        $sessionId = $validated['session_id'] ?? null;
        if (!$user && !$sessionId) {
            $sessionId = Str::uuid()->toString();
        }

        $meta = $validated['meta'] ?? null;
        if (is_array($meta) || is_object($meta)) $meta = json_encode($meta);

        DB::table('gym_interactions')->insert([
            'user_id' => $user?->user_id,
            'gym_id' => (int) $validated['gym_id'],
            'event' => $validated['event'],
            'source' => $validated['source'] ?? null,
            'session_id' => $sessionId,
            'meta' => $meta,
            'created_at' => now(),
        ]);

        return response()->json([
            'message' => 'Logged',
            'session_id' => $sessionId,
        ], 201);
    }

    public function adminIndex(Request $request)
    {
        $limit = (int) $request->query('limit', 1000);
        if ($limit < 1) $limit = 1;
        if ($limit > 5000) $limit = 5000;

        $q = trim((string) $request->query('q', ''));
        $event = trim((string) $request->query('event', ''));
        $source = trim((string) $request->query('source', ''));
        $days = (int) $request->query('days', 30);

        if (!in_array($days, [1, 7, 30, 90, 365], true)) $days = 30;
        $from = now()->subDays($days);

        $query = DB::table('gym_interactions as gi')
            ->leftJoin('gyms as g', 'g.gym_id', '=', 'gi.gym_id')
            ->leftJoin('users as u', 'u.user_id', '=', 'gi.user_id')
            ->where('gi.created_at', '>=', $from)
            ->select([
                'gi.gym_id',
                'gi.user_id',
                'gi.event',
                'gi.source',
                'gi.session_id',
                'gi.meta',
                'gi.created_at',

                'g.name as gym_name',

                // ✅ your users table has "name"
                'u.name as user_name',
                'u.email as user_email',

                // ✅ unique-ish key (since gym_interactions has no id)
                DB::raw("CONCAT(gi.gym_id,'|',COALESCE(gi.user_id::text,''),'|',COALESCE(gi.session_id,''),'|',gi.event,'|',gi.created_at::text) as row_key"),
            ])
            ->orderByDesc('gi.created_at')
            ->limit($limit);

        if ($event !== '' && $event !== 'All') {
            $query->where('gi.event', $event);
        }

        if ($source !== '' && $source !== 'All') {
            $query->where('gi.source', $source);
        }

        if ($q !== '') {
            $like = '%' . str_replace('%', '\\%', $q) . '%';
            $query->where(function ($w) use ($like) {
                $w->where('gi.session_id', 'ilike', $like)
                    ->orWhere('gi.event', 'ilike', $like)
                    ->orWhere('gi.source', 'ilike', $like)
                    ->orWhere('gi.meta', 'ilike', $like)
                    ->orWhere('g.name', 'ilike', $like)
                    ->orWhere('u.name', 'ilike', $like)
                    ->orWhere('u.email', 'ilike', $like);
            });
        }

        return response()->json($query->get(), 200);
    }
}