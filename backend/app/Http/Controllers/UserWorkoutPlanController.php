<?php

namespace App\Http\Controllers;

use App\Models\UserWorkoutPlan;
use Illuminate\Http\Request;
use App\Services\UserWorkoutPlanGeneratorService;

class UserWorkoutPlanController extends Controller
{
    public function index(Request $request)
    {
        $userId = (int) $request->user()->user_id;

        $status = $request->query('status');
        $templateId = $request->query('template_id');

        $query = UserWorkoutPlan::query()
            ->where('user_id', $userId)
            ->with(['template']);

        if ($status !== null && $status !== '') {
            $query->where('status', $status);
        }

        if ($templateId !== null && $templateId !== '') {
            $query->where('template_id', (int) $templateId);
        }

        return $query
            ->orderBy('user_plan_id', 'desc')
            ->paginate(50);
    }

    public function show(Request $request, $id)
    {
        $userId = (int) $request->user()->user_id;

        $plan = UserWorkoutPlan::with([
                'template',
                'days.templateDay',
                'days.exercises.exercise',
                'days.exercises.originalExercise',
            ])
            ->where('user_id', $userId)
            ->where('user_plan_id', (int) $id)
            ->firstOrFail();

        return response()->json([
            'data' => $plan,
        ]);
    }

    public function store(Request $request)
    {
        $userId = (int) $request->user()->user_id;

        $data = $request->validate([
            'template_id' => 'required|integer|exists:workout_templates,template_id',
            'start_date' => 'nullable|date',
            'gym_id' => 'nullable|integer',
            'status' => 'nullable|string|max:20',
        ]);

        $data['user_id'] = $userId;

        $plan = UserWorkoutPlan::create($data);

        return response()->json([
            'message' => 'User workout plan created.',
            'data' => $plan,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $userId = (int) $request->user()->user_id;

        $plan = UserWorkoutPlan::where('user_id', $userId)
            ->where('user_plan_id', (int) $id)
            ->firstOrFail();

        $data = $request->validate([
            'start_date' => 'nullable|date',
            'gym_id' => 'nullable|integer',
            'status' => 'nullable|string|max:20',
        ]);

        $plan->update($data);

        return response()->json([
            'message' => 'User workout plan updated.',
            'data' => $plan->fresh(),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $userId = (int) $request->user()->user_id;

        $plan = UserWorkoutPlan::where('user_id', $userId)
            ->where('user_plan_id', (int) $id)
            ->firstOrFail();

        $plan->delete();

        return response()->json([
            'message' => 'User workout plan deleted.',
        ]);
    }

    public function generate(Request $request, UserWorkoutPlanGeneratorService $svc)
    {
        $userId = (int) $request->user()->user_id;

        // Optional overrides; can be empty for MVP (it will use user_preferences).
        $data = $request->validate([
            'goal' => 'nullable|in:lose_fat,build_muscle,endurance,strength',
            'workout_level' => 'nullable|in:beginner,intermediate,advanced',
            'workout_days' => 'nullable|integer|min:1|max:7',
            'session_minutes' => 'nullable|integer|min:10|max:240',
        ]);

        $plan = $svc->generate($userId, $data);

        return response()->json([
            'message' => 'Workout plan generated.',
            'data' => $plan,
        ], 201);
    }


    public function recalibrateGym(Request $request, $id, UserWorkoutPlanGeneratorService $svc)
    {
        $userId = (int) $request->user()->user_id;

        $data = $request->validate([
            'gym_id' => 'required|integer|min:1',
        ]);

        $gymId = (int) $data['gym_id'];
        $planId = (int) $id;

        $plan = $svc->recalibrateWholePlanForGym(
            userId: $userId,
            userPlanId: $planId,
            gymId: $gymId,
            setAsPlanGym: true,
            clearDayOverrides: true
        );

        return response()->json([
            'message' => 'Plan recalibrated for selected gym.',
            'data' => $plan,
            'gym_id' => $gymId,
        ]);
    }
}
