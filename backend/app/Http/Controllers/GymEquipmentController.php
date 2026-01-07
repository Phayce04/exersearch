<?php

namespace App\Http\Controllers;

use App\Models\GymEquipment;
use Illuminate\Http\Request;

class GymEquipmentController extends Controller
{
    // GET /gym-equipments
    public function index()
    {
        return GymEquipment::with(['gym', 'equipment'])->get();
    }
}
