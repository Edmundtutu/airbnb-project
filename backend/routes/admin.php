<?php

use App\Http\Controllers\Admin\Auth\AdminLoginController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\Vendor\VendorManagementController;
use App\Http\Controllers\Admin\Vendor\VendorOnboardingController;
use App\Http\Controllers\Admin\Vendor\VendorKYCController;
use App\Http\Controllers\Admin\Customer\CustomerManagementController;
use App\Http\Controllers\Admin\Analytics\AnalyticsController;
use App\Http\Controllers\Admin\ActivityLogController;
use Illuminate\Support\Facades\Route;

// Auth routes (no middleware)
Route::get('/login', [AdminLoginController::class, 'showLoginForm'])->name('login');
Route::post('/login', [AdminLoginController::class, 'login']);
Route::post('/logout', [AdminLoginController::class, 'logout'])->name('logout')->middleware('admin.auth');

// Protected routes
Route::middleware(['admin.auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // Vendor routes
    Route::middleware(['admin.permission:vendor.view'])->group(function () {
        Route::get('/vendors', [VendorManagementController::class, 'index'])->name('vendors.index');
        Route::get('/vendors/{user}', [VendorManagementController::class, 'show'])->name('vendors.show');
        Route::get('/vendors/{user}/review', [VendorOnboardingController::class, 'showReview'])->name('vendors.review');
        
        Route::post('/vendors/{user}/approve', [VendorOnboardingController::class, 'approve'])
            ->middleware('admin.permission:vendor.approve')
            ->name('vendors.approve');
        Route::post('/vendors/{user}/reject', [VendorOnboardingController::class, 'reject'])
            ->middleware('admin.permission:vendor.reject')
            ->name('vendors.reject');
        Route::post('/vendors/{user}/suspend', [VendorOnboardingController::class, 'suspend'])
            ->middleware('admin.permission:vendor.suspend')
            ->name('vendors.suspend');
    });
    
    // KYC routes
    Route::middleware(['admin.permission:kyc.view'])->group(function () {
        Route::get('/kyc/pending', [VendorKYCController::class, 'pending'])->name('kyc.pending');
        Route::get('/kyc/{submission}', [VendorKYCController::class, 'show'])->name('kyc.show');
        Route::post('/kyc/{submission}/approve', [VendorKYCController::class, 'approve'])
            ->middleware('admin.permission:kyc.approve')
            ->name('kyc.approve');
        Route::post('/kyc/{submission}/reject', [VendorKYCController::class, 'reject'])
            ->middleware('admin.permission:kyc.reject')
            ->name('kyc.reject');
    });
    
    // Customer routes
    Route::middleware(['admin.permission:customer.view'])->group(function () {
        Route::get('/customers', [CustomerManagementController::class, 'index'])->name('customers.index');
        Route::get('/customers/{user}', [CustomerManagementController::class, 'show'])->name('customers.show');
        Route::post('/customers/{user}/flag', [CustomerManagementController::class, 'flag'])
            ->middleware('admin.permission:customer.flag')
            ->name('customers.flag');
    });
    
    // Analytics routes
    Route::middleware(['admin.permission:analytics.view'])->group(function () {
        Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');
    });
    
    // Activity logs
    Route::middleware(['admin.permission:activity_logs.view'])->group(function () {
        Route::get('/activity-logs', [ActivityLogController::class, 'index'])->name('activity-logs.index');
    });
});
