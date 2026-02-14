<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SavedGymController extends Controller
{
    /**
     * GET /api/v1/user/saved-gyms
     * Returns saved gyms for the logged-in user (with basic gym details).
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Join gyms so your frontend can render immediately
        $rows = DB::table('saved_gyms as sg')
            ->join('gyms as g', 'g.gym_id', '=', 'sg.gym_id')
            ->where('sg.user_id', $user->user_id)
            ->orderByDesc('sg.created_at')
            ->select([
                'sg.saved_id',
                'sg.gym_id',
                'sg.created_at as saved_at',

                // gym fields (add/remove as you like)
                'g.name',
                'g.address',
                'g.latitude',
                'g.longitude',
                'g.daily_price',
                'g.monthly_price',
                'g.annual_price',
                'g.opening_time',
                'g.closing_time',
                'g.gym_type',
                'g.contact_number',
                'g.email',
                'g.website',
                'g.facebook_page',
                'g.instagram_page',
                'g.main_image_url',
                'g.gallery_urls',
            ])
            ->get();

        return response()->json(['data' => $rows]);
    }

    /**
     * POST /api/v1/user/saved-gyms
     * Body: { gym_id }
     * Saves the gym (idempotent), and logs interaction event='save'.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'gym_id' => ['required', 'integer', 'exists:gyms,gym_id'],
            'source' => ['nullable', 'string', 'max:30'],     // optional passthrough
            'session_id' => ['nullable', 'string', 'max:64'], // optional passthrough
        ]);

        $gymId = (int) $validated['gym_id'];

        // ✅ idempotent save: if already saved, do nothing
        // IMPORTANT: your saved_gyms table must have UNIQUE(user_id, gym_id)
        $existing = DB::table('saved_gyms')
            ->where('user_id', $user->user_id)
            ->where('gym_id', $gymId)
            ->first();

        if (!$existing) {
            DB::table('saved_gyms')->insert([
                'user_id' => $user->user_id,
                'gym_id' => $gymId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // ✅ log event for ML (doesn't affect saved state)
        $this->logInteraction(
            userId: $user->user_id,
            gymId: $gymId,
            event: 'save',
            request: $request,
            extraMeta: [
                'already_saved' => (bool) $existing,
                'feature' => 'saved_gyms',
            ]
        );

        return response()->json([
            'message' => $existing ? 'Already saved' : 'Saved',
            'saved' => true,
        ], $existing ? 200 : 201);
    }

    /**
     * DELETE /api/v1/user/saved-gyms/{gym_id}
     * Unsaves the gym and logs interaction event='unsave'.
     */
    public function destroy(Request $request, $gym_id)
    {
        $user = $request->user();
        $gymId = (int) $gym_id;

        // validate gym exists (optional, but keeps responses consistent)
        $exists = DB::table('gyms')->where('gym_id', $gymId)->exists();
        if (!$exists) {
            return response()->json(['message' => 'Gym not found'], 404);
        }

        $deleted = DB::table('saved_gyms')
            ->where('user_id', $user->user_id)
            ->where('gym_id', $gymId)
            ->delete();

        // ✅ log event for ML
        $this->logInteraction(
            userId: $user->user_id,
            gymId: $gymId,
            event: 'unsave',
            request: $request,
            extraMeta: [
                'was_saved' => (bool) $deleted,
                'feature' => 'saved_gyms',
            ]
        );

        return response()->json([
            'message' => $deleted ? 'Unsaved' : 'Not saved',
            'saved' => false,
        ]);
    }

    /**
     * Helper to insert into gym_interactions (same schema you already use).
     * Keeps your SavedGymController simple.
     */
    private function logInteraction(
        int $userId,
        int $gymId,
        string $event,
        Request $request,
        array $extraMeta = []
    ): void {
        try {
            DB::table('gym_interactions')->insert([
                'user_id' => $userId,
                'gym_id' => $gymId,
                'event' => $event,
                'source' => $request->input('source') ?? 'ui',
                'session_id' => $request->input('session_id') ?? $request->header('X-Session-Id'),
                'meta' => array_merge([
                    'path' => $request->path(),
                    'method' => $request->method(),
                    'ua' => $request->userAgent(),
                ], $extraMeta),
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            // swallow logging errors so saving/unsaving still works
        }
    }
}
