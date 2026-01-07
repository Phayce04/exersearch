<?php

namespace App\Http\Controllers;

use App\Models\Amenity;
use Illuminate\Http\Request;

class AmenityController extends Controller
{
    // GET /amenities
    public function index()
    {
        return Amenity::all();
    }

    // GET /amenities/{id}
    public function show($id)
    {
        return Amenity::findOrFail($id);
    }
}
