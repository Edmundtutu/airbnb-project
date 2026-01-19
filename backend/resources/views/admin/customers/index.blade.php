@extends('admin.layouts.app')

@section('title', 'Customers')
@section('page-title', 'Customers')

@section('content')
<div class="card">
    <div class="card-header">
        <form method="GET" action="{{ route('admin.customers.index') }}" class="row g-3">
            <div class="col-md-6">
                <input type="text" name="search" class="form-control" placeholder="Search by name or email..." value="{{ request('search') }}">
            </div>
            <div class="col-md-2">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" name="flagged" id="flagged" value="1" {{ request('flagged') ? 'checked' : '' }}>
                    <label class="form-check-label" for="flagged">Flagged</label>
                </div>
            </div>
            <div class="col-md-2">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" name="restricted" id="restricted" value="1" {{ request('restricted') ? 'checked' : '' }}>
                    <label class="form-check-label" for="restricted">Restricted</label>
                </div>
            </div>
            <div class="col-md-2">
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
                    <th>Registered</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                @forelse($customers as $customer)
                    <tr>
                        <td>{{ $customer->name }}</td>
                        <td>{{ $customer->email }}</td>
                        <td>{{ $customer->created_at->format('M d, Y') }}</td>
                        <td>
                            @if($customer->flagged_at)
                                <span class="badge bg-warning">Flagged</span>
                            @endif
                            @if($customer->restricted_at)
                                <span class="badge bg-danger">Restricted</span>
                            @endif
                        </td>
                        <td>
                            <a href="{{ route('admin.customers.show', $customer) }}" class="btn btn-sm btn-primary">View</a>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="5" class="text-center">No customers found.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
        {{ $customers->links() }}
    </div>
</div>
@endsection
