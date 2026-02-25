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
            'owner' => $this->owner
                ? new GymOwnerResource($this->owner)
                : null,

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

            'has_personal_trainers' => (bool) $this->has_personal_trainers,
            'has_classes' => (bool) $this->has_classes,
            'is_24_hours' => (bool) $this->is_24_hours,
            'is_airconditioned' => (bool) $this->is_airconditioned,

            'free_first_visit_enabled' => (bool) $this->free_first_visit_enabled,
            'free_first_visit_enabled_at' => $this->free_first_visit_enabled_at,

            'status' => $this->status,
            'approved_at' => $this->approved_at,
            'approved_by' => $this->approved_by,

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            'equipments' => EquipmentResource::collection(
                $this->whenLoaded('equipments')
            ),

            'amenities' => AmenityResource::collection(
                $this->whenLoaded('amenities')
            ),
        ];
    }
}