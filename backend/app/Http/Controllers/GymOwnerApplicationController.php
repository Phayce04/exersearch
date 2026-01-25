<?php

namespace App\Http\Controllers;

use App\Models\GymOwnerApplication;
use App\Models\Gym;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GymOwnerApplicationController extends Controller
{
    public function applyOrUpdate(Request $request)
    {
        $request->validate([
            'gym_name'  => 'required|string|max:255',
            'address'   => 'required|string',
            'latitude'  => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'document_path' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);
        if ($user->role !== 'user') return response()->json(['message' => 'Not allowed'], 403);

        $application = GymOwnerApplication::where('user_id', $user->user_id)->first();

        if ($application) {
            $application->update([
                'gym_name'      => $request->gym_name,
                'address'       => $request->address,
                'latitude'      => $request->latitude,
                'longitude'     => $request->longitude,
                'document_path' => $request->document_path ?? $application->document_path,
                'status'        => 'pending',
            ]);

            return response()->json([
                'message' => 'Application updated.',
                'data' => $application->fresh(),
            ]);
        }

        $application = GymOwnerApplication::create([
            'user_id'       => $user->user_id,
            'gym_name'      => $request->gym_name,
            'address'       => $request->address,
            'latitude'      => $request->latitude,
            'longitude'     => $request->longitude,
            'document_path' => $request->document_path,
            'status'        => 'pending',
        ]);

        return response()->json([
            'message' => 'Application submitted.',
            'data' => $application,
        ], 201);
    }

    public function myApplication(Request $request)
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);

        $application = GymOwnerApplication::where('user_id', $user->user_id)->first();

        return response()->json(['data' => $application]);
    }

    public function index(Request $request)
    {
        $status = $request->query('status');
        $q = $request->query('q');

        $apps = GymOwnerApplication::with('user')
            ->when($status, fn ($query) => $query->where('status', $status))
            ->when($q, function ($query) use ($q) {
                $query->where(function ($qq) use ($q) {
                    $qq->where('gym_name', 'ilike', "%{$q}%")
                       ->orWhere('address', 'ilike', "%{$q}%");
                });
            })
            ->orderByDesc('created_at')
            ->paginate((int) $request->query('per_page', 20));

        return response()->json($apps);
    }

    public function show($id)
    {
        $application = GymOwnerApplication::with('user')->findOrFail($id);
        return response()->json(['data' => $application]);
    }

    // GET /api/v1/owner-applications/map?south=&west=&north=&east=&status=
    // Default: pending, unless status is provided
    public function mapPoints(Request $request)
    {
        $validated = $request->validate([
            'south' => 'required|numeric',
            'west'  => 'required|numeric',
            'north' => 'required|numeric',
            'east'  => 'required|numeric',
            'status' => 'nullable|string|in:pending,approved,rejected',
        ]);

        $apps = GymOwnerApplication::query()
            ->select(['id', 'user_id', 'gym_name', 'address', 'status', 'latitude', 'longitude', 'created_at'])
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->whereBetween('latitude', [$validated['south'], $validated['north']])
            ->whereBetween('longitude', [$validated['west'], $validated['east']])
            ->when(
                empty($validated['status']),
                fn ($q) => $q->where('status', 'pending')
            )
            ->when(
                !empty($validated['status']),
                fn ($q) => $q->where('status', $validated['status'])
            )
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $apps]);
    }

    public function approve($id)
    {
        $application = GymOwnerApplication::with('user')->findOrFail($id);

        if ($application->status === 'approved') {
            return response()->json(['message' => 'Already approved'], 409);
        }
        if ($application->status === 'rejected') {
            return response()->json(['message' => 'Cannot approve a rejected application'], 409);
        }

        DB::transaction(function () use ($application) {
            $application->update(['status' => 'approved']);
            $application->user->update(['role' => 'owner']);

            Gym::create([
                'name'          => $application->gym_name,
                'description'   => null,
                'owner_id'      => $application->user_id,
                'address'       => $application->address,
                'latitude'      => $application->latitude,
                'longitude'     => $application->longitude,

                'daily_price'   => null,
                'monthly_price' => 0.00,
                'annual_price'  => null,

                'opening_time'  => null,
                'closing_time'  => null,
                'gym_type'      => 'General',

                'contact_number' => null,
                'email'          => null,
                'website'        => null,
                'facebook_page'  => null,
                'instagram_page' => null,

                'main_image_url' => null,
                'gallery_urls'   => null,

                'has_personal_trainers' => false,
                'has_classes'           => false,
                'is_24_hours'           => false,
                'is_airconditioned'     => true,
            ]);
        });

        return response()->json(['message' => 'Approved and gym created.']);
    }

    public function reject(Request $request, $id)
    {
        $application = GymOwnerApplication::findOrFail($id);

        if ($application->status === 'rejected') {
            return response()->json(['message' => 'Already rejected'], 409);
        }
        if ($application->status === 'approved') {
            return response()->json(['message' => 'Cannot reject an approved application'], 409);
        }

        $application->update(['status' => 'rejected']);

        return response()->json(['message' => 'Rejected']);
    }
}
