<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class MeController extends Controller
{
    public function __invoke(Request $request)
    {
        return response()->json([
            'user_id' => $request->user()->user_id,
            'name'    => $request->user()->name,
            'email'   => $request->user()->email,
            'role'    => $request->user()->role,
        ]);
    }
}