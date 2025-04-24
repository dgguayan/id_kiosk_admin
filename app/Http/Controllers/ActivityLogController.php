<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ActivityLogController extends Controller
{
    /**
     * Display a listing of activity logs.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $sortField = $request->input('sort_by', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');
        $userId = $request->input('user_id');
        $actionType = $request->input('action');

        $query = ActivityLog::with('user');
        
        // Apply search if provided
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%");
                    });
            });
        }
        
        // Apply user filter if provided
        if ($userId) {
            $query->where('user_id', $userId);
        }
        
        // Apply action filter if provided
        if ($actionType) {
            $query->where('action', $actionType);
        }
        
        $logs = $query
            ->orderBy($sortField, $sortDirection)
            ->paginate(15)
            ->withQueryString();
        
        // Get unique users for filter dropdown
        $users = DB::table('users')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();
            
        // Get unique actions for filter dropdown
        $actions = DB::table('activity_logs')
            ->select('action')
            ->distinct()
            ->orderBy('action')
            ->get()
            ->pluck('action');

        return Inertia::render('ActivityLog/Index', [
            'logs' => $logs,
            'users' => $users,
            'actionTypes' => $actions,
            'filters' => [
                'search' => $search,
                'user_id' => $userId,
                'action' => $actionType,
                'sort_by' => $sortField,
                'sort_direction' => $sortDirection,
            ],
        ]);
    }

    /**
     * Display the specified activity log.
     */
    public function show($id)
    {
        $log = ActivityLog::with('user')->findOrFail($id);
        
        return Inertia::render('ActivityLog/Show', [
            'log' => $log
        ]);
    }

    /**
     * Clear all activity logs.
     */
    public function clearAll()
    {
        ActivityLog::truncate();
        
        return redirect()->route('activity-log.index')->with('success', 'All activity logs have been cleared.');
    }
}
