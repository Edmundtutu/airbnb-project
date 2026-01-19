@extends('admin.layouts.app')

@section('title', 'Vendor Details')
@section('page-title', 'Vendor: ' . $vendor->name)

@section('content')
<div class="row">
    <div class="col-md-8">
        <div class="card mb-3">
            <div class="card-header">
                <h5>Vendor Information</h5>
            </div>
            <div class="card-body">
                <p><strong>Name:</strong> {{ $vendor->name }}</p>
                <p><strong>Email:</strong> {{ $vendor->email }}</p>
                <p><strong>Phone:</strong> {{ $vendor->phone ?? 'N/A' }}</p>
                <p><strong>Registered:</strong> {{ $vendor->created_at->format('M d, Y H:i') }}</p>
                @if($vendor->onboardingState)
                    <p><strong>State:</strong> 
                        <span class="badge bg-{{ $vendor->onboardingState->state === 'approved' ? 'success' : ($vendor->onboardingState->state === 'rejected' ? 'danger' : ($vendor->onboardingState->state === 'suspended' ? 'warning' : 'info')) }}">
                            {{ ucfirst(str_replace('_', ' ', $vendor->onboardingState->state)) }}
                        </span>
                    </p>
                @endif
            </div>
        </div>

        @if($vendor->onboardingState && in_array($vendor->onboardingState->state, ['under_review', 'approved']))
            <div class="card mb-3">
                <div class="card-header">
                    <h5>Review Actions</h5>
                </div>
                <div class="card-body">
                    @if($vendor->onboardingState->state === 'under_review')
                        <a href="{{ route('admin.vendors.review', $vendor) }}" class="btn btn-primary">Review Vendor</a>
                    @endif
                    @if($vendor->onboardingState->state === 'approved')
                        <form method="POST" action="{{ route('admin.vendors.suspend', $vendor) }}" class="d-inline">
                            @csrf
                            <button type="button" class="btn btn-warning" data-bs-toggle="modal" data-bs-target="#suspendModal">Suspend</button>
                        </form>
                    @endif
                </div>
            </div>
        @endif
    </div>
    <div class="col-md-4">
        <div class="card">
            <div class="card-header">
                <h5>Quick Stats</h5>
            </div>
            <div class="card-body">
                <p><strong>Properties:</strong> {{ $vendor->properties->count() }}</p>
                <p><strong>KYC Submissions:</strong> {{ $vendor->kycSubmissions->count() }}</p>
                <p><strong>Flags:</strong> {{ $vendor->flags->count() }}</p>
            </div>
        </div>
    </div>
</div>

<!-- Suspend Modal -->
<div class="modal fade" id="suspendModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <form method="POST" action="{{ route('admin.vendors.suspend', $vendor) }}">
                @csrf
                <div class="modal-header">
                    <h5 class="modal-title">Suspend Vendor</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="reason" class="form-label">Reason *</label>
                        <textarea class="form-control" id="reason" name="reason" rows="3" required></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-warning">Suspend Vendor</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection
