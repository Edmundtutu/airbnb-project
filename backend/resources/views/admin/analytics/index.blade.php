@extends('admin.layouts.app')

@section('title', 'Analytics')
@section('page-title', 'Analytics')

@section('content')
<div class="row">
    <div class="col-md-12">
        <div class="card mb-3">
            <div class="card-header">
                <h5>Vendor Metrics</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-3">
                        <p><strong>Pending:</strong> {{ $vendorMetrics['onboarding_funnel']['pending'] ?? 0 }}</p>
                    </div>
                    <div class="col-md-3">
                        <p><strong>Under Review:</strong> {{ $vendorMetrics['onboarding_funnel']['under_review'] ?? 0 }}</p>
                    </div>
                    <div class="col-md-3">
                        <p><strong>Approved:</strong> {{ $vendorMetrics['onboarding_funnel']['approved'] ?? 0 }}</p>
                    </div>
                    <div class="col-md-3">
                        <p><strong>Rejected:</strong> {{ $vendorMetrics['onboarding_funnel']['rejected'] ?? 0 }}</p>
                    </div>
                </div>
                <hr>
                <p><strong>Average Review Time:</strong> {{ $vendorMetrics['average_review_time_hours'] ?? 0 }} hours</p>
                <p><strong>Rejection Rate:</strong> {{ $vendorMetrics['rejection_rate'] ?? 0 }}%</p>
                <p><strong>Suspension Rate:</strong> {{ $vendorMetrics['suspension_rate'] ?? 0 }}%</p>
            </div>
        </div>

        <div class="card mb-3">
            <div class="card-header">
                <h5>User Metrics</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-4">
                        <p><strong>New Registrations Today:</strong> {{ $userMetrics['new_registrations']['today'] ?? 0 }}</p>
                        <p><strong>This Week:</strong> {{ $userMetrics['new_registrations']['this_week'] ?? 0 }}</p>
                        <p><strong>This Month:</strong> {{ $userMetrics['new_registrations']['this_month'] ?? 0 }}</p>
                    </div>
                    <div class="col-md-4">
                        <p><strong>Active Users (7 days):</strong> {{ $userMetrics['active_users']['last_7_days'] ?? 0 }}</p>
                        <p><strong>Active Users (30 days):</strong> {{ $userMetrics['active_users']['last_30_days'] ?? 0 }}</p>
                    </div>
                    <div class="col-md-4">
                        <p><strong>Hosts:</strong> {{ $userMetrics['role_distribution']['host'] ?? 0 }}</p>
                        <p><strong>Guests:</strong> {{ $userMetrics['role_distribution']['guest'] ?? 0 }}</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h5>Platform Activity</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-4">
                        <p><strong>Total Properties:</strong> {{ $platformActivity['properties']['total'] ?? 0 }}</p>
                        <p><strong>New This Month:</strong> {{ $platformActivity['properties']['new_this_month'] ?? 0 }}</p>
                    </div>
                    <div class="col-md-4">
                        <p><strong>Total Listings:</strong> {{ $platformActivity['listings']['total'] ?? 0 }}</p>
                        <p><strong>Active Listings:</strong> {{ $platformActivity['listings']['active'] ?? 0 }}</p>
                        <p><strong>New This Month:</strong> {{ $platformActivity['listings']['new_this_month'] ?? 0 }}</p>
                    </div>
                    <div class="col-md-4">
                        <p><strong>Total Bookings:</strong> {{ $platformActivity['bookings']['total'] ?? 0 }}</p>
                        <p><strong>This Month:</strong> {{ $platformActivity['bookings']['this_month'] ?? 0 }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
