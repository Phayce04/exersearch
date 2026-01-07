<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class UserPreferredEquipmentController extends Controller
{
    public function index(Request $request)
    {
        return response()->json([
            'data' => $request->user()->preferredEquipments
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'equipment_ids' => 'required|array',
            'equipment_ids.*' => 'exists:equipments,equipment_id',
        ]);

        $request->user()->preferredEquipments()->sync($validated['equipment_ids']);

        return response()->json([
            'message' => 'Preferred equipments updated successfully',
            'data' => $request->user()->preferredEquipments
        ]);
    }
}
