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

use App\Http\Resources\GymOwnerResource;
use App\Models\User;

Route::prefix('v1')->group(function () {

    /* ---------------------------
     | AUTH (public)
     * --------------------------- */
    Route::post('/auth/login', [UserAuthController::class, 'login']);
    Route::post('/auth/register', [UserAuthController::class, 'register']);

    /* ---------------------------
     | PUBLIC DATA
     * --------------------------- */
    // Gyms + nested resources
    Route::get('/gyms', [GymController::class, 'index']);
    Route::get('/gyms/{gym}', [GymController::class, 'show']);
    Route::get('/gyms/{gym}/equipments', [GymController::class, 'equipments']);
    Route::get('/gyms/{gym}/equipments/{equipment}', [GymController::class, 'equipmentDetail']);
    Route::get('/gyms/{gym}/amenities', [GymController::class, 'amenities']);
    Route::get('/gyms/{gym}/amenities/{amenity}', [GymController::class, 'amenityDetail']);

    // Master lists
    Route::get('/equipments', [EquipmentController::class, 'index']);
    Route::get('/equipments/{id}', [EquipmentController::class, 'show']);

    Route::get('/amenities', [AmenityController::class, 'index']);
    Route::get('/amenities/{id}', [AmenityController::class, 'show']);
    Route::get('/equipments', [EquipmentController::class, 'index']);
    Route::get('/equipments/{id}', [EquipmentController::class, 'show']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::put('/equipments/{id}', [EquipmentController::class, 'update']);
        Route::patch('/equipments/{id}', [EquipmentController::class, 'update']);
    });
    // Pivot/listing endpoints
    Route::get('/gym-equipments', [GymEquipmentController::class, 'index']);
    Route::get('/gym-amenities', [GymAmenityController::class, 'index']);
    Route::get('/gym-amenities/{id}', [GymAmenityController::class, 'show']);

    /* ---------------------------
     | AUTHENTICATED
     * --------------------------- */
    Route::middleware('auth:sanctum')->group(function () {

        // Recommendation + interactions
        Route::get('/gyms/recommend', [GymRecommendationController::class, 'index']);
        Route::post('/gym-interactions', [GymInteractionController::class, 'store']);

        // Owner application + approval
        Route::post('/apply-owner', [GymOwnerApplicationController::class, 'apply']);
        Route::post('/approve-owner/{id}', [GymOwnerApplicationController::class, 'approve'])
            ->middleware('admin');

        // Me
        Route::get('/me', MeController::class);

        // Avatar
        Route::post('/me/avatar', [ProfilePhotoController::class, 'upload']);
        Route::delete('/me/avatar', [ProfilePhotoController::class, 'remove']);

        // Media uploads (equipments/amenities/gyms images)
        Route::post('/media/upload', [MediaUploadController::class, 'upload']);
        Route::delete('/media/delete', [MediaUploadController::class, 'delete']);

        // Gym-goers / Users
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{user}', [UserController::class, 'show']);
        Route::get('/users/{user}/preferences', [UserController::class, 'preferences']);
        Route::put('/users/{user}/preferences', [UserController::class, 'updatePreferences']);

        // Logged-in user preferences
        Route::get('/user/preferences', [UserPreferenceController::class, 'show']);
        Route::post('/user/preferences', [UserPreferenceController::class, 'storeOrUpdate']);

        // Preferred equipments
        Route::get('/user/preferred-equipments', [UserPreferredEquipmentController::class, 'index']);
        Route::post('/user/preferred-equipments', [UserPreferredEquipmentController::class, 'store']);

        // Preferred amenities
        Route::get('/user/preferred-amenities', [UserPreferredAmenityController::class, 'index']);
        Route::post('/user/preferred-amenities', [UserPreferredAmenityController::class, 'store']);

        // Owners
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
