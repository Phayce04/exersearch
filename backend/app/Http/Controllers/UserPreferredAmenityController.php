<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class UserPreferredAmenityController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'data' => $user->preferredAmenities
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'amenity_ids' => 'required|array',
            'amenity_ids.*' => 'exists:amenities,amenity_id',
        ]);

        $user = $request->user();

        // Replace existing selections
        $user->preferredAmenities()->sync($request->amenity_ids);

        return response()->json([
            'message' => 'Preferred amenities updated',
            'data' => $user->preferredAmenities
        ]);
    }
}
