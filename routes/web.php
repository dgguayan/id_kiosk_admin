<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\BusinessUnitController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\TemplateImagesController;
use App\Http\Controllers\PendingIdController;
use App\Http\Controllers\UserManagementController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
});

// Add this route group for Pending ID management
Route::middleware(['auth'])->group(function () {
    Route::get('/pending-id', [PendingIdController::class, 'index'])->name('pending-id.index');
    Route::delete('/pending-id/{id}', [PendingIdController::class, 'destroy'])->name('pending-id.destroy');
    Route::post('/pending-id/bulk-destroy', [PendingIdController::class, 'bulkDestroy'])->name('pending-id.bulk-destroy');
});

//employee
Route::resource('employee', EmployeeController::class)->middleware('auth');
Route::post('/employees/bulk-destroy', [EmployeeController::class, 'bulkDestroy'])->name('employee.bulk-destroy');
Route::put('/employee/{id}', [EmployeeController::class, 'update'])->name('employee.update');
Route::get('/employee/image', [EmployeeController::class, 'serveImage'])->name('employee.image');
// Add the ID card preview route
Route::get('/employee/{id}/id-preview', [EmployeeController::class, 'idPreview'])->name('employee.id-preview')->middleware('auth');
// Add the bulk ID card preview route
Route::post('/employee/bulk-id-preview', [EmployeeController::class, 'bulkIdPreview'])->name('employee.bulk-id-preview')->middleware('auth');
Route::get('/employee/placeholder-image', [EmployeeController::class, 'placeholderImage'])->name('employee.placeholder-image');

//business unit
Route::resource('business-unit', BusinessUnitController::class)->middleware('auth');
Route::post('/business-unit/bulk-destroy', [BusinessUnitController::class, 'bulkDestroy'])->name('business-unit.bulk-destroy');

// ID Templates routes
Route::middleware(['auth'])->group(function () {
    Route::resource('id-templates', TemplateImagesController::class);
    Route::get('/id-templates/{id}/layout', [TemplateImagesController::class, 'layout'])->name('id-templates.layout');
    Route::post('/id-templates/{id}/update-positions', [TemplateImagesController::class, 'updatePositions'])->name('id-templates.update-positions');
});

// Network images route
Route::get('/network-images/{folder}/{filename}', function ($folder, $filename) {
    $path = '\\\\DESKTOP-PJE8A0F\\Users\\Public\\images\\' . $folder . '\\' . $filename;
    
    // Convert to realpath
    $realPath = realpath($path);
    if (!$realPath || !file_exists($realPath)) {
        return response()->json(['error' => 'File not found', 'path' => $realPath], 404);
    }

    return response()->file($realPath, [
        'Content-Type' => mime_content_type($realPath),
        'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
    ]);
})->middleware('auth')->name('network.image');

// Activity Log Routes
Route::middleware(['auth'])->group(function () {
    Route::get('/activity-log', [ActivityLogController::class, 'index'])->name('activity-log.index');
    Route::get('/activity-log/{id}', [ActivityLogController::class, 'show'])->name('activity-log.show');
    Route::delete('/activity-log/clear-all', [ActivityLogController::class, 'clearAll'])->name('activity-log.clear-all');
});

// User Management Routes
Route::middleware('auth')->group(function () {
    Route::get('/user-management', [UserManagementController::class, 'index'])->name('user-management.index');
    Route::post('/user-management', [UserManagementController::class, 'store'])->name('user-management.store');
    Route::put('/user-management/{user}', [UserManagementController::class, 'update'])->name('user-management.update');
    Route::delete('/user-management/{user}', [UserManagementController::class, 'destroy'])->name('user-management.destroy');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
