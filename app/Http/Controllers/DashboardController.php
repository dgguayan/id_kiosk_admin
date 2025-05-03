<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\BusinessUnit;
use App\Models\Employee;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $totalEmployees = Employee::count();
        $pendingIDs = Employee::where('id_status', 'pending')->count();
        $totalIDCounter = Employee::sum('employee_id_counter');
        $businessUnits = BusinessUnit::all()->map(function ($unit) {
            // Count employees by business unit if you have that relationship
            // For example, if there's a relationship between Business Unit and Employee:
            $totalEmployeesByUnit = Employee::where('businessunit_id', $unit->businessunit_id)->count();
            $idCompletionCount = Employee::where('businessunit_id', $unit->businessunit_id)
                                        ->where('id_status', '!=', 'pending')
                                        ->count();
            
            return [
                'id' => $unit->businessunit_id,
                'name' => $unit->businessunit_name,
                'code' => $unit->businessunit_code,
                'totalEmployees' => $totalEmployeesByUnit,
                'idCompletionPercentage' => $totalEmployeesByUnit > 0 
                    ? round(($idCompletionCount / $totalEmployeesByUnit) * 100) 
                    : 0,
                'logoUrl' => $unit->businessunit_image_path 
                    ? "/storage/{$unit->businessunit_image_path}" 
                    : '/images/logos/placeholder-logo.png', // Fallback to placeholder
            ];
        });

        // Get the top 5 employees with expired or soon-to-expire IDs
        $expiringIDs = Employee::whereNotNull('id_last_exported_at')
            ->select(['uuid', 'employee_firstname', 'employee_middlename', 'employee_lastname', 
                    'employee_name_extension', 'businessunit_id', 'id_last_exported_at'])
            ->with(['businessUnit:businessunit_id,businessunit_name'])
            ->get()
            ->map(function ($employee) {
                // Calculate expiry date (2 years after export)
                $exportDate = Carbon::parse($employee->id_last_exported_at);
                $expiryDate = (clone $exportDate)->addYears(2);
                $daysRemaining = Carbon::now()->diffInDays($expiryDate, false);

                $employee->days_remaining = $daysRemaining;
                $employee->businessunit_name = $employee->businessUnit ? 
                    $employee->businessUnit->businessunit_name : 'Unknown';
                
                return $employee;
            })
            ->sortBy('days_remaining') // Sort by days remaining (most urgent first)
            ->take(5) // Get only top 5
            ->values()
            ->toArray();

        $dashboardData = [
            'totalEmployees' => $totalEmployees,
            'pendingIDs' => $pendingIDs,
            'totalIDCounter' => $totalIDCounter,
            'businessUnits' => $businessUnits,
        ];

        return Inertia::render('dashboard', [
            'dashboardData' => $dashboardData,
            'expiringIDs' => $expiringIDs
        ]);
    }
}
