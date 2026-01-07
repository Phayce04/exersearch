<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GymController;
use App\Http\Controllers\GymEquipmentController;
use App\Http\Controllers\EquipmentController;
use App\Http\Controllers\GymAmenityController;
use App\Http\Controllers\AmenityController;
use App\Http\Controllers\GymOwnerController;
use App\Http\Controllers\Auth\GymOwnerAuthController;
use App\Http\Controllers\GymGoerController;

Route::get('/', function () {
    return view('welcome');
});
Route::apiResource('gyms', GymController::class);
Route::get('gyms/{gym}/equipments', [GymController::class, 'equipments']);
Route::get('gyms/{gym}/equipments/{equipment}', [GymController::class, 'equipmentDetail']);
Route::get('gyms/{gym}/amenities', [GymController::class, 'amenities']);
Route::get('gyms/{gym}/amenities/{amenity}', [GymController::class, 'amenityDetail']);
Route::get('/gym-equipments', [GymEquipmentController::class, 'index']);
Route::get('/equipments', [EquipmentController::class, 'index']);
Route::get('/equipments/{id}', [EquipmentController::class, 'show']);
Route::get('/gym-amenities', [GymAmenityController::class, 'index']);
Route::get('/gym-amenities/{id}', [GymAmenityController::class, 'show']);
Route::get('/amenities', [AmenityController::class, 'index']);
Route::get('/amenities/{id}', [AmenityController::class, 'show']);
Route::get('/owners', [GymOwnerController::class, 'index']);
Route::get('/owners/{owner}', [GymOwnerController::class, 'show']);
Route::get('/owners/{owner}/gyms', [GymOwnerController::class, 'gyms']);
Route::get('/gym-owner/login', function () {
    return view('auth.gym-owner-login');
})->name('login'); 
Route::post('/gym-owner/login', [GymOwnerAuthController::class, 'login']);
Route::middleware('auth:gym_owner')->group(function () {
    Route::get('/owner/dashboard', [GymOwnerController::class, 'dashboard'])
        ->name('owner.dashboard');

    Route::put('/owner/gyms/{gym_id}', [GymController::class, 'update'])
        ->name('gym.update')
        ->middleware('gym.owner'); // optional extra middleware for ownership check
});
  Route::get('/users', [GymGoerController::class, 'index']);
    Route::get('/users/{user}', [GymGoerController::class, 'show']);
