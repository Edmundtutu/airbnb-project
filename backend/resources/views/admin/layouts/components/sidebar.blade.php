@php
    $admin = auth()->guard('admin')->user();
    $role = $admin->role->name ?? 'read_only_analyst';
@endphp

<nav class="col-md-3 col-lg-2 d-md-block bg-light sidebar collapse">
    <div class="position-sticky pt-3">
        <ul class="nav flex-column">
            <li class="nav-item">
                <a class="nav-link {{ request()->routeIs('admin.dashboard') ? 'active' : '' }}" href="{{ route('admin.dashboard') }}">
                    <i class="bi bi-speedometer2"></i> Dashboard
                </a>
            </li>
            
            @if(in_array($role, ['super_admin', 'compliance_admin', 'support_admin', 'read_only_analyst']))
            <li class="nav-item">
                <a class="nav-link {{ request()->routeIs('admin.vendors.*') ? 'active' : '' }}" href="{{ route('admin.vendors.index') }}">
                    <i class="bi bi-shop"></i> Vendors
                </a>
            </li>
            @endif

            @if(in_array($role, ['super_admin', 'support_admin', 'read_only_analyst']))
            <li class="nav-item">
                <a class="nav-link {{ request()->routeIs('admin.customers.*') ? 'active' : '' }}" href="{{ route('admin.customers.index') }}">
                    <i class="bi bi-people"></i> Customers
                </a>
            </li>
            @endif

            @if(in_array($role, ['super_admin', 'compliance_admin', 'support_admin', 'read_only_analyst']))
            <li class="nav-item">
                <a class="nav-link {{ request()->routeIs('admin.analytics.*') ? 'active' : '' }}" href="{{ route('admin.analytics.index') }}">
                    <i class="bi bi-graph-up"></i> Analytics
                </a>
            </li>
            @endif

            @if(in_array($role, ['super_admin', 'compliance_admin', 'support_admin', 'read_only_analyst']))
            <li class="nav-item">
                <a class="nav-link {{ request()->routeIs('admin.activity-logs.*') ? 'active' : '' }}" href="{{ route('admin.activity-logs.index') }}">
                    <i class="bi bi-clock-history"></i> Activity Logs
                </a>
            </li>
            @endif
        </ul>

        <hr>

        <div class="dropdown">
            <a href="#" class="d-flex align-items-center text-decoration-none dropdown-toggle" data-bs-toggle="dropdown">
                <i class="bi bi-person-circle me-2"></i>
                <span>{{ $admin->name }}</span>
            </a>
            <ul class="dropdown-menu">
                <li><span class="dropdown-item-text"><small>{{ $admin->role->display_name ?? 'Admin' }}</small></span></li>
                <li><hr class="dropdown-divider"></li>
                <li>
                    <form action="{{ route('admin.logout') }}" method="POST">
                        @csrf
                        <button type="submit" class="dropdown-item">
                            <i class="bi bi-box-arrow-right"></i> Logout
                        </button>
                    </form>
                </li>
            </ul>
        </div>
    </div>
</nav>
