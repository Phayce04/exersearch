<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GymGoerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'user_id' => $this->user_id,
            'name' => $this->name,
            'email' => $this->email,

            'profile' => [
                'age' => $this->age,
                'weight' => $this->weight,
                'height' => $this->height,
                'activity_level' => $this->activity_level,
                'address' => $this->address,
            ],

            'preferences' => [
                'goal' => optional($this->preference)->goal,
                'activity_level' => optional($this->preference)->activity_level,
                'budget' => optional($this->preference)->budget,
            ],

            'preferred_equipments' => $this->preferredEquipments->pluck('equipment_id'),
            'preferred_amenities' => $this->preferredAmenities->pluck('amenity_id'),

            'created_at' => $this->created_at,
        ];
    }
}
