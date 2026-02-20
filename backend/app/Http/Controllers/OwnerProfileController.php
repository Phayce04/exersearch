<?php

namespace App\Http\Controllers;

use App\Models\OwnerProfile;
use Illuminate\Http\Request;

class OwnerProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);
if (!in_array($user->role, ['user', 'owner', 'superadmin']))
{
            return response()->json(['message' => 'Not allowed'], 403);
        }

        $profile = OwnerProfile::where('user_id', $user->user_id)->first();

        return response()->json([
            'data' => $profile,
        ]);
    }

    public function storeOrUpdate(Request $request)
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);
if (!in_array($user->role, ['user', 'owner', 'superadmin']))
 {
            return response()->json(['message' => 'Not allowed'], 403);
        }

        $data = $request->validate([
            'profile_photo_url' => 'nullable|string|max:2048',
            'contact_number' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'company_name' => 'nullable|string|max:255',
        ]);

        $profile = OwnerProfile::updateOrCreate(
            ['user_id' => $user->user_id],
            [
                'profile_photo_url' => $data['profile_photo_url'] ?? null,
                'contact_number' => $data['contact_number'] ?? null,
                'address' => $data['address'] ?? null,
                'company_name' => $data['company_name'] ?? null,
            ]
        );

        return response()->json([
            'message' => 'Owner profile saved.',
            'data' => $profile,
        ]);
    }

    public function update(Request $request)
    {
        return $this->storeOrUpdate($request);
    }

    public function verify(Request $request, $user_id)
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);
        if ($user->role !== 'superadmin') {
            return response()->json(['message' => 'Not allowed'], 403);
        }

        $data = $request->validate([
            'verified' => 'required|boolean',
        ]);

        $profile = OwnerProfile::updateOrCreate(
            ['user_id' => (int) $user_id],
            ['verified' => (bool) $data['verified']]
        );

        return response()->json([
            'message' => 'Owner verification updated.',
            'data' => $profile,
        ]);
    }
}
