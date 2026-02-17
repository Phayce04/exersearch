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
            $days,
            $sessionMinutes
        ) {
            // =========================================================
            // ✅ NO ARCHIVING:
            // Delete existing ACTIVE plan + children (prevents DB bloat)
            // =========================================================
            $activePlanIds = UserWorkoutPlan::query()
                ->where('user_id', $userId)
                ->where('status', 'active')
                ->pluck('user_plan_id')
                ->toArray();

            if (!empty($activePlanIds)) {
                $activeDayIds = UserWorkoutPlanDay::query()
                    ->whereIn('user_plan_id', $activePlanIds)
                    ->pluck('user_plan_day_id')
                    ->toArray();

                if (!empty($activeDayIds)) {
                    UserWorkoutPlanDayExercise::query()
                        ->whereIn('user_plan_day_id', $activeDayIds)
                        ->delete();

                    UserWorkoutPlanDay::query()
                        ->whereIn('user_plan_day_id', $activeDayIds)
                        ->delete();
                }

                UserWorkoutPlan::query()
                    ->whereIn('user_plan_id', $activePlanIds)
                    ->delete();
            }

            // ✅ create new plan
            $plan = UserWorkoutPlan::create([
                'user_id' => $userId,
                'template_id' => $template->template_id,
                'status' => 'active',
                'start_date' => now()->toDateString(),
                'gym_id' => $gymId ? (int)$gymId : null,
            ]);

            // ✅ compute time scaling policy once per plan
            $timePolicy = $this->computeTimePolicy(
                sessionMinutes: $sessionMinutes,
                templateMin: (int)($template->session_minutes_min ?? 0),
                templateMax: (int)($template->session_minutes_max ?? 0),
                goal: (string)($template->goal ?? ''),
                level: (string)($template->level ?? '')
            );

            // template days
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

            for ($weekday = 1; $weekday <= 7; $weekday++) {
                $tpl = $tplByWeekday[$weekday] ?? null;

                $isWorkoutDay = $tpl !== null || in_array($weekday, $scheduledWorkoutWeekdays, true);
                $isRest = !$isWorkoutDay || $tpl === null;

                $userDay = UserWorkoutPlanDay::create([
                    'user_plan_id' => $plan->user_plan_id,
                    'template_day_id' => $tpl?->template_day_id,
                    'day_number' => $weekday,
                    'weekday' => $weekday,
                    'weekday_name' => $this->weekdayName($weekday),
                    'is_rest' => $isRest,
                    'focus' => $isRest ? 'rest' : ($tpl?->focus ?? null),
                ]);

                if ($isRest || !$tpl) continue;

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

                    // 1) If slot has exercise_id and it's allowed, keep it.
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
                            // 2) Replace via stable TOPSIS
                            $replacement = $this->pickExerciseForSlotTopsis(
                                userId: $userId,
                                slotSeedId: (int)($slot->tde_id ?? 0),
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

                            // fallback: ignore gym equipment constraint
                            if (!$replacement && !empty($availableEquipmentIds)) {
                                $replacement = $this->pickExerciseForSlotTopsis(
                                    userId: $userId,
                                    slotSeedId: (int)($slot->tde_id ?? 0),
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

                    // 3) If still none, pick via stable TOPSIS
                    if (!$finalExerciseId) {
                        $exercise = $this->pickExerciseForSlotTopsis(
                            userId: $userId,
                            slotSeedId: (int)($slot->tde_id ?? 0),
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
                            $exercise = $this->pickExerciseForSlotTopsis(
                                userId: $userId,
                                slotSeedId: (int)($slot->tde_id ?? 0),
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
                        }
                    }

                    // skip if we still couldn't pick
                    if (!$finalExerciseId) continue;

                    // ✅ TIME-AWARE SETS (THIS IS THE KEY CHANGE)
                    $baseSets = (int)($slot->sets ?? 0);
                    $adjustedSets = $this->adjustSetsByTime(
                        baseSets: $baseSets,
                        slotType: (string)($slot->slot_type ?? ''),
                        timePolicy: $timePolicy
                    );

                    // (optional) if baseSets is null/0 in DB, keep it 0 instead of forcing 1
                    // If you want ALWAYS at least 1 set, change the condition inside adjustSetsByTime().
                    UserWorkoutPlanDayExercise::create([
                        'user_plan_day_id' => $userDay->user_plan_day_id,
                        'template_day_exercise_id' => $slot->tde_id,
                        'exercise_id' => $finalExerciseId,
                        'slot_type' => $slot->slot_type,
                        'sets' => $adjustedSets > 0 ? $adjustedSets : ($slot->sets ?? null),
                        'reps_min' => $slot->reps_min,
                        'reps_max' => $slot->reps_max,
                        'rest_seconds' => $slot->rest_seconds,
                        'order_index' => $slot->order_index,
                        'is_modified' => $isModified,
                        'original_exercise_id' => $originalExerciseId,
                    ]);

                    $pickedToday[] = $finalExerciseId;
                }
            }

            // optional gym recalibration pass (also stable)
            if (!empty($availableEquipmentIds)) {
                $this->recalibratePlanForGym(
                    userId: $userId,
                    userPlanId: (int)$plan->user_plan_id,
                    level: $level,
                    workoutPlace: $workoutPlace,
                    preferredStyle: $preferredStyle,
                    injuries: $injuries,
                    preferredEquipmentIds: $preferredEquipmentIds,
                    availableEquipmentIds: $availableEquipmentIds,
                    timePolicy: $timePolicy
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
        int $userId,
        int $userPlanId,
        string $level,
        ?string $workoutPlace,
        ?string $preferredStyle,
        array $injuries,
        array $preferredEquipmentIds,
        array $availableEquipmentIds,
        array $timePolicy
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

            // already supported by gym equipment -> keep
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

            $replacement = $this->pickExerciseForSlotTopsis(
                userId: $userId,
                slotSeedId: (int)($it->template_day_exercise_id ?? 0),
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

            // ✅ keep time-aware sets after replacement too
            $baseSets = (int)($it->sets ?? 0);
            $adjustedSets = $this->adjustSetsByTime(
                baseSets: $baseSets,
                slotType: (string)($slotType ?? ''),
                timePolicy: $timePolicy
            );

            UserWorkoutPlanDayExercise::query()
                ->where('user_plan_exercise_id', (int)$it->user_plan_exercise_id)
                ->update([
                    'exercise_id' => $newId,
                    'is_modified' => true,
                    'original_exercise_id' => $orig,
                    'sets' => $adjustedSets > 0 ? $adjustedSets : $it->sets,
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
            $ex = Exercise::select('exercise_id', 'primary_muscle')
                ->where('exercise_id', $exerciseId)
                ->first();

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

        if ($total === 0) return true; // bodyweight / no equipment requirement

        $count = DB::table('exercise_equipments')
            ->where('exercise_id', $exerciseId)
            ->whereIn('equipment_id', $ids)
            ->count();

        return $count > 0;
    }

    /**
     * ✅ TOPSIS-based picker (STABLE)
     */
    private function pickExerciseForSlotTopsis(
        int $userId,
        int $slotSeedId,
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
        $slotTypeNorm = strtolower(trim((string)$slotType));
        $lvl = strtolower(trim((string)$level));

        $q = Exercise::query()->select(['exercise_id', 'name', 'primary_muscle', 'difficulty']);

        if ($target !== '') {
            $q->whereRaw("LOWER(COALESCE(primary_muscle,'')) = ?", [$target]);
        }

        $nameAllowlist = $this->nameAllowlistForPattern($pattern ?: $slotTypeNorm);
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

        // ✅ deterministic pool
        $candidates = $q->orderBy('exercise_id', 'asc')->limit(80)->get();
        if ($candidates->isEmpty()) return null;

        $candIds = $candidates->pluck('exercise_id')->map(fn($x) => (int)$x)->values()->all();

        $equipRows = DB::table('exercise_equipments')
            ->select('exercise_id', 'equipment_id')
            ->whereIn('exercise_id', $candIds)
            ->get();

        $equipByExercise = [];
        foreach ($equipRows as $r) {
            $eid = (int)$r->exercise_id;
            $eq  = (int)$r->equipment_id;
            if (!isset($equipByExercise[$eid])) $equipByExercise[$eid] = [];
            $equipByExercise[$eid][$eq] = true;
        }

        $availableSet = array_fill_keys(array_map('intval', $availableEquipmentIds), true);
        $preferredSet = array_fill_keys(array_map('intval', $preferredEquipmentIds), true);

        $homeIds = [50, 35, 39];
        $homeSet = array_fill_keys($homeIds, true);
        $isHome = $workoutPlace && strtolower(trim($workoutPlace)) === 'home';

        $weights = [
            'target_match'     => 0.30,
            'pattern_match'    => 0.20,
            'equip_fit'        => 0.20,
            'level_match'      => 0.15,
            'pref_equip_bonus' => 0.10,
            'home_bonus'       => 0.05,
        ];

        $rows = [];
        foreach ($candidates as $ex) {
            $eid  = (int)$ex->exercise_id;
            $pm   = strtolower(trim((string)($ex->primary_muscle ?? '')));
            $diff = strtolower(trim((string)($ex->difficulty ?? '')));

            $hasEquipReq = !empty($equipByExercise[$eid]);
            $equipIds = $hasEquipReq ? array_keys($equipByExercise[$eid]) : [];

            $targetMatch = ($target !== '' && $pm === $target) ? 1.0 : ($target === '' ? 0.5 : 0.0);

            $patternMatch = 0.5;
            if (!empty($nameAllowlist)) {
                $patternMatch = 1.0;
            } else {
                $patternAllow = $this->nameAllowlistForPattern($pattern ?: $slotTypeNorm);
                if (!empty($patternAllow)) {
                    $patternMatch = in_array($ex->name, $patternAllow, true) ? 1.0 : 0.3;
                }
            }

            $equipFit = 1.0;
            if (!empty($availableSet)) {
                if ($hasEquipReq) {
                    $ok = false;
                    foreach ($equipIds as $eqId) {
                        if (isset($availableSet[(int)$eqId])) { $ok = true; break; }
                    }
                    $equipFit = $ok ? 1.0 : 0.0;
                }
            }

            $prefBonus = 0.0;
            if (!empty($preferredSet) && $hasEquipReq) {
                foreach ($equipIds as $eqId) {
                    if (isset($preferredSet[(int)$eqId])) { $prefBonus = 1.0; break; }
                }
            }

            $homeBonus = 0.0;
            if ($isHome && $hasEquipReq) {
                foreach ($equipIds as $eqId) {
                    if (isset($homeSet[(int)$eqId])) { $homeBonus = 1.0; break; }
                }
            }

            $levelMatch = $this->levelMatchScore($diff, $lvl);

            if ($preferredStyle) {
                $style = strtolower(trim($preferredStyle));
                if ($style === 'strength') {
                    $levelMatch = min(1.0, $levelMatch + ($diff === 'advanced' ? 0.10 : 0.0));
                } elseif ($style === 'endurance') {
                    $levelMatch = min(1.0, $levelMatch + ($diff === 'beginner' ? 0.10 : 0.0));
                }
            }

            $rows[] = [
                'exercise' => $ex,
                'v' => [
                    'target_match'     => $targetMatch,
                    'pattern_match'    => $patternMatch,
                    'equip_fit'        => $equipFit,
                    'level_match'      => $levelMatch,
                    'pref_equip_bonus' => $prefBonus,
                    'home_bonus'       => $homeBonus,
                ],
            ];
        }

        $ranked = $this->topsisRank($rows, $weights);
        if (empty($ranked)) return null;

        $topK = array_slice($ranked, 0, 3);

        $seed = $this->stablePickSeed(
            userId: $userId,
            slotSeedId: $slotSeedId,
            target: $target,
            pattern: $pattern,
            slotType: $slotTypeNorm,
            workoutPlace: (string)($workoutPlace ?? ''),
            preferredStyle: (string)($preferredStyle ?? ''),
            injuries: $injuries,
            preferredEquipmentIds: $preferredEquipmentIds,
            availableEquipmentIds: $availableEquipmentIds
        );

        $idx = $seed % max(1, count($topK));
        $picked = $topK[$idx];

        /** @var Exercise $best */
        $best = $picked['exercise'];

        return $best;
    }

    private function stablePickSeed(
        int $userId,
        int $slotSeedId,
        string $target,
        string $pattern,
        string $slotType,
        string $workoutPlace,
        string $preferredStyle,
        array $injuries,
        array $preferredEquipmentIds,
        array $availableEquipmentIds
    ): int {
        $inj = array_values(array_filter(array_map(fn($x) => strtolower(trim((string)$x)), $injuries)));
        sort($inj);

        $prefEq = array_values(array_unique(array_map('intval', $preferredEquipmentIds)));
        sort($prefEq);

        $availEq = array_values(array_unique(array_map('intval', $availableEquipmentIds)));
        sort($availEq);

        $payload = [
            'user' => $userId,
            'slotId' => $slotSeedId,
            'target' => strtolower($target),
            'pattern' => strtolower($pattern),
            'slot' => strtolower($slotType),
            'place' => strtolower($workoutPlace),
            'style' => strtolower($preferredStyle),
            'injuries' => $inj,
            'prefEq' => $prefEq,
            'availEq' => $availEq,
        ];

        return (int) sprintf('%u', crc32(json_encode($payload)));
    }

    // =========================================================
    // ✅ TIME-AWARE HELPERS
    // =========================================================

    /**
     * Produces a deterministic policy from sessionMinutes vs template min/max.
     */
    private function computeTimePolicy(
        int $sessionMinutes,
        int $templateMin,
        int $templateMax,
        string $goal,
        string $level
    ): array {
        $sessionMinutes = max(0, (int)$sessionMinutes);
        $templateMin = max(0, (int)$templateMin);
        $templateMax = max(0, (int)$templateMax);

        // If no session minutes given OR template missing ranges -> neutral
        if ($sessionMinutes <= 0 || $templateMin <= 0 || $templateMax <= 0 || $templateMax < $templateMin) {
            return [
                'scale' => 1.0,
                'aboveMax' => false,
                'belowMin' => false,
                'overBy' => 0,
                'underBy' => 0,
            ];
        }

        $mid = ($templateMin + $templateMax) / 2.0;
        $rawScale = $mid > 0 ? ($sessionMinutes / $mid) : 1.0;

      $scale = max(0.85, min(1.15, $rawScale));

        $aboveMax = $sessionMinutes > $templateMax;
        $belowMin = $sessionMinutes < $templateMin;

        return [
            'scale' => $scale,
            'aboveMax' => $aboveMax,
            'belowMin' => $belowMin,
            'overBy' => $aboveMax ? ($sessionMinutes - $templateMax) : 0,
            'underBy' => $belowMin ? ($templateMin - $sessionMinutes) : 0,
        ];
    }

    /**
     * Adjust sets for a slot using time policy.
     * - If user is ABOVE template max -> add sets (capped)
     * - If BELOW template min -> reduce sets (floored)
     * - Otherwise scale around base sets slightly
     */
    private function adjustSetsByTime(int $baseSets, string $slotType, array $timePolicy): int
    {
        $baseSets = (int)$baseSets;
        if ($baseSets <= 0) return $baseSets;

        $slotTypeNorm = strtolower(trim((string)$slotType));

        // slot caps: compounds can grow more than accessories
        $maxExtra = match ($slotTypeNorm) {
            'compound', 'main', 'primary' => 2,
            default => 1,
        };

        $minSets = 1;

        $scale = (float)($timePolicy['scale'] ?? 1.0);

        // base scaled sets (rounded)
        $scaled = (int) round($baseSets * $scale);

        // If way above max, add extra sets per ~15 minutes (but capped)
        if (!empty($timePolicy['aboveMax'])) {
            $overBy = (int)($timePolicy['overBy'] ?? 0);
            $extra = min($maxExtra, 1 + (int) floor($overBy / 15));
            $scaled = $baseSets + $extra;
        }

        // If way below min, remove sets per ~15 minutes (but floored)
        if (!empty($timePolicy['belowMin'])) {
            $underBy = (int)($timePolicy['underBy'] ?? 0);
            $reduce = 1 + (int) floor($underBy / 15);
            $scaled = max($minSets, $baseSets - $reduce);
        }

        // safety clamp
        $upper = $baseSets + $maxExtra;
        return max($minSets, min($upper, $scaled));
    }

    /**
     * TOPSIS ranking (all criteria are benefit)
     */
    private function topsisRank(array $rows, array $weights): array
    {
        if (empty($rows)) return [];

        $keys = array_keys($weights);

        $denom = array_fill_keys($keys, 0.0);
        foreach ($rows as $r) {
            foreach ($keys as $k) {
                $x = (float)($r['v'][$k] ?? 0.0);
                $denom[$k] += ($x * $x);
            }
        }
        foreach ($keys as $k) {
            $denom[$k] = sqrt($denom[$k]) ?: 1.0;
        }

        $idealBest = array_fill_keys($keys, -INF);
        $idealWorst = array_fill_keys($keys, INF);

        $wn = [];
        foreach ($rows as $i => $r) {
            $vec = [];
            foreach ($keys as $k) {
                $x = (float)($r['v'][$k] ?? 0.0);
                $norm = $x / $denom[$k];
                $w = (float)$weights[$k];
                $val = $norm * $w;

                $vec[$k] = $val;
                if ($val > $idealBest[$k]) $idealBest[$k] = $val;
                if ($val < $idealWorst[$k]) $idealWorst[$k] = $val;
            }
            $wn[$i] = $vec;
        }

        $out = [];
        foreach ($rows as $i => $r) {
            $dPos = 0.0;
            $dNeg = 0.0;

            foreach ($keys as $k) {
                $val = $wn[$i][$k];
                $dPos += pow($val - $idealBest[$k], 2);
                $dNeg += pow($val - $idealWorst[$k], 2);
            }

            $dPos = sqrt($dPos);
            $dNeg = sqrt($dNeg);

            $closeness = ($dPos + $dNeg) > 0 ? ($dNeg / ($dPos + $dNeg)) : 0.0;

            $out[] = [
                'exercise' => $r['exercise'],
                'score' => $closeness,
            ];
        }

        usort($out, fn($a, $b) => $b['score'] <=> $a['score']);
        return $out;
    }

    private function levelMatchScore(string $exerciseDifficulty, string $userLevel): float
    {
        $e = strtolower(trim((string)$exerciseDifficulty));
        $u = strtolower(trim((string)$userLevel));

        $rank = fn($x) => match ($x) {
            'beginner' => 1,
            'intermediate' => 2,
            'advanced' => 3,
            default => 2,
        };

        if ($e === '') return 0.5;

        $re = $rank($e);
        $ru = $rank($u);

        if ($re === $ru) return 1.0;
        if (abs($re - $ru) === 1) return 0.6;
        return 0.2;
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

        $muscleSet = [
            'quads',
            'chest',
            'back',
            'core',
            'hamstrings',
            'shoulders',
            'triceps',
            'biceps',
            'calves',
            'legs',
            'glutes',
            'cardio',
        ];

        foreach ($flat as $inj) {
            if ($inj === '') continue;

            if (in_array($inj, $muscleSet, true)) {
                $blocked[] = $inj;
            }

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

        return array_values(array_unique(array_filter($blocked)));
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
