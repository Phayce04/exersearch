<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Schema;

class ProfilePhotoController extends Controller
{
    public function upload(Request $request)
    {
        $request->validate([
            'photo' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'], // 2MB
        ]);

        $user = $request->user();

        // keep files organized by role
        $folder = match ($user->role) {
            'admin', 'superadmin' => 'avatars/admins',
            'owner'              => 'avatars/owners',
            default              => 'avatars/users',
        };

        // store file on the "public" disk
        $path = $request->file('photo')->store($folder, 'public');

        // public URL via storage:link (e.g. /storage/avatars/admins/xxx.webp)
        $url = Storage::url($path);

        // save URL into the correct profile column
        if (in_array($user->role, ['admin', 'superadmin'])) {
            $profile = $user->adminProfile()->firstOrCreate(['user_id' => $user->user_id]);
            $profile->avatar_url = $url;
            $profile->save();
        } elseif ($user->role === 'owner') {
            $profile = $user->ownerProfile()->firstOrCreate(['user_id' => $user->user_id]);
            $profile->profile_photo_url = $url;
            $profile->save();
        } else {
            // only save if your user_profiles has profile_photo_url
            $profile = $user->userProfile()->firstOrCreate(['user_id' => $user->user_id]);

            if (Schema::hasColumn('user_profiles', 'profile_photo_url')) {
                $profile->profile_photo_url = $url;
                $profile->save();
            }
        }

        return response()->json([
            'message' => 'Profile photo updated.',
            'avatar_url' => $url,
        ]);
    }

    public function remove(Request $request)
    {
        $user = $request->user();

        $currentUrl = null;

        if (in_array($user->role, ['admin', 'superadmin'])) {
            $currentUrl = optional($user->adminProfile)->avatar_url;

            if ($user->adminProfile) {
                $user->adminProfile->avatar_url = null;
                $user->adminProfile->save();
            }
        } elseif ($user->role === 'owner') {
            $currentUrl = optional($user->ownerProfile)->profile_photo_url;

            if ($user->ownerProfile) {
                $user->ownerProfile->profile_photo_url = null;
                $user->ownerProfile->save();
            }
        }

        // delete file from disk if it was local /storage/*
        if ($currentUrl && str_starts_with($currentUrl, '/storage/')) {
            $relative = str_replace('/storage/', '', $currentUrl);
            Storage::disk('public')->delete($relative);
        }

        return response()->json([
            'message' => 'Profile photo removed.',
        ]);
    }
}
