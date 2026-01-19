<?php

namespace App\Services\Admin;

use App\Models\Admin;
use App\Models\AdminActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class ActivityLogService
{
    public function log(
        Admin $admin,
        string $action,
        Model $entity,
        string $description,
        ?array $metadata = null
    ): AdminActivityLog {
        $request = request();
        
        $log = AdminActivityLog::create([
            'admin_id' => $admin->id,
            'action' => $action,
            'entity_type' => get_class($entity),
            'entity_id' => $entity->id,
            'description' => $description,
            'metadata' => array_merge($metadata ?? [], [
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return $log;
    }

    public function getLogsForEntity(Model $entity, ?int $limit = 50)
    {
        return AdminActivityLog::where('entity_type', get_class($entity))
            ->where('entity_id', $entity->id)
            ->with('admin')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    public function getLogsForAdmin(Admin $admin, ?int $limit = 50)
    {
        return AdminActivityLog::where('admin_id', $admin->id)
            ->with('entity')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }
}
