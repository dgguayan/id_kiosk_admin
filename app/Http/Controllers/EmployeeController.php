<?php

namespace App\Http\Controllers;

use App\Models\BusinessUnit;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use App\Services\ActivityLogService;
use App\Models\Setting;

class EmployeeController extends Controller
{
    /**
     * Network path for storing images.
     *
     * @var string
     */
    protected $networkPath;
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $sortField = $request->input('sort_by', 'employee_lastname');
        $sortDirection = $request->input('sort_direction', 'asc');
        $businessUnitId = $request->input('businessunit_id');
        $perPage = $request->get('per_page', 10);
        
        $query = Employee::with('businessUnit');
        
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('employee_firstname', 'like', "%{$search}%")
                    ->orWhere('employee_lastname', 'like', "%{$search}%")
                    ->orWhere('employee_middlename', 'like', "%{$search}%")
                    ->orWhere('id_no', 'like', "%{$search}%")
                    ->orWhere('position', 'like', "%{$search}%")
                    ->orWhereHas('businessUnit', function ($bq) use ($search) {
                        $bq->where('businessunit_name', 'like', "%{$search}%");
                    });
            });
        }
        
        if ($businessUnitId) {
            $query->where('businessunit_id', $businessUnitId);
        }
        
        // Special handling for date fields
        if ($sortField === 'id_last_exported_at') {
            // Handle nulls - in MySQL nulls are sorted differently than in JavaScript
            if ($sortDirection === 'asc') {
                // Sort nulls last when ascending
                $query->orderByRaw("COALESCE(id_last_exported_at, '9999-12-31') $sortDirection");
            } else {
                // Sort nulls first when descending
                $query->orderByRaw("COALESCE(id_last_exported_at, '1000-01-01') $sortDirection");
            }
        } else if ($sortField === 'businessunit_name') {
            $sortField = 'businessunit_id';
            $query->orderBy($sortField, $sortDirection);
        } else {
            // Regular sorting for other fields
            $query->orderBy($sortField, $sortDirection);
        }
        
        $employees = $query
            ->paginate($perPage)
            ->withQueryString();
        
        $transformedEmployees = collect($employees->items())->map(function ($employee) {
            $employee->businessunit_name = $employee->businessUnit ? $employee->businessUnit->businessunit_name : null;
            return $employee;
        });
        
        $businessUnits = BusinessUnit::orderBy('businessunit_name')
            ->get(['businessunit_id AS id', 'businessunit_name']);
        
        // Get current user's role for permission control
        $currentUserRole = Auth::user()->role;
        
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
                'per_page' => $perPage,
                'sort_by' => $sortField === 'businessunit_id' ? 'businessunit_name' : $sortField,
                'sort_direction' => $sortDirection,
            ],
            'businessUnits' => $businessUnits,
            'currentUserRole' => $currentUserRole,
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
            'image_person' => 'nullable|image|max:2048',
            'image_signature' => 'nullable|image|max:2048',
            'image_qrcode' => 'nullable|image|max:2048',
            'employment_status' => 'required|string|in:Active,Inactive'
        ]);
        
        try {
            // Get the current counter value from the settings table
            $counterSetting = DB::table('settings')->where('key', 'employee_id_counter')->first();
            $newIdNo = $counterSetting ? (int)$counterSetting->value : 1;
            
            // Format the ID with leading zeros
            $idNo = str_pad($newIdNo, 6, '0', STR_PAD_LEFT);
            
            DB::transaction(function () use ($validated, $idNo, $request, $newIdNo) {
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
                $employee->employee_id_counter = 0;
                $employee->uuid = \Illuminate\Support\Str::uuid();
                $employee->id_status = $validated['id_status'] ?? 'pending';
                
                $employee->date_hired = now()->format('Y-m-d');
                
                if ($request->hasFile('image_person')) {
                    $file = $request->file('image_person');
                    $imagePersonFilename = time() . '_' . $file->getClientOriginalName();
                    
                    // Get path from database settings, with fallback to default
                    $basePath = \App\Models\NetworkPath::getNetworkPath(
                        'network_images_path', 
                        '\\\\DESKTOP-PJE8A0F\\Users\\Public\\images\\'
                    );
                    
                    $networkPath = $basePath . 'employee';
                    
                    if (!file_exists($networkPath)) {
                        mkdir($networkPath, 0777, true);
                    }
                    
                    $file->move($networkPath, $imagePersonFilename);
                    $employee->image_person = $imagePersonFilename;
                }
                
                if ($request->hasFile('image_signature')) {
                    $file = $request->file('image_signature');
                    $imageSignatureFilename = time() . '_' . $file->getClientOriginalName();
                    
                    // Get path from database settings
                    $basePath = \App\Models\NetworkPath::getNetworkPath(
                        'network_images_path', 
                        '\\\\DESKTOP-PJE8A0F\\Users\\Public\\images\\'
                    );
                    
                    $networkPath = $basePath . 'signature';
                    
                    if (!file_exists($networkPath)) {
                        mkdir($networkPath, 0777, true);
                    }
                    
                    $file->move($networkPath, $imageSignatureFilename);
                    $employee->image_signature = $imageSignatureFilename;
                }
                
                // For image_qrcode in store method
                if ($request->hasFile('image_qrcode')) {
                    $file = $request->file('image_qrcode');
                    $imageQRCodeFilename = time() . '_' . $file->getClientOriginalName();
                    
                    // Get path from database settings
                    $basePath = \App\Models\NetworkPath::getNetworkPath(
                        'network_images_path', 
                        '\\\\DESKTOP-PJE8A0F\\Users\\Public\\images\\'
                    );
                    
                    $networkPath = $basePath . 'qrcode';
                    
                    if (!file_exists($networkPath)) {
                        mkdir($networkPath, 0777, true);
                    }
                    
                    $file->move($networkPath, $imageQRCodeFilename);
                    $employee->image_qrcode = $imageQRCodeFilename;
                }
                
                $employee->save();
                
                // Increment and update the counter in the settings table
                DB::table('settings')
                    ->where('key', 'employee_id_counter')
                    ->update([
                        'value' => $newIdNo + 1,
                        'updated_at' => now()
                    ]);
            });
            
            $fullName = $validated['employee_firstname'] . ' ' . $validated['employee_lastname'];
            
            // Log activity
            ActivityLogService::log(
                'employee_created',
                "Employee {$fullName} was created",
                'App\Models\Employee',
                $idNo,
                ['name' => $fullName, 'position' => $validated['position']]
            );
            
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => "Employee {$fullName} has been added successfully.",
                    'employee' => $idNo
                ], 201);
            }
            
            return redirect()->route('employee.index')->with('success', "Employee {$fullName} has been added successfully.");
        } catch (\Exception $e) {
            Log::error('Failed to add employee: ' . $e->getMessage());
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
            
            $oldData = $employee->toArray();
            
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
                    
                    // Get path from database settings, with fallback to default
                    $basePath = \App\Models\NetworkPath::getNetworkPath(
                        'network_images_path', 
                        '\\\\DESKTOP-PJE8A0F\\Users\\Public\\images\\'
                    );
                    
                    $networkPath = $basePath . 'employee';
                    
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
                    // Get path from database settings, with fallback to default
                    $basePath = \App\Models\NetworkPath::getNetworkPath(
                        'network_images_path', 
                        '\\\\DESKTOP-PJE8A0F\\Users\\Public\\images\\'
                    );
                    
                    $networkPath = $basePath . 'signature';
                    
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
                    // Get path from database settings, with fallback to default
                    $basePath = \App\Models\NetworkPath::getNetworkPath(
                        'network_images_path', 
                        '\\\\DESKTOP-PJE8A0F\\Users\\Public\\images\\'
                    );
                    
                    $networkPath = $basePath . 'qrcode';
                    
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
            
            // Log the activity
            ActivityLogService::log(
                'employee_updated',
                "Employee {$fullName} was updated",
                'App\Models\Employee',
                $employee->id,
                [
                    'old' => array_intersect_key($oldData, $validated),
                    'new' => $validated
                ]
            );
            
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
        // Check if user has permission to delete
        if (Auth::user()->role !== 'Admin') {
            abort(403, 'Only administrators can delete employees.');
        }
        
        try {
            $employee = Employee::where('uuid', $id)->firstOrFail();
            
            $employeeName = $employee->employee_firstname . ' ' . $employee->employee_lastname;
            
            $employee->delete();
            
            // Log the activity
            ActivityLogService::log(
                'employee_deleted',
                "Employee {$employeeName} was deleted",
                'App\Models\Employee',
                $id,
                ['name' => $employeeName]
            );
            
            return redirect()->route('employee.index')->with('success', "Employee $employeeName has been deleted successfully.");
            
        } catch (\Exception $e) {
            return redirect()->route('employee.index')->with('error', 'Failed to delete employee: ' . $e->getMessage());
        }
    }

    /**
     * Bulk delete employees.
     */
    public function bulkDestroy(Request $request)
    {
        // Check if user has permission to delete
        if (Auth::user()->role !== 'Admin') {
            abort(403, 'Only administrators can delete employees.');
        }
        
        $validated = $request->validate([
            'uuids' => 'required|array',
            'uuids.*' => 'string'
        ]);

        try {
            // Find all employees by UUIDs for logging purposes
            $employees = Employee::whereIn('uuid', $validated['uuids'])->get();
            
            // Log details about each employee being deleted
            $employeeDetails = $employees->map(function($employee) {
                return [
                    'uuid' => $employee->uuid,
                    'id_no' => $employee->id_no,
                    'name' => $employee->employee_firstname . ' ' . $employee->employee_lastname,
                    'position' => $employee->position,
                    'businessunit_id' => $employee->businessunit_id
                ];
            })->toArray();
            
            // Delete the employees
            Employee::whereIn('uuid', $validated['uuids'])->delete();
            
            // Log the activity
            ActivityLogService::log(
                'employee_bulk_deleted',
                $employees->count() . " employees were deleted in bulk",
                'App\Models\Employee',
                null,
                [
                    'count' => $employees->count(),
                    'deleted_by' => Auth::user()->name,
                    'user_role' => Auth::user()->role,
                    'employee_details' => $employeeDetails
                ]
            );
            
            // Also log to Laravel's log system for debugging
            Log::info('Bulk employee deletion', [
                'count' => $employees->count(),
                'deleted_by' => Auth::user()->name,
                'user_role' => Auth::user()->role,
                'employee_details' => $employeeDetails
            ]);
            
            // Return success response
            return redirect()->back()->with('success', $employees->count() . " employees have been deleted successfully.");
        } catch (\Exception $e) {
            Log::error('Failed to delete employees in bulk: ' . $e->getMessage(), [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'uuids' => $validated['uuids']
            ]);
            
            return redirect()->back()->with('error', 'Failed to delete employees: ' . $e->getMessage());
        }
    }

    /**
     * Display the ID card preview for the specified employee.
     */
    public function idPreview(string $id)
    {
        try {
            // Find employee by UUID
            $employee = Employee::where('uuid', $id)
                ->with('businessUnit')
                ->firstOrFail();
                
            // Format the employee object for frontend
            $employee->businessunit_name = $employee->businessUnit ? $employee->businessUnit->businessunit_name : null;
            
            // Find template by business unit ID
            $templateImage = DB::table('template_images')
                ->where('businessunit_id', $employee->businessunit_id)
                ->first();
            
            // Use the template ID from template_images if found, otherwise use default
            $templateId = $templateImage ? $templateImage->id : 1;
            
            // Log the employee and template association
            Log::info('ID Card preview details', [
                'employee_uuid' => $id,
                'employee_id' => $employee->id,
                'businessunit_id' => $employee->businessunit_id,
                'template_id' => $templateId
            ]);
            
            // Get template images data from the database
            $templateImages = $this->getTemplateImagesData($templateId);
            
            // Ensure the public/images directory exists
            $imagesDir = public_path('images');
            if (!file_exists($imagesDir)) {
                mkdir($imagesDir, 0755, true);
            }
            
            // Create default templates if they don't exist
            $this->createDefaultTemplatesIfNeeded();
            
            // Get template paths with debug info
            $frontTemplate = $this->getFrontTemplatePath($templateId);
            $backTemplate = $this->getBackTemplatePath($templateId);
            
            // Process hidden elements from the template
            $hiddenElements = [];
            if ($templateImage && isset($templateImage->hidden_elements)) {
                try {
                    if (is_string($templateImage->hidden_elements)) {
                        $hiddenElements = json_decode($templateImage->hidden_elements, true) ?? [];
                    } else {
                        $hiddenElements = $templateImage->hidden_elements ?? [];
                    }
                } catch (\Exception $e) {
                    Log::error('Error parsing hidden elements: ' . $e->getMessage());
                }
            }
            
            // Log the template paths for debugging
            Log::info('Template paths for ID Card preview:', [
                'employee_id' => $employee->id,
                'businessunit_id' => $employee->businessunit_id,
                'template_id' => $templateId,
                'front_template' => $frontTemplate,
                'back_template' => $backTemplate,
                'hidden_elements' => $hiddenElements
            ]);
            
            return Inertia::render('Employee/IdCardPreview', [
                'employee' => $employee,
                'templateImages' => $templateImages,
                'frontTemplate' => $frontTemplate,
                'backTemplate' => $backTemplate,
                'hiddenElements' => $hiddenElements,
                'debug' => [
                    'templateId' => $templateId,
                    'businessunitId' => $employee->businessunit_id,
                    'frontTemplatePath' => $frontTemplate,
                    'backTemplatePath' => $backTemplate
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to load ID card preview: ' . $e->getMessage(), [
                'exception' => $e,
                'employee_uuid' => $id,
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->route('employee.index')->with('error', 'Failed to load ID card preview: ' . $e->getMessage());
        }
    }
    
    /**
     * Display the ID card preview for multiple selected employees.
     */
    public function bulkIdPreview(Request $request)
    {
        try {
            // Validate the request
            $validated = $request->validate([
                'uuids' => 'required|array',
                'uuids.*' => 'string'
            ]);

            // Find all employees by UUIDs
            $employees = Employee::whereIn('uuid', $validated['uuids'])
                ->with('businessUnit')
                ->get();
            
            // Format the employees collection for frontend
            $formattedEmployees = $employees->map(function ($employee) {
                // Add business unit name to each employee
                $employee->businessunit_name = $employee->businessUnit ? $employee->businessUnit->businessunit_name : null;
                return $employee;
            });
            
            // Group employees by business unit for template association
            $employeesByBusinessUnit = $employees->groupBy('businessunit_id');
            
            // Get templates for each business unit
            $templatesByBusinessUnit = [];
            foreach ($employeesByBusinessUnit as $businessUnitId => $groupEmployees) {
                // Find template by business unit ID
                $templateImage = DB::table('template_images')
                    ->where('businessunit_id', $businessUnitId)
                    ->first();
                
                // Use the template ID from template_images if found, otherwise use default
                $templateId = $templateImage ? $templateImage->id : 1;
                
                $templatesByBusinessUnit[$businessUnitId] = [
                    'template_id' => $templateId,
                    'template_data' => $this->getTemplateImagesData($templateId),
                    'front_template' => $this->getFrontTemplatePath($templateId),
                    'back_template' => $this->getBackTemplatePath($templateId)
                ];
            }
            
            // Log the employees and templates data
            Log::info('Bulk ID Card preview request', [
                'employee_count' => $employees->count(),
                'business_units' => $employeesByBusinessUnit->keys()->toArray()
            ]);
            
            // Ensure the public/images directory exists
            $imagesDir = public_path('images');
            if (!file_exists($imagesDir)) {
                mkdir($imagesDir, 0755, true);
            }
            
            // Create default templates if they don't exist
            $this->createDefaultTemplatesIfNeeded();
            
            return Inertia::render('Employee/BulkIdCardPreview', [
                'employees' => $formattedEmployees,
                'templatesByBusinessUnit' => $templatesByBusinessUnit,
                'employeeCount' => $employees->count(),
                'selectedUuids' => $validated['uuids']
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to load bulk ID card preview: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->route('employee.index')->with('error', 'Failed to load bulk ID card preview: ' . $e->getMessage());
        }
    }
    
    /**
     * Get template images data from the database.
     */
    private function getTemplateImagesData(int $templateId): array
    {
        try {
            // First try to find template by direct ID
            $templateData = DB::table('template_images')
                ->where('id', $templateId)
                ->first();
            
            // If not found, try by template_id column
            if (!$templateData) {
                $templateData = DB::table('template_images')
                    ->where('template_id', $templateId)
                    ->first();
            }
            
            // Add detailed logging to understand what's happening
            Log::info('Template lookup results', [
                'template_id_requested' => $templateId,
                'found' => !is_null($templateData),
                'raw_data' => $templateData ? json_encode($templateData) : 'No template found'
            ]);
                
            if ($templateData) {
                // Convert to array but preserve integer values when they're 0
                $result = (array) $templateData;
                
                // Log the specific QR code coordinates we're going to use
                Log::info('QR code coordinates from database:', [
                    'qrcode_x' => $result['emp_qrcode_x'] ?? null,
                    'qrcode_y' => $result['emp_qrcode_y'] ?? null,
                    'qrcode_width' => $result['emp_qrcode_width'] ?? null,
                    'qrcode_height' => $result['emp_qrcode_height'] ?? null,
                ]);
                
                return $result;
            }
            
            // Log that we're using default values
            Log::warning('No template found, using default positions', [
                'template_id' => $templateId
            ]);
            
            // Return complete set of default positions if no template is found
            return [
                'emp_img_x' => 193,
                'emp_img_y' => 338,
                'emp_img_height' => 265,
                'emp_img_width' => 265,
                'emp_name_x' => 341,
                'emp_name_y' => 675,
                'emp_pos_x' => 341,
                'emp_pos_y' => 700,
                'emp_idno_x' => 325,
                'emp_idno_y' => 725,
                'emp_sig_x' => 341,
                'emp_sig_y' => 780,
                'emp_qrcode_x' => 483, // Correct QR code coordinates
                'emp_qrcode_y' => 88,
                'emp_qrcode_width' => 150,
                'emp_qrcode_height' => 150,
                'emp_add_x' => 150,
                'emp_add_y' => 225,
                'emp_bday_x' => 150,
                'emp_bday_y' => 257,
                'emp_sss_x' => 150,
                'emp_sss_y' => 283,
                'emp_phic_x' => 150,
                'emp_phic_y' => 308,
                'emp_hdmf_x' => 150,
                'emp_hdmf_y' => 333,
                'emp_tin_x' => 150,
                'emp_tin_y' => 360,
                'emp_emergency_name_x' => 150,
                'emp_emergency_name_y' => 626,
                'emp_emergency_num_x' => 150,
                'emp_emergency_num_y' => 680,
                'emp_emergency_add_x' => 150,
                'emp_emergency_add_y' => 738,
            ];
        } catch (\Exception $e) {
            Log::error('Error getting template images data: ' . $e->getMessage());
            // Return default values on error
            return [
                // Default values for QR code
                'emp_qrcode_x' => 483, 
                'emp_qrcode_y' => 88,
                'emp_qrcode_width' => 150,
                'emp_qrcode_height' => 150,
            ];
        }
    }
    
    /**
     * Get front template path with fallback to default.
     */
    private function getFrontTemplatePath(int $templateId): string 
    {
        // Get path from database settings, with fallback to default
        $this->networkPath = \App\Models\NetworkPath::getNetworkPath(
            'network_images_path', 
            '\\\\DESKTOP-PJE8A0F\\Users\\Public\\images\\'
        ) . 'id_templates\\';
        
        try {
            // First try to get the template from template_images table
            $templateImage = DB::table('template_images')
                ->where('id', $templateId)
                ->first();
                
            if ($templateImage && !empty($templateImage->image_path)) {
                // Check if the network path exists
                $networkPath = $this->networkPath . $templateImage->image_path;
                if (file_exists($networkPath)) {
                    // Use network.image route to serve the image
                    return route('network.image', ['folder' => 'id_templates', 'filename' => $templateImage->image_path]);
                }
                
                // If not in network path, check in storage
                $storagePath = storage_path('app/public/images/id_templates/' . $templateImage->image_path);
                if (file_exists($storagePath)) {
                    return asset('storage/images/id_templates/' . $templateImage->image_path);
                }
            }
            
            // If no template_images record or path doesn't exist, try templates table
            $template = DB::table('templates')
                ->where('id', $templateId)
                ->first();
                
            if ($template && !empty($template->image1)) {
                // Check if the file exists in storage
                $storagePath = storage_path('app/public/images/' . $template->image1);
                if (file_exists($storagePath)) {
                    return asset('storage/images/' . $template->image1);
                }
            }
            
            // Finally fall back to default template
            $defaultPath = public_path('images/default_front_template.png');
            if (file_exists($defaultPath)) {
                return asset('images/default_front_template.png');
            }
            
            // Create default template if it doesn't exist
            $this->createDefaultTemplatesIfNeeded();
            return asset('images/default_front_template.png');
            
        } catch (\Exception $e) {
            Log::error('Error getting front template path: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'templateId' => $templateId
            ]);
            return asset('images/default_front_template.png');
        }
    }
    
    /**
     * Get back template path with fallback to default.
     */
    private function getBackTemplatePath(int $templateId): string 
    {
        // Get path from database settings, with fallback to default
        $this->networkPath = \App\Models\NetworkPath::getNetworkPath(
            'network_images_path', 
            '\\\\DESKTOP-PJE8A0F\\Users\\Public\\images\\'
        ) . 'id_templates\\';
        
        try {
            // First try to get the template from template_images table
            $templateImage = DB::table('template_images')
                ->where('id', $templateId)
                ->first();
                
            if ($templateImage && !empty($templateImage->image_path2)) {
                // Check if the network path exists
                $networkPath = $this->networkPath . $templateImage->image_path2;
                if (file_exists($networkPath)) {
                    // Use network.image route to serve the image
                    return route('network.image', ['folder' => 'id_templates', 'filename' => $templateImage->image_path2]);
                }
                
                // If not in network path, check in storage
                $storagePath = storage_path('app/public/images/id_templates/' . $templateImage->image_path2);
                if (file_exists($storagePath)) {
                    return asset('storage/images/id_templates/' . $templateImage->image_path2);
                }
            }
            
            // If no template_images record or path doesn't exist, try templates table
            $template = DB::table('templates')
                ->where('id', $templateId)
                ->first();
                
            if ($template && !empty($template->image2)) {
                // Check if the file exists in storage
                $storagePath = storage_path('app/public/images/' . $template->image2);
                if (file_exists($storagePath)) {
                    return asset('storage/images/' . $template->image2);
                }
            }
            
            // Finally fall back to default template
            $defaultPath = public_path('images/default_back_template.png');
            if (file_exists($defaultPath)) {
                return asset('images/default_back_template.png');
            }
            
            // Create default template if it doesn't exist
            $this->createDefaultTemplatesIfNeeded();
            return asset('images/default_back_template.png');
            
        } catch (\Exception $e) {
            Log::error('Error getting back template path: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'templateId' => $templateId
            ]);
            return asset('images/default_back_template.png');
        }
    }

    /**
     * Create default template files in the public directory.
     */
    private function createDefaultTemplatesIfNeeded()
    {
        // Define template files
        $templates = [
            'default_front_template.png' => [651, 1005, 'Front ID Template'],
            'default_back_template.png' => [651, 1005, 'Back ID Template']
        ];
        
        // Create each template if it doesn't exist
        foreach ($templates as $filename => [$width, $height, $text]) {
            $path = public_path('images/' . $filename);
            
            if (!file_exists($path)) {
                // Create a simple placeholder image
                $img = imagecreatetruecolor($width, $height);
                $bgColor = imagecolorallocate($img, 255, 255, 255); // White background
                $textColor = imagecolorallocate($img, 100, 100, 100); // Gray text
                $borderColor = imagecolorallocate($img, 200, 200, 200); // Light gray border
                
                // Fill background white
                imagefilledrectangle($img, 0, 0, $width - 1, $height - 1, $bgColor);
                
                // Draw border
                imagerectangle($img, 0, 0, $width - 1, $height - 1, $borderColor);
                
                // Add template title text
                $font = 5; // Built-in font (1-5)
                $textWidth = strlen($text) * imagefontwidth($font);
                $textX = ($width - $textWidth) / 2;
                $textY = $height / 3;
                imagestring($img, $font, $textX, $textY, $text, $textColor);
                
                // Add hint text
                $hint = "This is a default template. Please upload a custom template.";
                $hintWidth = strlen($hint) * imagefontwidth(2);
                $hintX = ($width - $hintWidth) / 2;
                $hintY = $height / 2;
                imagestring($img, 2, $hintX, $hintY, $hint, $textColor);
                
                // Save the image
                if (!file_exists(dirname($path))) {
                    mkdir(dirname($path), 0755, true);
                }
                
                imagepng($img, $path);
                imagedestroy($img);
                
                Log::info("Created default template image: $filename");
            }
        }
    }

    /**
     * Serve a placeholder image when employee images are not found.
     */
    public function placeholderImage()
    {
        $path = public_path('images/placeholder.png');
        
        if (!file_exists($path)) {
            // Ensure the directory exists
            if (!file_exists(dirname($path))) {
                mkdir(dirname($path), 0755, true);
            }

            // Create a simple placeholder image
            $img = imagecreatetruecolor(250, 250);
            $bg = imagecolorallocate($img, 240, 240, 240);
            $textcolor = imagecolorallocate($img, 100, 100, 100);
            
            imagefilledrectangle($img, 0, 0, 249, 249, $bg);
            imagestring($img, 5, 70, 120, 'No Image', $textcolor);
            
            imagepng($img, $path);
            imagedestroy($img);
            
            Log::info("Created placeholder image");
        }
        
        return response()->file($path, [
            'Content-Type' => 'image/png',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
        ]);
    }

    /**
     * Update the employee's ID status to printed and increment the employee ID counter
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  string  $uuid
     * @return \Illuminate\Http\Response
     */
    public function updateIdStatus(Request $request, $uuid)
    {
        try {
            DB::beginTransaction();
            
            $employee = Employee::where('uuid', $uuid)->firstOrFail();
            
            $employee->id_status = 'printed';
            
            if (isset($employee->employee_id_counter)) {
                $oldCounter = $employee->employee_id_counter;
                $employee->employee_id_counter = (int)$employee->employee_id_counter + 1;
            } else {
                $employee->employee_id_counter = 1;
            }
            
            // Always update the last exported date whenever an ID is exported
            // This ensures the 2-year expiry calculation will work correctly
            $employee->id_last_exported_at = now();
            
            $employee->save();
            
            $fullName = $employee->employee_firstname . ' ' . $employee->employee_lastname;
            ActivityLogService::log(
                'employee_id_exported',
                "ID Card for employee {$fullName} was exported",
                'App\Models\Employee',
                $employee->id,
                [
                    'employee_id' => $employee->id_no, 
                    'name' => $fullName,
                    'counter' => $employee->employee_id_counter,
                    'position' => $employee->position,
                    'export_date' => now()->toDateTimeString()
                ]
            );
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Employee ID status updated and counter incremented successfully',
                'new_counter' => $employee->employee_id_counter
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            
            $errorMessage = 'Failed to update employee ID status: ';
            
            if (strpos($e->getMessage(), 'employee_id_counter') !== false) {
                $errorMessage .= 'The employee_id_counter column might not exist in the employees table.';
            } else if (strpos($e->getMessage(), 'No query results') !== false) {
                $errorMessage .= 'Employee not found with the given UUID.';
            } else {
                $errorMessage .= $e->getMessage();
            }
            
            return response()->json([
                'success' => false,
                'message' => $errorMessage
            ], 500);
        }
    }
}