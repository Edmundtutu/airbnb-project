@extends('admin.layouts.app')

@section('title', 'Activity Logs')
@section('page-title', 'Activity Logs')

@section('content')
<div class="card">
    <div class="card-header">
        <form method="GET" action="{{ route('admin.activity-logs.index') }}" class="row g-3">
            <div class="col-md-4">
                <input type="text" name="action" class="form-control" placeholder="Search by action..." value="{{ request('action') }}">
            </div>
            <div class="col-md-4">
                <input type="text" name="entity_type" class="form-control" placeholder="Entity type..." value="{{ request('entity_type') }}">
            </div>
            <div class="col-md-4">
                <button type="submit" class="btn btn-primary w-100">Filter</button>
            </div>
        </form>
    </div>
    <div class="card-body">
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>Timestamp</th>
                    <th>Admin</th>
                    <th>Action</th>
                    <th>Description</th>
                    <th>Entity</th>
                </tr>
            </thead>
            <tbody>
                @forelse($logs as $log)
                    <tr>
                        <td>{{ $log->created_at->format('M d, Y H:i') }}</td>
                        <td>{{ $log->admin->name }}</td>
                        <td><code>{{ $log->action }}</code></td>
                        <td>{{ $log->description }}</td>
                        <td>
                            <small>{{ class_basename($log->entity_type) }} #{{ $log->entity_id }}</small>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="5" class="text-center">No activity logs found.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
        {{ $logs->links() }}
    </div>
</div>
@endsection
