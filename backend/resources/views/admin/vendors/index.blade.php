@extends('admin.layouts.app')

@section('title', 'Vendors')
@section('page-title', 'Vendors')

@section('content')
<div class="card">
    <div class="card-header">
        <form method="GET" action="{{ route('admin.vendors.index') }}" class="row g-3">
            <div class="col-md-3">
                <select name="state" class="form-select">
                    <option value="">All States</option>
                    <option value="pending" {{ request('state') === 'pending' ? 'selected' : '' }}>Pending</option>
                    <option value="under_review" {{ request('state') === 'under_review' ? 'selected' : '' }}>Under Review</option>
                    <option value="approved" {{ request('state') === 'approved' ? 'selected' : '' }}>Approved</option>
                    <option value="rejected" {{ request('state') === 'rejected' ? 'selected' : '' }}>Rejected</option>
                    <option value="suspended" {{ request('state') === 'suspended' ? 'selected' : '' }}>Suspended</option>
                </select>
            </div>
            <div class="col-md-6">
                <input type="text" name="search" class="form-control" placeholder="Search by name or email..." value="{{ request('search') }}">
            </div>
            <div class="col-md-3">
                <button type="submit" class="btn btn-primary w-100">Filter</button>
            </div>
        </form>
    </div>
    <div class="card-body">
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>State</th>
                    <th>Registered</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                @forelse($vendors as $vendor)
                    <tr>
                        <td>{{ $vendor->name }}</td>
                        <td>{{ $vendor->email }}</td>
                        <td>
                            @if($vendor->onboardingState)
                                <span class="badge bg-{{ $vendor->onboardingState->state === 'approved' ? 'success' : ($vendor->onboardingState->state === 'rejected' ? 'danger' : ($vendor->onboardingState->state === 'suspended' ? 'warning' : 'info')) }}">
                                    {{ ucfirst(str_replace('_', ' ', $vendor->onboardingState->state)) }}
                                </span>
                            @else
                                <span class="badge bg-secondary">No State</span>
                            @endif
                        </td>
                        <td>{{ $vendor->created_at->format('M d, Y') }}</td>
                        <td>
                            <a href="{{ route('admin.vendors.show', $vendor) }}" class="btn btn-sm btn-primary">View</a>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="5" class="text-center">No vendors found.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
        {{ $vendors->links() }}
    </div>
</div>
@endsection
