<?php

namespace App\Http\Controllers;

use App\Models\Gym;
use Illuminate\Http\Request;
use App\Http\Resources\GymResource;
use App\Http\Resources\EquipmentResource;
use App\Http\Resources\AmenityResource;

class GymController extends Controller
{
    // GET /api/gyms
    public function index(Request $request)
    {
        $query = Gym::with(['owner', 'equipments', 'amenities']);

        // === Gym-level filters ===
        if ($request->has('gym_type')) {
            $query->where('gym_type', $request->gym_type);
        }
        if ($request->has('is_airconditioned')) {
            $query->where('is_airconditioned', $request->is_airconditioned);
        }
        if ($request->has('has_personal_trainers')) {
            $query->where('has_personal_trainers', $request->has_personal_trainers);
        }
        if ($request->has('has_classes')) {
            $query->where('has_classes', $request->has_classes);
        }
        if ($request->has('is_24_hours')) {
            $query->where('is_24_hours', $request->is_24_hours);
        }

        // === Price filters ===
        foreach (['daily_price', 'monthly_price', 'annual_price'] as $field) {
            if ($request->has($field)) {
                $query->where($field, $request->get($field)); // exact match
            }
            if ($request->has("{$field}_min")) {
                $query->where($field, '>=', $request->get("{$field}_min"));
            }
            if ($request->has("{$field}_max")) {
                $query->where($field, '<=', $request->get("{$field}_max"));
            }
        }

        // === Amenities filter ===
        if ($request->has('amenity_id')) {
            $query->whereHas('amenities', fn($q) => $q->where('amenity_id', $request->amenity_id));
        }

        // === Equipments filter ===
        if ($request->has('equipment_category')) {
            $query->whereHas('equipments', fn($q) => $q->where('category', $request->equipment_category));
        }
        if ($request->has('equipment_difficulty')) {
            $query->whereHas('equipments', fn($q) => $q->where('difficulty', $request->equipment_difficulty));
        }

        return GymResource::collection($query->paginate(10));
    }

    // GET /api/gyms/{gym}
    public function show($gym_id)
    {
        $gym = Gym::with(['equipments', 'amenities'])->findOrFail($gym_id);
        return new GymResource($gym);
    }

    // GET /api/gyms/{gym}/equipments
    public function equipments(Request $request, $gym_id)
    {
        $gym = Gym::findOrFail($gym_id);
        $query = $gym->equipments();

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }
        if ($request->has('difficulty')) {
            $query->where('difficulty', $request->difficulty);
        }

        return EquipmentResource::collection($query->paginate(10));
    }

    // GET /api/gyms/{gym}/equipments/{equipment}
    public function equipmentDetail($gym_id, $equipment_id)
    {
        $gym = Gym::findOrFail($gym_id);
        $equipment = $gym->equipments()
            ->where('equipments.equipment_id', $equipment_id)
            ->firstOrFail();

        return new EquipmentResource($equipment);
    }

    // GET /api/gyms/{gym}/amenities
    public function amenities(Request $request, $gym_id)
    {
        $gym = Gym::findOrFail($gym_id);
        $query = $gym->amenities();

        if ($request->has('available')) {
            $query->wherePivot('availability_status', $request->available);
        }

        return AmenityResource::collection($query->paginate(10));
    }

    // GET /api/gyms/{gym}/amenities/{amenity}
    public function amenityDetail($gym_id, $amenity_id)
    {
        $gym = Gym::findOrFail($gym_id);
        $amenity = $gym->amenities()
            ->where('amenities.amenity_id', $amenity_id)
            ->firstOrFail();

        return new AmenityResource($amenity);
    }

    // ✅ OPTIONAL: GET /api/my-gyms
    public function myGyms(Request $request)
    {
        $user = auth()->user();

        if (!$user || !in_array($user->role, ['owner', 'superadmin'])) {
            abort(403, 'Unauthorized');
        }

        $query = Gym::with(['owner', 'equipments', 'amenities']);

        // owners see their own
        if ($user->role !== 'superadmin') {
            $query->where('owner_id', $user->user_id);
        }

        // superadmin sees all gyms
        return GymResource::collection($query->paginate(10));
    }

    // ✅ POST /api/gyms
    public function store(Request $request)
    {
        $user = auth()->user();

        if (!$user || !in_array($user->role, ['owner', 'superadmin'])) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',

            'address' => 'required|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',

            'daily_price' => 'nullable|numeric|min:0',
            'monthly_price' => 'required|numeric|min:0',
            'annual_price' => 'nullable|numeric|min:0',

            'opening_time' => 'nullable',
            'closing_time' => 'nullable',

            'gym_type' => 'nullable|string|max:50',

            'contact_number' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'facebook_page' => 'nullable|url|max:255',
            'instagram_page' => 'nullable|url|max:255',

            'main_image_url' => 'nullable|string',
            'gallery_urls' => 'nullable|array',
            'gallery_urls.*' => 'nullable|string',

            'has_personal_trainers' => 'boolean',
            'has_classes' => 'boolean',
            'is_24_hours' => 'boolean',
            'is_airconditioned' => 'boolean',
        ]);

        // ✅ keep: creator becomes owner_id
        $validated['owner_id'] = $user->user_id;

        $gym = Gym::create($validated);

        return response()->json([
            'message' => 'Gym created.',
            'data' => new GymResource($gym->load(['owner', 'equipments', 'amenities'])),
        ], 201);
    }

    // ✅ PATCH/PUT /api/gyms/{gym}
    public function update(Request $request, $gym_id)
    {
        $user = auth()->user();

        if (!$user || !in_array($user->role, ['owner', 'superadmin'])) {
            abort(403, 'Unauthorized');
        }

        // ✅ superadmin can edit any gym
        $query = Gym::where('gym_id', $gym_id);

        // ✅ owner can only edit their own gyms
        if ($user->role !== 'superadmin') {
            $query->where('owner_id', $user->user_id);
        }

        $gym = $query->firstOrFail();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',

            'address' => 'required|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',

            'contact_number' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'facebook_page' => 'nullable|url|max:255',
            'instagram_page' => 'nullable|url|max:255',

            'daily_price' => 'nullable|numeric|min:0',
            'monthly_price' => 'required|numeric|min:0',
            'annual_price' => 'nullable|numeric|min:0',

            'opening_time' => 'nullable',
            'closing_time' => 'nullable',

            'gym_type' => 'nullable|string|max:50',

            'main_image_url' => 'nullable|string',
            'gallery_urls' => 'nullable|array',
            'gallery_urls.*' => 'nullable|string',

            'has_personal_trainers' => 'boolean',
            'has_classes' => 'boolean',
            'is_24_hours' => 'boolean',
            'is_airconditioned' => 'boolean',
        ]);

        $gym->update($validated);

        return response()->json([
            'message' => 'Gym updated.',
            'data' => new GymResource($gym->load(['owner', 'equipments', 'amenities'])),
        ]);
    }

    // ✅ DELETE /api/gyms/{gym}
    public function destroy($gym_id)
    {
        $user = auth()->user();

        if (!$user || !in_array($user->role, ['owner', 'superadmin'])) {
            abort(403, 'Unauthorized');
        }

        $query = Gym::where('gym_id', $gym_id);

        if ($user->role !== 'superadmin') {
            $query->where('owner_id', $user->user_id);
        }

        $gym = $query->firstOrFail();
        $gym->delete();

        return response()->json([
            'message' => 'Gym deleted.',
        ]);
    }
}
