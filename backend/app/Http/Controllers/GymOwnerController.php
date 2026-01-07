<?php

namespace App\Http\Controllers;

use App\Models\GymOwner;
use App\Http\Resources\GymOwnerResource;
use App\Http\Resources\GymResource;

class GymOwnerController extends Controller
{
    // GET /api/owners
    public function index()
    {
        return GymOwnerResource::collection(
            GymOwner::paginate(10)
        );
    }

    public function show($owner_id)
    {
        $owner = GymOwner::findOrFail($owner_id);
        return new GymOwnerResource($owner);
    }

    public function gyms($owner_id)
    {
        $owner = GymOwner::findOrFail($owner_id);

        return GymResource::collection(
            $owner->gyms()->with(['equipments', 'amenities'])->paginate(10)
        );
    }
       public function dashboard()
    {
        $owner = auth()->guard('gym_owner')->user();

        // Only the gyms owned by this owner
        $gyms = $owner->gyms()->with(['equipments', 'amenities'])->get();

        return view('owner.dashboard', compact('gyms'));
    }
}
