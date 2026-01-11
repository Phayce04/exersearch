<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GymController;
use App\Http\Controllers\GymEquipmentController;
use App\Http\Controllers\EquipmentController;
use App\Http\Controllers\GymAmenityController;
use App\Http\Controllers\AmenityController;


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
