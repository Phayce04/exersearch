<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GymController;
use App\Http\Controllers\GymOwnerController;
use App\Http\Controllers\GymGoerController;
use App\Http\Controllers\Auth\GymGoerAuthController;
use App\Http\Controllers\UserPreferenceController;
use App\Http\Controllers\UserPreferredEquipmentController;
use App\Http\Controllers\UserPreferredAmenityController;

Route::prefix('v1')->group(function () {

    Route::get('/gyms', [GymController::class, 'index']);
    Route::get('/gyms/{gym}', [GymController::class, 'show']);

    Route::get('/gyms/{gym}/equipments', [GymController::class, 'equipments']);
    Route::get('/gyms/{gym}/equipments/{equipment}', [GymController::class, 'equipmentDetail']);

    Route::get('/gyms/{gym}/amenities', [GymController::class, 'amenities']);
    Route::get('/gyms/{gym}/amenities/{amenity}', [GymController::class, 'amenityDetail']);

    Route::get('/owners', [GymOwnerController::class, 'index']);
    Route::get('/owners/{owner}', [GymOwnerController::class, 'show']);
    Route::get('/owners/{owner}/gyms', [GymOwnerController::class, 'gyms']);
    Route::get('/users', [GymGoerController::class, 'index']);
    Route::get('/users/{user}', [GymGoerController::class, 'show']);
    Route::get('/users/{user}/preferences', [GymGoerController::class, 'preferences']);
        Route::put('/users/{user}/preferences', [GymGoerController::class, 'updatePreferences']);

    Route::post('/auth/login', [GymGoerAuthController::class, 'login']);
    Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user/preferences', [UserPreferenceController::class, 'show']);
    Route::post('/user/preferences', [UserPreferenceController::class, 'storeOrUpdate']);
        Route::get('/user/preferred-equipments', [UserPreferredEquipmentController::class, 'index']);
    Route::post('/user/preferred-equipments', [UserPreferredEquipmentController::class, 'store']);
       Route::get('/user/preferred-amenities', [UserPreferredAmenityController::class, 'index']);
    Route::post('/user/preferred-amenities', [UserPreferredAmenityController::class, 'store']);
    });

    });
