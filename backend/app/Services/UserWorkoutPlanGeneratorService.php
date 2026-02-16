<?php

namespace App\Services;

use App\Models\UserPreference;
use App\Models\UserWorkoutPlan;
use App\Models\UserWorkoutPlanDay;
use App\Models\UserWorkoutPlanDayExercise;

use App\Models\WorkoutTemplate;
use App\Models\WorkoutTemplateDay;
use App\Models\WorkoutTemplateDayExercise;

use App\Models\Exercise;
use Illuminate\Support\Facades\DB;

class UserWorkoutPlanGeneratorService
{
    public function generate(int $userId, array $overrides = []): UserWorkoutPlan
    {
        $prefs = UserPreference::where('user_id', $userId)->first();
        if (!$prefs) {
            throw new \Exception('User preferences not found.');
        }

        $goal = $overrides['goal'] ?? $prefs->goal;
        $days = (int)($overrides['workout_days'] ?? $prefs->workout_days ?? 0);

        if (!$goal) throw new \Exception('goal is required in user_preferences (or overrides).');
        if ($days < 1 || $days > 7) throw new \Exception('workout_days must be between 1 and 7.');

        $level = $overrides['workout_level']
            ?? $prefs->workout_level
            ?? $this->levelFromActivity($prefs->activity_level);

        $sessionMinutes = (int)($overrides['session_minutes'] ?? $prefs->session_minutes ?? 0);
        $workoutPlace = $overrides['workout_place'] ?? $prefs->workout_place ?? null;
        $preferredStyle = $overrides['preferred_style'] ?? $prefs->preferred_style ?? null;

        $injuries = $overrides['injuries'] ?? $prefs->injuries ?? [];
        if (!is_array($injuries)) $injuries = [];

        $preferredEquipmentIds = $this->getPreferredEquipmentIds($userId);

        $gymId = $overrides['gym_id'] ?? null;
        $availableEquipmentIds = [];
        if (!empty($gymId)) {
            $availableEquipmentIds = $this->getGymEquipmentIds((int)$gymId);
        }

        $splitWanted = $this->determineSplit($days);

        $template = $this->pickBestTemplate(
            goal: $goal,
            level: $level,
            days: $days,
            splitWanted: $splitWanted,
            sessionMinutes: $sessionMinutes
        );

        if (!$template) {
            throw new \Exception("No template found for goal '{$goal}'. Create at least one template for this goal (admin).");
        }

        return DB::transaction(function () use (
            $userId,
            $template,
            $level,
            $workoutPlace,
            $preferredStyle,
            $injuries,
            $preferredEquipmentIds,
            $gymId,
            $availableEquipmentIds,
            $days
        ) {
            UserWorkoutPlan::where('user_id', $userId)
                ->where('status', 'active')
                ->update(['status' => 'archived']);

            $plan = UserWorkoutPlan::create([
                'user_id' => $userId,
                'template_id' => $template->template_id,
                'status' => 'active',
                'start_date' => now()->toDateString(),
                'gym_id' => $gymId ? (int)$gymId : null,
            ]);

            $tplDays = WorkoutTemplateDay::where('template_id', $template->template_id)
                ->orderByRaw('COALESCE(weekday, 99) asc')
                ->orderBy('day_number', 'asc')
                ->get();

            $tplByWeekday = [];
            foreach ($tplDays as $d) {
                if (!empty($d->weekday)) {
                    $tplByWeekday[(int)$d->weekday] = $d;
                }
            }

            $scheduledWorkoutWeekdays = $this->workoutWeekdaysForDaysPerWeek($days);

            $userDaysByWeekday = [];

            for ($weekday = 1; $weekday <= 7; $weekday++) {
                $tpl = $tplByWeekday[$weekday] ?? null;

                $isWorkoutDay = $tpl !== null || in_array($weekday, $scheduledWorkoutWeekdays, true);
                $isRest = !$isWorkoutDay || $tpl === null;

                $payload = [
                    'user_plan_id' => $plan->user_plan_id,
                    'template_day_id' => $tpl?->template_day_id,
                    'day_number' => $weekday,
                    'weekday' => $weekday,
                    'weekday_name' => $this->weekdayName($weekday),
                    'is_rest' => $isRest,
                    'focus' => $isRest ? 'rest' : ($tpl?->focus ?? null),
                ];

                $userDay = UserWorkoutPlanDay::create($payload);
                $userDaysByWeekday[$weekday] = $userDay;

                if ($isRest || !$tpl) {
                    continue;
                }

                $slots = WorkoutTemplateDayExercise::where('template_day_id', $tpl->template_day_id)
                    ->orderBy('order_index', 'asc')
                    ->get();

                $pickedToday = [];

                foreach ($slots as $slot) {
                    $target = $this->normStr($slot->target_muscle ?? '');
                    $pattern = $this->normStr($slot->movement_pattern ?? '');
                    $slotType = $this->normStr($slot->slot_type ?? '');

                    $finalExerciseId = null;
                    $originalExerciseId = null;
                    $isModified = false;

                    if (!empty($slot->exercise_id)) {
                        $candidateId = (int)$slot->exercise_id;

                        if ($this->isExerciseAllowed(
                            exerciseId: $candidateId,
                            injuries: $injuries,
                            pickedToday: $pickedToday,
                            availableEquipmentIds: $availableEquipmentIds
                        )) {
                            $finalExerciseId = $candidateId;
                        } else {
                            $replacement = $this->pickExerciseForSlot(
                                targetMuscle: $target,
                                movementPattern: $pattern,
                                slotType: $slotType,
                                level: $level,
                                workoutPlace: $workoutPlace,
                                preferredStyle: $preferredStyle,
                                injuries: $injuries,
                                preferredEquipmentIds: $preferredEquipmentIds,
                                availableEquipmentIds: $availableEquipmentIds,
                                excludeExerciseIds: $pickedToday
                            );

                            if (!$replacement && !empty($availableEquipmentIds)) {
                                $replacement = $this->pickExerciseForSlot(
                                    targetMuscle: $target,
                                    movementPattern: $pattern,
                                    slotType: $slotType,
                                    level: $level,
                                    workoutPlace: $workoutPlace,
                                    preferredStyle: $preferredStyle,
                                    injuries: $injuries,
                                    preferredEquipmentIds: $preferredEquipmentIds,
                                    availableEquipmentIds: [],
                                    excludeExerciseIds: $pickedToday
                                );
                            }

                            if ($replacement) {
                                $finalExerciseId = (int)$replacement->exercise_id;
                                $originalExerciseId = $candidateId;
                                $isModified = true;
                            }
                        }
                    }

                    if (!$finalExerciseId) {
                        $exercise = $this->pickExerciseForSlot(
                            targetMuscle: $target,
                            movementPattern: $pattern,
                            slotType: $slotType,
                            level: $level,
                            workoutPlace: $workoutPlace,
                            preferredStyle: $preferredStyle,
                            injuries: $injuries,
                            preferredEquipmentIds: $preferredEquipmentIds,
                            availableEquipmentIds: $availableEquipmentIds,
                            excludeExerciseIds: $pickedToday
                        );

                        if (!$exercise && !empty($availableEquipmentIds)) {
                            $exercise = $this->pickExerciseForSlot(
                                targetMuscle: $target,
                                movementPattern: $pattern,
                                slotType: $slotType,
                                level: $level,
                                workoutPlace: $workoutPlace,
                                preferredStyle: $preferredStyle,
                                injuries: $injuries,
                                preferredEquipmentIds: $preferredEquipmentIds,
                                availableEquipmentIds: [],
                                excludeExerciseIds: $pickedToday
                            );
                        }

                        if ($exercise) {
                            $finalExerciseId = (int)$exercise->exercise_id;
                            $originalExerciseId = null;
                            $isModified = false;
                        }
                    }

                    UserWorkoutPlanDayExercise::create([
                        'user_plan_day_id' => $userDay->user_plan_day_id,
                        'template_day_exercise_id' => $slot->tde_id,
                        'exercise_id' => $finalExerciseId,
                        'slot_type' => $slot->slot_type,
                        'sets' => $slot->sets,
                        'reps_min' => $slot->reps_min,
                        'reps_max' => $slot->reps_max,
                        'rest_seconds' => $slot->rest_seconds,
                        'order_index' => $slot->order_index,
                        'is_modified' => $isModified,
                        'original_exercise_id' => $originalExerciseId,
                    ]);

                    if ($finalExerciseId) $pickedToday[] = $finalExerciseId;
                }
            }

            if (!empty($availableEquipmentIds)) {
                $this->recalibratePlanForGym(
                    userPlanId: (int)$plan->user_plan_id,
                    level: $level,
                    workoutPlace: $workoutPlace,
                    preferredStyle: $preferredStyle,
                    injuries: $injuries,
                    preferredEquipmentIds: $preferredEquipmentIds,
                    availableEquipmentIds: $availableEquipmentIds
                );
            }

            return UserWorkoutPlan::with([
                'template',
                'days.templateDay',
                'days.exercises.exercise',
                'days.exercises.originalExercise',
            ])->where('user_plan_id', $plan->user_plan_id)->firstOrFail();
        });
    }

    private function recalibratePlanForGym(
        int $userPlanId,
        string $level,
        ?string $workoutPlace,
        ?string $preferredStyle,
        array $injuries,
        array $preferredEquipmentIds,
        array $availableEquipmentIds
    ): void {
        $items = UserWorkoutPlanDayExercise::query()
            ->with(['planDay.templateDay'])
            ->whereHas('planDay', function ($q) use ($userPlanId) {
                $q->where('user_plan_id', $userPlanId);
            })
            ->orderBy('user_plan_day_id', 'asc')
            ->orderBy('order_index', 'asc')
            ->get();

        $pickedByDay = [];

        foreach ($items as $it) {
            $dayId = (int)($it->user_plan_day_id ?? 0);
            if ($dayId <= 0) continue;

            if (!isset($pickedByDay[$dayId])) $pickedByDay[$dayId] = [];

            $currentId = !empty($it->exercise_id) ? (int)$it->exercise_id : null;
            if (!$currentId) continue;

            $pickedByDay[$dayId][] = $currentId;

            if ($this->isExerciseSupportedByEquipment($currentId, $availableEquipmentIds)) {
                continue;
            }

            $slot = null;
            if (!empty($it->template_day_exercise_id)) {
                $slot = WorkoutTemplateDayExercise::query()
                    ->select('tde_id', 'target_muscle', 'movement_pattern', 'slot_type')
                    ->where('tde_id', (int)$it->template_day_exercise_id)
                    ->first();
            }

            $target = $this->normStr($slot?->target_muscle ?? '');
            $pattern = $this->normStr($slot?->movement_pattern ?? '');
            $slotType = $this->normStr($slot?->slot_type ?? ($it->slot_type ?? ''));

            $exclude = array_values(array_unique(array_merge($pickedByDay[$dayId], [$currentId])));

            $replacement = $this->pickExerciseForSlot(
                targetMuscle: $target,
                movementPattern: $pattern,
                slotType: $slotType,
                level: $level,
                workoutPlace: $workoutPlace,
                preferredStyle: $preferredStyle,
                injuries: $injuries,
                preferredEquipmentIds: $preferredEquipmentIds,
                availableEquipmentIds: $availableEquipmentIds,
                excludeExerciseIds: $exclude
            );

            if (!$replacement) continue;

            $newId = (int)$replacement->exercise_id;
            $orig = !empty($it->original_exercise_id) ? (int)$it->original_exercise_id : $currentId;

            UserWorkoutPlanDayExercise::query()
                ->where('user_plan_exercise_id', (int)$it->user_plan_exercise_id)
                ->update([
                    'exercise_id' => $newId,
                    'is_modified' => true,
                    'original_exercise_id' => $orig,
                ]);

            $pickedByDay[$dayId][] = $newId;
        }
    }

    private function determineSplit(int $days): string
    {
        if ($days <= 3) return 'full_body';
        if ($days <= 4) return 'upper_lower';
        return 'ppl';
    }

    private function levelFromActivity(?string $activityLevel): string
    {
        $x = strtolower(trim((string)$activityLevel));
        return match ($x) {
            'beginner' => 'beginner',
            'advanced' => 'advanced',
            'intermediate' => 'intermediate',
            default => 'intermediate',
        };
    }

    private function pickBestTemplate(string $goal, string $level, int $days, string $splitWanted, int $sessionMinutes = 0): ?WorkoutTemplate
    {
        $q = WorkoutTemplate::query()->where('goal', $goal);

        $userLevelRank = $this->levelRank($level);

        $q->orderByRaw("
            (
                ABS(days_per_week - ?) * 100
                +
                ABS(
                    CASE level
                        WHEN 'beginner' THEN 1
                        WHEN 'intermediate' THEN 2
                        WHEN 'advanced' THEN 3
                        ELSE 2
                    END - ?
                ) * 20
                +
                CASE WHEN split_type = ? THEN 0 ELSE 5 END
                +
                CASE
                    WHEN ? > 0
                     AND session_minutes_min IS NOT NULL
                     AND session_minutes_max IS NOT NULL
                     AND ? BETWEEN session_minutes_min AND session_minutes_max
                    THEN 0
                    ELSE 3
                END
            ) ASC
        ", [
            $days,
            $userLevelRank,
            $splitWanted,
            $sessionMinutes,
            $sessionMinutes,
        ])->orderBy('updated_at', 'desc');

        return $q->first();
    }

    private function levelRank(string $lvl): int
    {
        return match (strtolower(trim($lvl))) {
            'beginner' => 1,
            'intermediate' => 2,
            'advanced' => 3,
            default => 2,
        };
    }

    private function isExerciseAllowed(
        int $exerciseId,
        array $injuries,
        array $pickedToday,
        array $availableEquipmentIds
    ): bool {
        if (in_array($exerciseId, $pickedToday, true)) return false;

        $blocked = $this->blockedMusclesFromInjuries($injuries);
        if (!empty($blocked)) {
            $ex = Exercise::select('exercise_id', 'primary_muscle')->where('exercise_id', $exerciseId)->first();
            if ($ex) {
                $pm = strtolower(trim((string)($ex->primary_muscle ?? '')));
                if ($pm !== '' && in_array($pm, $blocked, true)) return false;
            }
        }

        if (!empty($availableEquipmentIds)) {
            return $this->isExerciseSupportedByEquipment($exerciseId, $availableEquipmentIds);
        }

        return true;
    }

    private function isExerciseSupportedByEquipment(int $exerciseId, array $availableEquipmentIds): bool
    {
        $ids = array_values(array_unique(array_map('intval', $availableEquipmentIds)));

        $total = DB::table('exercise_equipments')
            ->where('exercise_id', $exerciseId)
            ->count();

        if ($total === 0) return true;

        $count = DB::table('exercise_equipments')
            ->where('exercise_id', $exerciseId)
            ->whereIn('equipment_id', $ids)
            ->count();

        return $count > 0;
    }

    private function pickExerciseForSlot(
        string $targetMuscle,
        string $movementPattern,
        string $slotType,
        string $level,
        ?string $workoutPlace,
        ?string $preferredStyle,
        array $injuries,
        array $preferredEquipmentIds,
        array $availableEquipmentIds,
        array $excludeExerciseIds = []
    ): ?Exercise {
        $target = strtolower(trim((string)$targetMuscle));
        $pattern = strtolower(trim((string)$movementPattern));
        $slotType = strtolower(trim((string)$slotType));
        $lvl = strtolower(trim((string)$level));

        $q = Exercise::query();

        if ($target !== '') {
            $q->whereRaw("LOWER(COALESCE(primary_muscle,'')) = ?", [$target]);
        }

        $nameAllowlist = $this->nameAllowlistForPattern($pattern ?: $slotType);
        if (!empty($nameAllowlist)) {
            $q->whereIn('name', $nameAllowlist);
        }

        if (!empty($excludeExerciseIds)) {
            $q->whereNotIn('exercise_id', $excludeExerciseIds);
        }

        $blocked = $this->blockedMusclesFromInjuries($injuries);
        if (!empty($blocked)) {
            $q->whereNotIn(DB::raw("LOWER(COALESCE(primary_muscle,''))"), $blocked);
        }

        if (!empty($availableEquipmentIds)) {
            $ids = array_values(array_unique(array_map('intval', $availableEquipmentIds)));
            $q->where(function ($qq) use ($ids) {
                $qq->whereDoesntHave('equipments')
                    ->orWhereHas('equipments', function ($qq2) use ($ids) {
                        $qq2->whereIn('equipments.equipment_id', $ids);
                    });
            });
        }

        if (in_array($lvl, ['beginner', 'intermediate', 'advanced'], true)) {
            $q->orderByRaw("
                CASE
                    WHEN difficulty = ? THEN 0
                    WHEN difficulty IS NULL THEN 2
                    ELSE 1
                END
            ", [$lvl]);
        }

        if (!empty($preferredEquipmentIds)) {
            $pref = array_values(array_unique(array_map('intval', $preferredEquipmentIds)));

            $q->orderByRaw("
                CASE WHEN EXISTS (
                    SELECT 1
                    FROM exercise_equipments ee2
                    WHERE ee2.exercise_id = exercises.exercise_id
                      AND ee2.equipment_id = ANY (?)
                ) THEN 0 ELSE 1 END
            ", [$pref]);
        }

        if ($workoutPlace && strtolower(trim($workoutPlace)) === 'home') {
            $homeIds = [50, 35, 39];
            $q->orderByRaw("
                CASE WHEN EXISTS (
                    SELECT 1
                    FROM exercise_equipments ee3
                    WHERE ee3.exercise_id = exercises.exercise_id
                      AND ee3.equipment_id = ANY (?)
                ) THEN 0 ELSE 1 END
            ", [$homeIds]);
        }

        if ($preferredStyle) {
            $style = strtolower(trim($preferredStyle));
            if ($style === 'strength') {
                $q->orderByRaw("CASE WHEN difficulty = 'advanced' THEN 0 ELSE 1 END");
            } elseif ($style === 'endurance') {
                $q->orderByRaw("CASE WHEN difficulty = 'beginner' THEN 0 ELSE 1 END");
            }
        }

        $q->inRandomOrder();

        return $q->first();
    }

    private function nameAllowlistForPattern(string $patternOrSlotType): array
    {
        $k = strtolower(trim((string)$patternOrSlotType));

        return match ($k) {
            'squat', 'quad_compound' => [
                'Goblet Squat',
                'Bodyweight Squat',
                'Barbell Back Squat',
                'Leg Press',
            ],
            'hinge' => [
                'Romanian Deadlift (Dumbbell)',
                'Romanian Deadlift (Barbell)',
                'Deadlift (Conventional)',
                'Glute Bridge',
                'Hip Thrust (Barbell)',
            ],
            'horizontal_push', 'chest_compound', 'push' => [
                'Dumbbell Bench Press',
                'Barbell Bench Press',
                'Machine Chest Press',
                'Push-up',
                'Incline Dumbbell Press',
                'Incline Push-up',
                'Decline Push-up',
            ],
            'vertical_push', 'shoulder_press' => [
                'Dumbbell Shoulder Press',
                'Barbell Overhead Press',
                'Arnold Press',
            ],
            'row', 'back_row', 'pull' => [
                'Seated Cable Row',
                'One-Arm Dumbbell Row',
                'Barbell Row',
                'T-Bar Row',
                'Chest-Supported Row (Machine)',
            ],
            'vertical_pull', 'lat_vertical_pull' => [
                'Lat Pulldown',
                'Assisted Pull-up',
                'Pull-up',
            ],
            'biceps', 'arms_biceps' => [
                'Dumbbell Curl',
                'Hammer Curl',
                'Barbell Curl',
                'Cable Curl',
                'Incline Dumbbell Curl',
                'Preacher Curl (Machine)',
            ],
            'triceps', 'arms_triceps' => [
                'Triceps Pushdown',
                'Cable Triceps Extension (Overhead)',
                'Overhead Triceps Extension (Dumbbell)',
                'Skull Crushers',
                'Bench Dips',
                'Triceps Dips (Assisted)',
            ],
            'core', 'core_flexion', 'core_rotation', 'core_anti_extension' => [
                'Plank',
                'Side Plank',
                'Dead Bug',
                'Crunch',
                'Russian Twist',
                'Cable Crunch',
                'Hanging Knee Raise',
            ],
            'conditioning', 'cardio', 'cardio_1', 'cardio_2' => [
                'Mountain Climbers',
                'High Knees',
                'Jumping Jacks',
                'Burpees',
                'Treadmill Walk',
                'Treadmill Run',
                'Stationary Bike',
                'Rowing Machine',
                'Elliptical',
                'Jump Rope',
            ],
            default => [],
        };
    }

    private function blockedMusclesFromInjuries(array $injuries): array
    {
        $blocked = [];
        $flat = array_map(fn($x) => strtolower(trim((string)$x)), $injuries);

        foreach ($flat as $inj) {
            if (str_contains($inj, 'knee')) {
                $blocked[] = 'quads';
                $blocked[] = 'hamstrings';
                $blocked[] = 'legs';
            }
            if (str_contains($inj, 'back') || str_contains($inj, 'lower back')) {
                $blocked[] = 'back';
                $blocked[] = 'lower_back';
                $blocked[] = 'hamstrings';
            }
            if (str_contains($inj, 'shoulder')) {
                $blocked[] = 'shoulders';
                $blocked[] = 'chest';
            }
            if (str_contains($inj, 'elbow')) {
                $blocked[] = 'triceps';
                $blocked[] = 'biceps';
            }
            if (str_contains($inj, 'wrist')) {
                $blocked[] = 'forearms';
            }
        }

        return array_values(array_unique(array_filter(array_map('strtolower', $blocked))));
    }

    private function getPreferredEquipmentIds(int $userId): array
    {
        $rows = DB::table('user_preferred_equipments')
            ->where('user_id', $userId)
            ->pluck('equipment_id')
            ->toArray();

        return array_values(array_filter(array_map('intval', $rows)));
    }

    private function getGymEquipmentIds(int $gymId): array
    {
        $rows = DB::table('gym_equipments')
            ->where('gym_id', $gymId)
            ->where('status', 'active')
            ->pluck('equipment_id')
            ->toArray();

        return array_values(array_filter(array_map('intval', $rows)));
    }

    private function normStr(string $s): string
    {
        return trim((string)$s);
    }

    private function weekdayName(int $weekday): ?string
    {
        return match ($weekday) {
            1 => 'Monday',
            2 => 'Tuesday',
            3 => 'Wednesday',
            4 => 'Thursday',
            5 => 'Friday',
            6 => 'Saturday',
            7 => 'Sunday',
            default => null,
        };
    }

    private function workoutWeekdaysForDaysPerWeek(int $daysPerWeek): array
    {
        $maps = [
            1 => [1],
            2 => [1, 4],
            3 => [1, 3, 5],
            4 => [1, 2, 4, 5],
            5 => [1, 2, 3, 4, 5],
            6 => [1, 2, 3, 4, 5, 6],
            7 => [1, 2, 3, 4, 5, 6, 7],
        ];

        return $maps[$daysPerWeek] ?? [1, 3, 5];
    }
}
