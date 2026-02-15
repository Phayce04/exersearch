<?php

namespace App\Http\Controllers;

use App\Models\WorkoutTemplateDayExercise;
use Illuminate\Http\Request;

class WorkoutTemplateDayExerciseController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'template_day_id' => 'required|integer',
            'slot_type' => 'required|string|max:50',
            'exercise_id' => 'nullable|integer',
            'sets' => 'nullable|integer|min:1|max:20',
            'reps_min' => 'nullable|integer|min:1|max:100',
            'reps_max' => 'nullable|integer|min:1|max:100',
            'rest_seconds' => 'nullable|integer|min:0|max:600',
            'order_index' => 'nullable|integer|min:1|max:200',
        ]);

        $item = WorkoutTemplateDayExercise::create($data);

        return response()->json([
            'message' => 'Template day exercise added.',
            'data' => $item,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $item = WorkoutTemplateDayExercise::findOrFail($id);

        $data = $request->validate([
            'slot_type' => 'sometimes|required|string|max:50',
            'exercise_id' => 'nullable|integer',
            'sets' => 'nullable|integer|min:1|max:20',
            'reps_min' => 'nullable|integer|min:1|max:100',
            'reps_max' => 'nullable|integer|min:1|max:100',
            'rest_seconds' => 'nullable|integer|min:0|max:600',
            'order_index' => 'nullable|integer|min:1|max:200',
        ]);

        $item->update($data);

        return response()->json([
            'message' => 'Template day exercise updated.',
            'data' => $item->fresh(),
        ]);
    }

    public function destroy($id)
    {
        $item = WorkoutTemplateDayExercise::findOrFail($id);
        $item->delete();

        return response()->json([
            'message' => 'Template day exercise deleted.',
        ]);
    }
}
