<?php

namespace App\Http\Controllers;

use App\Models\BusinessUnit;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth; // Add this import
use Inertia\Inertia;

class PendingIdController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $sortField = $request->input('sort_by', 'employee_lastname');
        $sortDirection = $request->input('sort_direction', 'asc');
        $businessUnitId = $request->input('businessunit_id');
        
        $query = Employee::with('businessUnit')
                ->where('id_status', 'pending'); // Filter only employees with pending ID status
        
        // Apply search if provided
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('employee_firstname', 'like', "%{$search}%")
                    ->orWhere('employee_lastname', 'like', "%{$search}%")
                    ->orWhere('employee_middlename', 'like', "%{$search}%")
                    ->orWhere('id_no', 'like', "%{$search}%")
                    ->orWhereHas('businessUnit', function ($bq) use ($search) {
                        $bq->where('businessunit_name', 'like', "%{$search}%");
                    });
            });
        }
        
        // Apply business unit filter if provided
        if ($businessUnitId) {
            $query->where('businessunit_id', $businessUnitId);
        }
        
        // Map virtual field to actual column for sorting
        if ($sortField === 'businessunit_name') {
            $sortField = 'businessunit_id';
        }
        
        $employees = $query
            ->orderBy($sortField, $sortDirection)
            ->paginate(10)
            ->withQueryString();
        
        // Transform the employees to include business unit name
        $transformedEmployees = collect($employees->items())->map(function ($employee) {
            // Add the business unit name to each employee
            $employee->businessunit_name = $employee->businessUnit ? $employee->businessUnit->businessunit_name : null;
            return $employee;
        });
        
        // Fetch business units for the dropdown - use the correct primary key field
        $businessUnits = BusinessUnit::orderBy('businessunit_name')
            ->get(['businessunit_id AS id', 'businessunit_name']);
        
        // Get current user's role for permission control
        $currentUserRole = Auth::user()->role;
        
        return Inertia::render('PendingId/Index', [
            'employees' => $transformedEmployees->all(),
            'meta' => [
                'current_page' => $employees->currentPage(),
                'last_page' => $employees->lastPage(),
                'total' => $employees->total(),
                'per_page' => $employees->perPage(),
            ],
            'filters' => [
                'search' => $search,
                'businessunit_id' => $businessUnitId,
                'page' => $request->input('page', 1),
                'per_page' => 10,
                'sort_by' => $sortField === 'businessunit_id' ? 'businessunit_name' : $sortField,
                'sort_direction' => $sortDirection,
            ],
            'businessUnits' => $businessUnits, // Pass business units for the dropdown
            'currentUserRole' => $currentUserRole, // Pass the current user role
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $employee = Employee::findOrFail($id);
            $employee->delete();
            
            return redirect()->route('pending-id.index')
                ->with('success', 'Employee deleted successfully');
        } catch (\Exception $e) {
            return redirect()->route('pending-id.index')
                ->with('error', 'Failed to delete employee: ' . $e->getMessage());
        }
    }
    
    /**
     * Bulk delete the specified resources from storage.
     */
    public function bulkDestroy(Request $request)
    {
        try {
            $uuids = $request->input('uuids', []);
            $deletedCount = Employee::whereIn('uuid', $uuids)->delete();
            
            return redirect()->route('pending-id.index')
                ->with('success', $deletedCount . ' employees deleted successfully');
        } catch (\Exception $e) {
            return redirect()->route('pending-id.index')
                ->with('error', 'Failed to delete employees: ' . $e->getMessage());
        }
    }
}
