<?php

namespace App\Http\Controllers;

use App\Models\Gym;
use App\Models\User;
use App\Models\GymAnnouncement;
use App\Models\GymOwnerApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    public function show(Request $request)
    {
        $range = (string) $request->query('range', '30d');

        if (!in_array($range, ['7d', '30d', '12m'], true)) {
            $range = '30d';
        }

        $days = $range === '7d' ? 7 : ($range === '30d' ? 30 : 365);
        $from = now()->subDays($days);

        $pendingApplications = GymOwnerApplication::where('status', 'pending')->count();
        $pendingGyms = Gym::where('status', 'pending')->count();
        $totalGyms = Gym::count();
        $totalUsers = User::where('role', 'user')->count();
        $blockedGyms = Gym::where('is_announcement_blocked', true)->count();

        $interactions = DB::table('gym_interactions')
            ->where('created_at', '>=', $from)
            ->count();

        $recentUsers = User::query()
            ->where('role', 'user')
            ->with(['userProfile'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(function ($u) {
                return [
                    'id' => $u->user_id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'created_at' => optional($u->created_at)->toIso8601String(),
                    'profile' => $u->userProfile ? [
                        'profile_photo_url' => $u->userProfile->profile_photo_url,
                        'address' => $u->userProfile->address,
                        'gender' => $u->userProfile->gender,
                        'age' => $u->userProfile->age,
                    ] : null,
                ];
            })
            ->values();

        $recentOwners = User::query()
            ->where('role', 'owner')
            ->with(['ownerProfile'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(function ($o) {
                return [
                    'id' => $o->user_id,
                    'name' => $o->name,
                    'email' => $o->email,
                    'created_at' => optional($o->created_at)->toIso8601String(),
                    'profile' => $o->ownerProfile ? [
                        'profile_photo_url' => $o->ownerProfile->profile_photo_url,
                        'contact_number' => $o->ownerProfile->contact_number,
                        'address' => $o->ownerProfile->address,
                        'company_name' => $o->ownerProfile->company_name,
                        'verified' => (bool) $o->ownerProfile->verified,
                        'last_login' => $o->ownerProfile->last_login,
                    ] : null,
                ];
            })
            ->values();

        $apps = GymOwnerApplication::latest()
            ->limit(6)
            ->get()
            ->map(function ($a) {
                return [
                    'type' => 'owner_application',
                    'id' => $a->id,
                    'title' => 'New gym owner application',
                    'subtitle' => ($a->gym_name ?? 'Gym') . ' • ' . ($a->address ?? ''),
                    'created_at' => optional($a->created_at)->toIso8601String(),
                ];
            });

        $gyms = Gym::latest('gym_id')
            ->limit(6)
            ->get()
            ->map(function ($g) {
                return [
                    'type' => 'gym',
                    'id' => $g->gym_id,
                    'title' => 'Gym update',
                    'subtitle' => ($g->name ?? 'Gym') . ' • ' . ($g->address ?? ''),
                    'created_at' => optional($g->created_at)->toIso8601String(),
                ];
            });

        $announcements = GymAnnouncement::latest('announcement_id')
            ->limit(6)
            ->get()
            ->map(function ($x) {
                return [
                    'type' => 'announcement',
                    'id' => $x->announcement_id,
                    'title' => $x->is_deleted ? 'Announcement deleted' : 'New announcement',
                    'subtitle' => $x->title ?? '',
                    'created_at' => optional($x->created_at)->toIso8601String(),
                ];
            });

        $activity = $apps
            ->concat($gyms)
            ->concat($announcements)
            ->sortByDesc('created_at')
            ->values()
            ->take(12);

        $approvalsByMonth = $this->countByMonth(
            GymOwnerApplication::where('status', 'approved'),
            'created_at',
            12
        );

        $interactionsTrend = $this->countByDayTrend(
            'gym_interactions',
            'created_at',
            $days
        );

        return response()->json([
            'range' => $range,
            'kpi' => [
                'pending_applications' => $pendingApplications,
                'pending_gyms' => $pendingGyms,
                'total_gyms' => $totalGyms,
                'total_users' => $totalUsers,
                'blocked_gyms' => $blockedGyms,
                'interactions' => $interactions,
            ],
            'charts' => [
                'approvals_by_month' => $approvalsByMonth,
                'interactions_trend' => $interactionsTrend,
            ],
            'activity' => $activity,
            'recent_users' => $recentUsers,
            'recent_owners' => $recentOwners,
        ]);
    }

    private function countByMonth($query, string $column, int $months)
    {
        $start = now()->startOfMonth()->subMonths($months - 1);

        $rows = $query
            ->where($column, '>=', $start)
            ->selectRaw("date_trunc('month', $column) as ym, COUNT(*) as c")
            ->groupBy('ym')
            ->orderBy('ym')
            ->get();

        $map = [];
        foreach ($rows as $r) {
            $key = \Carbon\Carbon::parse($r->ym)->format('Y-m-01');
            $map[$key] = (int) $r->c;
        }

        $out = [];
        for ($i = 0; $i < $months; $i++) {
            $date = (clone $start)->addMonths($i);
            $key = $date->format('Y-m-01');

            $out[] = [
                'label' => $date->format('M'),
                'value' => (int) ($map[$key] ?? 0),
            ];
        }

        return $out;
    }

    private function countByDayTrend($table, string $column, int $days)
    {
        $start = now()->startOfDay()->subDays($days - 1);

        $rows = DB::table($table)
            ->where($column, '>=', $start)
            ->selectRaw("date_trunc('day', $column) as d, COUNT(*) as c")
            ->groupBy('d')
            ->orderBy('d')
            ->get();

        $map = [];
        foreach ($rows as $r) {
            $key = \Carbon\Carbon::parse($r->d)->format('Y-m-d');
            $map[$key] = (int) $r->c;
        }

        $out = [];
        for ($i = 0; $i < $days; $i++) {
            $date = (clone $start)->addDays($i);
            $key = $date->format('Y-m-d');

            $out[] = [
                'label' => $date->format('M d'),
                'value' => (int) ($map[$key] ?? 0),
            ];
        }

        return $out;
    }
}