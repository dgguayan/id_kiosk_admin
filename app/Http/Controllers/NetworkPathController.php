<?php

namespace App\Http\Controllers;

use App\Models\NetworkPath;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NetworkPathController extends Controller
{
    /**
     * Display the network path settings page.
     */
    public function index()
    {
        $networkPath = NetworkPath::where('key', 'network_images_path')->first();
        
        return Inertia::render('settings/NetworkPath', [
            'networkPath' => $networkPath ? $networkPath->value : '\\\\DESKTOP-PJE8A0F\\Users\\Public\\images\\'
        ]);
    }

    /**
     * Store or update network path setting.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'network_images_path' => 'required|string'
        ]);

        NetworkPath::updateOrCreate(
            ['key' => 'network_images_path'],
            ['value' => $validated['network_images_path']]
        );

        return redirect()->back()->with('success', 'Network path updated successfully');
    }
}
