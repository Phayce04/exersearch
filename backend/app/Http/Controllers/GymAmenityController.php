<?php

namespace App\Http\Controllers;

use App\Models\GymAmenity;
use Illuminate\Http\Request;

class GymAmenityController extends Controller
{
    // GET /gym-amenities
    public function index()
    {
        return GymAmenity::with(['gym', 'amenity'])->get();
    }

    // GET /gym-amenities/{id}
    public function show($id)
    {
        return GymAmenity::with(['gym', 'amenity'])->findOrFail($id);
    }
}
