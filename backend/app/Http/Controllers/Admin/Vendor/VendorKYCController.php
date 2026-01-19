<?php

namespace App\Http\Controllers\Admin\Vendor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReviewKYCRequest;
use App\Models\KYCSubmission;
use App\Services\Admin\KYCReviewService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class VendorKYCController extends Controller
{
    public function __construct(
        private KYCReviewService $kycReviewService
    ) {}

    public function pending()
    {
        $submissions = KYCSubmission::where('status', 'pending')
            ->with(['user', 'reviewer'])
            ->latest()
            ->paginate(20);

        return view('admin.vendors.kyc', [
            'submissions' => $submissions,
        ]);
    }

    public function show(KYCSubmission $submission)
    {
        $submission->load(['user', 'reviewer']);

        return view('admin.vendors.kyc-show', [
            'submission' => $submission,
        ]);
    }

    public function approve(ReviewKYCRequest $request, KYCSubmission $submission)
    {
        try {
            $admin = Auth::guard('admin')->user();
            $this->kycReviewService->reviewSubmission($submission, $admin, 'approved', $request->notes);

            return redirect()->route('admin.kyc.show', $submission)
                ->with('success', 'KYC submission approved successfully.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to approve KYC submission: ' . $e->getMessage());
        }
    }

    public function reject(ReviewKYCRequest $request, KYCSubmission $submission)
    {
        try {
            $admin = Auth::guard('admin')->user();
            $this->kycReviewService->reviewSubmission($submission, $admin, 'rejected', $request->notes);

            return redirect()->route('admin.kyc.show', $submission)
                ->with('success', 'KYC submission rejected successfully.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to reject KYC submission: ' . $e->getMessage());
        }
    }
}
