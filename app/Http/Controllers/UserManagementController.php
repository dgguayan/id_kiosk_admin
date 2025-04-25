<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Spatie\Activitylog\Facades\LogActivity;

class UserManagementController extends Controller
{
    public function __construct()
    {
        // Authentication is handled at the route level
        // No need for middleware here
    }

    /**
     * Display a listing of users with filtering, sorting, and pagination.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        // Check user permissions - any logged in user with Admin or HR role can access
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

        // Get current user's role
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
        // Check user permissions - any logged in user with Admin or HR role can create
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

        // Only Admins can create Admin users
        if ($request->input('role') === 'Admin' && Auth::user()->role !== 'Admin') {
            abort(403, 'Only administrators can create admin users.');
        }

        // Create the user
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ]);

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
        // Check user permissions - any logged in user with Admin or HR role can update
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

        // Only Admins can change roles
        if (Auth::user()->role !== 'Admin' && $user->role !== $request->input('role')) {
            abort(403, 'Only administrators can change user roles.');
        }

        // Update user data
        $user->name = $validatedData['name'];
        $user->email = $validatedData['email'];
        
        // Only Admins can update role
        if (Auth::user()->role === 'Admin') {
            $user->role = $validatedData['role'];
        }

        // Update password if provided
        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();
        // Log activity
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
        // Only Admin users can delete
        if (Auth::user()->role !== 'Admin') {
            abort(403, 'Only administrators can delete users.');
        }

        // Cannot delete yourself
        if (Auth::id() === $user->id) {
            return redirect()->back()->with('error', 'You cannot delete your own account.');
        }
        // Log activity before deleting
        ActivityLogService::log(
            'user_deleted',
            "User {$user->name} was deleted",
            'App\Models\User',
            $user->id,
            ['name' => $user->name, 'email' => $user->email, 'role' => $user->role]
        );

        // Delete the user
        $user->delete();

        return redirect()->back()->with('success', 'User deleted successfully.');
    }
}
