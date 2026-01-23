<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Equipment;

class EquipmentImportController extends Controller
{
    public function import(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
        ]);

        $path = $request->file('file')->getRealPath();
        $handle = fopen($path, 'r');

        if (!$handle) {
            return response()->json(['message' => 'Unable to read CSV file.'], 422);
        }

        $header = fgetcsv($handle);
        if (!$header) {
            fclose($handle);
            return response()->json(['message' => 'CSV appears empty.'], 422);
        }

        // normalize header keys: "Target Muscle Group" -> "target_muscle_group"
        $header = array_map(function ($h) {
            $h = trim($h ?? '');
            $h = Str::lower($h);
            $h = str_replace([' ', '-'], '_', $h);
            return $h;
        }, $header);

        // allowed columns based on your fillable
        $allowed = [
            'name',
            'category',
            'difficulty',
            'image_url',
            'target_muscle_group',
        ];

        // map csv index -> model field
        $map = [];
        foreach ($header as $idx => $key) {
            if (in_array($key, $allowed, true)) $map[$idx] = $key;
        }

        // must have name column
        if (!in_array('name', $map, true)) {
            fclose($handle);
            return response()->json([
                'message' => 'CSV must include a "name" column.',
                'found_headers' => $header,
                'expected_headers' => $allowed,
            ], 422);
        }

        $inserted = 0;
        $skipped = 0;
        $errors = [];

        DB::beginTransaction();
        try {
            $rowNum = 1; // header row
            while (($row = fgetcsv($handle)) !== false) {
                $rowNum++;

                // build payload from mapped fields
                $payload = [];
                foreach ($map as $idx => $field) {
                    $payload[$field] = isset($row[$idx]) ? trim((string)$row[$idx]) : null;
                }

                // skip completely empty rows
                $allEmpty = true;
                foreach ($payload as $v) {
                    if ($v !== null && $v !== '') { $allEmpty = false; break; }
                }
                if ($allEmpty) {
                    $skipped++;
                    continue;
                }

                // validate required name
                if (empty($payload['name'])) {
                    $errors[] = ['row' => $rowNum, 'error' => 'Missing name'];
                    $skipped++;
                    continue;
                }

                // OPTIONAL: skip duplicates by name
                if (Equipment::where('name', $payload['name'])->exists()) {
                    $errors[] = ['row' => $rowNum, 'error' => 'Duplicate name (skipped)', 'name' => $payload['name']];
                    $skipped++;
                    continue;
                }

                Equipment::create([
                    'name' => $payload['name'],
                    'category' => $payload['category'] ?? null,
                    'difficulty' => $payload['difficulty'] ?? null,
                    'image_url' => $payload['image_url'] ?? null,
                    'target_muscle_group' => $payload['target_muscle_group'] ?? null,
                ]);

                $inserted++;
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            fclose($handle);
            return response()->json([
                'message' => 'Import failed.',
                'error' => $e->getMessage(),
            ], 500);
        }

        fclose($handle);

        return response()->json([
            'message' => 'Import complete.',
            'inserted' => $inserted,
            'skipped' => $skipped,
            'errors' => array_slice($errors, 0, 50),
        ]);
    }
}
