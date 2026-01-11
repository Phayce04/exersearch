<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GymOwnerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'owner_id' => $this->user_id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'profile_photo_url' => $this->ownerProfile->profile_photo_url ?? null,
            'contact_number' => $this->ownerProfile->contact_number ?? null,
            'company_name' => $this->ownerProfile->company_name ?? null,
            'verified' => $this->ownerProfile->verified ?? false,
            'created_at' => $this->created_at,
        ];
    }
}
