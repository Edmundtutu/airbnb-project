<?php

namespace App\Http\Controllers\Admin\Customer;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserFlag;
use App\Services\Admin\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CustomerManagementController extends Controller
{
    public function __construct(
        private ActivityLogService $activityLogService
    ) {}

    public function index(Request $request)
    {
        $query = User::where('role', 'guest')
            ->latest();

        if ($request->has('flagged')) {
            $query->whereNotNull('flagged_at');
        }

        if ($request->has('restricted')) {
            $query->whereNotNull('restricted_at');
        }

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('email', 'like', "%{$request->search}%");
            });
        }

        $customers = $query->paginate(20);

        return view('admin.customers.index', [
            'customers' => $customers,
            'filters' => $request->only(['flagged', 'restricted', 'search']),
        ]);
    }

    public function show(User $user)
    {
        if ($user->role !== 'guest') {
            abort(404);
        }

        $user->load([
            'flags.flaggedBy',
            'flags.resolvedBy',
            'bookings',
            'reviews',
        ]);

        $activityLogs = $this->activityLogService->getLogsForEntity($user, 20);

        return view('admin.customers.show', [
            'customer' => $user,
            'activityLogs' => $activityLogs,
        ]);
    }

    public function flag(Request $request, User $user)
    {
        $request->validate([
            'flag_type' => 'required|in:suspicious_activity,policy_violation,payment_issue,other',
            'reason' => 'required|string|max:1000',
            'severity' => 'required|in:low,medium,high,critical',
        ]);

        $admin = Auth::guard('admin')->user();

        UserFlag::create([
            'user_id' => $user->id,
            'flagged_by' => $admin->id,
            'flag_type' => $request->flag_type,
            'reason' => $request->reason,
            'severity' => $request->severity,
        ]);

        $user->update(['flagged_at' => now()]);

        $this->activityLogService->log(
            admin: $admin,
            action: 'customer.flagged',
            entity: $user,
            description: "Customer {$user->name} flagged by {$admin->name}",
            metadata: [
                'flag_type' => $request->flag_type,
                'severity' => $request->severity,
                'reason' => $request->reason,
            ]
        );

        return redirect()->route('admin.customers.show', $user)
            ->with('success', 'Customer flagged successfully.');
    }
}
