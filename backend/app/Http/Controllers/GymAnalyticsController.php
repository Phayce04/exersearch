<?php

namespace App\Http\Controllers;

use App\Models\Gym; // adjust model namespace if different
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GymAnalyticsController extends Controller
{
    public function show(Request $request, $gymId)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $gym = Gym::findOrFail((int) $gymId);

        // ✅ IMPORTANT: enforce owner/admin access (adjust column name!)
        // If your gyms table uses owner_user_id or user_id, update this.
        $ownerId = $gym->owner_user_id ?? $gym->user_id ?? null;

        $isAdmin = in_array($user->role ?? '', ['admin', 'superadmin'], true);
        if (!$isAdmin && $ownerId !== null && (int)$ownerId !== (int)$user->user_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // ---------- VIEWS ----------
        $totalViews = (int) DB::table('gym_interactions')
            ->where('gym_id', (int) $gymId)
            ->where('event', 'view')
            ->count();

        // last 7 days vs previous 7 days
        $viewsThisWeek = (int) DB::table('gym_interactions')
            ->where('gym_id', (int) $gymId)
            ->where('event', 'view')
            ->where('created_at', '>=', now()->subDays(7))
            ->count();

        $viewsPrevWeek = (int) DB::table('gym_interactions')
            ->where('gym_id', (int) $gymId)
            ->where('event', 'view')
            ->whereBetween('created_at', [now()->subDays(14), now()->subDays(7)])
            ->count();

        $viewsChange = $viewsPrevWeek > 0
            ? (int) round((($viewsThisWeek - $viewsPrevWeek) / $viewsPrevWeek) * 100)
            : ($viewsThisWeek > 0 ? 100 : 0);

        // ---------- SAVES ----------
        // Preferred: count actual saved gyms table (more accurate than “save” events)
        // If your table name differs, update it.
        $totalSaves = (int) DB::table('saved_gyms')
            ->where('gym_id', (int) $gymId)
            ->count();

        // optional: month change (30d vs previous 30d)
        $savesThisMonth = (int) DB::table('saved_gyms')
            ->where('gym_id', (int) $gymId)
            ->where('created_at', '>=', now()->subDays(30))
            ->count();

        $savesPrevMonth = (int) DB::table('saved_gyms')
            ->where('gym_id', (int) $gymId)
            ->whereBetween('created_at', [now()->subDays(60), now()->subDays(30)])
            ->count();

        $savesChange = $savesPrevMonth > 0
            ? (int) round((($savesThisMonth - $savesPrevMonth) / $savesPrevMonth) * 100)
            : ($savesThisMonth > 0 ? 100 : 0);

        return response()->json([
            'gym_id' => (int) $gymId,
            'total_views' => $totalViews,
            'views_change' => $viewsChange,
            'total_saves' => $totalSaves,
            'saves_change' => $savesChange,
        ]);
    }
}