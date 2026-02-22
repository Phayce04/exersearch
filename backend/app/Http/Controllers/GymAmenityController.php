<?php

namespace App\Http\Controllers;

use App\Models\Gym;
use Illuminate\Http\Request;

class GymAmenityController extends Controller
{
    private function requireOwnerOrSuperadmin(): array
    {
        $user = auth()->user();
        if (!$user) abort(401);

        if (!in_array($user->role, ['owner', 'superadmin'])) {
            abort(403, 'Unauthorized');
        }

        return [$user];
    }

    private function findOwnedGymOrFail(int $gymId)
    {
        [$user] = $this->requireOwnerOrSuperadmin();

        $q = Gym::query()->where('gym_id', $gymId);

        if ($user->role !== 'superadmin') {
            $q->where('owner_id', $user->user_id);
        }

        return $q->firstOrFail();
    }

    private function toBool($v): bool
    {
        if (is_bool($v)) return $v;
        $s = strtolower(trim((string) $v));
        if (in_array($s, ['1', 'true', 'yes', 'available', 'enabled'])) return true;
        return false;
    }

    public function store(Request $request, $gym)
    {
        $gymModel = $this->findOwnedGymOrFail((int) $gym);

        $data = $request->validate([
            'amenity_id' => 'required|integer|exists:amenities,amenity_id',
            'availability_status' => 'nullable',
            'notes' => 'nullable|string|max:500',
            'image_url' => 'nullable|string|max:2048',
        ]);

        $amenityId = (int) $data['amenity_id'];

        $pivot = [
            'availability_status' => array_key_exists('availability_status', $data)
                ? $this->toBool($data['availability_status'])
                : true,
            'notes' => $data['notes'] ?? null,
            'image_url' => $data['image_url'] ?? null,
        ];

        $gymModel->amenities()->syncWithoutDetaching([
            $amenityId => $pivot,
        ]);

        $fresh = Gym::with(['equipments', 'amenities'])->findOrFail($gymModel->gym_id);
        return response()->json(['message' => 'Amenity added.', 'data' => $fresh]);
    }

    public function update(Request $request, $gym, $amenity)
    {
        $gymModel = $this->findOwnedGymOrFail((int) $gym);

        $data = $request->validate([
            'availability_status' => 'nullable',
            'notes' => 'nullable|string|max:500',
            'image_url' => 'nullable|string|max:2048',
        ]);

        $updates = [];
        if (array_key_exists('availability_status', $data)) {
            $updates['availability_status'] = $this->toBool($data['availability_status']);
        }
        if (array_key_exists('notes', $data)) $updates['notes'] = $data['notes'];
        if (array_key_exists('image_url', $data)) $updates['image_url'] = $data['image_url'];

        $gymModel->amenities()->updateExistingPivot((int) $amenity, $updates);

        $fresh = Gym::with(['equipments', 'amenities'])->findOrFail($gymModel->gym_id);
        return response()->json(['message' => 'Amenity updated.', 'data' => $fresh]);
    }

    public function destroy(Request $request, $gym, $amenity)
    {
        $gymModel = $this->findOwnedGymOrFail((int) $gym);

        $gymModel->amenities()->detach((int) $amenity);

        $fresh = Gym::with(['equipments', 'amenities'])->findOrFail($gymModel->gym_id);
        return response()->json(['message' => 'Amenity removed.', 'data' => $fresh]);
    }
}