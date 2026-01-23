<?php

namespace App\Http\Controllers;

use App\Models\Equipment;
use Illuminate\Http\Request;

class EquipmentController extends Controller
{
    // GET /equipments
    public function index()
    {
        return Equipment::all();
    }

    // GET /equipments/{id}
    public function show($id)
    {
        return Equipment::findOrFail($id);
    }

    // POST /equipments
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',

            'description' => 'nullable|string',

            // ✅ enum-safe (match your Postgres enums)
            'category' => 'nullable|in:Cardio,Strength,Machine,Free Weight,Flexibility,Functional',
            'difficulty' => 'nullable|in:Beginner,Intermediate,Advanced',

            'image_url' => 'nullable|string',
            'target_muscle_group' => 'nullable|string|max:100',
        ]);

        $equipment = Equipment::create($data);

        return response()->json([
            'message' => 'Equipment created.',
            'data' => $equipment,
        ], 201);
    }

    // PATCH/PUT /equipments/{id}
    public function update(Request $request, $id)
    {
        $equipment = Equipment::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'description' => 'sometimes|nullable|string',

            // ✅ enum-safe (match your Postgres enums)
            'category' => 'sometimes|nullable|in:Cardio,Strength,Machine,Free Weight,Flexibility,Functional',
            'difficulty' => 'sometimes|nullable|in:Beginner,Intermediate,Advanced',

            'image_url' => 'sometimes|nullable|string',
            'target_muscle_group' => 'sometimes|nullable|string|max:100',
        ]);

        $equipment->fill($data);
        $equipment->save();

        return response()->json([
            'message' => 'Equipment updated.',
            'data' => $equipment,
        ]);
    }

    // DELETE /equipments/{id}
    public function destroy($id)
    {
        $equipment = Equipment::findOrFail($id);
        $equipment->delete();

        return response()->json([
            'message' => 'Equipment deleted.',
        ]);
    }
}
