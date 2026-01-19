<?php

namespace App\Http\Controllers\Admin\Vendor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ApproveVendorRequest;
use App\Http\Requests\Admin\RejectVendorRequest;
use App\Http\Requests\Admin\SuspendVendorRequest;
use App\Models\User;
use App\Services\Admin\VendorOnboardingService;
use App\Services\Admin\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class VendorOnboardingController extends Controller
{
    public function __construct(
        private VendorOnboardingService $onboardingService,
        private ActivityLogService $activityLogService
    ) {}

    public function showReview(User $user)
    {
        if ($user->role !== 'host') {
            abort(404);
        }

        $user->load([
            'onboardingState.reviewer',
            'onboardingState.kycVerifier',
            'kycSubmissions.reviewer',
            'properties',
        ]);

        $activityLogs = $this->activityLogService->getLogsForEntity($user, 20);

        return view('admin.vendors.review', [
            'vendor' => $user,
            'activityLogs' => $activityLogs,
        ]);
    }

    public function approve(ApproveVendorRequest $request, User $user)
    {
        try {
            $admin = Auth::guard('admin')->user();
            $this->onboardingService->approve($user, $admin, $request->notes);

            return redirect()->route('admin.vendors.show', $user)
                ->with('success', 'Vendor approved successfully.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to approve vendor: ' . $e->getMessage());
        }
    }

    public function reject(RejectVendorRequest $request, User $user)
    {
        try {
            $admin = Auth::guard('admin')->user();
            $this->onboardingService->reject($user, $admin, $request->reason);

            return redirect()->route('admin.vendors.show', $user)
                ->with('success', 'Vendor rejected successfully.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to reject vendor: ' . $e->getMessage());
        }
    }

    public function suspend(SuspendVendorRequest $request, User $user)
    {
        try {
            $admin = Auth::guard('admin')->user();
            $this->onboardingService->suspend($user, $admin, $request->reason);

            return redirect()->route('admin.vendors.show', $user)
                ->with('success', 'Vendor suspended successfully.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to suspend vendor: ' . $e->getMessage());
        }
    }
}
