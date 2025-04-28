<?php

namespace App\Http\Controllers;

use App\Models\BusinessUnit;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // Get total employees count
        $totalEmployees = Employee::count();
        
        // Get pending IDs count
        $pendingIDs = Employee::where('id_status', 'pending')->count();
        
        // Get sum of all employee_id_counter values
        $totalIDCounter = Employee::sum('employee_id_counter');
        
        // Get business units with their employee counts
        $businessUnits = BusinessUnit::select('businessunit_id as id', 'businessunit_name as name')
            ->get()
            ->map(function ($unit) {
                // Count employees in this business unit
                $unitEmployees = Employee::where('businessunit_id', $unit->id)->count();
                
                // Calculate ID completion percentage
                $completedIDs = Employee::where('businessunit_id', $unit->id)
                    ->where('id_status', '!=', 'pending')
                    ->count();
                
                $idCompletionPercentage = $unitEmployees > 0 
                    ? round(($completedIDs / $unitEmployees) * 100) 
                    : 0;
                
                // Map static business unit codes to match the frontend
                $codeMap = [
                    1 => 'MMHI',
                    2 => 'MMEI',
                    3 => 'MMFI',
                    4 => 'MMHC',
                    5 => 'MMDC',
                ];
                
                // Use the static business unit data for code and logo
                $code = isset($codeMap[$unit->id]) ? $codeMap[$unit->id] : 'BU' . $unit->id;
                $logoUrl = "/images/logos/{$code}-logo.png";
                
                return [
                    'id' => $unit->id,
                    'code' => $code,
                    'name' => $unit->name,
                    'totalEmployees' => $unitEmployees,
                    'idCompletionPercentage' => $idCompletionPercentage,
                    'logoUrl' => $logoUrl
                ];
            });

        return Inertia::render('dashboard', [
            'dashboardData' => [
                'totalEmployees' => $totalEmployees,
                'pendingIDs' => $pendingIDs,
                'TotalIDCounter' => $totalIDCounter,
                'businessUnits' => $businessUnits
            ]
        ]);
    }
}
