<?php

namespace App\Http\Controllers;

use App\Models\BusinessUnit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class BusinessUnitController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $sortField = $request->input('sort_by', 'businessunit_name');
        $sortDirection = $request->input('sort_direction', 'asc');
        
        $query = BusinessUnit::query();
        
        // Apply search if provided
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('businessunit_name', 'like', "%{$search}%")
                ->orWhere('businessunit_id', 'like', "%{$search}%");
            });
        }
        
        $businessUnits = $query
            ->orderBy($sortField, $sortDirection)
            ->paginate(10)
            ->withQueryString();
        
        // Return with meta information properly formatted
        return Inertia::render('BusinessUnit/Index', [
            'businessUnits' => $businessUnits->items(),
            'meta' => [
                'current_page' => $businessUnits->currentPage(),
                'last_page' => $businessUnits->lastPage(),
                'total' => $businessUnits->total(),
                'per_page' => $businessUnits->perPage(),
            ],
            'filters' => [
                'search' => $search,
                'page' => $request->input('page', 1),
                'per_page' => 10,
                'sort_by' => $sortField,
                'sort_direction' => $sortDirection,
            ],
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
        $validator = Validator::make($request->all(), [
            'businessunit_name' => 'required|string|max:255|unique:business_units',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator->errors());
        }

        $businessUnit = new BusinessUnit();
        $businessUnit->businessunit_name = $request->businessunit_name;
        
        $businessUnit->save(['timestamps' => true]);

        return redirect()->route('business-unit.index')->with('success', 'Business Unit created successfully.');
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
        $businessUnit = BusinessUnit::findOrFail($id);
        
        $validator = Validator::make($request->all(), [
            'businessunit_name' => 'required|string|max:255|unique:business_units,businessunit_name,' . $id . ',businessunit_id',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator->errors());
        }

        $businessUnit->businessunit_name = $request->businessunit_name;
        $businessUnit->save();

        return redirect()->route('business-unit.index')->with('success', 'Business Unit updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $businessUnit = BusinessUnit::findOrFail($id);
        $businessUnit->delete();

        return redirect()->route('business-unit.index')->with('success', 'Business Unit deleted successfully.');
    }

    /**
     * Bulk delete multiple business units
     */
    public function bulkDestroy(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array',
            'ids.*' => 'exists:business_units,businessunit_id',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator->errors());
        }

        BusinessUnit::whereIn('businessunit_id', $request->ids)->delete();

        return redirect()->route('business-unit.index')->with('success', 'Business Units deleted successfully.');
    }
}
