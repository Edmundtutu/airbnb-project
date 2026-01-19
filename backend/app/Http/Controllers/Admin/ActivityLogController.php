<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = AdminActivityLog::with(['admin', 'entity'])
            ->latest();

        if ($request->has('admin_id')) {
            $query->where('admin_id', $request->admin_id);
        }

        if ($request->has('action')) {
            $query->where('action', 'like', "%{$request->action}%");
        }

        if ($request->has('entity_type')) {
            $query->where('entity_type', $request->entity_type);
        }

        $logs = $query->paginate(50);

        return view('admin.activity-logs.index', [
            'logs' => $logs,
            'filters' => $request->only(['admin_id', 'action', 'entity_type']),
        ]);
    }
}
