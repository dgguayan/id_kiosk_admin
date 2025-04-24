<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

class ActivityLogService
{
    /**
     * Log an activity
     *
     * @param string $action
     * @param string $description
     * @param string|null $modelType
     * @param string|null $modelId
     * @param array|null $properties
     * @return ActivityLog
     */
    public static function log(
        string $action, 
        ?string $description = null, 
        ?string $modelType = null, 
        ?string $modelId = null, 
        ?array $properties = null
    ): ActivityLog
    {
        $request = request();
        
        return ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => $action,
            'description' => $description,
            'model_type' => $modelType,
            'model_id' => $modelId,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'properties' => $properties
        ]);
    }
}
