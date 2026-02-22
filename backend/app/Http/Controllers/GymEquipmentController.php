<?php

namespace App\Http\Controllers;

use App\Models\Gym;
use Illuminate\Http\Request;

class GymEquipmentController extends Controller
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

    public function store(Request $request, $gym)
    {
        $gymModel = $this->findOwnedGymOrFail((int) $gym);

        $data = $request->validate([
            'equipment_id' => 'required|integer|exists:equipments,equipment_id',
            'quantity'     => 'nullable|integer|min:1',
        ]);

        $equipmentId = (int) $data['equipment_id'];
        $qty = (int)($data['quantity'] ?? 1);

        $gymModel->equipments()->syncWithoutDetaching([
            $equipmentId => ['quantity' => $qty],
        ]);

        $fresh = Gym::with(['equipments', 'amenities'])->findOrFail($gymModel->gym_id);
        return response()->json(['message' => 'Equipment added.', 'data' => $fresh]);
    }

    public function update(Request $request, $gym, $equipment)
    {
        $gymModel = $this->findOwnedGymOrFail((int) $gym);

        $data = $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $gymModel->equipments()->updateExistingPivot((int) $equipment, [
            'quantity' => (int) $data['quantity'],
        ]);

        $fresh = Gym::with(['equipments', 'amenities'])->findOrFail($gymModel->gym_id);
        return response()->json(['message' => 'Equipment updated.', 'data' => $fresh]);
    }

    public function destroy(Request $request, $gym, $equipment)
    {
        $gymModel = $this->findOwnedGymOrFail((int) $gym);

        $gymModel->equipments()->detach((int) $equipment);

        $fresh = Gym::with(['equipments', 'amenities'])->findOrFail($gymModel->gym_id);
        return response()->json(['message' => 'Equipment removed.', 'data' => $fresh]);
    }
}