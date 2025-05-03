<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\BusinessUnit;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use App\Services\ActivityLogService; // Add this import
use Illuminate\Support\Facades\Log; // Add this import

class BusinessUnitController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = BusinessUnit::query();
        
        // Apply search filter if provided
        if ($request->has('search') && !empty($request->search)) {
            $query->where('businessunit_name', 'like', '%' . $request->search . '%');
        }

        // Apply sorting
        $sortBy = $request->get('sort_by', 'businessunit_name');
        $sortDirection = $request->get('sort_direction', 'asc');
        $query->orderBy($sortBy, $sortDirection);
        
        // Paginate the results
        $businessUnits = $query->paginate($request->get('per_page', 10));
        
        // Get current user's role for permission control
        $currentUserRole = Auth::user()->role;
        
        return Inertia::render('BusinessUnit/Index', [
            'businessUnits' => $businessUnits->items(),
            'meta' => [
                'current_page' => $businessUnits->currentPage(),
                'last_page' => $businessUnits->lastPage(),
                'total' => $businessUnits->total(),
                'per_page' => $businessUnits->perPage(),
            ],
            'filters' => $request->only(['search', 'page', 'per_page']),
            'currentUserRole' => $currentUserRole,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'businessunit_name' => 'required|string|max:255',
            'businessunit_code' => 'nullable|string|max:50|unique:business_units,businessunit_code',
            'businessunit_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        try {
            // Create with direct assignment rather than setting properties one by one
            $data = [
                'businessunit_name' => $validated['businessunit_name']
            ];
            
            if (!empty($request->businessunit_code)) {
                $data['businessunit_code'] = $request->businessunit_code;
            }
            
            if ($request->hasFile('businessunit_image')) {
                $path = $request->file('businessunit_image')->store('business_units', 'public');
                $data['businessunit_image_path'] = $path;
            }
            
            $businessUnit = BusinessUnit::create($data);
            
            // Log what was created
            Log::info('Created business unit with data:', $data);
            Log::info('Resulting business unit:', $businessUnit->toArray());
            
            // Log the business unit creation
            ActivityLogService::log(
                'businessunit_created',
                'Created new business unit: ' . $businessUnit->businessunit_name . 
                (isset($businessUnit->businessunit_code) ? ' (' . $businessUnit->businessunit_code . ')' : ''),
                'App\Models\BusinessUnit',
                $businessUnit->businessunit_id,
                [
                    'name' => $businessUnit->businessunit_name,
                    'code' => $businessUnit->businessunit_code ?? null,
                    'has_image' => isset($businessUnit->businessunit_image_path),
                    'created_by' => Auth::user()->name ?? 'System'
                ]
            );

            return redirect()->route('business-unit.index')->with('success', 'Business unit created successfully.');
        } catch (\Exception $e) {
            Log::error('Error creating business unit: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->back()->with('error', 'Failed to create business unit: ' . $e->getMessage());
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        try {
            $businessUnit = BusinessUnit::findOrFail($id);

            $validated = $request->validate([
                'businessunit_name' => 'required|string|max:255',
                'businessunit_code' => 'nullable|string|max:50|unique:business_units,businessunit_code,' . $id . ',businessunit_id', // Changed to nullable
                'businessunit_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            $oldData = $businessUnit->toArray();
            $changes = [];
            
            if ($businessUnit->businessunit_name !== $validated['businessunit_name']) {
                $changes['name'] = [
                    'old' => $businessUnit->businessunit_name,
                    'new' => $validated['businessunit_name']
                ];
            }
            
            // Only track changes if the code is provided
            if (isset($validated['businessunit_code']) && $businessUnit->businessunit_code !== $validated['businessunit_code']) {
                $changes['code'] = [
                    'old' => $businessUnit->businessunit_code,
                    'new' => $validated['businessunit_code']
                ];
            }
            
            $businessUnit->businessunit_name = $validated['businessunit_name'];
            
            // Only update the code if it's provided
            if (isset($validated['businessunit_code'])) {
                $businessUnit->businessunit_code = $validated['businessunit_code'];
            }

            if ($request->hasFile('businessunit_image')) {
                if ($businessUnit->businessunit_image_path) {
                    Storage::disk('public')->delete($businessUnit->businessunit_image_path);
                }

                $path = $request->file('businessunit_image')->store('business_units', 'public');
                $changes['image'] = [
                    'old' => $businessUnit->businessunit_image_path,
                    'new' => $path
                ];
                $businessUnit->businessunit_image_path = $path;
            }

            $businessUnit->save();

            // Update activity log to include the code
            ActivityLogService::log(
                'businessunit_updated',
                'Updated business unit: ' . $businessUnit->businessunit_name . ' (' . $businessUnit->businessunit_code . ')',
                'App\Models\BusinessUnit',
                $businessUnit->businessunit_id,
                [
                    'changes' => $changes,
                    'updated_by' => Auth::user()->name ?? 'System'
                ]
            );

            return redirect()->route('business-unit.index')->with('success', 'Business unit updated successfully.');
        } catch (\Exception $e) {
            Log::error('Error updating business unit: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->back()->with('error', 'Failed to update business unit: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(BusinessUnit $businessUnit)
    {
        // Check if user has permission to delete
        if (Auth::user()->role !== 'Admin') {
            return redirect()->back()->with('error', 'You do not have permission to perform this action.');
        }
        
        try {
            $businessUnitData = $businessUnit->toArray();
            $businessUnitName = $businessUnit->businessunit_name;
            $businessUnitId = $businessUnit->businessunit_id;
            
            // Delete image if it exists
            if ($businessUnit->businessunit_image_path) {
                Storage::disk('public')->delete($businessUnit->businessunit_image_path);
            }
            
            $businessUnit->delete();

            // Log the business unit deletion
            ActivityLogService::log(
                'businessunit_deleted',
                'Deleted business unit: ' . $businessUnitName,
                'App\Models\BusinessUnit',
                $businessUnitId,
                [
                    'business_unit_data' => $businessUnitData,
                    'deleted_by' => Auth::user()->name ?? 'System',
                    'user_role' => Auth::user()->role
                ]
            );
            
            return redirect()->route('business-unit.index')->with('success', 'Business unit deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Error deleting business unit: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->back()->with('error', 'Failed to delete business unit: ' . $e->getMessage());
        }
    }

    /**
     * Bulk delete business units
     */
    public function bulkDestroy(Request $request)
    {
        // Check if user has permission to delete
        if (Auth::user()->role !== 'Admin') {
            return redirect()->back()->with('error', 'You do not have permission to perform this action.');
        }
        
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array',
            'ids.*' => 'exists:business_units,businessunit_id'
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator);
        }
        
        try {
            // Get business unit data before deletion for logging
            $businessUnits = BusinessUnit::whereIn('businessunit_id', $request->ids)->get();
            $businessUnitData = $businessUnits->map(function ($unit) {
                return [
                    'id' => $unit->businessunit_id,
                    'name' => $unit->businessunit_name,
                    'has_image' => !empty($unit->businessunit_image_path)
                ];
            })->toArray();
            
            // Delete images from storage
            foreach ($businessUnits as $unit) {
                if ($unit->businessunit_image_path) {
                    Storage::disk('public')->delete($unit->businessunit_image_path);
                }
            }
            
            // Delete business units
            BusinessUnit::whereIn('businessunit_id', $request->ids)->delete();

            // Log the bulk business unit deletion
            ActivityLogService::log(
                'businessunit_bulk_deleted',
                count($request->ids) . ' business units were deleted in bulk',
                'App\Models\BusinessUnit',
                null,
                [
                    'count' => count($request->ids),
                    'business_unit_data' => $businessUnitData,
                    'deleted_by' => Auth::user()->name ?? 'System',
                    'user_role' => Auth::user()->role
                ]
            );
            
            return redirect()->route('business-unit.index')->with('success', 'Business units deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Error bulk deleting business units: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->back()->with('error', 'Failed to delete business units: ' . $e->getMessage());
        }
    }
}
