<?php

namespace App\Http\Controllers;

use App\Models\Exercise;
use Illuminate\Http\Request;

class ExerciseController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->query('q');
        $muscle = $request->query('primary_muscle');
        $difficulty = $request->query('difficulty');
        $equipment = $request->query('equipment');

        $query = Exercise::query();

        if ($q) {
            $query->where('name', 'ilike', "%{$q}%");
        }
        if ($muscle) {
            $query->where('primary_muscle', $muscle);
        }
        if ($difficulty) {
            $query->where('difficulty', $difficulty);
        }
        if ($equipment) {
            $query->where('equipment', $equipment);
        }

        return response()->json([
            'data' => $query->orderBy('name')->paginate(20),
        ]);
    }

    public function show($id)
    {
        $exercise = Exercise::findOrFail($id);

        return response()->json([
            'data' => $exercise,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:150',
            'primary_muscle' => 'nullable|string|max:50',
            'secondary_muscles' => 'nullable|array',
            'secondary_muscles.*' => 'string|max:60',
            'equipment' => 'nullable|string|max:50',
            'difficulty' => 'nullable|string|in:beginner,intermediate,advanced',
            'instructions' => 'nullable|array',
            'instructions.*' => 'string|max:300',
            'external_source' => 'nullable|string|max:30',
            'external_id' => 'nullable|string|max:50',
        ]);

        $exercise = Exercise::create($data);

        return response()->json([
            'message' => 'Exercise created.',
            'data' => $exercise,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $exercise = Exercise::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|required|string|max:150',
            'primary_muscle' => 'nullable|string|max:50',
            'secondary_muscles' => 'nullable|array',
            'secondary_muscles.*' => 'string|max:60',
            'equipment' => 'nullable|string|max:50',
            'difficulty' => 'nullable|string|in:beginner,intermediate,advanced',
            'instructions' => 'nullable|array',
            'instructions.*' => 'string|max:300',
            'external_source' => 'nullable|string|max:30',
            'external_id' => 'nullable|string|max:50',
        ]);

        $exercise->update($data);

        return response()->json([
            'message' => 'Exercise updated.',
            'data' => $exercise->fresh(),
        ]);
    }

    public function destroy($id)
    {
        $exercise = Exercise::findOrFail($id);
        $exercise->delete();

        return response()->json([
            'message' => 'Exercise deleted.',
        ]);
    }
}
