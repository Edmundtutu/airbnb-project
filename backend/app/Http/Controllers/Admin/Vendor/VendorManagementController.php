<?php

namespace App\Http\Controllers\Admin\Vendor;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class VendorManagementController extends Controller
{
    public function index(Request $request)
    {
        $query = User::where('role', 'host')
            ->with('onboardingState')
            ->latest();

        if ($request->has('state')) {
            $query->whereHas('onboardingState', function ($q) use ($request) {
                $q->where('state', $request->state);
            });
        }

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('email', 'like', "%{$request->search}%");
            });
        }

        $vendors = $query->paginate(20);

        return view('admin.vendors.index', [
            'vendors' => $vendors,
            'filters' => $request->only(['state', 'search']),
        ]);
    }

    public function show(User $user)
    {
        if ($user->role !== 'host') {
            abort(404);
        }

        $user->load([
            'onboardingState.reviewer',
            'onboardingState.kycVerifier',
            'properties',
            'kycSubmissions',
            'flags.flaggedBy',
        ]);

        return view('admin.vendors.show', [
            'vendor' => $user,
        ]);
    }
}
