<?php

namespace App\Http\Controllers;

use App\Models\Equipment;
use Illuminate\Http\Request;

class EquipmentController extends Controller
{
    // GET /equipments
    public function index()
    {
        return Equipment::all();
    }

    // GET /equipments/{id}
    public function show($id)
    {
        return Equipment::findOrFail($id);
    }
}
