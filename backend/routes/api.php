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
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserPreferenceController;
use App\Http\Controllers\UserPreferredAmenityController;
use App\Http\Controllers\UserPreferredEquipmentController;
use App\Http\Controllers\EquipmentImportController;

use App\Http\Resources\GymOwnerResource;
use App\Models\User;

Route::prefix('v1')->group(function () {

    // Auth
    Route::post('/auth/login', [UserAuthController::class, 'login']);
    Route::post('/auth/register', [UserAuthController::class, 'register']);

    // Public data
    Route::get('/gyms', [GymController::class, 'index']);
    Route::get('/gyms/{gym}', [GymController::class, 'show']);
    Route::get('/gyms/{gym}/equipments', [GymController::class, 'equipments']);
    Route::get('/gyms/{gym}/equipments/{equipment}', [GymController::class, 'equipmentDetail']);
    Route::get('/gyms/{gym}/amenities', [GymController::class, 'amenities']);
    Route::get('/gyms/{gym}/amenities/{amenity}', [GymController::class, 'amenityDetail']);

    Route::get('/equipments', [EquipmentController::class, 'index']);
    Route::get('/equipments/{id}', [EquipmentController::class, 'show']);

    Route::get('/amenities', [AmenityController::class, 'index']);
    Route::get('/amenities/{id}', [AmenityController::class, 'show']);

    Route::get('/gym-equipments', [GymEquipmentController::class, 'index']);
    Route::get('/gym-amenities', [GymAmenityController::class, 'index']);
    Route::get('/gym-amenities/{id}', [GymAmenityController::class, 'show']);

    // Admin
    Route::middleware(['auth:sanctum', 'admin'])->group(function () {

        Route::post('/equipments', [EquipmentController::class, 'store']);
        Route::put('/equipments/{id}', [EquipmentController::class, 'update']);
        Route::patch('/equipments/{id}', [EquipmentController::class, 'update']);
        Route::delete('/equipments/{id}', [EquipmentController::class, 'destroy']);
        Route::post('/equipments/import-csv', [EquipmentImportController::class, 'import']);

        Route::post('/amenities', [AmenityController::class, 'store']);
        Route::put('/amenities/{id}', [AmenityController::class, 'update']);
        Route::patch('/amenities/{id}', [AmenityController::class, 'update']);
        Route::delete('/amenities/{id}', [AmenityController::class, 'destroy']);

        Route::post('/gyms', [GymController::class, 'store']);
        Route::put('/gyms/{gym}', [GymController::class, 'update']);
        Route::patch('/gyms/{gym}', [GymController::class, 'update']);
        Route::delete('/gyms/{gym}', [GymController::class, 'destroy']);
    });

    // Authenticated
    Route::middleware('auth:sanctum')->group(function () {

        Route::get('/gyms/recommend', [GymRecommendationController::class, 'index']);
        Route::post('/gym-interactions', [GymInteractionController::class, 'store']);

        Route::post('/apply-owner', [GymOwnerApplicationController::class, 'apply']);
        Route::post('/approve-owner/{id}', [GymOwnerApplicationController::class, 'approve'])
            ->middleware('admin');

        Route::get('/me', MeController::class);

        Route::post('/me/avatar', [ProfilePhotoController::class, 'upload']);
        Route::delete('/me/avatar', [ProfilePhotoController::class, 'remove']);

        Route::post('/media/upload', [MediaUploadController::class, 'upload']);
        Route::delete('/media/delete', [MediaUploadController::class, 'delete']);

        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{user}', [UserController::class, 'show']);
        Route::get('/users/{user}/preferences', [UserController::class, 'preferences']);
        Route::put('/users/{user}/preferences', [UserController::class, 'updatePreferences']);

        Route::get('/user/preferences', [UserPreferenceController::class, 'show']);
        Route::post('/user/preferences', [UserPreferenceController::class, 'storeOrUpdate']);

        Route::get('/user/preferred-equipments', [UserPreferredEquipmentController::class, 'index']);
        Route::post('/user/preferred-equipments', [UserPreferredEquipmentController::class, 'store']);

        Route::get('/user/preferred-amenities', [UserPreferredAmenityController::class, 'index']);
        Route::post('/user/preferred-amenities', [UserPreferredAmenityController::class, 'store']);

        Route::get('/owners', function () {
            return GymOwnerResource::collection(
                User::where('role', 'owner')->paginate(10)
            );
        });

        Route::get('/owners/{owner}', function ($owner_id) {
            $owner = User::where('role', 'owner')->findOrFail($owner_id);
            return new GymOwnerResource($owner);
        });

        Route::get('/owners/{owner}/gyms', function ($owner_id) {
            $owner = User::where('role', 'owner')->findOrFail($owner_id);
            return \App\Http\Resources\GymResource::collection(
                $owner->gyms()->with(['equipments', 'amenities'])->paginate(10)
            );
        });
    });
});
