@extends('admin.layouts.app')

@section('title', 'Customer Details')
@section('page-title', 'Customer: ' . $customer->name)

@section('content')
<div class="row">
    <div class="col-md-8">
        <div class="card mb-3">
            <div class="card-header">
                <h5>Customer Information</h5>
            </div>
            <div class="card-body">
                <p><strong>Name:</strong> {{ $customer->name }}</p>
                <p><strong>Email:</strong> {{ $customer->email }}</p>
                <p><strong>Phone:</strong> {{ $customer->phone ?? 'N/A' }}</p>
                <p><strong>Registered:</strong> {{ $customer->created_at->format('M d, Y H:i') }}</p>
            </div>
        </div>

        <div class="card mb-3">
            <div class="card-header">
                <h5>Actions</h5>
            </div>
            <div class="card-body">
                <button type="button" class="btn btn-warning" data-bs-toggle="modal" data-bs-target="#flagModal">Flag Customer</button>
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
    <div class="col-md-4">
        <div class="card">
            <div class="card-header">
                <h5>Quick Stats</h5>
            </div>
            <div class="card-body">
                <p><strong>Bookings:</strong> {{ $customer->bookings->count() }}</p>
                <p><strong>Reviews:</strong> {{ $customer->reviews->count() }}</p>
                <p><strong>Flags:</strong> {{ $customer->flags->count() }}</p>
            </div>
        </div>
    </div>
</div>

<!-- Flag Modal -->
<div class="modal fade" id="flagModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <form method="POST" action="{{ route('admin.customers.flag', $customer) }}">
                @csrf
                <div class="modal-header">
                    <h5 class="modal-title">Flag Customer</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="flag_type" class="form-label">Flag Type *</label>
                        <select class="form-select" id="flag_type" name="flag_type" required>
                            <option value="suspicious_activity">Suspicious Activity</option>
                            <option value="policy_violation">Policy Violation</option>
                            <option value="payment_issue">Payment Issue</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="severity" class="form-label">Severity *</label>
                        <select class="form-select" id="severity" name="severity" required>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="reason" class="form-label">Reason *</label>
                        <textarea class="form-control" id="reason" name="reason" rows="3" required></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-warning">Flag Customer</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection
