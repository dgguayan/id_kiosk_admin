<?php

use App\Http\Controllers\BusinessUnitController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\TemplateImagesController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
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

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
