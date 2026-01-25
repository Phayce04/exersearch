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

Route::prefix('v1')->group(function () {

    // ---------------------------
    // AUTH
    // ---------------------------
    Route::post('/auth/login', [UserAuthController::class, 'login']);
    Route::post('/auth/register', [UserAuthController::class, 'register']);

    // ---------------------------
    // PUBLIC
    // ---------------------------
    Route::get('/gyms', [GymController::class, 'index']);

    // ✅ IMPORTANT: constrain {gym} so /gyms/map won't match this
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

    // ---------------------------
    // AUTHENTICATED
    // ---------------------------
    Route::middleware('auth:sanctum')->group(function () {

        Route::get('/me', MeController::class);

        Route::post('/me/avatar', [ProfilePhotoController::class, 'upload']);
        Route::delete('/me/avatar', [ProfilePhotoController::class, 'remove']);

        Route::post('/media/upload', [MediaUploadController::class, 'upload']);
        Route::delete('/media/delete', [MediaUploadController::class, 'delete']);

        Route::get('/gyms/recommend', [GymRecommendationController::class, 'index']);
        Route::post('/gym-interactions', [GymInteractionController::class, 'store']);

        /**
         * OWNER APPLICATION FLOW (USER)

         */
        Route::post('/owner-applications', [GymOwnerApplicationController::class, 'applyOrUpdate']);
        Route::get('/owner-applications/me', [GymOwnerApplicationController::class, 'myApplication']);

        // ---------------------------
        // SELF PREFERENCES
        // ---------------------------
        Route::get('/user/preferences', [UserPreferenceController::class, 'show']);
        Route::post('/user/preferences', [UserPreferenceController::class, 'storeOrUpdate']);

        Route::get('/user/preferred-equipments', [UserPreferredEquipmentController::class, 'index']);
        Route::post('/user/preferred-equipments', [UserPreferredEquipmentController::class, 'store']);

        Route::get('/user/preferred-amenities', [UserPreferredAmenityController::class, 'index']);
        Route::post('/user/preferred-amenities', [UserPreferredAmenityController::class, 'store']);

        // ---------------------------
        // ADMIN
        // ---------------------------
        Route::middleware('admin')->group(function () {

            // equipments
            Route::post('/equipments', [EquipmentController::class, 'store']);
            Route::match(['put', 'patch'], '/equipments/{id}', [EquipmentController::class, 'update'])->whereNumber('id');
            Route::delete('/equipments/{id}', [EquipmentController::class, 'destroy'])->whereNumber('id');
            Route::post('/equipments/import-csv', [EquipmentImportController::class, 'import']);

            // amenities
            Route::post('/amenities', [AmenityController::class, 'store']);
            Route::match(['put', 'patch'], '/amenities/{id}', [AmenityController::class, 'update'])->whereNumber('id');
            Route::delete('/amenities/{id}', [AmenityController::class, 'destroy'])->whereNumber('id');

            Route::get('/gyms/map', [GymController::class, 'mapGyms']);
            Route::get('/owner-applications/map', [GymOwnerApplicationController::class, 'mapPoints']);

            // gyms CRUD
            Route::post('/gyms', [GymController::class, 'store']);
            Route::match(['put', 'patch'], '/gyms/{gym}', [GymController::class, 'update'])->whereNumber('gym');
            Route::delete('/gyms/{gym}', [GymController::class, 'destroy'])->whereNumber('gym');

            /**
             * OWNER APPLICATION APPROVALS (ADMIN)
             * - list + show applications
             * - approve: user role -> owner AND create gym row in gyms table
             * - reject: mark rejected
             */
            Route::get('/admin/owner-applications', [GymOwnerApplicationController::class, 'index']);
            Route::get('/admin/owner-applications/{id}', [GymOwnerApplicationController::class, 'show'])->whereNumber('id');
            Route::patch('/admin/owner-applications/{id}/approve', [GymOwnerApplicationController::class, 'approve'])->whereNumber('id');
            Route::patch('/admin/owner-applications/{id}/reject', [GymOwnerApplicationController::class, 'reject'])->whereNumber('id');

            // users (admin view)
            Route::get('/admin/users', [AdminUserController::class, 'index']);
            Route::get('/admin/users/{user}', [AdminUserController::class, 'show']);
            Route::get('/admin/users/{user}/preferences', [AdminUserController::class, 'preferences']);
            Route::put('/admin/users/{user}/preferences', [AdminUserController::class, 'updatePreferences']);

            // owners (admin view)
            Route::get('/admin/owners', [AdminOwnerController::class, 'index']);
            Route::get('/admin/owners/{owner}', [AdminOwnerController::class, 'show']);
            Route::get('/admin/owners/{owner}/gyms', [AdminOwnerController::class, 'gyms']);
        });
    });
});
