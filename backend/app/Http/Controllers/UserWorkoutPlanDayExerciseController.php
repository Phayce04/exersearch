<?php

namespace App\Http\Controllers;

use App\Models\UserWorkoutPlanDay;
use App\Models\UserWorkoutPlanDayExercise;
use Illuminate\Http\Request;

class UserWorkoutPlanDayExerciseController extends Controller
{
    public function index(Request $request)
    {
        $userId = (int) $request->user()->user_id;
        $planDayId = $request->query('user_plan_day_id');

        $query = UserWorkoutPlanDayExercise::query()
            ->with(['exercise', 'originalExercise'])
            ->whereHas('planDay.plan', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            });

        if ($planDayId !== null && $planDayId !== '') {
            $query->where('user_plan_day_id', (int) $planDayId);
        }

        return $query
            ->orderBy('user_plan_day_id', 'desc')
            ->orderBy('order_index', 'asc')
            ->paginate(200);
    }

    public function show(Request $request, $id)
    {
        $userId = (int) $request->user()->user_id;

        $item = UserWorkoutPlanDayExercise::with([
                'exercise',
                'originalExercise',
                'planDay'
            ])
            ->whereHas('planDay.plan', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            })
            ->where('user_plan_exercise_id', (int) $id)
            ->firstOrFail();

        return response()->json([
            'data' => $item,
        ]);
    }

    public function store(Request $request)
    {
        $userId = (int) $request->user()->user_id;

        $data = $request->validate([
            'user_plan_day_id' => 'required|integer|exists:user_workout_plan_days,user_plan_day_id',
            'template_day_exercise_id' => 'nullable|integer|exists:workout_template_day_exercises,tde_id',
            'slot_type' => 'required|string|max:50',
            'exercise_id' => 'nullable|integer|exists:exercises,exercise_id',
            'sets' => 'nullable|integer|min:1|max:20',
            'reps_min' => 'nullable|integer|min:1|max:100',
            'reps_max' => 'nullable|integer|min:1|max:100',
            'rest_seconds' => 'nullable|integer|min:0|max:600',
            'order_index' => 'nullable|integer|min:1|max:200',
            'is_modified' => 'nullable|boolean',
            'original_exercise_id' => 'nullable|integer|exists:exercises,exercise_id',
        ]);

        // Ensure day belongs to this user
        UserWorkoutPlanDay::where('user_plan_day_id', (int) $data['user_plan_day_id'])
            ->whereHas('plan', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            })
            ->firstOrFail();

        // reps validation
        if (!empty($data['reps_min']) && !empty($data['reps_max'])) {
            if ((int)$data['reps_min'] > (int)$data['reps_max']) {
                return response()->json([
                    'message' => 'reps_min must be <= reps_max'
                ], 422);
            }
        }

        // Auto order_index
        if (empty($data['order_index'])) {
            $max = UserWorkoutPlanDayExercise::where(
                'user_plan_day_id',
                (int)$data['user_plan_day_id']
            )->max('order_index');

            $data['order_index'] = ($max ? (int)$max : 0) + 1;
        }

        $item = UserWorkoutPlanDayExercise::create($data);

        return response()->json([
            'message' => 'User plan exercise added.',
            'data' => $item,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $userId = (int) $request->user()->user_id;

        $item = UserWorkoutPlanDayExercise::where('user_plan_exercise_id', (int)$id)
            ->whereHas('planDay.plan', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            })
            ->firstOrFail();

        $data = $request->validate([
            'slot_type' => 'sometimes|required|string|max:50',
            'exercise_id' => 'nullable|integer|exists:exercises,exercise_id',
            'sets' => 'nullable|integer|min:1|max:20',
            'reps_min' => 'nullable|integer|min:1|max:100',
            'reps_max' => 'nullable|integer|min:1|max:100',
            'rest_seconds' => 'nullable|integer|min:0|max:600',
            'order_index' => 'nullable|integer|min:1|max:200',
            'is_modified' => 'nullable|boolean',
            'original_exercise_id' => 'nullable|integer|exists:exercises,exercise_id',
        ]);

        $merged = array_merge($item->toArray(), $data);

        if (!empty($merged['reps_min']) && !empty($merged['reps_max'])) {
            if ((int)$merged['reps_min'] > (int)$merged['reps_max']) {
                return response()->json([
                    'message' => 'reps_min must be <= reps_max'
                ], 422);
            }
        }

        $item->update($data);

        return response()->json([
            'message' => 'User plan exercise updated.',
            'data' => $item->fresh(),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $userId = (int) $request->user()->user_id;

        $item = UserWorkoutPlanDayExercise::where('user_plan_exercise_id', (int)$id)
            ->whereHas('planDay.plan', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            })
            ->firstOrFail();

        $item->delete();

        return response()->json([
            'message' => 'User plan exercise deleted.',
        ]);
    }
}
