<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GymOwnerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'owner_id' => $this->owner_id,
            'username' => $this->username,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'profile_photo_url' => $this->profile_photo_url,
            'contact_number' => $this->contact_number,
            'company_name' => $this->company_name,
            'verified' => $this->verified,
            'created_at' => $this->created_at,
        ];
    }
}
