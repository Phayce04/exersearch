<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class EquipmentResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'equipment_id' => $this->equipment_id,
            'name' => $this->name,
            'description' => $this->description,
            'category' => $this->category,
            'difficulty' => $this->difficulty,
            'target_muscle_group' => $this->target_muscle_group,
            'image_url' => $this->image_url,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'pivot' => [
                'gym_id' => $this->pivot->gym_id ?? null,
                'equipment_id' => $this->pivot->equipment_id ?? null,
                'id' => $this->pivot->id ?? null,
                'quantity' => $this->pivot->quantity ?? null,
                'status' => $this->pivot->status ?? null,
                'date_purchased' => $this->pivot->date_purchased ?? null,
                'last_maintenance' => $this->pivot->last_maintenance ?? null,
                'next_maintenance' => $this->pivot->next_maintenance ?? null,
            ],
        ];
    }
}
