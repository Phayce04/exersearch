<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GymController;
use App\Http\Controllers\Auth\UserAuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserPreferenceController;
use App\Http\Controllers\UserPreferredEquipmentController;
use App\Http\Controllers\UserPreferredAmenityController;
use App\Http\Controllers\GymOwnerApplicationController;

use App\Http\Resources\GymOwnerResource;
use App\Models\User;

Route::prefix('v1')->group(function () {

    // ---------------------------
    // AUTH
    // ---------------------------
    Route::post('/auth/login', [UserAuthController::class, 'login']);
    Route::post('/auth/register', [UserAuthController::class, 'register']);
    Route::post('/apply-owner', [GymOwnerApplicationController::class, 'apply'])
        ->middleware('auth:sanctum');

    // Approve a gym owner application (admin only)
    Route::post('/approve-owner/{id}', [GymOwnerApplicationController::class, 'approve'])
        ->middleware(['auth:sanctum', 'admin']); 
    // ---------------------------
    // Gyms
    // ---------------------------
    Route::get('/gyms', [GymController::class, 'index']);
    Route::get('/gyms/{gym}', [GymController::class, 'show']);
    Route::get('/gyms/{gym}/equipments', [GymController::class, 'equipments']);
    Route::get('/gyms/{gym}/equipments/{equipment}', [GymController::class, 'equipmentDetail']);
    Route::get('/gyms/{gym}/amenities', [GymController::class, 'amenities']);
    Route::get('/gyms/{gym}/amenities/{amenity}', [GymController::class, 'amenityDetail']);

    // ---------------------------
    // Gym-goers / Users
    // Only role = 'user'
    // ---------------------------
    Route::get('/users', [UserController::class, 'index']);               // List gym-goers
    Route::get('/users/{user}', [UserController::class, 'show']);        // Single gym-goer
    Route::get('/users/{user}/preferences', [UserController::class, 'preferences']);
    Route::put('/users/{user}/preferences', [UserController::class, 'updatePreferences']);

    // ---------------------------
    // Owners
    // Only role = 'owner'
    // ---------------------------
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

    // ---------------------------
    // Authenticated user routes
    // ---------------------------
    Route::middleware('auth:sanctum')->group(function () {
        // Preferences (for logged-in user)
        Route::get('/user/preferences', [UserPreferenceController::class, 'show']);
        Route::post('/user/preferences', [UserPreferenceController::class, 'storeOrUpdate']);

        // Preferred Equipments
        Route::get('/user/preferred-equipments', [UserPreferredEquipmentController::class, 'index']);
        Route::post('/user/preferred-equipments', [UserPreferredEquipmentController::class, 'store']);

        // Preferred Amenities
        Route::get('/user/preferred-amenities', [UserPreferredAmenityController::class, 'index']);
        Route::post('/user/preferred-amenities', [UserPreferredAmenityController::class, 'store']);
    });
});
