<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\EquipmentResource;
use App\Http\Resources\AmenityResource;

class GymResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'gym_id' => $this->gym_id,
            'name' => $this->name,
            'description' => $this->description,
            'owner_id' => $this->owner_id,
            'owner' => new GymOwnerResource(
                $this->owner()->first()
            ),
            'address' => $this->address,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'daily_price' => $this->daily_price,
            'monthly_price' => $this->monthly_price,
            'annual_price' => $this->annual_price,
            'opening_time' => $this->opening_time,
            'closing_time' => $this->closing_time,
            'gym_type' => $this->gym_type,
            'contact_number' => $this->contact_number,
            'email' => $this->email,
            'website' => $this->website,
            'facebook_page' => $this->facebook_page,
            'instagram_page' => $this->instagram_page,
            'main_image_url' => $this->main_image_url,
            'gallery_urls' => $this->gallery_urls,
            
            'has_personal_trainers' => $this->has_personal_trainers,
            'has_classes' => $this->has_classes,
            'is_24_hours' => $this->is_24_hours,
            'is_airconditioned' => $this->is_airconditioned,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            'equipments' => EquipmentResource::collection($this->equipments()->get()),
            'amenities' => AmenityResource::collection($this->amenities()->get()),
        ];
    }
}
    