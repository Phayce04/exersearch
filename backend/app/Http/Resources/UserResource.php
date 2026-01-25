<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // relationships (will be null if not loaded)
        $profile = $this->relationLoaded('profile') ? $this->profile : null;
        $ownerProfile = $this->relationLoaded('ownerProfile') ? $this->ownerProfile : null;

        return [
            'user_id' => $this->user_id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,

            // ✅ user_profiles table
            'profile' => [
                'profile_id' => optional($profile)->profile_id,
                'user_id' => $this->user_id,

                'age' => optional($profile)->age,
                'weight' => optional($profile)->weight,
                'height' => optional($profile)->height,
                'address' => optional($profile)->address,

                'latitude' => optional($profile)->latitude,
                'longitude' => optional($profile)->longitude,

                'profile_photo_url' => optional($profile)->profile_photo_url,

                'created_at' => optional($profile)->created_at,
                'updated_at' => optional($profile)->updated_at,
            ],

            // ✅ owner_profiles table (null for normal users)
            'owner_profile' => $ownerProfile ? [
                'owner_profile_id' => $ownerProfile->owner_profile_id,
                'user_id' => $ownerProfile->user_id,
                'profile_photo_url' => $ownerProfile->profile_photo_url,
                'contact_number' => $ownerProfile->contact_number,
                'address' => $ownerProfile->address,
                'company_name' => $ownerProfile->company_name,
                'verified' => (bool) $ownerProfile->verified,
                'last_login' => $ownerProfile->last_login,
                'login_attempts' => $ownerProfile->login_attempts,
                'created_at' => $ownerProfile->created_at,
                'updated_at' => $ownerProfile->updated_at,
            ] : null,

            // ✅ user_preferences table
            'preferences' => [
                'goal' => optional($this->preference)->goal,
                'activity_level' => optional($this->preference)->activity_level,
                'budget' => optional($this->preference)->budget,
            ],

            // ✅ pivot tables
            'preferred_equipments' => $this->relationLoaded('preferredEquipments')
                ? $this->preferredEquipments->pluck('equipment_id')
                : [],

            'preferred_amenities' => $this->relationLoaded('preferredAmenities')
                ? $this->preferredAmenities->pluck('amenity_id')
                : [],

            'created_at' => $this->created_at,
        ];
    }
}
