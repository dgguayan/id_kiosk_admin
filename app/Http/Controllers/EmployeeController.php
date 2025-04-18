<?php

namespace App\Http\Controllers;

use App\Models\BusinessUnit;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class EmployeeController extends Controller
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
        
        $query = Employee::with('businessUnit');
        
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
            // Use the actual foreign key column for sorting
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
        
        return Inertia::render('Employee/Index', [
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
        // Validate the incoming request
        $validated = $request->validate([
            'employee_firstname' => 'required|string|max:255',
            'employee_middlename' => 'nullable|string|max:255',
            'employee_lastname' => 'required|string|max:255',
            'employee_name_extension' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:255',
            'birthday' => 'nullable|date',
            'businessunit_id' => 'required|exists:business_units,businessunit_id',
            'position' => 'required|string|max:255',
            'tin_no' => 'nullable|string|max:255',
            'sss_no' => 'nullable|string|max:255',
            'phic_no' => 'nullable|string|max:255',
            'hdmf_no' => 'nullable|string|max:255',
            'emergency_name' => 'nullable|string|max:255',
            'emergency_contact_number' => 'nullable|string|max:255',
            'emergency_address' => 'nullable|string|max:255',
            'id_status' => 'nullable|string|in:pending,printed',
            'employee_id_counter' => 'nullable|integer',
            'image_person' => 'nullable|image|max:2048',
            'image_signature' => 'nullable|image|max:2048',
            'image_qrcode' => 'nullable|image|max:2048',
            'employment_status' => 'required|string|in:Active,Inactive'
        ]);
        
        try {
            // Generate a unique ID number
            // Get the next available counter number from the last employee
            $lastEmployee = Employee::orderBy('employee_id_counter', 'desc')->first();
            $counter = $lastEmployee ? $lastEmployee->employee_id_counter + 1 : 1;
            
            // Generate the ID without prefix but keep the 6-digit zero-padded format
            $idNo = str_pad($counter, 6, '0', STR_PAD_LEFT);
            
            // Old code with prefix (commented out)
            // $idPrefix = 'EMP-';
            // $idNo = $idPrefix . str_pad($counter, 6, '0', STR_PAD_LEFT);
            
            // Create the new employee within a transaction
            DB::transaction(function () use ($validated, $idNo, $counter, $request) {
                $employee = new Employee();
                $employee->id_no = $idNo;
                $employee->employee_firstname = $validated['employee_firstname'];
                $employee->employee_middlename = $validated['employee_middlename'] ?? null;
                $employee->employee_lastname = $validated['employee_lastname'];
                $employee->employee_name_extension = $validated['employee_name_extension'] ?? null;
                $employee->address = $validated['address'] ?? null;
                $employee->birthday = $validated['birthday'] ?? null;
                $employee->businessunit_id = (int)$validated['businessunit_id'];
                $employee->position = $validated['position'];
                $employee->tin_no = $validated['tin_no'] ?? null;
                $employee->sss_no = $validated['sss_no'] ?? null;
                $employee->phic_no = $validated['phic_no'] ?? null;
                $employee->hdmf_no = $validated['hdmf_no'] ?? null;
                $employee->emergency_name = $validated['emergency_name'] ?? null;
                $employee->emergency_contact_number = $validated['emergency_contact_number'] ?? null;
                $employee->emergency_address = $validated['emergency_address'] ?? null;
                $employee->employment_status = $validated['employment_status'];
                $employee->employee_id_counter = $counter;
                $employee->uuid = \Illuminate\Support\Str::uuid();
                $employee->id_status = $validated['id_status'] ?? 'pending';
                
                // Add current date as date_hired
                $employee->date_hired = now()->format('Y-m-d');
                
                // Handle image uploads if present
                if ($request->hasFile('image_person')) {
                    $file = $request->file('image_person');
                    $imagePersonFilename = time() . '_' . $file->getClientOriginalName();
                    $networkPath = '\\\\DESKTOP-PJE8A0F\\Users\\Public\\images\\employee';
                    if (!file_exists($networkPath)) {
                        mkdir($networkPath, 0777, true);
                    }
                    $file->move($networkPath, $imagePersonFilename);
                    // Store just the filename in the database
                    $employee->image_person = $imagePersonFilename;
                }
                
                if ($request->hasFile('image_signature')) {
                    $file = $request->file('image_signature');
                    $imageSignatureFilename = time() . '_' . $file->getClientOriginalName();
                    $networkPath = '\\\\DESKTOP-PJE8A0F\\Users\\Public\\images\\signature';
                    if (!file_exists($networkPath)) {
                        mkdir($networkPath, 0777, true);
                    }
                    $file->move($networkPath, $imageSignatureFilename);
                    // Store the full network path in the database
                    $employee->image_signature = $imageSignatureFilename;
                }
                
                if ($request->hasFile('image_qrcode')) {
                    $file = $request->file('image_qrcode');
                    $imageQRCodeFilename = time() . '_' . $file->getClientOriginalName();
                    $networkPath = '\\\\DESKTOP-PJE8A0F\\Users\\Public\\images\\qrcode';
                    if (!file_exists($networkPath)) {
                        mkdir($networkPath, 0777, true);
                    }
                    $file->move($networkPath, $imageQRCodeFilename);
                    // Store the full network path in the database
                    $employee->image_qrcode = $imageQRCodeFilename;
                }
                
                $employee->save();
            });
            
            $fullName = $validated['employee_firstname'] . ' ' . $validated['employee_lastname'];
            
            // Return a JSON response for API requests
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => "Employee {$fullName} has been added successfully.",
                    'employee' => $idNo
                ], 201);
            }
            
            // Return a redirect response for web requests
            return redirect()->route('employee.index')->with('success', "Employee {$fullName} has been added successfully.");
        } catch (\Exception $e) {
            Log::error('Failed to add employee: ' . $e->getMessage());
            // Handle errors and return appropriate response
            if ($request->wantsJson()) {
                return response()->json(['error' => 'Failed to add employee: ' . $e->getMessage()], 500);
            }
            
            return redirect()->back()->withInput()->with('error', 'Failed to add employee: ' . $e->getMessage());
        }
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
        // Debug incoming request for detailed troubleshooting
        Log::info('Update employee request received', [
            'id' => $id,
            'has_files' => $request->hasFile('image_person'),
            'request_method' => $request->method(),
            'all_inputs' => $request->except(['image_person', 'image_signature', 'image_qrcode']),
        ]);
        
        // Validate the incoming request
        $validated = $request->validate([
            'employee_firstname' => 'required|string|max:255',
            'employee_middlename' => 'nullable|string|max:255',
            'employee_lastname' => 'required|string|max:255',
            'employee_name_extension' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:255',
            'birthday' => 'nullable|date',
            'businessunit_id' => 'required|exists:business_units,businessunit_id',
            'position' => 'required|string|max:255',
            'tin_no' => 'nullable|string|max:255',
            'sss_no' => 'nullable|string|max:255',
            'phic_no' => 'nullable|string|max:255',
            'hdmf_no' => 'nullable|string|max:255',
            'emergency_name' => 'nullable|string|max:255',
            'emergency_contact_number' => 'nullable|string|max:255',
            'emergency_address' => 'nullable|string|max:255',
            'id_status' => 'nullable|string|in:pending,printed',
            'image_person' => 'nullable|image|max:2048',
            'image_signature' => 'nullable|image|max:2048',
            'image_qrcode' => 'nullable|image|max:2048',
            'employment_status' => 'required|string'
        ]);
        
        try {
            $employee = Employee::where('uuid', $id)->firstOrFail();
            Log::info('Employee found for update', ['uuid' => $id, 'employee_id' => $employee->id]);
            
            DB::transaction(function () use ($validated, $request, $employee) {
                $employee->employee_firstname = $validated['employee_firstname'];
                $employee->employee_middlename = $validated['employee_middlename'] ?? null;
                $employee->employee_lastname = $validated['employee_lastname'];
                $employee->employee_name_extension = $validated['employee_name_extension'] ?? null;
                $employee->address = $validated['address'] ?? null;
                $employee->birthday = $validated['birthday'] ?? null;
                $employee->businessunit_id = (int)$validated['businessunit_id'];
                $employee->position = $validated['position'];
                $employee->tin_no = $validated['tin_no'] ?? null;
                $employee->sss_no = $validated['sss_no'] ?? null;
                $employee->phic_no = $validated['phic_no'] ?? null;
                $employee->hdmf_no = $validated['hdmf_no'] ?? null;
                $employee->emergency_name = $validated['emergency_name'] ?? null;
                $employee->emergency_contact_number = $validated['emergency_contact_number'] ?? null;
                $employee->emergency_address = $validated['emergency_address'] ?? null;
                $employee->employment_status = $validated['employment_status'];
                $employee->id_status = $validated['id_status'] ?? $employee->id_status;
                
                if ($request->hasFile('image_person')) {
                    Log::info('Processing image_person file for employee', ['uuid' => $employee->uuid]);
                    
                    $networkPath = '\\\\DESKTOP-PJE8A0F\\Users\\Public\\images\\employee';
                    
                    if ($employee->image_person && file_exists($networkPath . '\\' . $employee->image_person)) {
                        unlink($networkPath . '\\' . $employee->image_person);
                        Log::info('Previous image_person deleted', ['filename' => $employee->image_person]);
                    }
                    
                    if (!file_exists($networkPath)) {
                        mkdir($networkPath, 0777, true);
                    }
                    
                    $file = $request->file('image_person');
                    $imagePersonFilename = time() . '_' . $file->getClientOriginalName();
                    $file->move($networkPath, $imagePersonFilename);
                    
                    $employee->image_person = $imagePersonFilename;
                }
                
                if ($request->hasFile('image_signature')) {
                    $networkPath = '\\\\DESKTOP-PJE8A0F\\Users\\Public\\images\\signature';
                    
                    if ($employee->image_signature && file_exists($networkPath . '\\' . $employee->image_signature)) {
                        unlink($networkPath . '\\' . $employee->image_signature);
                        Log::info('Previous image_signature deleted', ['filename' => $employee->image_signature]);
                    }
                    
                    if (!file_exists($networkPath)) {
                        mkdir($networkPath, 0777, true);
                    }
                    
                    $file = $request->file('image_signature');
                    $imageSignatureFilename = time() . '_' . $file->getClientOriginalName();
                    $file->move($networkPath, $imageSignatureFilename);
                    
                    // Store just the filename in the database
                    $employee->image_signature = $imageSignatureFilename;
                }
                
                if ($request->hasFile('image_qrcode')) {
                    $networkPath = '\\\\DESKTOP-PJE8A0F\\Users\\Public\\images\\qrcode';
                    
                    // Delete previous QR code if it exists
                    if ($employee->image_qrcode && file_exists($networkPath . '\\' . $employee->image_qrcode)) {
                        unlink($networkPath . '\\' . $employee->image_qrcode);
                        Log::info('Previous image_qrcode deleted', ['filename' => $employee->image_qrcode]);
                    }
                    
                    if (!file_exists($networkPath)) {
                        mkdir($networkPath, 0777, true);
                    }
                    
                    $file = $request->file('image_qrcode');
                    $imageQrcodeFilename = time() . '_' . $file->getClientOriginalName();
                    $file->move($networkPath, $imageQrcodeFilename);
                    
                    $employee->image_qrcode = $imageQrcodeFilename;
                }
                
                $employee->save();
                Log::info('Employee updated successfully in the database', [
                    'uuid' => $employee->uuid, 
                    'name' => $employee->employee_firstname . ' ' . $employee->employee_lastname
                ]);
            });
            
            $fullName = $validated['employee_firstname'] . ' ' . $validated['employee_lastname'];
            
            if ($request->wantsJson()) {
                Log::info('Returning JSON response for employee update', ['uuid' => $id]);
                return response()->json([
                    'success' => true,
                    'employee' => $employee
                ]);
            }
            
            Log::info('Redirecting after employee update', ['uuid' => $id]);
            return redirect()->route('employee.index')->with('success', "Employee {$fullName} has been updated successfully.");
            
        } catch (\Exception $e) {
            Log::error('Failed to update employee: ' . $e->getMessage(), [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'uuid' => $id
            ]);
            
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Failed to update employee: ' . $e->getMessage()
                ], 500);
            }
            
            return redirect()->back()->withInput()->with('error', 'Failed to update employee: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $employee = Employee::where('uuid', $id)->firstOrFail();
            
            $employeeName = $employee->employee_firstname . ' ' . $employee->employee_lastname;
            
            $employee->delete();
            
            return redirect()->route('employee.index')->with('success', "Employee $employeeName has been deleted successfully.");
            
        } catch (\Exception $e) {
            return redirect()->route('employee.index')->with('error', 'Failed to delete employee: ' . $e->getMessage());
        }
    }

    /**
     * Bulk delete of employees
     */
    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'uuids' => 'required|array',
            'uuids.*' => 'string'
        ]);

        try {
            // Find all employees by UUIDs
            $count = Employee::whereIn('uuid', $validated['uuids'])->count();
            
            // Delete them
            Employee::whereIn('uuid', $validated['uuids'])->delete();
            
            // Return success response
            return redirect()->back()->with('success', "$count employees have been deleted successfully.");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to delete employees: ' . $e->getMessage());
        }
    }
}
