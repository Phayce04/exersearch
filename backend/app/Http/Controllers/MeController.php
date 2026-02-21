<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class MeController extends Controller
{
    private const ROLE_LEVEL = [
        'user' => 1,
        'owner' => 2,
        'admin' => 3,
        'superadmin' => 4,
    ];

    private function hasAtLeastRole(?string $role, string $required): bool
    {
        $lvl = self::ROLE_LEVEL[$role ?? ''] ?? 0;
        $req = self::ROLE_LEVEL[$required] ?? PHP_INT_MAX;
        return $lvl >= $req;
    }

    public function __invoke(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $loads = [];
        if ($this->hasAtLeastRole($user->role, 'user')) {
            $loads[] = 'userProfile';
        }

        if ($this->hasAtLeastRole($user->role, 'owner')) {
            $loads[] = 'ownerProfile';
        }

        if ($this->hasAtLeastRole($user->role, 'admin')) {
            $loads[] = 'adminProfile';
        }

        if (!empty($loads)) {
            $user->load($loads);
        }

        return response()->json([
            'user_id' => $user->user_id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'email_verified_at' => $user->email_verified_at,
            'onboarded_at' => $user->onboarded_at,

            'user_profile' => $user->userProfile ? [
                'profile_id' => $user->userProfile->profile_id,
                'age' => $user->userProfile->age,
                'weight' => $user->userProfile->weight,
                'height' => $user->userProfile->height,
                'address' => $user->userProfile->address,
                'latitude' => $user->userProfile->latitude,
                'longitude' => $user->userProfile->longitude,
                'gender' => $user->userProfile->gender ?? null,
                'profile_photo_url' => $user->userProfile->profile_photo_url ?? null,
                'created_at' => $user->userProfile->created_at,
                'updated_at' => $user->userProfile->updated_at,
            ] : null,

            'owner_profile' => $user->ownerProfile ? [
                'owner_profile_id' => $user->ownerProfile->owner_profile_id,
                'company_name' => $user->ownerProfile->company_name,
                'contact_number' => $user->ownerProfile->contact_number,
                'address' => $user->ownerProfile->address,
                'verified' => $user->ownerProfile->verified,
                'profile_photo_url' => $user->ownerProfile->profile_photo_url,
                'last_login' => $user->ownerProfile->last_login,
                'login_attempts' => $user->ownerProfile->login_attempts,
                'created_at' => $user->ownerProfile->created_at,
                'updated_at' => $user->ownerProfile->updated_at,
            ] : null,

            'admin_profile' => $user->adminProfile ? [
                'admin_profile_id' => $user->adminProfile->admin_profile_id,
                'permission_level' => $user->adminProfile->permission_level,
                'notes' => $user->adminProfile->notes,
                'avatar_url' => $user->adminProfile->avatar_url,
                'created_at' => $user->adminProfile->created_at,
                'updated_at' => $user->adminProfile->updated_at,
            ] : null,
        ]);
    }
}