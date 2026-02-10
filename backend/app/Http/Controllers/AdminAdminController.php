<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AdminProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AdminAdminController extends Controller
{
    private function requireSuperadmin(Request $request)
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);

        if ($user->role !== 'superadmin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return null;
    }

    // GET /api/v1/admin/admins
    public function index(Request $request)
    {
        if ($resp = $this->requireSuperadmin($request)) return $resp;

        $q = User::query()
            ->whereIn('role', ['admin', 'superadmin'])
            ->with(['adminProfile'])
            ->orderByDesc('user_id')
            ->paginate(10);

        return response()->json($q);
    }

    // GET /api/v1/admin/admins/{user}
    public function show(Request $request, User $user)
    {
        if ($resp = $this->requireSuperadmin($request)) return $resp;

        if (!in_array($user->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Not an admin user'], 404);
        }

        $user->load(['adminProfile']);

        return response()->json([
            'user' => $user,
            'admin_profile' => $user->adminProfile,
        ]);
    }

    // POST /api/v1/admin/admins
    public function store(Request $request)
    {
        if ($resp = $this->requireSuperadmin($request)) return $resp;

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(['admin', 'superadmin'])],

            'permission_level' => ['sometimes', Rule::in(['full', 'limited', 'readonly'])],
            'notes' => ['nullable', 'string'],
            'avatar_url' => ['nullable', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = new User();
        $user->name = $request->input('name');
        $user->email = $request->input('email');
        $user->password = Hash::make($request->input('password'));
        $user->role = $request->input('role');
        $user->save();

        $profile = AdminProfile::create([
            'user_id' => $user->user_id,
            'permission_level' => $request->input('permission_level', 'full'),
            'notes' => $request->input('notes'),
            'avatar_url' => $request->input('avatar_url'),
        ]);

        return response()->json([
            'message' => 'Admin created.',
            'user' => $user,
            'admin_profile' => $profile,
        ], 201);
    }

    // PUT /api/v1/admin/admins/{user}
    public function update(Request $request, User $user)
    {
        if ($resp = $this->requireSuperadmin($request)) return $resp;

        if (!in_array($user->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Not an admin user'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->user_id, 'user_id')],
            'password' => ['sometimes', 'string', 'min:8'],
            'role' => ['sometimes', Rule::in(['admin', 'superadmin'])],

            'permission_level' => ['sometimes', Rule::in(['full', 'limited', 'readonly'])],
            'notes' => ['nullable', 'string'],
            'avatar_url' => ['nullable', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($request->has('name')) $user->name = $request->input('name');
        if ($request->has('email')) $user->email = $request->input('email');
        if ($request->has('role')) $user->role = $request->input('role');
        if ($request->has('password')) $user->password = Hash::make($request->input('password'));
        $user->save();

        $profile = AdminProfile::firstOrCreate(
            ['user_id' => $user->user_id],
            ['permission_level' => 'full']
        );

        if ($request->has('permission_level')) $profile->permission_level = $request->input('permission_level');
        if ($request->has('notes')) $profile->notes = $request->input('notes');
        if ($request->has('avatar_url')) $profile->avatar_url = $request->input('avatar_url');
        $profile->save();

        return response()->json([
            'message' => 'Admin updated.',
            'user' => $user,
            'admin_profile' => $profile,
        ]);
    }

    // DELETE /api/v1/admin/admins/{user}
    public function destroy(Request $request, User $user)
    {
        if ($resp = $this->requireSuperadmin($request)) return $resp;

        if (!in_array($user->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Not an admin user'], 404);
        }

        // prevent deleting self (optional but recommended)
        if ((int)$request->user()->user_id === (int)$user->user_id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        $user->delete(); // cascades admin_profile if FK is ON DELETE CASCADE
        return response()->json(['message' => 'Admin deleted.']);
    }
}
