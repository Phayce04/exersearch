BEGIN;

-- OPTIONAL: wipe existing workout tables (keep if you want a clean seed each time)
TRUNCATE TABLE
  public.workout_template_day_exercises,
  public.workout_template_days,
  public.workout_templates,
  public.exercises
RESTART IDENTITY CASCADE;

-- =========================
-- 1) EXERCISES (~90)
-- =========================

INSERT INTO public.exercises
(name, primary_muscle, secondary_muscles, equipment, difficulty, instructions, external_source, external_id)
VALUES

-- CHEST
('Push-up', 'chest', '["triceps","shoulders","core"]'::jsonb, 'bodyweight', 'beginner',
 '["Hands under shoulders.","Lower chest to floor, press up."]'::jsonb, NULL, NULL),

('Incline Push-up', 'chest', '["triceps","shoulders"]'::jsonb, 'bodyweight', 'beginner',
 '["Hands on elevated surface.","Lower and press up."]'::jsonb, NULL, NULL),

('Decline Push-up', 'chest', '["triceps","shoulders"]'::jsonb, 'bodyweight', 'intermediate',
 '["Feet elevated.","Lower and press up."]'::jsonb, NULL, NULL),

('Dumbbell Bench Press', 'chest', '["triceps","shoulders"]'::jsonb, 'dumbbell', 'intermediate',
 '["Press dumbbells up over chest.","Control on the way down."]'::jsonb, NULL, NULL),

('Barbell Bench Press', 'chest', '["triceps","shoulders"]'::jsonb, 'barbell', 'intermediate',
 '["Unrack and lower to mid-chest.","Press up with control."]'::jsonb, NULL, NULL),

('Incline Dumbbell Press', 'chest', '["shoulders","triceps"]'::jsonb, 'dumbbell', 'intermediate',
 '["Press up on incline bench.","Lower to chest line."]'::jsonb, NULL, NULL),

('Chest Fly (Dumbbell)', 'chest', '["shoulders"]'::jsonb, 'dumbbell', 'beginner',
 '["Arms slightly bent.","Open wide then squeeze chest."]'::jsonb, NULL, NULL),

('Cable Chest Fly', 'chest', '["shoulders"]'::jsonb, 'cable', 'intermediate',
 '["Arms slightly bent.","Bring hands together in front."]'::jsonb, NULL, NULL),

('Machine Chest Press', 'chest', '["triceps","shoulders"]'::jsonb, 'machine', 'beginner',
 '["Seat height set.","Press and return slowly."]'::jsonb, NULL, NULL),

-- BACK
('Pull-up', 'back', '["biceps","forearms"]'::jsonb, 'bodyweight', 'advanced',
 '["Hang with full extension.","Pull chest toward bar."]'::jsonb, NULL, NULL),

('Assisted Pull-up', 'back', '["biceps"]'::jsonb, 'machine', 'beginner',
 '["Set assistance.","Pull down, control up."]'::jsonb, NULL, NULL),

('Lat Pulldown', 'back', '["biceps"]'::jsonb, 'cable', 'beginner',
 '["Pull bar to upper chest.","Control return."]'::jsonb, NULL, NULL),

('Seated Cable Row', 'back', '["biceps"]'::jsonb, 'cable', 'beginner',
 '["Row to stomach.","Squeeze shoulder blades."]'::jsonb, NULL, NULL),

('One-Arm Dumbbell Row', 'back', '["biceps"]'::jsonb, 'dumbbell', 'beginner',
 '["Brace on bench.","Row elbow to hip."]'::jsonb, NULL, NULL),

('Barbell Row', 'back', '["biceps","lower_back"]'::jsonb, 'barbell', 'intermediate',
 '["Hinge at hips.","Row bar to lower ribs."]'::jsonb, NULL, NULL),

('T-Bar Row', 'back', '["biceps"]'::jsonb, 'machine', 'intermediate',
 '["Chest supported if available.","Row handles to chest."]'::jsonb, NULL, NULL),

('Face Pull', 'back', '["rear_delts","traps"]'::jsonb, 'cable', 'beginner',
 '["Pull rope to face.","Elbows high, squeeze."]'::jsonb, NULL, NULL),

('Straight-Arm Pulldown', 'back', '["lats"]'::jsonb, 'cable', 'intermediate',
 '["Arms mostly straight.","Pull to thighs, squeeze lats."]'::jsonb, NULL, NULL),

-- SHOULDERS
('Dumbbell Shoulder Press', 'shoulders', '["triceps"]'::jsonb, 'dumbbell', 'beginner',
 '["Press overhead.","Lower to shoulder level."]'::jsonb, NULL, NULL),

('Barbell Overhead Press', 'shoulders', '["triceps","upper_back"]'::jsonb, 'barbell', 'intermediate',
 '["Brace core.","Press overhead, lockout."]'::jsonb, NULL, NULL),

('Arnold Press', 'shoulders', '["triceps"]'::jsonb, 'dumbbell', 'intermediate',
 '["Rotate as you press.","Control down."]'::jsonb, NULL, NULL),

('Lateral Raise', 'shoulders', '["upper_traps"]'::jsonb, 'dumbbell', 'beginner',
 '["Raise to shoulder height.","Slow down, no swing."]'::jsonb, NULL, NULL),

('Cable Lateral Raise', 'shoulders', '["upper_traps"]'::jsonb, 'cable', 'intermediate',
 '["Raise across body.","Pause at top."]'::jsonb, NULL, NULL),

('Rear Delt Fly', 'shoulders', '["upper_back"]'::jsonb, 'dumbbell', 'beginner',
 '["Hinge forward.","Open arms, squeeze rear delts."]'::jsonb, NULL, NULL),

('Upright Row (Cable)', 'shoulders', '["traps"]'::jsonb, 'cable', 'intermediate',
 '["Pull to upper chest.","Elbows lead."]'::jsonb, NULL, NULL),

-- ARMS (BICEPS)
('Dumbbell Curl', 'biceps', '["forearms"]'::jsonb, 'dumbbell', 'beginner',
 '["Curl without swinging.","Lower slowly."]'::jsonb, NULL, NULL),

('Hammer Curl', 'biceps', '["forearms"]'::jsonb, 'dumbbell', 'beginner',
 '["Neutral grip.","Curl up, control down."]'::jsonb, NULL, NULL),

('Barbell Curl', 'biceps', '["forearms"]'::jsonb, 'barbell', 'intermediate',
 '["Elbows tucked.","Curl to shoulder height."]'::jsonb, NULL, NULL),

('Cable Curl', 'biceps', '["forearms"]'::jsonb, 'cable', 'beginner',
 '["Curl handles up.","Squeeze at top."]'::jsonb, NULL, NULL),

('Preacher Curl (Machine)', 'biceps', '["forearms"]'::jsonb, 'machine', 'beginner',
 '["Upper arms supported.","Curl and control down."]'::jsonb, NULL, NULL),

-- ARMS (TRICEPS)
('Triceps Pushdown', 'triceps', '["forearms"]'::jsonb, 'cable', 'beginner',
 '["Elbows pinned.","Push down, squeeze."]'::jsonb, NULL, NULL),

('Overhead Triceps Extension (Dumbbell)', 'triceps', '["shoulders"]'::jsonb, 'dumbbell', 'beginner',
 '["Elbows up.","Extend overhead and return."]'::jsonb, NULL, NULL),

('Skull Crushers', 'triceps', '["forearms"]'::jsonb, 'barbell', 'intermediate',
 '["Lower to forehead area.","Extend and lockout."]'::jsonb, NULL, NULL),

('Bench Dips', 'triceps', '["chest","shoulders"]'::jsonb, 'bodyweight', 'beginner',
 '["Hands on bench.","Dip down and press up."]'::jsonb, NULL, NULL),

('Triceps Dips (Assisted)', 'triceps', '["chest","shoulders"]'::jsonb, 'machine', 'beginner',
 '["Use assistance.","Lower and press."]'::jsonb, NULL, NULL),

-- LEGS (QUADS/GLUTES/HAMS)
('Bodyweight Squat', 'legs', '["glutes","core"]'::jsonb, 'bodyweight', 'beginner',
 '["Sit hips back and down.","Stand tall, squeeze."]'::jsonb, NULL, NULL),

('Goblet Squat', 'legs', '["glutes","core"]'::jsonb, 'dumbbell', 'beginner',
 '["Hold dumbbell at chest.","Squat down, drive up."]'::jsonb, NULL, NULL),

('Barbell Back Squat', 'legs', '["glutes","core"]'::jsonb, 'barbell', 'intermediate',
 '["Brace and squat.","Drive up through mid-foot."]'::jsonb, NULL, NULL),

('Leg Press', 'legs', '["glutes"]'::jsonb, 'machine', 'beginner',
 '["Lower sled with control.","Press without locking knees hard."]'::jsonb, NULL, NULL),

('Walking Lunges', 'legs', '["glutes","core"]'::jsonb, 'bodyweight', 'beginner',
 '["Step forward and drop knee.","Push through front heel."]'::jsonb, NULL, NULL),

('Dumbbell Lunges', 'legs', '["glutes","core"]'::jsonb, 'dumbbell', 'beginner',
 '["Hold dumbbells at sides.","Lunge and return."]'::jsonb, NULL, NULL),

('Bulgarian Split Squat', 'legs', '["glutes","core"]'::jsonb, 'bodyweight', 'intermediate',
 '["Rear foot elevated.","Lower and drive up."]'::jsonb, NULL, NULL),

('Romanian Deadlift (Dumbbell)', 'hamstrings', '["glutes","lower_back"]'::jsonb, 'dumbbell', 'intermediate',
 '["Hinge hips back.","Feel stretch, stand up."]'::jsonb, NULL, NULL),

('Romanian Deadlift (Barbell)', 'hamstrings', '["glutes","lower_back"]'::jsonb, 'barbell', 'intermediate',
 '["Hinge at hips.","Keep bar close to legs."]'::jsonb, NULL, NULL),

('Deadlift (Conventional)', 'hamstrings', '["glutes","back","core"]'::jsonb, 'barbell', 'advanced',
 '["Set back neutral.","Push floor away, stand tall."]'::jsonb, NULL, NULL),

('Leg Curl (Machine)', 'hamstrings', '["calves"]'::jsonb, 'machine', 'beginner',
 '["Curl pad down/up.","Control both directions."]'::jsonb, NULL, NULL),

('Leg Extension (Machine)', 'quads', '[]'::jsonb, 'machine', 'beginner',
 '["Extend knees.","Pause, lower slowly."]'::jsonb, NULL, NULL),

('Hip Thrust (Barbell)', 'glutes', '["hamstrings","core"]'::jsonb, 'barbell', 'intermediate',
 '["Drive hips up.","Squeeze glutes at top."]'::jsonb, NULL, NULL),

('Glute Bridge', 'glutes', '["hamstrings"]'::jsonb, 'bodyweight', 'beginner',
 '["Drive hips up.","Hold squeeze and lower."]'::jsonb, NULL, NULL),

('Calf Raise (Standing)', 'calves', '[]'::jsonb, 'bodyweight', 'beginner',
 '["Rise onto toes.","Pause, lower slowly."]'::jsonb, NULL, NULL),

('Calf Raise (Machine)', 'calves', '[]'::jsonb, 'machine', 'beginner',
 '["Full range motion.","Pause at top."]'::jsonb, NULL, NULL),

-- CORE
('Plank', 'core', '["shoulders","glutes"]'::jsonb, 'bodyweight', 'beginner',
 '["Elbows under shoulders.","Keep body straight."]'::jsonb, NULL, NULL),

('Side Plank', 'core', '["obliques","glutes"]'::jsonb, 'bodyweight', 'beginner',
 '["Stack feet or stagger.","Lift hips and hold."]'::jsonb, NULL, NULL),

('Dead Bug', 'core', '["hips"]'::jsonb, 'bodyweight', 'beginner',
 '["Lower opposite arm/leg.","Keep lower back down."]'::jsonb, NULL, NULL),

('Hanging Knee Raise', 'core', '["hip_flexors"]'::jsonb, 'bodyweight', 'intermediate',
 '["Raise knees to chest.","Control down."]'::jsonb, NULL, NULL),

('Crunch', 'core', '[]'::jsonb, 'bodyweight', 'beginner',
 '["Curl ribcage toward hips.","Lower slowly."]'::jsonb, NULL, NULL),

('Russian Twist', 'core', '["obliques"]'::jsonb, 'bodyweight', 'beginner',
 '["Rotate torso side to side.","Keep chest tall."]'::jsonb, NULL, NULL),

-- CARDIO / CONDITIONING (stored as exercises too)
('Jump Rope', 'cardio', '["calves","shoulders"]'::jsonb, 'bodyweight', 'beginner',
 '["Small bounces.","Keep elbows close."]'::jsonb, NULL, NULL),

('Treadmill Walk', 'cardio', '[]'::jsonb, 'machine', 'beginner',
 '["Set incline/speed.","Maintain steady pace."]'::jsonb, NULL, NULL),

('Treadmill Run', 'cardio', '[]'::jsonb, 'machine', 'intermediate',
 '["Warm up first.","Run at target pace."]'::jsonb, NULL, NULL),

('Stationary Bike', 'cardio', '[]'::jsonb, 'machine', 'beginner',
 '["Adjust seat height.","Pedal steadily."]'::jsonb, NULL, NULL),

('Rowing Machine', 'cardio', '["back","legs"]'::jsonb, 'machine', 'intermediate',
 '["Legs drive first.","Pull handle to ribs."]'::jsonb, NULL, NULL),

('Burpees', 'cardio', '["legs","chest","core"]'::jsonb, 'bodyweight', 'intermediate',
 '["Squat down to plank.","Jump up, repeat."]'::jsonb, NULL, NULL),

('Mountain Climbers', 'cardio', '["core","shoulders"]'::jsonb, 'bodyweight', 'beginner',
 '["Hands under shoulders.","Drive knees fast."]'::jsonb, NULL, NULL),

('High Knees', 'cardio', '["legs","core"]'::jsonb, 'bodyweight', 'beginner',
 '["Run in place.","Knees up, fast rhythm."]'::jsonb, NULL, NULL),

('Jumping Jacks', 'cardio', '[]'::jsonb, 'bodyweight', 'beginner',
 '["Jump feet out/in.","Arms overhead each rep."]'::jsonb, NULL, NULL),

('Elliptical', 'cardio', '[]'::jsonb, 'machine', 'beginner',
 '["Steady pace.","Keep posture tall."]'::jsonb, NULL, NULL)
;

-- Add more core strength staples to reach a "complete feeling"
INSERT INTO public.exercises
(name, primary_muscle, secondary_muscles, equipment, difficulty, instructions)
VALUES
('Cable Crunch', 'core', '[]'::jsonb, 'cable', 'beginner', '["Kneel and crunch down.","Control back up."]'::jsonb),
('Back Extension', 'lower_back', '["glutes","hamstrings"]'::jsonb, 'bodyweight', 'beginner', '["Hinge at hips.","Extend spine neutral."]'::jsonb),
('Hip Abduction (Machine)', 'glutes', '["hips"]'::jsonb, 'machine', 'beginner', '["Open knees out.","Pause, return."]'::jsonb),
('Hip Adduction (Machine)', 'legs', '["hips"]'::jsonb, 'machine', 'beginner', '["Squeeze knees in.","Control return."]'::jsonb),
('Cable Triceps Extension (Overhead)', 'triceps', '[]'::jsonb, 'cable', 'intermediate', '["Elbows fixed.","Extend overhead."]'::jsonb),
('Incline Dumbbell Curl', 'biceps', '[]'::jsonb, 'dumbbell', 'intermediate', '["Curl without swinging.","Slow eccentric."]'::jsonb),
('Dumbbell RDL to Row', 'back', '["hamstrings","glutes"]'::jsonb, 'dumbbell', 'intermediate', '["Hinge then row.","Control both phases."]'::jsonb),
('Chest-Supported Row (Machine)', 'back', '["biceps"]'::jsonb, 'machine', 'beginner', '["Row handles back.","Squeeze scapula."]'::jsonb),
('Overhead Carry', 'core', '["shoulders","grip"]'::jsonb, 'dumbbell', 'intermediate', '["Hold overhead.","Walk controlled."]'::jsonb),
('Farmer Carry', 'core', '["grip","traps"]'::jsonb, 'dumbbell', 'beginner', '["Stand tall.","Walk with control."]'::jsonb);

-- =========================
-- 2) WORKOUT TEMPLATES
-- =========================

INSERT INTO public.workout_templates
(goal, level, days_per_week, session_minutes_min, session_minutes_max, split_type, duration_weeks, notes)
VALUES
('build_muscle','beginner',3,30,60,'full_body',4,'Beginner full body (3 days).'),
('lose_fat','beginner',3,20,45,'full_body',4,'Beginner fat loss (3 days).'),
('strength','beginner',3,30,60,'full_body',4,'Beginner strength (3 days).'),
('endurance','beginner',3,20,45,'full_body',4,'Beginner endurance (3 days).'),

('build_muscle','intermediate',4,45,75,'upper_lower',4,'Intermediate upper/lower (4 days).'),
('lose_fat','intermediate',4,30,60,'upper_lower',4,'Intermediate fat loss (4 days).'),

('build_muscle','intermediate',6,45,90,'ppl',4,'Intermediate PPL (6 days).'),
('strength','intermediate',4,45,75,'upper_lower',4,'Intermediate strength upper/lower (4 days).')
;

-- =========================
-- 3) TEMPLATE DAYS
-- =========================

-- Helper: create days for templates by selecting template_id via unique keys
-- Build Muscle Beginner 3 days Full Body
INSERT INTO public.workout_template_days (template_id, day_number, focus)
SELECT t.template_id, d.day_number, d.focus
FROM public.workout_templates t
JOIN (VALUES
  (1, 'full_body'),
  (2, 'full_body'),
  (3, 'full_body')
) AS d(day_number, focus) ON true
WHERE t.goal='build_muscle' AND t.level='beginner' AND t.days_per_week=3 AND t.split_type='full_body';

-- Lose Fat Beginner 3 days Full Body
INSERT INTO public.workout_template_days (template_id, day_number, focus)
SELECT t.template_id, d.day_number, d.focus
FROM public.workout_templates t
JOIN (VALUES
  (1, 'full_body'),
  (2, 'full_body'),
  (3, 'full_body')
) AS d(day_number, focus) ON true
WHERE t.goal='lose_fat' AND t.level='beginner' AND t.days_per_week=3 AND t.split_type='full_body';

-- Strength Beginner 3 days Full Body
INSERT INTO public.workout_template_days (template_id, day_number, focus)
SELECT t.template_id, d.day_number, d.focus
FROM public.workout_templates t
JOIN (VALUES
  (1, 'full_body'),
  (2, 'full_body'),
  (3, 'full_body')
) AS d(day_number, focus) ON true
WHERE t.goal='strength' AND t.level='beginner' AND t.days_per_week=3 AND t.split_type='full_body';

-- Endurance Beginner 3 days Full Body
INSERT INTO public.workout_template_days (template_id, day_number, focus)
SELECT t.template_id, d.day_number, d.focus
FROM public.workout_templates t
JOIN (VALUES
  (1, 'full_body'),
  (2, 'full_body'),
  (3, 'full_body')
) AS d(day_number, focus) ON true
WHERE t.goal='endurance' AND t.level='beginner' AND t.days_per_week=3 AND t.split_type='full_body';

-- Intermediate 4 days Upper/Lower (build muscle)
INSERT INTO public.workout_template_days (template_id, day_number, focus)
SELECT t.template_id, d.day_number, d.focus
FROM public.workout_templates t
JOIN (VALUES
  (1, 'upper'),
  (2, 'lower'),
  (3, 'upper'),
  (4, 'lower')
) AS d(day_number, focus) ON true
WHERE t.goal='build_muscle' AND t.level='intermediate' AND t.days_per_week=4 AND t.split_type='upper_lower';

-- Intermediate 4 days Upper/Lower (lose fat)
INSERT INTO public.workout_template_days (template_id, day_number, focus)
SELECT t.template_id, d.day_number, d.focus
FROM public.workout_templates t
JOIN (VALUES
  (1, 'upper'),
  (2, 'lower'),
  (3, 'upper'),
  (4, 'lower')
) AS d(day_number, focus) ON true
WHERE t.goal='lose_fat' AND t.level='intermediate' AND t.days_per_week=4 AND t.split_type='upper_lower';

-- Intermediate 4 days Upper/Lower (strength)
INSERT INTO public.workout_template_days (template_id, day_number, focus)
SELECT t.template_id, d.day_number, d.focus
FROM public.workout_templates t
JOIN (VALUES
  (1, 'upper'),
  (2, 'lower'),
  (3, 'upper'),
  (4, 'lower')
) AS d(day_number, focus) ON true
WHERE t.goal='strength' AND t.level='intermediate' AND t.days_per_week=4 AND t.split_type='upper_lower';

-- Intermediate 6 days PPL (build muscle)
INSERT INTO public.workout_template_days (template_id, day_number, focus)
SELECT t.template_id, d.day_number, d.focus
FROM public.workout_templates t
JOIN (VALUES
  (1, 'push'),
  (2, 'pull'),
  (3, 'legs'),
  (4, 'push'),
  (5, 'pull'),
  (6, 'legs')
) AS d(day_number, focus) ON true
WHERE t.goal='build_muscle' AND t.level='intermediate' AND t.days_per_week=6 AND t.split_type='ppl';

-- =========================
-- 4) TEMPLATE DAY EXERCISES
-- =========================

-- Helper: find template_day_id by template filters + day_number
-- Use slot_type for swapping later.

-- Beginner Build Muscle (3 days full body)
-- Day 1: squat, press, row, core
INSERT INTO public.workout_template_day_exercises
(template_day_id, slot_type, exercise_id, sets, reps_min, reps_max, rest_seconds, order_index)
SELECT d.template_day_id, x.slot_type,
       (SELECT e.exercise_id FROM public.exercises e WHERE e.name = x.exercise_name LIMIT 1),
       x.sets, x.reps_min, x.reps_max, x.rest_seconds, x.order_index
FROM public.workout_template_days d
JOIN public.workout_templates t ON t.template_id = d.template_id
JOIN (VALUES
 ('quad_compound','Goblet Squat',3,8,12,90,1),
 ('chest_compound','Dumbbell Bench Press',3,8,12,90,2),
 ('back_row','Seated Cable Row',3,10,12,75,3),
 ('core_anti_extension','Plank',3,30,60,45,4)
) AS x(slot_type, exercise_name, sets, reps_min, reps_max, rest_seconds, order_index) ON true
WHERE t.goal='build_muscle' AND t.level='beginner' AND t.days_per_week=3 AND t.split_type='full_body'
  AND d.day_number=1;

-- Day 2: hinge, overhead, pulldown, core
INSERT INTO public.workout_template_day_exercises
(template_day_id, slot_type, exercise_id, sets, reps_min, reps_max, rest_seconds, order_index)
SELECT d.template_day_id, x.slot_type,
       (SELECT e.exercise_id FROM public.exercises e WHERE e.name = x.exercise_name LIMIT 1),
       x.sets, x.reps_min, x.reps_max, x.rest_seconds, x.order_index
FROM public.workout_template_days d
JOIN public.workout_templates t ON t.template_id = d.template_id
JOIN (VALUES
 ('hinge','Romanian Deadlift (Dumbbell)',3,8,12,90,1),
 ('shoulder_press','Dumbbell Shoulder Press',3,8,12,75,2),
 ('lat_vertical_pull','Lat Pulldown',3,10,12,75,3),
 ('core_flexion','Crunch',3,12,20,45,4)
) AS x(slot_type, exercise_name, sets, reps_min, reps_max, rest_seconds, order_index) ON true
WHERE t.goal='build_muscle' AND t.level='beginner' AND t.days_per_week=3 AND t.split_type='full_body'
  AND d.day_number=2;

-- Day 3: lunge, chest, row, core
INSERT INTO public.workout_template_day_exercises
(template_day_id, slot_type, exercise_id, sets, reps_min, reps_max, rest_seconds, order_index)
SELECT d.template_day_id, x.slot_type,
       (SELECT e.exercise_id FROM public.exercises e WHERE e.name = x.exercise_name LIMIT 1),
       x.sets, x.reps_min, x.reps_max, x.rest_seconds, x.order_index
FROM public.workout_template_days d
JOIN public.workout_templates t ON t.template_id = d.template_id
JOIN (VALUES
 ('single_leg','Dumbbell Lunges',3,10,12,75,1),
 ('chest_accessory','Chest Fly (Dumbbell)',3,10,15,60,2),
 ('back_row','One-Arm Dumbbell Row',3,10,12,75,3),
 ('core_rotation','Russian Twist',3,12,20,45,4)
) AS x(slot_type, exercise_name, sets, reps_min, reps_max, rest_seconds, order_index) ON true
WHERE t.goal='build_muscle' AND t.level='beginner' AND t.days_per_week=3 AND t.split_type='full_body'
  AND d.day_number=3;

-- Beginner Lose Fat (3 days full body) add cardio finisher
INSERT INTO public.workout_template_day_exercises
(template_day_id, slot_type, exercise_id, sets, reps_min, reps_max, rest_seconds, order_index)
SELECT d.template_day_id, x.slot_type,
       (SELECT e.exercise_id FROM public.exercises e WHERE e.name = x.exercise_name LIMIT 1),
       x.sets, x.reps_min, x.reps_max, x.rest_seconds, x.order_index
FROM public.workout_template_days d
JOIN public.workout_templates t ON t.template_id = d.template_id
JOIN (VALUES
 ('quad_compound','Bodyweight Squat',3,12,20,60,1),
 ('push','Push-up',3,8,15,60,2),
 ('pull','Seated Cable Row',3,10,15,60,3),
 ('core','Plank',3,20,45,45,4),
 ('cardio','Mountain Climbers',3,20,40,30,5)
) AS x(slot_type, exercise_name, sets, reps_min, reps_max, rest_seconds, order_index) ON true
WHERE t.goal='lose_fat' AND t.level='beginner' AND t.days_per_week=3 AND t.split_type='full_body'
  AND d.day_number=1;

INSERT INTO public.workout_template_day_exercises
(template_day_id, slot_type, exercise_id, sets, reps_min, reps_max, rest_seconds, order_index)
SELECT d.template_day_id, x.slot_type,
       (SELECT e.exercise_id FROM public.exercises e WHERE e.name = x.exercise_name LIMIT 1),
       x.sets, x.reps_min, x.reps_max, x.rest_seconds, x.order_index
FROM public.workout_template_days d
JOIN public.workout_templates t ON t.template_id = d.template_id
JOIN (VALUES
 ('hinge','Glute Bridge',3,12,20,60,1),
 ('shoulder','Lateral Raise',3,12,20,45,2),
 ('vertical_pull','Lat Pulldown',3,10,15,60,3),
 ('core','Crunch',3,12,25,45,4),
 ('cardio','Jumping Jacks',3,30,60,30,5)
) AS x(slot_type, exercise_name, sets, reps_min, reps_max, rest_seconds, order_index) ON true
WHERE t.goal='lose_fat' AND t.level='beginner' AND t.days_per_week=3 AND t.split_type='full_body'
  AND d.day_number=2;

INSERT INTO public.workout_template_day_exercises
(template_day_id, slot_type, exercise_id, sets, reps_min, reps_max, rest_seconds, order_index)
SELECT d.template_day_id, x.slot_type,
       (SELECT e.exercise_id FROM public.exercises e WHERE e.name = x.exercise_name LIMIT 1),
       x.sets, x.reps_min, x.reps_max, x.rest_seconds, x.order_index
FROM public.workout_template_days d
JOIN public.workout_templates t ON t.template_id = d.template_id
JOIN (VALUES
 ('single_leg','Walking Lunges',3,12,20,60,1),
 ('push','Incline Push-up',3,10,20,60,2),
 ('row','One-Arm Dumbbell Row',3,10,15,60,3),
 ('core','Dead Bug',3,8,12,45,4),
 ('cardio','High Knees',3,20,40,30,5)
) AS x(slot_type, exercise_name, sets, reps_min, reps_max, rest_seconds, order_index) ON true
WHERE t.goal='lose_fat' AND t.level='beginner' AND t.days_per_week=3 AND t.split_type='full_body'
  AND d.day_number=3;

-- Intermediate Build Muscle Upper/Lower (4 days)
-- Upper Day
INSERT INTO public.workout_template_day_exercises
(template_day_id, slot_type, exercise_id, sets, reps_min, reps_max, rest_seconds, order_index)
SELECT d.template_day_id, x.slot_type,
       (SELECT e.exercise_id FROM public.exercises e WHERE e.name = x.exercise_name LIMIT 1),
       x.sets, x.reps_min, x.reps_max, x.rest_seconds, x.order_index
FROM public.workout_template_days d
JOIN public.workout_templates t ON t.template_id = d.template_id
JOIN (VALUES
 ('chest_compound','Barbell Bench Press',4,6,10,120,1),
 ('back_row','Barbell Row',4,6,10,120,2),
 ('shoulder_press','Dumbbell Shoulder Press',3,8,12,90,3),
 ('triceps','Triceps Pushdown',3,10,15,60,4),
 ('biceps','Dumbbell Curl',3,10,15,60,5)
) AS x(slot_type, exercise_name, sets, reps_min, reps_max, rest_seconds, order_index) ON true
WHERE t.goal='build_muscle' AND t.level='intermediate' AND t.days_per_week=4 AND t.split_type='upper_lower'
  AND d.day_number=1;

-- Lower Day
INSERT INTO public.workout_template_day_exercises
(template_day_id, slot_type, exercise_id, sets, reps_min, reps_max, rest_seconds, order_index)
SELECT d.template_day_id, x.slot_type,
       (SELECT e.exercise_id FROM public.exercises e WHERE e.name = x.exercise_name LIMIT 1),
       x.sets, x.reps_min, x.reps_max, x.rest_seconds, x.order_index
FROM public.workout_template_days d
JOIN public.workout_templates t ON t.template_id = d.template_id
JOIN (VALUES
 ('quad_compound','Barbell Back Squat',4,5,8,150,1),
 ('hinge','Romanian Deadlift (Barbell)',4,6,10,150,2),
 ('quad_iso','Leg Extension (Machine)',3,10,15,60,3),
 ('ham_iso','Leg Curl (Machine)',3,10,15,60,4),
 ('calves','Calf Raise (Machine)',3,12,20,45,5),
 ('core','Cable Crunch',3,10,15,45,6)
) AS x(slot_type, exercise_name, sets, reps_min, reps_max, rest_seconds, order_index) ON true
WHERE t.goal='build_muscle' AND t.level='intermediate' AND t.days_per_week=4 AND t.split_type='upper_lower'
  AND d.day_number=2;

-- Upper Day 2
INSERT INTO public.workout_template_day_exercises
(template_day_id, slot_type, exercise_id, sets, reps_min, reps_max, rest_seconds, order_index)
SELECT d.template_day_id, x.slot_type,
       (SELECT e.exercise_id FROM public.exercises e WHERE e.name = x.exercise_name LIMIT 1),
       x.sets, x.reps_min, x.reps_max, x.rest_seconds, x.order_index
FROM public.workout_template_days d
JOIN public.workout_templates t ON t.template_id = d.template_id
JOIN (VALUES
 ('incline_chest','Incline Dumbbell Press',4,8,12,90,1),
 ('vertical_pull','Lat Pulldown',4,8,12,90,2),
 ('rear_delts','Face Pull',3,12,15,60,3),
 ('triceps_overhead','Overhead Triceps Extension (Dumbbell)',3,10,15,60,4),
 ('biceps_alt','Hammer Curl',3,10,15,60,5)
) AS x(slot_type, exercise_name, sets, reps_min, reps_max, rest_seconds, order_index) ON true
WHERE t.goal='build_muscle' AND t.level='intermediate' AND t.days_per_week=4 AND t.split_type='upper_lower'
  AND d.day_number=3;

-- Lower Day 2
INSERT INTO public.workout_template_day_exercises
(template_day_id, slot_type, exercise_id, sets, reps_min, reps_max, rest_seconds, order_index)
SELECT d.template_day_id, x.slot_type,
       (SELECT e.exercise_id FROM public.exercises e WHERE e.name = x.exercise_name LIMIT 1),
       x.sets, x.reps_min, x.reps_max, x.rest_seconds, x.order_index
FROM public.workout_template_days d
JOIN public.workout_templates t ON t.template_id = d.template_id
JOIN (VALUES
 ('quad_compound','Leg Press',4,10,15,120,1),
 ('single_leg','Bulgarian Split Squat',3,8,12,90,2),
 ('glutes','Hip Thrust (Barbell)',4,8,12,120,3),
 ('calves','Calf Raise (Standing)',3,12,20,45,4),
 ('core','Dead Bug',3,8,12,45,5)
) AS x(slot_type, exercise_name, sets, reps_min, reps_max, rest_seconds, order_index) ON true
WHERE t.goal='build_muscle' AND t.level='intermediate' AND t.days_per_week=4 AND t.split_type='upper_lower'
  AND d.day_number=4;

COMMIT;
