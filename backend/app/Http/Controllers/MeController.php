<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class MeController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();

        // Load role-specific profile
        switch ($user->role) {
            case 'admin':
                $user->load('adminProfile');
                break;

            case 'owner':
                $user->load('ownerProfile');
                break;

            case 'user':
                $user->load('userProfile');
                break;
        }

        return response()->json([
            // --------------------
            // Base user fields
            // --------------------
            'user_id' => $user->user_id,
            'name'    => $user->name,
            'email'   => $user->email,
            'role'    => $user->role,

            // --------------------
            // Admin profile
            // --------------------
            'admin_profile' => $user->role === 'superadmin' && $user->adminProfile ? [
                'admin_profile_id' => $user->adminProfile->admin_profile_id,
                'permission_level' => $user->adminProfile->permission_level,
                'notes'            => $user->adminProfile->notes,
                'avatar_url'       => $user->adminProfile->avatar_url,
                'created_at'       => $user->adminProfile->created_at,
                'updated_at'       => $user->adminProfile->updated_at,
            ] : null,

            // --------------------
            // Owner profile
            // --------------------
            'owner_profile' => $user->role === 'owner' && $user->ownerProfile ? [
                'owner_profile_id' => $user->ownerProfile->owner_profile_id,
                'company_name'     => $user->ownerProfile->company_name,
                'contact_number'   => $user->ownerProfile->contact_number,
                'address'          => $user->ownerProfile->address,
                'verified'         => $user->ownerProfile->verified,
                'profile_photo_url'=> $user->ownerProfile->profile_photo_url,
                'last_login'       => $user->ownerProfile->last_login,
                'login_attempts'   => $user->ownerProfile->login_attempts,
                'created_at'       => $user->ownerProfile->created_at,
                'updated_at'       => $user->ownerProfile->updated_at,
            ] : null,

            // --------------------
            // User / gym-goer profile
            // --------------------
            'user_profile' => $user->role === 'user' && $user->userProfile ? [
                'profile_id' => $user->userProfile->profile_id,
                'age'        => $user->userProfile->age,
                'weight'     => $user->userProfile->weight,
                'height'     => $user->userProfile->height,
                'address'    => $user->userProfile->address,
                'latitude'   => $user->userProfile->latitude,
                'longitude'  => $user->userProfile->longitude,
                'created_at' => $user->userProfile->created_at,
                'updated_at' => $user->userProfile->updated_at,
            ] : null,
        ]);
    }
}
