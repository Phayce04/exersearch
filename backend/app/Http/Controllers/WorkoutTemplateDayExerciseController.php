<?php

namespace App\Http\Controllers;

use App\Models\WorkoutTemplateDayExercise;
use Illuminate\Http\Request;

class WorkoutTemplateDayExerciseController extends Controller
{
    public function index(Request $request)
    {
        $templateDayId = $request->query('template_day_id');

        $query = WorkoutTemplateDayExercise::with('exercise');

        if ($templateDayId !== null && $templateDayId !== '') {
            $query->where('template_day_id', (int) $templateDayId);
        }

        // ✅ Return paginator directly (payload.data = array)
        return $query
            ->orderBy('template_day_id', 'desc')
            ->orderBy('order_index', 'asc')
            ->paginate(200);
    }

    public function show($id)
    {
        $item = WorkoutTemplateDayExercise::with('exercise')->findOrFail($id);

        return response()->json([
            'data' => $item,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'template_day_id' => 'required|integer|exists:workout_template_days,template_day_id',
            'slot_type' => 'required|string|max:50',
            'exercise_id' => 'nullable|integer|exists:exercises,exercise_id',
            'sets' => 'nullable|integer|min:1|max:20',
            'reps_min' => 'nullable|integer|min:1|max:100',
            'reps_max' => 'nullable|integer|min:1|max:100',
            'rest_seconds' => 'nullable|integer|min:0|max:600',
            'order_index' => 'nullable|integer|min:1|max:200',
        ]);

        if (!empty($data['reps_min']) && !empty($data['reps_max'])) {
            if ((int) $data['reps_min'] > (int) $data['reps_max']) {
                return response()->json([
                    'message' => 'reps_min must be <= reps_max',
                ], 422);
            }
        }

        if (empty($data['order_index'])) {
            $max = WorkoutTemplateDayExercise::where('template_day_id', $data['template_day_id'])
                ->max('order_index');
            $data['order_index'] = ($max ? (int) $max : 0) + 1;
        }

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
            'exercise_id' => 'nullable|integer|exists:exercises,exercise_id',
            'sets' => 'nullable|integer|min:1|max:20',
            'reps_min' => 'nullable|integer|min:1|max:100', 
'target_muscle' => 'nullable|string|max:50',
            'reps_max' => 'nullable|integer|min:1|max:100',
            'rest_seconds' => 'nullable|integer|min:0|max:600',
            'order_index' => 'nullable|integer|min:1|max:200',
        ]);

        $merged = array_merge($item->toArray(), $data);

        if (!empty($merged['reps_min']) && !empty($merged['reps_max'])) {
            if ((int) $merged['reps_min'] > (int) $merged['reps_max']) {
                return response()->json([
                    'message' => 'reps_min must be <= reps_max',
                ], 422);
            }
        }

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
