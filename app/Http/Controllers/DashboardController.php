<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\BusinessUnit;
use App\Models\Employee;

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

        $dashboardData = [
            'totalEmployees' => $totalEmployees,
            'pendingIDs' => $pendingIDs,
            'totalIDCounter' => $totalIDCounter,
            'businessUnits' => $businessUnits,
        ];

        return Inertia::render('dashboard', [
            'dashboardData' => $dashboardData,
        ]);
    }
}
