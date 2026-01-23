<?php

namespace App\Http\Controllers;

use App\Models\Amenity;
use Illuminate\Http\Request;

class AmenityController extends Controller
{
    // GET /api/v1/amenities
    public function index()
    {
        return Amenity::all();
    }

    // GET /api/v1/amenities/{id}
    public function show($id)
    {
        return Amenity::findOrFail($id);
    }

    // POST /api/v1/amenities  (admin)
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string|max:2048',
        ]);

        $amenity = Amenity::create($data);

        return response()->json([
            'message' => 'Amenity created successfully.',
            'amenity' => $amenity,
        ], 201);
    }

    // PATCH|PUT /api/v1/amenities/{id} (admin)
    public function update(Request $request, $id)
    {
        $amenity = Amenity::findOrFail($id);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string|max:2048',
        ]);

        $amenity->update($data);

        return response()->json([
            'message' => 'Amenity updated successfully.',
            'amenity' => $amenity,
        ]);
    }

    // DELETE /api/v1/amenities/{id} (admin)
    public function destroy($id)
    {
        $amenity = Amenity::findOrFail($id);
        $amenity->delete();

        return response()->json([
            'message' => 'Amenity deleted successfully.',
        ]);
    }
}
