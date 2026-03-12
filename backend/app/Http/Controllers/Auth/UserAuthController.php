<?php

namespace App\Http\Controllers\Auth;

use Google\Client as GoogleClient;
use Illuminate\Support\Str;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class UserAuthController extends Controller
{
    private function logAuthInteraction(?int $userId, string $event, string $source = 'auth', $meta = null): void
    {
        try {
            DB::table('gym_interactions')->insert([
                'user_id' => $userId,
                'gym_id' => null,
                'event' => $event,
                'source' => $source,
                'session_id' => (string) Str::uuid(),
                'meta' => $meta ? json_encode($meta) : null,
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed to log auth interaction', [
                'event' => $event,
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials',
            ], 401);
        }

        $token = $user->createToken($user->role . '-token')->plainTextToken;

        $this->logAuthInteraction(
            $user->user_id,
            'login',
            'email',
            [
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]
        );

        return response()->json([
            'token' => $token,
            'user'  => [
                'user_id' => $user->user_id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'email_verified_at' => $user->email_verified_at,
            ],
        ]);
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
        ]);

        try {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'user',
            ]);

            $user->sendEmailVerificationNotification();

            $token = $user->createToken('user-token')->plainTextToken;

            $this->logAuthInteraction(
                $user->user_id,
                'signup',
                'email',
                [
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]
            );

            return response()->json([
                'token' => $token,
                'user'  => [
                    'user_id' => $user->user_id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'email_verified_at' => $user->email_verified_at,
                ],
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Register failed',
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ], 500);
        }
    }

    public function google(Request $request)
    {
        $validated = $request->validate([
            'id_token' => 'required|string',
        ]);

        $client = new GoogleClient(['client_id' => env('GOOGLE_CLIENT_ID')]);
        $payload = $client->verifyIdToken($validated['id_token']);

        if (!$payload) {
            return response()->json([
                'message' => 'Invalid Google token',
            ], 401);
        }

        $email = $payload['email'] ?? null;
        $name = $payload['name'] ?? 'Google User';

        if (!$email) {
            return response()->json([
                'message' => 'Google token missing email',
            ], 422);
        }

        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => bcrypt(Str::random(32)),
                'role' => 'user',
                'email_verified_at' => now(),
            ]
        );

        if (!$user->email_verified_at) {
            $user->forceFill([
                'email_verified_at' => now(),
            ])->save();
        }

        $token = $user->createToken($user->role . '-token')->plainTextToken;

        $this->logAuthInteraction(
            $user->user_id,
            'google_login',
            'google',
            [
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]
        );

        return response()->json([
            'token' => $token,
            'user'  => [
                'user_id' => $user->user_id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'email_verified_at' => $user->email_verified_at,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();

        $this->logAuthInteraction(
            $user?->user_id,
            'logout',
            'auth',
            [
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]
        );

        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }
}