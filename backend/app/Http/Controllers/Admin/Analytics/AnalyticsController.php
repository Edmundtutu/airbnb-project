<?php

namespace App\Http\Controllers\Admin\Analytics;

use App\Http\Controllers\Controller;
use App\Services\Admin\AnalyticsService;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    public function __construct(
        private AnalyticsService $analyticsService
    ) {}

    public function index()
    {
        $vendorMetrics = $this->analyticsService->getVendorMetrics();
        $userMetrics = $this->analyticsService->getUserMetrics();
        $platformActivity = $this->analyticsService->getPlatformActivity();

        return view('admin.analytics.index', [
            'vendorMetrics' => $vendorMetrics,
            'userMetrics' => $userMetrics,
            'platformActivity' => $platformActivity,
        ]);
    }
}
