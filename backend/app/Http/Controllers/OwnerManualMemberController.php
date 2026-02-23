<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Gym;
use App\Models\GymManualMember;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OwnerManualMemberController extends Controller
{
    private function ensureOwnerOwnsGym(int $gymId, $user): Gym
    {
        $gym = Gym::where('gym_id', $gymId)->firstOrFail();

        // Admin + Superadmin can manage any gym
        if (in_array($user->role, ['admin', 'superadmin'], true)) {
            return $gym;
        }

        // Owners must match the gym owner_id
        if ((int)$gym->owner_id !== (int)$user->user_id) {
            abort(403, 'You do not own this gym.');
        }

        return $gym;
    }

    // List manual members for a gym
    public function index(Request $request, $gymId)
    {
        $user = $request->user();
        $this->ensureOwnerOwnsGym((int)$gymId, $user);

        $q = GymManualMember::query()
            ->where('gym_id', $gymId)
            ->orderByDesc('manual_member_id');

        if ($request->filled('status')) {
            $q->where('status', $request->string('status'));
        }

        if ($request->filled('search')) {
            $s = '%' . $request->string('search') . '%';
            $q->where(function ($qq) use ($s) {
                $qq->where('full_name', 'ilike', $s)
                    ->orWhere('email', 'ilike', $s)
                    ->orWhere('contact_number', 'ilike', $s);
            });
        }

        return response()->json([
            'data' => $q->paginate((int)($request->input('per_page', 20))),
        ]);
    }

    // Create manual member
    public function store(Request $request, $gymId)
    {
        $user = $request->user();
        $this->ensureOwnerOwnsGym((int)$gymId, $user);

        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],

            // keep aligned with your MEMBERSHIP_STATUS constants
            'status' => ['nullable', Rule::in(['intent', 'active', 'expired', 'cancelled', 'rejected'])],

            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'plan_type' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string'],
        ]);

        $member = GymManualMember::create(array_merge($validated, [
            'gym_id' => (int)$gymId,
        ]));

        return response()->json([
            'message' => 'Manual member created.',
            'data' => $member,
        ], 201);
    }

    // Show one manual member
    public function show(Request $request, $gymId, $manualMemberId)
    {
        $user = $request->user();
        $this->ensureOwnerOwnsGym((int)$gymId, $user);

        $member = GymManualMember::where('gym_id', $gymId)
            ->where('manual_member_id', $manualMemberId)
            ->firstOrFail();

        return response()->json(['data' => $member]);
    }

    // Update manual member
    public function update(Request $request, $gymId, $manualMemberId)
    {
        $user = $request->user();
        $this->ensureOwnerOwnsGym((int)$gymId, $user);

        $member = GymManualMember::where('gym_id', $gymId)
            ->where('manual_member_id', $manualMemberId)
            ->firstOrFail();

        $validated = $request->validate([
            'full_name' => ['sometimes', 'required', 'string', 'max:255'],
            'contact_number' => ['sometimes', 'nullable', 'string', 'max:50'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],

            'status' => ['sometimes', Rule::in(['intent', 'active', 'expired', 'cancelled', 'rejected'])],
            'start_date' => ['sometimes', 'nullable', 'date'],
            'end_date' => ['sometimes', 'nullable', 'date'],
            'plan_type' => ['sometimes', 'nullable', 'string', 'max:50'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ]);

        // enforce date ordering if both provided
        if (array_key_exists('start_date', $validated) && array_key_exists('end_date', $validated)) {
            if (!empty($validated['start_date']) && !empty($validated['end_date'])) {
                if (strtotime($validated['end_date']) < strtotime($validated['start_date'])) {
                    return response()->json(['message' => 'end_date must be after or equal to start_date'], 422);
                }
            }
        }

        $member->fill($validated);
        $member->save();

        return response()->json([
            'message' => 'Manual member updated.',
            'data' => $member,
        ]);
    }

    // Delete manual member
    public function destroy(Request $request, $gymId, $manualMemberId)
    {
        $user = $request->user();
        $this->ensureOwnerOwnsGym((int)$gymId, $user);

        $member = GymManualMember::where('gym_id', $gymId)
            ->where('manual_member_id', $manualMemberId)
            ->firstOrFail();

        $member->delete();

        return response()->json(['message' => 'Manual member deleted.']);
    }

    /**
     * Combined members list (app users + manual members)
     * Good for the Owner “Members” page.
     */
    public function combined(Request $request, $gymId)
    {
        $user = $request->user();
        $this->ensureOwnerOwnsGym((int)$gymId, $user);

        // manual members
        $manual = GymManualMember::query()
            ->where('gym_id', $gymId)
            ->selectRaw("
                manual_member_id::bigint as id,
                gym_id,
                linked_user_id as user_id,
                full_name as display_name,
                email,
                contact_number,
                status::text as status,
                start_date,
                end_date,
                plan_type,
                notes,
                'manual' as source,
                created_at
            ");

        // app user memberships
        $app = \DB::table('gym_memberships as gm')
            ->join('users as u', 'u.user_id', '=', 'gm.user_id')
            ->where('gm.gym_id', $gymId)
            ->selectRaw("
                gm.membership_id::bigint as id,
                gm.gym_id,
                gm.user_id,
                u.name as display_name,
                u.email,
                NULL::text as contact_number,
                gm.status::text as status,
                gm.start_date,
                gm.end_date,
                gm.plan_type,
                gm.notes,
                'app_user' as source,
                gm.created_at
            ");

        $rows = $app->unionAll($manual);

        $query = \DB::query()->fromSub($rows, 'members');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('search')) {
            $s = '%' . $request->string('search') . '%';
            $query->where(function ($qq) use ($s) {
                $qq->where('display_name', 'ilike', $s)
                    ->orWhere('email', 'ilike', $s)
                    ->orWhere('contact_number', 'ilike', $s);
            });
        }

        $query->orderByDesc('created_at');

        return response()->json([
            'data' => $query->paginate((int)($request->input('per_page', 20))),
        ]);
    }
    public function import(Request $request, $gymId)
{
    $user = $request->user();
    $this->ensureOwnerOwnsGym((int)$gymId, $user);

    $validated = $request->validate([
        'rows' => ['required', 'array', 'min:1', 'max:5000'],
        'rows.*.full_name' => ['required', 'string', 'max:255'],
        'rows.*.contact_number' => ['nullable', 'string', 'max:50'],
        'rows.*.email' => ['nullable', 'email', 'max:255'],
        'rows.*.status' => ['nullable', Rule::in(['intent', 'active', 'expired', 'cancelled', 'rejected'])],
        'rows.*.start_date' => ['nullable', 'date'],
        'rows.*.end_date' => ['nullable', 'date'],
        'rows.*.plan_type' => ['nullable', 'string', 'max:50'],
        'rows.*.notes' => ['nullable', 'string'],
    ]);

    $rows = $validated['rows'];

    $errors = [];
    $inserts = [];

    foreach ($rows as $i => $r) {
        $start = $r['start_date'] ?? null;
        $end = $r['end_date'] ?? null;

        if ($start && $end && strtotime($end) < strtotime($start)) {
            $errors[] = [
                'row' => $i + 1,
                'field' => 'end_date',
                'message' => 'end_date must be after or equal to start_date',
            ];
            continue;
        }

        $inserts[] = [
            'gym_id' => (int)$gymId,
            'linked_user_id' => null,
            'full_name' => $r['full_name'],
            'email' => $r['email'] ?? null,
            'contact_number' => $r['contact_number'] ?? null,
            'status' => $r['status'] ?? 'active',
            'start_date' => $start,
            'end_date' => $end,
            'plan_type' => $r['plan_type'] ?? null,
            'notes' => $r['notes'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    if (count($errors)) {
        return response()->json([
            'message' => 'Some rows failed validation.',
            'errors' => $errors,
            'inserted' => 0,
        ], 422);
    }

    \DB::transaction(function () use ($inserts) {
        $chunked = array_chunk($inserts, 500);
        foreach ($chunked as $chunk) {
            \DB::table('gym_manual_members')->insert($chunk);
        }
    });

    return response()->json([
        'message' => 'Import successful.',
        'inserted' => count($inserts),
    ], 201);
}
}