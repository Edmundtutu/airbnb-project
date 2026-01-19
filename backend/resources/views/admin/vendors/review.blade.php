@extends('admin.layouts.app')

@section('title', 'Review Vendor')
@section('page-title', 'Review Vendor: ' . $vendor->name)

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
            </div>
        </div>

        <div class="card mb-3">
            <div class="card-header">
                <h5>Review Actions</h5>
            </div>
            <div class="card-body">
                <form method="POST" action="{{ route('admin.vendors.approve', $vendor) }}" class="d-inline mb-2">
                    @csrf
                    <div class="mb-3">
                        <label for="approve_notes" class="form-label">Internal Notes (Optional)</label>
                        <textarea class="form-control" id="approve_notes" name="notes" rows="2"></textarea>
                    </div>
                    <button type="submit" class="btn btn-success">Approve Vendor</button>
                </form>

                <button type="button" class="btn btn-danger" data-bs-toggle="modal" data-bs-target="#rejectModal">Reject Vendor</button>
            </div>
        </div>

        @if($activityLogs->count() > 0)
            <div class="card">
                <div class="card-header">
                    <h5>Activity Timeline</h5>
                </div>
                <div class="card-body">
                    <ul class="list-unstyled">
                        @foreach($activityLogs as $log)
                            <li class="mb-2">
                                <small class="text-muted">{{ $log->created_at->format('M d, Y H:i') }}</small><br>
                                <strong>{{ $log->admin->name }}</strong>: {{ $log->description }}
                            </li>
                        @endforeach
                    </ul>
                </div>
            </div>
        @endif
    </div>
</div>

<!-- Reject Modal -->
<div class="modal fade" id="rejectModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <form method="POST" action="{{ route('admin.vendors.reject', $vendor) }}">
                @csrf
                <div class="modal-header">
                    <h5 class="modal-title">Reject Vendor</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="rejection_reason" class="form-label">Rejection Reason *</label>
                        <textarea class="form-control" id="rejection_reason" name="reason" rows="3" required></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-danger">Reject Vendor</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection
