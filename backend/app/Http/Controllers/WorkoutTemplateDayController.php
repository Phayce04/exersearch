<?php

namespace App\Http\Controllers;

use App\Models\WorkoutTemplateDay;
use Illuminate\Http\Request;

class WorkoutTemplateDayController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'template_id' => 'required|integer',
            'day_number' => 'required|integer|min:1|max:7',
            'focus' => 'nullable|string|max:30',
        ]);

        $day = WorkoutTemplateDay::create($data);

        return response()->json([
            'message' => 'Template day created.',
            'data' => $day,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $day = WorkoutTemplateDay::findOrFail($id);

        $data = $request->validate([
            'day_number' => 'sometimes|required|integer|min:1|max:7',
            'focus' => 'nullable|string|max:30',
        ]);

        $day->update($data);

        return response()->json([
            'message' => 'Template day updated.',
            'data' => $day->fresh(),
        ]);
    }

    public function destroy($id)
    {
        $day = WorkoutTemplateDay::findOrFail($id);
        $day->delete();

        return response()->json([
            'message' => 'Template day deleted.',
        ]);
    }
}
