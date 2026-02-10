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
use App\Http\Controllers\UserProfileController;

use App\Http\Controllers\AdminAdminController;

Route::prefix('v1')->group(function () {

    // AUTH
    Route::post('/auth/login', [UserAuthController::class, 'login']);
    Route::post('/auth/register', [UserAuthController::class, 'register']);

    // PUBLIC
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

    // AUTHENTICATED
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

        // ADMIN (protected by your 'admin' middleware)
        Route::middleware('admin')->group(function () {

            // admin profile (edit profile page)
            Route::get('/admin/profile', [AdminProfileController::class, 'show']);
            Route::put('/admin/profile', [AdminProfileController::class, 'update']);

            /* ✅ ADD THIS BLOCK: ADMIN MANAGEMENT (admins/superadmins) */
            Route::get('/admin/admins', [AdminAdminController::class, 'index']);
            Route::get('/admin/admins/{user}', [AdminAdminController::class, 'show']);
            Route::post('/admin/admins', [AdminAdminController::class, 'store']);
            Route::put('/admin/admins/{user}', [AdminAdminController::class, 'update']);
            Route::delete('/admin/admins/{user}', [AdminAdminController::class, 'destroy']);

            // equipments
            Route::post('/equipments', [EquipmentController::class, 'store']);
            Route::match(['put', 'patch'], '/equipments/{id}', [EquipmentController::class, 'update'])->whereNumber('id');
            Route::delete('/equipments/{id}', [EquipmentController::class, 'destroy'])->whereNumber('id');
            Route::post('/equipments/import-csv', [EquipmentImportController::class, 'import']);

            // amenities
            Route::post('/amenities', [AmenityController::class, 'store']);
            Route::match(['put', 'patch'], '/amenities/{id}', [AmenityController::class, 'update'])->whereNumber('id');
            Route::delete('/amenities/{id}', [AmenityController::class, 'destroy'])->whereNumber('id');

            // maps
            Route::get('/gyms/map', [GymController::class, 'mapGyms']);
            Route::get('/owner-applications/map', [GymOwnerApplicationController::class, 'mapPoints']);

            // gyms CRUD
            Route::post('/gyms', [GymController::class, 'store']);
            Route::match(['put', 'patch'], '/gyms/{gym}', [GymController::class, 'update'])->whereNumber('gym');
            Route::delete('/gyms/{gym}', [GymController::class, 'destroy'])->whereNumber('gym');

            // owner application approvals
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
