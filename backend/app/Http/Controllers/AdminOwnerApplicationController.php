<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\OwnerApplicationApproved;
use App\Mail\OwnerApplicationRejected;
use App\Models\GymOwnerApplication;

class AdminOwnerApplicationController extends Controller
{
    public function approve($id)
    {
        $application = GymOwnerApplication::with('user')->findOrFail($id);

        $application->status = 'approved';
        $application->save();

        $email = $application->user?->email;

        if ($email) {
            try {
                Mail::to($email)->send(
                    new OwnerApplicationApproved(
                        name: $application->user->name ?? 'Applicant',
                        gymName: $application->gym_name ?? 'Your Gym'
                    )
                );
            } catch (\Throwable $e) {
                \Log::warning("Approval email failed: ".$e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Application approved.'
        ]);
    }

    public function reject(Request $request, $id)
    {
        $application = GymOwnerApplication::with('user')->findOrFail($id);

        $reason = $request->input('reason');

        $application->status = 'rejected';
        $application->rejection_reason = $reason; // remove if column doesn't exist
        $application->save();

        $email = $application->user?->email;

        if ($email) {
            try {
                Mail::to($email)->send(
                    new OwnerApplicationRejected(
                        name: $application->user->name ?? 'Applicant',
                        reason: $reason
                    )
                );
            } catch (\Throwable $e) {
                \Log::warning("Rejection email failed: ".$e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Application rejected.'
        ]);
    }
}