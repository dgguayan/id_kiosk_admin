<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Inertia\Inertia;

class UserManagementController extends Controller
{
    public function __construct()
    {
        // $this->middleware('auth');
    }

    /**
     * Display a listing of users with filtering, sorting, and pagination.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        // Check if user is Admin or HR
        if (!in_array(Auth::user()->role, ['Admin', 'HR'])) {
            abort(403, 'Unauthorized action.');
        }

        // Handle search, filters, sorting and pagination
        $search = $request->input('search');
        $role = $request->input('role');
        $sortField = $request->input('sort_by', 'name');
        $sortDirection = $request->input('sort_direction', 'asc');
        $perPage = $request->input('per_page', 10);
        $page = $request->input('page', 1);

        // Build the query
        $query = User::query();

        // Apply search
        if ($search) {
            $query->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('role', 'like', "%{$search}%");
            });
        }

        // Apply role filter
        if ($role) {
            $query->where('role', $role);
        }

        // Apply sorting
        if (in_array($sortField, ['name', 'email', 'role', 'created_at'])) {
            $query->orderBy($sortField, $sortDirection);
        }

        // Get paginated results
        $users = $query->paginate($perPage, ['*'], 'page', $page);

        // Get current user's role for permission control in frontend
        $currentUserRole = Auth::user()->role;

        return Inertia::render('UserManagement/Index', [
            'users' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'total' => $users->total(),
                'per_page' => $users->perPage(),
            ],
            'filters' => [
                'search' => $search,
                'role' => $role,
                'page' => $page,
                'per_page' => $perPage,
            ],
            'currentUserRole' => $currentUserRole,
        ]);
    }

    /**
     * Store a newly created user in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        // Check user permissions - both Admin and HR can create
        if (!in_array(Auth::user()->role, ['Admin', 'HR'])) {
            abort(403, 'Unauthorized action.');
        }

        // Validate the request data
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => [
                'required', 
                Rule::in(['Admin', 'HR']),
            ],
        ]);

        // Create the user
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ]);

        // Log activity for audit trail
        ActivityLogService::log(
            'user_created',
            "User {$user->name} was created", 
            'App\Models\User',
            $user->id,
            ['name' => $user->name, 'email' => $user->email, 'role' => $user->role]
        );

        return redirect()->back()->with('success', 'User created successfully.');
    }

    /**
     * Update the specified user in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\User  $user
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, User $user)
    {
        // Check user permissions - both Admin and HR can update
        if (!in_array(Auth::user()->role, ['Admin', 'HR'])) {
            abort(403, 'Unauthorized action.');
        }

        // Cannot modify own account through this interface
        if (Auth::id() === $user->id) {
            return redirect()->back()->with('error', 'You cannot modify your own account through this interface.');
        }

        // Validate the request data
        $rules = [
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role' => [
                'required', 
                Rule::in(['Admin', 'HR']),
            ],
        ];

        // Only add password validation if password is provided
        if ($request->filled('password')) {
            $rules['password'] = ['required', 'confirmed', Rules\Password::defaults()];
        }

        $validatedData = $request->validate($rules);

        // Update user data
        $user->name = $validatedData['name'];
        $user->email = $validatedData['email'];
        $user->role = $validatedData['role'];

        // Update password if provided
        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        // Log activity for audit trail
        ActivityLogService::log(
            'user_updated',
            "User {$user->name} was updated", 
            'App\Models\User',
            $user->id,
            ['name' => $user->name, 'email' => $user->email, 'role' => $user->role]
        );

        return redirect()->back()->with('success', 'User updated successfully.');
    }

    /**
     * Remove the specified user from storage.
     *
     * @param  \App\Models\User  $user
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(User $user)
    {
        // Only Admin users can delete - THIS IS THE KEY PERMISSION DIFFERENCE
        if (Auth::user()->role !== 'Admin') {
            abort(403, 'Only administrators can delete users.');
        }

        // Cannot delete yourself
        if (Auth::id() === $user->id) {
            return redirect()->back()->with('error', 'You cannot delete your own account.');
        }

        // Log activity before deleting for audit trail
        ActivityLogService::log(
            'user_deleted',
            "User {$user->name} was deleted",
            'App\Models\User',
            $user->id,
            ['name' => $user->name]
        );

        // Delete the user
        $user->delete();

        return redirect()->back()->with('success', 'User deleted successfully.');
    }
}
