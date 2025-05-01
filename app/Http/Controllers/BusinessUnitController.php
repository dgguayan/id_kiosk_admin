<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\BusinessUnit;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

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
            'currentUserRole' => $currentUserRole, // Pass the role with the same capitalization as other controllers
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'businessunit_name' => 'required|string|max:255',
            'businessunit_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048', // Validate image
        ]);

        $businessUnit = new BusinessUnit();
        $businessUnit->businessunit_name = $validated['businessunit_name'];

        // Handle image upload
        if ($request->hasFile('businessunit_image')) {
            $path = $request->file('businessunit_image')->store('business_units', 'public');
            $businessUnit->businessunit_image_path = $path;
        }

        $businessUnit->save();

        return redirect()->route('business-unit.index');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'businessunit_name' => 'required|string|max:255',
            'businessunit_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048', // Validate image
        ]);

        $businessUnit = BusinessUnit::findOrFail($id);
        $businessUnit->businessunit_name = $validated['businessunit_name'];

        // Handle image upload
        if ($request->hasFile('businessunit_image')) {
            // Delete old image if exists
            if ($businessUnit->businessunit_image_path) {
                Storage::disk('public')->delete($businessUnit->businessunit_image_path);
            }

            // Store new image
            $path = $request->file('businessunit_image')->store('business_units', 'public');
            $businessUnit->businessunit_image_path = $path;
        }

        $businessUnit->save();

        return redirect()->route('business-unit.index');
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
        
        $businessUnit->delete();
        
        return redirect()->route('business-unit.index')->with('success', 'Business unit deleted successfully.');
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
        
        BusinessUnit::whereIn('businessunit_id', $request->ids)->delete();
        
        return redirect()->route('business-unit.index')->with('success', 'Business units deleted successfully.');
    }
}
