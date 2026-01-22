<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MediaUploadController extends Controller
{
    public function upload(Request $request)
    {
        $request->validate([
            'type' => ['required', 'in:equipments,amenities,gyms'],
            'kind' => ['nullable', 'string'], // covers, logos, gallery
            'file' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $user = $request->user();

        // permissions (adjust later if needed)
        if (!in_array($user->role, ['admin', 'superadmin', 'owner'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $type = $request->type;               // equipments | amenities | gyms
        $kind = $request->kind ?? 'covers';   // default folder

        $folder = "{$type}/{$kind}";

        $path = $request->file('file')->store($folder, 'public');
        $url  = Storage::url($path); // /storage/equipments/covers/xxx.webp

        return response()->json([
            'message' => 'Uploaded',
            'url' => $url,
        ]);
    }

    public function delete(Request $request)
    {
        $request->validate([
            'url' => ['required', 'string'],
        ]);

        if (!in_array($request->user()->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (!str_starts_with($request->url, '/storage/')) {
            return response()->json(['message' => 'Not a local file'], 400);
        }

        $relative = str_replace('/storage/', '', $request->url);
        Storage::disk('public')->delete($relative);

        return response()->json(['message' => 'Deleted']);
    }
}
