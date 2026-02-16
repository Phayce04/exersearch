<?php

namespace App\Http\Controllers;

use App\Models\WorkoutTemplate;
use App\Models\WorkoutTemplateDay;
use Illuminate\Http\Request;

class WorkoutTemplateDayController extends Controller
{
    public function index(Request $request)
    {
        $templateId = $request->query('template_id');
        $sort = $request->query('sort'); // optional: "weekday" or default

        $query = WorkoutTemplateDay::query();

        if ($templateId !== null && $templateId !== '') {
            $query->where('template_id', (int) $templateId);
        }

        // default ordering: template desc, day_number asc
        if ($sort === 'weekday') {
            $query->orderBy('template_id', 'desc')
                  ->orderByRaw('COALESCE(weekday, 99) asc')
                  ->orderBy('day_number', 'asc');
        } else {
            $query->orderBy('template_id', 'desc')
                  ->orderBy('day_number', 'asc');
        }

        return $query->paginate(100);
    }

    public function show($id)
    {
        $day = WorkoutTemplateDay::with(['items.exercise'])->findOrFail($id);

        return response()->json([
            'data' => $day,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'template_id' => 'required|integer|exists:workout_templates,template_id',
            'day_number' => 'required|integer|min:1|max:7',
            'focus' => 'nullable|string|max:30',

            // new (optional): allow manual schedule
            'weekday' => 'nullable|integer|min:1|max:7',
        ]);

        // prevent duplicate day_number for template
        $existsDayNumber = WorkoutTemplateDay::where('template_id', $data['template_id'])
            ->where('day_number', $data['day_number'])
            ->exists();

        if ($existsDayNumber) {
            return response()->json([
                'message' => 'This day_number already exists for this template.',
            ], 422);
        }

        // If weekday not given, auto-assign from template days_per_week + day_number
        if (empty($data['weekday'])) {
            $template = WorkoutTemplate::findOrFail($data['template_id']);
            $data['weekday'] = $this->weekdayFromDaysPerWeek((int) $template->days_per_week, (int) $data['day_number']);
        }

        // If weekday is set, optionally prevent duplicate weekday per template
        if (!empty($data['weekday'])) {
            $existsWeekday = WorkoutTemplateDay::where('template_id', $data['template_id'])
                ->where('weekday', (int) $data['weekday'])
                ->exists();

            if ($existsWeekday) {
                return response()->json([
                    'message' => 'This weekday is already used for this template.',
                ], 422);
            }

            $data['weekday_name'] = $this->weekdayName((int) $data['weekday']);
        }

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
            'weekday' => 'nullable|integer|min:1|max:7',
        ]);

        // If changing day_number, prevent duplicates for this template
        if (isset($data['day_number'])) {
            $exists = WorkoutTemplateDay::where('template_id', $day->template_id)
                ->where('day_number', (int) $data['day_number'])
                ->where('template_day_id', '!=', $day->template_day_id)
                ->exists();

            if ($exists) {
                return response()->json([
                    'message' => 'This day_number already exists for this template.',
                ], 422);
            }
        }

        // If weekday provided, prevent duplicate weekday for this template
        if (array_key_exists('weekday', $data) && !empty($data['weekday'])) {
            $existsWeekday = WorkoutTemplateDay::where('template_id', $day->template_id)
                ->where('weekday', (int) $data['weekday'])
                ->where('template_day_id', '!=', $day->template_day_id)
                ->exists();

            if ($existsWeekday) {
                return response()->json([
                    'message' => 'This weekday is already used for this template.',
                ], 422);
            }

            $data['weekday_name'] = $this->weekdayName((int) $data['weekday']);
        }

        // If user changes day_number but not weekday, you may want to auto-recompute weekday.
        // We'll do it only when weekday was NOT provided AND day_number changed.
        if (isset($data['day_number']) && !array_key_exists('weekday', $data)) {
            $template = WorkoutTemplate::findOrFail($day->template_id);
            $newWeekday = $this->weekdayFromDaysPerWeek((int) $template->days_per_week, (int) $data['day_number']);

            // avoid collision if another day already has that weekday
            if ($newWeekday !== null) {
                $existsWeekday = WorkoutTemplateDay::where('template_id', $day->template_id)
                    ->where('weekday', (int) $newWeekday)
                    ->where('template_day_id', '!=', $day->template_day_id)
                    ->exists();

                if (!$existsWeekday) {
                    $data['weekday'] = $newWeekday;
                    $data['weekday_name'] = $this->weekdayName((int) $newWeekday);
                }
            }
        }

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

    /* ---------------------------
     * Helpers
     * --------------------------- */

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

    /**
     * Assign realistic training days based on days_per_week.
     * Returns weekday 1..7 or null.
     */
    private function weekdayFromDaysPerWeek(int $daysPerWeek, int $dayNumber): ?int
    {
        // mapping:
        // 2: Mon Thu
        // 3: Mon Wed Fri
        // 4: Mon Tue Thu Fri
        // 5: Mon Tue Wed Thu Fri
        // 6: Mon Tue Wed Thu Fri Sat
        // 7: Mon..Sun
        $maps = [
            2 => [1, 4],
            3 => [1, 3, 5],
            4 => [1, 2, 4, 5],
            5 => [1, 2, 3, 4, 5],
            6 => [1, 2, 3, 4, 5, 6],
            7 => [1, 2, 3, 4, 5, 6, 7],
        ];

        if (!isset($maps[$daysPerWeek])) return null;

        $idx = $dayNumber - 1;
        return $maps[$daysPerWeek][$idx] ?? null;
    }
}
