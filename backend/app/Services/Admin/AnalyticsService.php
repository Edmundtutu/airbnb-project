<?php

namespace App\Services\Admin;

use App\Models\User;
use App\Models\VendorOnboardingState;
use App\Models\Property;
use App\Models\Listing;
use App\Models\Booking;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    public function getVendorMetrics(): array
    {
        $states = VendorOnboardingState::select('state', DB::raw('count(*) as count'))
            ->groupBy('state')
            ->pluck('count', 'state')
            ->toArray();

        $avgReviewTime = VendorOnboardingState::whereNotNull('reviewed_at')
            ->whereNotNull('submitted_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(HOUR, submitted_at, reviewed_at)) as avg_hours')
            ->value('avg_hours');

        return [
            'onboarding_funnel' => [
                'pending' => $states['pending'] ?? 0,
                'under_review' => $states['under_review'] ?? 0,
                'approved' => $states['approved'] ?? 0,
                'rejected' => $states['rejected'] ?? 0,
                'suspended' => $states['suspended'] ?? 0,
            ],
            'average_review_time_hours' => round($avgReviewTime ?? 0, 2),
            'rejection_rate' => $this->calculateRejectionRate(),
            'suspension_rate' => $this->calculateSuspensionRate(),
        ];
    }

    public function getUserMetrics(): array
    {
        $newRegistrations = [
            'today' => User::whereDate('created_at', today())->count(),
            'this_week' => User::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
            'this_month' => User::whereMonth('created_at', now()->month)->whereYear('created_at', now()->year)->count(),
        ];

        $activeUsers = [
            'last_7_days' => User::where('last_active_at', '>=', now()->subDays(7))->count(),
            'last_30_days' => User::where('last_active_at', '>=', now()->subDays(30))->count(),
        ];

        $roleDistribution = User::select('role', DB::raw('count(*) as count'))
            ->groupBy('role')
            ->pluck('count', 'role')
            ->toArray();

        return [
            'new_registrations' => $newRegistrations,
            'active_users' => $activeUsers,
            'role_distribution' => [
                'host' => $roleDistribution['host'] ?? 0,
                'guest' => $roleDistribution['guest'] ?? 0,
            ],
        ];
    }

    public function getPlatformActivity(): array
    {
        return [
            'properties' => [
                'total' => Property::count(),
                'new_this_month' => Property::whereMonth('created_at', now()->month)->count(),
            ],
            'listings' => [
                'total' => Listing::count(),
                'active' => Listing::where('is_active', true)->count(),
                'new_this_month' => Listing::whereMonth('created_at', now()->month)->count(),
            ],
            'bookings' => [
                'total' => Booking::count(),
                'this_month' => Booking::whereMonth('created_at', now()->month)->count(),
            ],
        ];
    }

    private function calculateRejectionRate(): float
    {
        $total = VendorOnboardingState::whereIn('state', ['approved', 'rejected'])->count();
        if ($total === 0) {
            return 0;
        }
        $rejected = VendorOnboardingState::where('state', 'rejected')->count();
        return round(($rejected / $total) * 100, 2);
    }

    private function calculateSuspensionRate(): float
    {
        $total = VendorOnboardingState::whereIn('state', ['approved', 'suspended'])->count();
        if ($total === 0) {
            return 0;
        }
        $suspended = VendorOnboardingState::where('state', 'suspended')->count();
        return round(($suspended / $total) * 100, 2);
    }
}
