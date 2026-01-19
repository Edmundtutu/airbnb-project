@extends('admin.layouts.app')

@section('title', 'Dashboard')
@section('page-title', 'Dashboard')

@section('content')
<div class="row">
    <div class="col-md-3">
        <div class="card text-white bg-primary mb-3">
            <div class="card-body">
                <h5 class="card-title">Pending Vendors</h5>
                <h2>{{ $vendorMetrics['onboarding_funnel']['pending'] ?? 0 }}</h2>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card text-white bg-info mb-3">
            <div class="card-body">
                <h5 class="card-title">Under Review</h5>
                <h2>{{ $vendorMetrics['onboarding_funnel']['under_review'] ?? 0 }}</h2>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card text-white bg-success mb-3">
            <div class="card-body">
                <h5 class="card-title">Approved</h5>
                <h2>{{ $vendorMetrics['onboarding_funnel']['approved'] ?? 0 }}</h2>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card text-white bg-warning mb-3">
            <div class="card-body">
                <h5 class="card-title">New Users (Today)</h5>
                <h2>{{ $userMetrics['new_registrations']['today'] ?? 0 }}</h2>
            </div>
        </div>
    </div>
</div>

<div class="row mt-4">
    <div class="col-md-6">
        <div class="card">
            <div class="card-header">
                <h5>Vendor Onboarding Metrics</h5>
            </div>
            <div class="card-body">
                <p><strong>Average Review Time:</strong> {{ $vendorMetrics['average_review_time_hours'] ?? 0 }} hours</p>
                <p><strong>Rejection Rate:</strong> {{ $vendorMetrics['rejection_rate'] ?? 0 }}%</p>
                <p><strong>Suspension Rate:</strong> {{ $vendorMetrics['suspension_rate'] ?? 0 }}%</p>
            </div>
        </div>
    </div>
    <div class="col-md-6">
        <div class="card">
            <div class="card-header">
                <h5>Platform Activity</h5>
            </div>
            <div class="card-body">
                <p><strong>Total Properties:</strong> {{ $platformActivity['properties']['total'] ?? 0 }}</p>
                <p><strong>Active Listings:</strong> {{ $platformActivity['listings']['active'] ?? 0 }}</p>
                <p><strong>Bookings This Month:</strong> {{ $platformActivity['bookings']['this_month'] ?? 0 }}</p>
            </div>
        </div>
    </div>
</div>
@endsection
