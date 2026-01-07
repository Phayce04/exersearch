<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class AmenityResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'amenity_id' => $this->amenity_id,
            'name' => $this->name,
            'description' => $this->description,
            'image_url' => $this->image_url,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'pivot' => [
                'gym_id' => $this->pivot->gym_id ?? null,
                'amenity_id' => $this->pivot->amenity_id ?? null,
                'id' => $this->pivot->id ?? null,
                'availability_status' => $this->pivot->availability_status ?? null,
                'notes' => $this->pivot->notes ?? null,
                'image_url' => $this->pivot->image_url ?? $this->image_url ?? null,
            ],
        ];
    }
}
