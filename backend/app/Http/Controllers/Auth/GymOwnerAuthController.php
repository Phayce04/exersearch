<?php
namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\GymOwner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class GymOwnerAuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $owner = GymOwner::where('email', $request->email)->first();

        if ($owner && Hash::check($request->password, $owner->password)) {
            // Log in using the gym_owner guard
            auth()->guard('gym_owner')->login($owner);

            return redirect()->route('owner.dashboard');
        }


        return back()->withErrors(['email' => 'Invalid credentials']);
    }
}
