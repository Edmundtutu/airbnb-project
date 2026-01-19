@extends('admin.layouts.app')

@section('title', 'Review KYC Submission')
@section('page-title', 'Review KYC Submission')

@section('content')
<div class="row">
    <div class="col-md-8">
        <div class="card mb-3">
            <div class="card-header">
                <h5>Submission Details</h5>
            </div>
            <div class="card-body">
                <p><strong>Vendor:</strong> {{ $submission->user->name }}</p>
                <p><strong>Document Type:</strong> {{ ucfirst(str_replace('_', ' ', $submission->document_type)) }}</p>
                <p><strong>File Name:</strong> {{ $submission->file_name }}</p>
                <p><strong>Submitted:</strong> {{ $submission->created_at->format('M d, Y H:i') }}</p>
                @if($submission->expires_at)
                    <p><strong>Expires:</strong> {{ $submission->expires_at->format('M d, Y') }}</p>
                @endif
            </div>
        </div>

        <div class="card mb-3">
            <div class="card-header">
                <h5>Review Actions</h5>
            </div>
            <div class="card-body">
                <form method="POST" action="{{ route('admin.kyc.approve', $submission) }}" class="d-inline mb-2">
                    @csrf
                    <div class="mb-3">
                        <label for="approve_notes" class="form-label">Notes (Optional)</label>
                        <textarea class="form-control" id="approve_notes" name="notes" rows="2"></textarea>
                    </div>
                    <button type="submit" class="btn btn-success">Approve</button>
                </form>

                <button type="button" class="btn btn-danger" data-bs-toggle="modal" data-bs-target="#rejectModal">Reject</button>
            </div>
        </div>
    </div>
</div>

<!-- Reject Modal -->
<div class="modal fade" id="rejectModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <form method="POST" action="{{ route('admin.kyc.reject', $submission) }}">
                @csrf
                <div class="modal-header">
                    <h5 class="modal-title">Reject KYC Submission</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="rejection_notes" class="form-label">Rejection Notes *</label>
                        <textarea class="form-control" id="rejection_notes" name="notes" rows="3" required></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-danger">Reject Submission</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection
