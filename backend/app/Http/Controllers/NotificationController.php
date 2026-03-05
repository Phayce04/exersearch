<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class NotificationController extends Controller
{
    private function bucketRole(Request $request): string
    {
        $r = (string) $request->query('role', 'user');
        return in_array($r, ['user', 'owner', 'admin', 'superadmin'], true) ? $r : 'user';
    }

    private function applyAccessScope($q, $user, string $role)
    {
        $q->where('recipient_role', $role)->where('is_hidden', false);

        if ($role !== 'owner') {
            return $q->where('recipient_id', (int) $user->user_id);
        }

        $uid = (int) $user->user_id;

        return $q->where(function ($w) use ($uid) {
            $w->where('recipient_id', $uid)
              ->orWhereIn('gym_id', function ($sub) use ($uid) {
                  $sub->select('gym_id')->from('gyms')->where('owner_id', $uid);
              });
        });
    }

    private function isInquiryType(?string $type): bool
    {
        $t = strtoupper(trim((string) $type));
        return $t !== '' && str_starts_with($t, 'INQUIRY_');
    }

    /**
     * OWNER URL fallback rules (only used if url is empty):
     * - ratings/reviews -> /owner/view-gym/{gym_id}
     * - inquiries       -> /owner/inbox
     * - members         -> /owner/members/{gym_id}
     * - free visits     -> /owner/free-visits/{gym_id}
     */
    private function fallbackOwnerUrl($row): ?string
    {
        $type = strtoupper(trim((string) ($row->type ?? '')));
        $gymId = (int) ($row->gym_id ?? 0);

        // inquiries (exact)
        if ($this->isInquiryType($type)) {
            return '/owner/inbox';
        }

        // ratings / reviews (exact)
        if (str_contains($type, 'RATING') || str_contains($type, 'REVIEW')) {
            return $gymId > 0 ? ('/owner/view-gym/' . $gymId) : null;
        }

        // members / membership (exact)
        if (str_contains($type, 'MEMBER') || str_contains($type, 'MEMBERSHIP')) {
            return $gymId > 0 ? ('/owner/members/' . $gymId) : null;
        }

        // visits / free visits (exact)
        if (str_contains($type, 'FREE_VISIT') || str_contains($type, 'VISIT')) {
            return $gymId > 0 ? ('/owner/free-visits/' . $gymId) : null;
        }

        return null;
    }

    /**
     * Collapsed feed rule:
     * - Non-inquiry: normal rows (paged)
     * - Inquiry: ALWAYS 1 row per gym (latest activity), regardless of read/unread
     */
    private function buildCollapsedIndexQuery($user, string $role, bool $unreadOnly)
    {
        // non-inquiry notifications
        $nonInquiry = Notification::query()->select('notifications.*');
        $this->applyAccessScope($nonInquiry, $user, $role);

        if ($unreadOnly) $nonInquiry->where('is_read', false);

        $nonInquiry->where(function ($w) {
            $w->whereNull('type')->orWhereRaw("UPPER(type) NOT LIKE 'INQUIRY\\_%'");
        });

        // inquiry notifications: 1 per gym (latest)
        $inquiryLatest = Notification::query()->select('notifications.*');
        $this->applyAccessScope($inquiryLatest, $user, $role);

        $inquiryLatest->whereNotNull('gym_id')
            ->whereRaw("UPPER(type) LIKE 'INQUIRY\\_%'");

        if ($unreadOnly) {
            $inquiryLatest->where('is_read', false);
        }

        $inquiryLatest->whereIn('notification_id', function ($sub) use ($user, $role, $unreadOnly) {
            $subQ = DB::table('notifications as n')
                ->selectRaw('MAX(n.notification_id) as id')
                ->where('n.recipient_role', $role)
                ->where('n.is_hidden', false)
                ->whereNotNull('n.gym_id')
                ->whereRaw("UPPER(n.type) LIKE 'INQUIRY\\_%'");

            if ($unreadOnly) $subQ->where('n.is_read', false);

            if ($role !== 'owner') {
                $subQ->where('n.recipient_id', (int) $user->user_id);
            } else {
                $uid = (int) $user->user_id;
                $subQ->where(function ($w) use ($uid) {
                    $w->where('n.recipient_id', $uid)
                      ->orWhereIn('n.gym_id', function ($g) use ($uid) {
                          $g->select('gym_id')->from('gyms')->where('owner_id', $uid);
                      });
                });
            }

            $subQ->groupBy('n.gym_id');
            $sub->fromSub($subQ, 'x')->select('x.id');
        });

        $union = $nonInquiry->unionAll($inquiryLatest);
        return DB::query()->fromSub($union, 'u');
    }

    private function inquiryUnreadCountForGym($user, string $role, int $gymId): int
    {
        $q = Notification::query();
        $this->applyAccessScope($q, $user, $role);

        return (int) $q->where('is_read', false)
            ->whereNotNull('gym_id')
            ->where('gym_id', $gymId)
            ->whereRaw("UPPER(type) LIKE 'INQUIRY\\_%'")
            ->count();
    }

    /**
     * Adds collapsed_title/collapsed_message that the UI should show.
     * IMPORTANT: handles count=0 so you never see "(0)".
     */
    private function decorateCollapsedInquiry(&$n, int $count): void
    {
        $n->collapsed = true;
        $n->collapsed_count = $count;

        if (($n->recipient_role ?? null) === 'owner') {
            if ($count <= 0) {
                $n->collapsed_title = $n->title ?? 'Inquiry update';
                $n->collapsed_message = $n->message ?? 'Tap to view.';
            } else {
                $n->collapsed_title = $count === 1 ? 'New inquiry' : "You have {$count} inquiries";
                $n->collapsed_message = $count === 1
                    ? 'You have a new inquiry. Tap to view.'
                    : "You have {$count} unread inquiries. Tap to view.";
            }
        }

        else if (($n->recipient_role ?? null) === 'user') {
            if ($count <= 0) {
                $n->collapsed_title = $n->title ?? 'Inquiry update';
                $n->collapsed_message = $n->message ?? 'Tap to view your inquiry history.';
            } else {
                $n->collapsed_title = $count === 1 ? 'Gym replied' : "Gym replied ({$count})";
                $n->collapsed_message = $count === 1
                    ? 'A gym has replied to your inquiry. Tap to view.'
                    : "A gym has replied {$count} times on your inquiries. Tap to view.";
            }
        }

        else {
            $n->collapsed_title = $n->title ?? 'Inquiry update';
            $n->collapsed_message = $n->message ?? '';
        }

        if (empty($n->url)) {
            if (($n->recipient_role ?? null) === 'owner') {
                // EXACT per your requirement
                $n->url = '/owner/inbox';
            } else if (($n->recipient_role ?? null) === 'user') {
                $n->url = '/home/inquiries';
            }
        }
    }

    public function index(Request $request)
    {
        $user = Auth::user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $request->validate([
            'role' => ['nullable', Rule::in(['user', 'owner', 'admin', 'superadmin'])],
            'unread_only' => ['nullable', 'boolean'],
            'type' => ['nullable', 'string', 'max:80'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $role = $this->bucketRole($request);
        $unreadOnly = $request->boolean('unread_only');
        $perPage = (int) $request->query('per_page', 20);

        if ($request->filled('type')) {
            $q = Notification::query();
            $this->applyAccessScope($q, $user, $role);
            if ($unreadOnly) $q->where('is_read', false);
            $q->where('type', $request->query('type'));

            $paged = $q->orderByDesc('created_at')->paginate($perPage);

            $items = $paged->getCollection()->map(function ($row) {
                if (($row->recipient_role ?? null) === 'owner' && empty($row->url)) {
                    $fallback = $this->fallbackOwnerUrl($row);
                    if (!empty($fallback)) $row->url = $fallback;
                }
                return $row;
            });

            $paged->setCollection($items);

            return response()->json($paged);
        }

        $base = $this->buildCollapsedIndexQuery($user, $role, $unreadOnly);
        $paged = $base->orderByDesc('created_at')->paginate($perPage);

        $items = $paged->getCollection()->map(function ($row) use ($user, $role) {
            $type = $row->type ?? null;
            $gymId = (int) ($row->gym_id ?? 0);

            if ($gymId > 0 && $this->isInquiryType($type)) {
                $count = $this->inquiryUnreadCountForGym($user, $role, $gymId);
                $this->decorateCollapsedInquiry($row, $count);
            } else {
                $row->collapsed = false;
                $row->collapsed_count = 1;
            }

            // owner fallback for missing url (exact rules)
            if (($row->recipient_role ?? null) === 'owner' && empty($row->url)) {
                $fallback = $this->fallbackOwnerUrl($row);
                if (!empty($fallback)) $row->url = $fallback;
            }

            return $row;
        });

        $paged->setCollection($items);

        return response()->json($paged);
    }

    public function unreadCount(Request $request)
    {
        $user = Auth::user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $request->validate([
            'role' => ['nullable', Rule::in(['user', 'owner', 'admin', 'superadmin'])],
        ]);

        $role = $this->bucketRole($request);

        $base = Notification::query();
        $this->applyAccessScope($base, $user, $role);
        $base->where('is_read', false);

        $nonInquiryCount = (clone $base)->where(function ($w) {
            $w->whereNull('type')->orWhereRaw("UPPER(type) NOT LIKE 'INQUIRY\\_%'");
        })->count();

        // inquiries count as 1 per gym (collapsed)
        $inquiryGroupCount = (clone $base)
            ->whereRaw("UPPER(type) LIKE 'INQUIRY\\_%'")
            ->whereNotNull('gym_id')
            ->distinct('gym_id')
            ->count('gym_id');

        return response()->json(['unread' => (int) ($nonInquiryCount + $inquiryGroupCount)]);
    }
    public function markRead(Request $request, $id)
    {
        $user = Auth::user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $request->validate([
            'role' => ['nullable', Rule::in(['user', 'owner', 'admin', 'superadmin'])],
        ]);

        $role = $this->bucketRole($request);

        $q = Notification::query()->where('notification_id', (int) $id);
        $this->applyAccessScope($q, $user, $role);

        $n = $q->first();
        if (!$n) return response()->json(['message' => 'Notification not found'], 404);

        if ($this->isInquiryType($n->type) && !empty($n->gym_id)) {
            $all = Notification::query();
            $this->applyAccessScope($all, $user, $role);

            $all->whereRaw("UPPER(type) LIKE 'INQUIRY\\_%'")
                ->where('gym_id', (int) $n->gym_id)
                ->where('is_read', false)
                ->update(['is_read' => true, 'read_at' => now()]);

            return response()->json([
                'message' => 'Marked inquiry group as read',
            ]);
        }

        if (!$n->is_read) {
            $n->update(['is_read' => true, 'read_at' => now()]);
        }

        return response()->json(['message' => 'Marked as read', 'notification' => $n->fresh()]);
    }

    public function markAllRead(Request $request)
    {
        $user = Auth::user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $request->validate([
            'role' => ['nullable', Rule::in(['user', 'owner', 'admin', 'superadmin'])],
        ]);

        $role = $this->bucketRole($request);

        $q = Notification::query();
        $this->applyAccessScope($q, $user, $role);

        $count = $q->where('is_read', false)->update(['is_read' => true, 'read_at' => now()]);

        return response()->json(['message' => 'All marked read', 'updated' => (int) $count]);
    }

    public function destroy(Request $request, $id)
    {
        $user = Auth::user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $request->validate([
            'role' => ['nullable', Rule::in(['user', 'owner', 'admin', 'superadmin'])],
        ]);

        $role = $this->bucketRole($request);

        $q = Notification::query()->where('notification_id', (int) $id);
        $this->applyAccessScope($q, $user, $role);

        $deleted = $q->delete();

        return response()->json([
            'message' => $deleted ? 'Deleted' : 'Not found',
            'deleted' => (int) $deleted
        ]);
    }
}