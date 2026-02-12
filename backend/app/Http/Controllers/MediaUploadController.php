<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class MediaUploadController extends Controller
{
    public function upload(Request $request)
    {
        /**
         * ✅ IMPORTANT:
         * Don't rely on $request->hasFile('file') here.
         * When upload fails at PHP level, hasFile() may be false,
         * but the Symfony file bag may still hold the "file" with an error code.
         */
        $raw = $request->files->get('file');

        if ($raw instanceof UploadedFile) {
            $err = $raw->getError();

            if ($err !== UPLOAD_ERR_OK) {
                $map = [
                    UPLOAD_ERR_INI_SIZE   => 'Upload too large: server upload_max_filesize limit reached.',
                    UPLOAD_ERR_FORM_SIZE  => 'Upload too large: form limit reached.',
                    UPLOAD_ERR_PARTIAL    => 'Upload was interrupted (partial upload). Please try again.',
                    UPLOAD_ERR_NO_FILE    => 'No file was uploaded. Please select a file.',
                    UPLOAD_ERR_NO_TMP_DIR => 'Server error: missing temporary folder (upload_tmp_dir).',
                    UPLOAD_ERR_CANT_WRITE => 'Server error: failed to write file to disk.',
                    UPLOAD_ERR_EXTENSION  => 'Server blocked the upload (PHP extension).',
                ];

                $msg = $map[$err] ?? 'Upload failed at server level. Please try again.';

                return response()->json([
                    'message' => $msg,
                    'errors' => [
                        'file' => [$msg],
                    ],
                    // keep this temporarily while debugging
                    'debug' => [
                        'upload_error_code' => $err,
                        'php_upload_max_filesize' => ini_get('upload_max_filesize'),
                        'php_post_max_size' => ini_get('post_max_size'),
                        'php_upload_tmp_dir' => ini_get('upload_tmp_dir'),
                    ],
                ], 422);
            }
        }

        // ✅ Normal validation (runs only when PHP successfully received the file)
        $request->validate(
            [
                'type' => ['required', 'in:equipments,amenities,gyms,settings'],
                'kind' => ['nullable', 'string'],
                'file' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            ],
            [
                'type.required' => 'Upload type is required.',
                'type.in' => 'Upload type must be one of: equipments, amenities, gyms, settings.',

                'file.required' => 'Please select an image to upload.',
                'file.file' => 'Invalid upload. Please re-select the file and try again.',
                'file.image' => 'File must be a valid image.',
                'file.mimes' => 'Only JPG, JPEG, PNG, and WebP are allowed.',
                'file.max' => 'Image is too large. Max is 5MB.',
            ]
        );

        $user = $request->user();
        $type = $request->type;               // equipments | amenities | gyms | settings
        $kind = $request->kind ?? 'covers';   // default folder

        // ✅ permissions
        if ($type === 'settings') {
            if (!in_array($user->role, ['admin', 'superadmin'])) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        } else {
            if (!in_array($user->role, ['admin', 'superadmin', 'owner'])) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $folder = "{$type}/{$kind}";

        $path = $request->file('file')->store($folder, 'public');
        $url  = Storage::url($path);

        return response()->json([
            'message' => 'Uploaded',
            'url' => $url,
        ]);
    }

    public function delete(Request $request)
    {
        $request->validate(
            [
                'url' => ['required', 'string'],
            ],
            [
                'url.required' => 'File URL is required.',
            ]
        );

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
