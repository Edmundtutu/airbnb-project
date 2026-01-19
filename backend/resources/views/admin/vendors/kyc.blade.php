@extends('admin.layouts.app')

@section('title', 'Pending KYC Submissions')
@section('page-title', 'Pending KYC Submissions')

@section('content')
<div class="card">
    <div class="card-body">
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>Vendor</th>
                    <th>Document Type</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                @forelse($submissions as $submission)
                    <tr>
                        <td>{{ $submission->user->name }}</td>
                        <td>{{ ucfirst(str_replace('_', ' ', $submission->document_type)) }}</td>
                        <td>{{ $submission->created_at->format('M d, Y') }}</td>
                        <td><span class="badge bg-warning">{{ ucfirst($submission->status) }}</span></td>
                        <td>
                            <a href="{{ route('admin.kyc.show', $submission) }}" class="btn btn-sm btn-primary">Review</a>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="5" class="text-center">No pending KYC submissions.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
        {{ $submissions->links() }}
    </div>
</div>
@endsection
