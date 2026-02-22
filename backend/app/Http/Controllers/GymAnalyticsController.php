<?php

namespace App\Http\Controllers;

use App\Models\Gym;
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

        $ownerId = $gym->owner_user_id ?? $gym->user_id ?? null;

        $isAdmin = in_array($user->role ?? '', ['admin', 'superadmin'], true);
        if (!$isAdmin && $ownerId !== null && (int) $ownerId !== (int) $user->user_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $totalViews = (int) DB::table('gym_interactions')
            ->where('gym_id', (int) $gymId)
            ->where('event', 'view')
            ->count();

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

        $totalSaves = (int) DB::table('saved_gyms')
            ->where('gym_id', (int) $gymId)
            ->count();

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

    public function activities(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $isAdmin = in_array($user->role ?? '', ['admin', 'superadmin'], true);

        $ownerColumn = 'owner_user_id';
        $gymPk = 'gym_id';

        $rows = DB::table('gym_interactions as gi')
            ->join('gyms as g', "g.$gymPk", '=', 'gi.gym_id')
            ->when(!$isAdmin, function ($q) use ($user, $ownerColumn) {
                return $q->where("g.$ownerColumn", (int) $user->user_id);
            })
            ->whereIn('gi.event', ['view', 'click', 'save'])
            ->orderByDesc('gi.created_at')
            ->limit(20)
            ->get([
                'gi.gym_id',
                'g.name as gym_name',
                'gi.event',
                'gi.created_at',
            ])
            ->values()
            ->map(function ($row, $i) {
                $row->id = $i + 1;
                return $row;
            });

        return response()->json([
            'data' => $rows,
        ]);
    }
}