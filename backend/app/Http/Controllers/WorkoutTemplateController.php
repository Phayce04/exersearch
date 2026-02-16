<?php

namespace App\Http\Controllers;

use App\Models\WorkoutTemplate;
use Illuminate\Http\Request;

class WorkoutTemplateController extends Controller
{
    public function index(Request $request)
    {
        $goal  = $request->query('goal');
        $level = $request->query('level');
        $days  = $request->query('days_per_week');
        $split = $request->query('split_type');

        $query = WorkoutTemplate::query();

        if ($goal)  $query->where('goal', $goal);
        if ($level) $query->where('level', $level);
        if ($days !== null && $days !== '') $query->where('days_per_week', (int) $days);
        if ($split) $query->where('split_type', $split);

        // ✅ return paginator directly so useApiList can extractRows(payload.data)
        return $query->orderBy('template_id', 'desc')->paginate(50);
    }

    public function show($id)
    {
        $template = WorkoutTemplate::with(['days.items.exercise'])->findOrFail($id);

        return response()->json([
            'data' => $template,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'goal' => 'required|string|in:lose_fat,build_muscle,endurance,strength',
            'level' => 'required|string|in:beginner,intermediate,advanced',
            'days_per_week' => 'required|integer|min:1|max:7',
            'session_minutes_min' => 'nullable|integer|min:10|max:240',
            'session_minutes_max' => 'nullable|integer|min:10|max:240',
            'split_type' => 'required|string|in:full_body,upper_lower,ppl',
            'duration_weeks' => 'nullable|integer|in:4,8',
            'notes' => 'nullable|string',
        ]);

        // optional: keep min<=max if both provided
        if (!empty($data['session_minutes_min']) && !empty($data['session_minutes_max'])) {
            if ((int)$data['session_minutes_min'] > (int)$data['session_minutes_max']) {
                return response()->json([
                    'message' => 'session_minutes_min must be <= session_minutes_max',
                ], 422);
            }
        }

        $template = WorkoutTemplate::create($data);

        return response()->json([
            'message' => 'Workout template created.',
            'data' => $template,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $template = WorkoutTemplate::findOrFail($id);

        $data = $request->validate([
            'goal' => 'sometimes|required|string|in:lose_fat,build_muscle,endurance,strength',
            'level' => 'sometimes|required|string|in:beginner,intermediate,advanced',
            'days_per_week' => 'sometimes|required|integer|min:1|max:7',
            'session_minutes_min' => 'nullable|integer|min:10|max:240',
            'session_minutes_max' => 'nullable|integer|min:10|max:240',
            'split_type' => 'sometimes|required|string|in:full_body,upper_lower,ppl',
            'duration_weeks' => 'nullable|integer|in:4,8',
            'notes' => 'nullable|string',
        ]);

        $merged = array_merge($template->toArray(), $data);

        if (!empty($merged['session_minutes_min']) && !empty($merged['session_minutes_max'])) {
            if ((int)$merged['session_minutes_min'] > (int)$merged['session_minutes_max']) {
                return response()->json([
                    'message' => 'session_minutes_min must be <= session_minutes_max',
                ], 422);
            }
        }

        $template->update($data);

        return response()->json([
            'message' => 'Workout template updated.',
            'data' => $template->fresh(),
        ]);
    }

    public function destroy($id)
    {
        $template = WorkoutTemplate::findOrFail($id);
        $template->delete();

        return response()->json([
            'message' => 'Workout template deleted.',
        ]);
    }
}
