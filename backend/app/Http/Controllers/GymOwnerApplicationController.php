<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\GymOwnerApplication; // Model for the applications
use Illuminate\Support\Facades\DB;   // For database transactions

class GymOwnerApplicationController extends Controller
{
    public function apply(Request $request)
    {
        $request->validate([
            'gym_name' => 'required|string|max:255',
            'address' => 'required|string',
        ]);

        $user = $request->user();

        if ($user->role !== 'user') {
            return response()->json(['message' => 'Not allowed'], 403);
        }

        if ($user->gymOwnerApplication) {
            return response()->json(['message' => 'Application already exists'], 409);
        }

        $application = GymOwnerApplication::create([
            'user_id' => $user->user_id,
            'gym_name' => $request->gym_name,
            'address' => $request->address,
            'status' => 'pending'
        ]);

        return response()->json($application, 201);
    }

    public function approve($id)
    {
        $application = GymOwnerApplication::with('user')->findOrFail($id);

        DB::transaction(function () use ($application) {
            $application->update(['status' => 'approved']);
            $application->user->update(['role' => 'owner']);
        });

        return response()->json(['message' => 'Approved']);
    }
}
