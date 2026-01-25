<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Resources\GymOwnerResource;
use App\Http\Resources\GymResource;

class AdminOwnerController extends Controller
{
    /**
     * GET /api/v1/admin/owners
     * Lists owners for admin dashboard
     */
    public function index(Request $request)
    {
        $q = trim((string) $request->query('q', ''));

        $owners = User::query()
            ->where('role', 'owner')
            ->when($q !== '', function ($query) use ($q) {
                $query->where(function ($qq) use ($q) {
                    $qq->where('name', 'ilike', "%{$q}%")
                       ->orWhere('email', 'ilike', "%{$q}%")
                       ->orWhere('company_name', 'ilike', "%{$q}%");
                });
            })
            ->orderByDesc('created_at')
            ->paginate(10);

        return GymOwnerResource::collection($owners);
    }

    /**
     * GET /api/v1/admin/owners/{owner}
     */
    public function show($owner_id)
    {
        $owner = User::query()
            ->where('role', 'owner')
            ->findOrFail($owner_id);

        return new GymOwnerResource($owner);
    }

    /**
     * GET /api/v1/admin/owners/{owner}/gyms
     */
    public function gyms(Request $request, $owner_id)
    {
        $owner = User::query()
            ->where('role', 'owner')
            ->findOrFail($owner_id);

        $gyms = $owner->gyms()
            ->with(['equipments', 'amenities'])
            ->orderByDesc('updated_at')
            ->paginate(10);

        return GymResource::collection($gyms);
    }
}
