<?php

use App\Http\Controllers\EmployeeController;
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

// Make sure you have the proper employee resource routes
Route::resource('employee', EmployeeController::class)->middleware('auth');
Route::post('/employees/bulk-destroy', [EmployeeController::class, 'bulkDestroy'])->name('employee.bulk-destroy');

// Ensure the employee.update route exists and is properly named
Route::put('/employee/{id}', [EmployeeController::class, 'update'])->name('employee.update');

Route::get('/employee/image', [EmployeeController::class, 'serveImage'])->name('employee.image');

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
