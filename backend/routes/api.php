<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Auth\UserAuthController;
use App\Http\Controllers\AmenityController;
use App\Http\Controllers\EquipmentController;
use App\Http\Controllers\GymAmenityController;
use App\Http\Controllers\GymController;
use App\Http\Controllers\GymEquipmentController;
use App\Http\Controllers\GymInteractionController;
use App\Http\Controllers\GymOwnerApplicationController;
use App\Http\Controllers\GymRecommendationController;
use App\Http\Controllers\MediaUploadController;
use App\Http\Controllers\MeController;
use App\Http\Controllers\ProfilePhotoController;
use App\Http\Controllers\UserPreferenceController;
use App\Http\Controllers\UserPreferredAmenityController;
use App\Http\Controllers\UserPreferredEquipmentController;
use App\Http\Controllers\EquipmentImportController;

use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AdminOwnerController;
use App\Http\Controllers\AdminProfileController;
use App\Http\Controllers\AdminAppSettingsController;
use App\Http\Controllers\AppSettingsPublicController;
use App\Http\Controllers\SavedGymController;

use App\Http\Controllers\AdminAdminController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserProfileController;

use App\Http\Controllers\ExerciseController;
use App\Http\Controllers\WorkoutTemplateController;
use App\Http\Controllers\WorkoutTemplateDayController;
use App\Http\Controllers\WorkoutTemplateDayExerciseController;

use App\Http\Controllers\UserWorkoutPlanController;
use App\Http\Controllers\UserWorkoutPlanDayController;
use App\Http\Controllers\UserWorkoutPlanDayExerciseController;

Route::prefix('v1')->group(function () {

    Route::get('/settings/public', [AppSettingsPublicController::class, 'show']);

    Route::post('/auth/login', [UserAuthController::class, 'login']);
    Route::post('/auth/register', [UserAuthController::class, 'register']);

    Route::get('/gyms', [GymController::class, 'index']);
    Route::get('/gyms/{gym}', [GymController::class, 'show'])->whereNumber('gym');
    Route::get('/gyms/{gym}/equipments', [GymController::class, 'equipments'])->whereNumber('gym');
    Route::get('/gyms/{gym}/equipments/{equipment}', [GymController::class, 'equipmentDetail'])->whereNumber('gym');
    Route::get('/gyms/{gym}/amenities', [GymController::class, 'amenities'])->whereNumber('gym');
    Route::get('/gyms/{gym}/amenities/{amenity}', [GymController::class, 'amenityDetail'])->whereNumber('gym');

    Route::get('/equipments', [EquipmentController::class, 'index']);
    Route::get('/equipments/{id}', [EquipmentController::class, 'show'])->whereNumber('id');

    Route::get('/amenities', [AmenityController::class, 'index']);
    Route::get('/amenities/{id}', [AmenityController::class, 'show'])->whereNumber('id');

    Route::get('/gym-equipments', [GymEquipmentController::class, 'index']);
    Route::get('/gym-amenities', [GymAmenityController::class, 'index']);
    Route::get('/gym-amenities/{id}', [GymAmenityController::class, 'show'])->whereNumber('id');

    Route::middleware('auth:sanctum')->group(function () {

        Route::get('/me', MeController::class);

        Route::post('/me/avatar', [ProfilePhotoController::class, 'upload']);
        Route::delete('/me/avatar', [ProfilePhotoController::class, 'remove']);

        Route::post('/media/upload', [MediaUploadController::class, 'upload']);
        Route::delete('/media/delete', [MediaUploadController::class, 'delete']);

        Route::get('/gyms/recommend', [GymRecommendationController::class, 'index']);
        Route::post('/gym-interactions', [GymInteractionController::class, 'store']);

        Route::post('/owner-applications', [GymOwnerApplicationController::class, 'applyOrUpdate']);
        Route::get('/owner-applications/me', [GymOwnerApplicationController::class, 'myApplication']);

        Route::get('/user/preferences', [UserPreferenceController::class, 'show']);
        Route::post('/user/preferences', [UserPreferenceController::class, 'storeOrUpdate']);

        Route::get('/user/preferred-equipments', [UserPreferredEquipmentController::class, 'index']);
        Route::post('/user/preferred-equipments', [UserPreferredEquipmentController::class, 'store']);

        Route::get('/user/preferred-amenities', [UserPreferredAmenityController::class, 'index']);
        Route::post('/user/preferred-amenities', [UserPreferredAmenityController::class, 'store']);

        Route::get('/user/profile', [UserProfileController::class, 'show']);
        Route::put('/user/profile', [UserProfileController::class, 'update']);

        Route::post('/user/onboarding/complete', [UserController::class, 'markOnboarded']);

        Route::get('/user/saved-gyms', [SavedGymController::class, 'index']);
        Route::post('/user/saved-gyms', [SavedGymController::class, 'store']);
        Route::delete('/user/saved-gyms/{gym_id}', [SavedGymController::class, 'destroy'])->whereNumber('gym_id');

        Route::get('/exercises', [ExerciseController::class, 'index']);
        Route::get('/exercises/{id}', [ExerciseController::class, 'show'])->whereNumber('id');

        Route::get('/workout-templates', [WorkoutTemplateController::class, 'index']);
        Route::get('/workout-templates/{id}', [WorkoutTemplateController::class, 'show'])->whereNumber('id');

        Route::post('/user/workout-plans/generate', [UserWorkoutPlanController::class, 'generate']);
        Route::post('/user/workout-plans/{id}/recalibrate-gym', [UserWorkoutPlanController::class, 'recalibrateGym'])
    ->whereNumber('id');

        Route::get('/user/workout-plans', [UserWorkoutPlanController::class, 'index']);
        Route::get('/user/workout-plans/{id}', [UserWorkoutPlanController::class, 'show'])->whereNumber('id');
        Route::post('/user/workout-plans', [UserWorkoutPlanController::class, 'store']);
        Route::match(['put', 'patch'], '/user/workout-plans/{id}', [UserWorkoutPlanController::class, 'update'])->whereNumber('id');
        Route::delete('/user/workout-plans/{id}', [UserWorkoutPlanController::class, 'destroy'])->whereNumber('id');

        // ✅ NEW: Whole-plan (whole week) recalibration endpoint
        // POST /api/v1/user/workout-plans/{id}/recalibrate-gym  { gym_id: number }
        Route::post('/user/workout-plans/{id}/recalibrate-gym', [UserWorkoutPlanController::class, 'recalibrateGym'])
            ->whereNumber('id');

        Route::get('/user/workout-plan-days', [UserWorkoutPlanDayController::class, 'index']);
        Route::get('/user/workout-plan-days/{id}', [UserWorkoutPlanDayController::class, 'show'])->whereNumber('id');
        Route::post('/user/workout-plan-days', [UserWorkoutPlanDayController::class, 'store']);
        Route::match(['put', 'patch'], '/user/workout-plan-days/{id}', [UserWorkoutPlanDayController::class, 'update'])->whereNumber('id');
        Route::delete('/user/workout-plan-days/{id}', [UserWorkoutPlanDayController::class, 'destroy'])->whereNumber('id');

        // ✅ Existing: single-day recalibration endpoint
        Route::post('/user/workout-plan-days/{id}/recalibrate-gym', [UserWorkoutPlanDayController::class, 'recalibrateGym'])
            ->whereNumber('id');

        Route::get('/user/workout-plan-day-exercises', [UserWorkoutPlanDayExerciseController::class, 'index']);
        Route::get('/user/workout-plan-day-exercises/{id}', [UserWorkoutPlanDayExerciseController::class, 'show'])->whereNumber('id');
        Route::post('/user/workout-plan-day-exercises', [UserWorkoutPlanDayExerciseController::class, 'store']);
        Route::match(['put', 'patch'], '/user/workout-plan-day-exercises/{id}', [UserWorkoutPlanDayExerciseController::class, 'update'])->whereNumber('id');
        Route::delete('/user/workout-plan-day-exercises/{id}', [UserWorkoutPlanDayExerciseController::class, 'destroy'])->whereNumber('id');

        Route::middleware('admin')->group(function () {

            Route::get('/admin/settings', [AdminAppSettingsController::class, 'show']);
            Route::put('/admin/settings', [AdminAppSettingsController::class, 'update']);

            Route::get('/admin/profile', [AdminProfileController::class, 'show']);
            Route::put('/admin/profile', [AdminProfileController::class, 'update']);

            Route::get('/admin/admins', [AdminAdminController::class, 'index']);
            Route::get('/admin/admins/{user}', [AdminAdminController::class, 'show']);
            Route::post('/admin/admins', [AdminAdminController::class, 'store']);
            Route::put('/admin/admins/{user}', [AdminAdminController::class, 'update']);
            Route::delete('/admin/admins/{user}', [AdminAdminController::class, 'destroy']);

            Route::post('/equipments', [EquipmentController::class, 'store']);
            Route::match(['put', 'patch'], '/equipments/{id}', [EquipmentController::class, 'update'])->whereNumber('id');
            Route::delete('/equipments/{id}', [EquipmentController::class, 'destroy'])->whereNumber('id');
            Route::post('/equipments/import-csv', [EquipmentImportController::class, 'import']);

            Route::post('/amenities', [AmenityController::class, 'store']);
            Route::match(['put', 'patch'], '/amenities/{id}', [AmenityController::class, 'update'])->whereNumber('id');
            Route::delete('/amenities/{id}', [AmenityController::class, 'destroy'])->whereNumber('id');

            Route::get('/gyms/map', [GymController::class, 'mapGyms']);
            Route::get('/owner-applications/map', [GymOwnerApplicationController::class, 'mapPoints']);

            Route::post('/gyms', [GymController::class, 'store']);
            Route::match(['put', 'patch'], '/gyms/{gym}', [GymController::class, 'update'])->whereNumber('gym');
            Route::delete('/gyms/{gym}', [GymController::class, 'destroy'])->whereNumber('gym');

            Route::get('/admin/owner-applications', [GymOwnerApplicationController::class, 'index']);
            Route::get('/admin/owner-applications/{id}', [GymOwnerApplicationController::class, 'show'])->whereNumber('id');
            Route::patch('/admin/owner-applications/{id}/approve', [GymOwnerApplicationController::class, 'approve'])->whereNumber('id');
            Route::patch('/admin/owner-applications/{id}/reject', [GymOwnerApplicationController::class, 'reject'])->whereNumber('id');

            Route::get('/admin/users', [AdminUserController::class, 'index']);
            Route::get('/admin/users/{user}', [AdminUserController::class, 'show']);
            Route::get('/admin/users/{user}/preferences', [AdminUserController::class, 'preferences']);
            Route::put('/admin/users/{user}/preferences', [AdminUserController::class, 'updatePreferences']);

            Route::get('/admin/owners', [AdminOwnerController::class, 'index']);
            Route::get('/admin/owners/{owner}', [AdminOwnerController::class, 'show']);
            Route::get('/admin/owners/{owner}/gyms', [AdminOwnerController::class, 'gyms']);

            Route::post('/exercises', [ExerciseController::class, 'store']);
            Route::match(['put', 'patch'], '/exercises/{id}', [ExerciseController::class, 'update'])->whereNumber('id');
            Route::delete('/exercises/{id}', [ExerciseController::class, 'destroy'])->whereNumber('id');

            Route::post('/workout-templates', [WorkoutTemplateController::class, 'store']);
            Route::match(['put', 'patch'], '/workout-templates/{id}', [WorkoutTemplateController::class, 'update'])->whereNumber('id');
            Route::delete('/workout-templates/{id}', [WorkoutTemplateController::class, 'destroy'])->whereNumber('id');

            Route::get('/workout-template-days', [WorkoutTemplateDayController::class, 'index']);
            Route::get('/workout-template-days/{id}', [WorkoutTemplateDayController::class, 'show'])->whereNumber('id');
            Route::post('/workout-template-days', [WorkoutTemplateDayController::class, 'store']);
            Route::match(['put', 'patch'], '/workout-template-days/{id}', [WorkoutTemplateDayController::class, 'update'])->whereNumber('id');
            Route::delete('/workout-template-days/{id}', [WorkoutTemplateDayController::class, 'destroy'])->whereNumber('id');

            Route::get('/workout-template-day-exercises', [WorkoutTemplateDayExerciseController::class, 'index']);
            Route::get('/workout-template-day-exercises/{id}', [WorkoutTemplateDayExerciseController::class, 'show'])->whereNumber('id');
            Route::post('/workout-template-day-exercises', [WorkoutTemplateDayExerciseController::class, 'store']);
            Route::match(['put', 'patch'], '/workout-template-day-exercises/{id}', [WorkoutTemplateDayExerciseController::class, 'update'])->whereNumber('id');
            Route::delete('/workout-template-day-exercises/{id}', [WorkoutTemplateDayExerciseController::class, 'destroy'])->whereNumber('id');
        });
    });
});
