<?php

namespace App\Http\Controllers;

use App\Models\TemplateImage;
use App\Models\BusinessUnit;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TemplateImagesController extends Controller
{
    /**
     * Network path for storing images
     */
    protected $networkPath;

    /**
     * Constructor to initialize network path
     */
    public function __construct()
    {
        $this->networkPath = env('NETWORK_IMAGE_PATH', '\\\\DESKTOP-PJE8A0F\\Users\\Public\\images\\id_templates\\');
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $pageTitle = 'List of ID Templates';
        $businessUnits = BusinessUnit::all();
    
        // Get selected business unit
        $selectedBusinessUnit = $request->input('business_unit');
    
        // Filter templates based on the selected business unit
        if ($selectedBusinessUnit && $selectedBusinessUnit != 'all') {
            $templates = TemplateImage::where('businessunit_id', $selectedBusinessUnit)
                                        ->with('businessUnit')
                                        ->get();
        } else {
            $templates = TemplateImage::with('businessUnit')->get();
        }
    
        return Inertia::render('IdTemplates/Index', [
            'templates' => $templates,
            'businessUnits' => $businessUnits,
            'pageTitle' => $pageTitle,
            'selectedBusinessUnit' => $selectedBusinessUnit
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $businessUnits = BusinessUnit::all();
        return Inertia::render('IdTemplates/Create', [
            'businessUnits' => $businessUnits
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            // Validate request data
            $request->validate([
                'businessunit_id' => 'required|exists:business_units,businessunit_id',
                'image_front' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
                'image_back' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
                'emp_img_x' => 'nullable|integer',
                'emp_img_y' => 'nullable|integer',
            ]);

            // Get files
            $frontImage = $request->file('image_front');
            $backImage = $request->file('image_back');
            
            // Generate unique filenames
            $frontImageName = uniqid() . '_' . time() . '.' . $frontImage->getClientOriginalExtension();
            $backImageName = uniqid() . '_' . time() . '.' . $backImage->getClientOriginalExtension();
            
            // Ensure the network directory exists
            if (!file_exists($this->networkPath)) {
                mkdir($this->networkPath, 0777, true);
            }
            
            // Move files directly to the network path
            $frontImage->move($this->networkPath, $frontImageName);
            $backImage->move($this->networkPath, $backImageName);

            // Save to database
            $template = TemplateImage::create([
                'businessunit_id' => $request->businessunit_id,
                'image_path' => $frontImageName,
                'image_path2' => $backImageName,
            ]);

            // Log the template creation
            ActivityLogService::log(
                'template_created',
                'Created a new ID template for business unit ID: ' . $request->businessunit_id,
                'App\Models\TemplateImage',
                $template->id,
                [
                    'businessunit_id' => $request->businessunit_id,
                    'front_image' => $frontImageName,
                    'back_image' => $backImageName,
                    'created_by' => Auth::user()->name ?? 'System'
                ]
            );

            return redirect()->route('id-templates.index')->with('success', 'Template added successfully!');

        } catch (\Exception $e) {
            Log::error('Error storing template images: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return back()->with('error', 'An error occurred while saving the template: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $template = TemplateImage::with('businessUnit')->findOrFail($id);
        return Inertia::render('IdTemplates/Show', [
            'template' => $template
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        $template = TemplateImage::findOrFail($id);
        $businessUnits = BusinessUnit::all();
        return Inertia::render('IdTemplates/Edit', [
            'template' => $template,
            'businessUnits' => $businessUnits
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        try {
            $request->validate([
                'businessunit_id' => 'required|exists:business_units,businessunit_id',
                'image_front' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'image_back' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            $template = TemplateImage::findOrFail($id);
            $originalData = $template->toArray();
            $changes = [];

            // Ensure the network directory exists
            if (!file_exists($this->networkPath)) {
                mkdir($this->networkPath, 0777, true);
            }

            // Handle Image Updates
            if ($request->hasFile('image_front')) {
                // Delete old image if it exists
                if ($template->image_path && file_exists($this->networkPath . $template->image_path)) {
                    unlink($this->networkPath . $template->image_path);
                }
                
                // Store new image directly to network
                $frontImage = $request->file('image_front');
                $frontImageName = uniqid() . '_' . time() . '.' . $frontImage->getClientOriginalExtension();
                $frontImage->move($this->networkPath, $frontImageName);
                
                $changes['front_image'] = [
                    'old' => $template->image_path,
                    'new' => $frontImageName
                ];
                $template->image_path = $frontImageName;
            }
            
            if ($request->hasFile('image_back')) {
                // Delete old image if it exists
                if ($template->image_path2 && file_exists($this->networkPath . $template->image_path2)) {
                    unlink($this->networkPath . $template->image_path2);
                }
                
                // Store new image directly to network
                $backImage = $request->file('image_back');
                $backImageName = uniqid() . '_' . time() . '.' . $backImage->getClientOriginalExtension();
                $backImage->move($this->networkPath, $backImageName);
                
                $changes['back_image'] = [
                    'old' => $template->image_path2,
                    'new' => $backImageName
                ];
                $template->image_path2 = $backImageName;
            }

            if ($template->businessunit_id != $request->businessunit_id) {
                $changes['businessunit_id'] = [
                    'old' => $template->businessunit_id,
                    'new' => $request->businessunit_id
                ];
            }
            $template->businessunit_id = $request->businessunit_id;
            $template->save();

            // Log the template update
            ActivityLogService::log(
                'template_updated',
                'Updated ID template ID: ' . $id,
                'App\Models\TemplateImage',
                $template->id,
                [
                    'changes' => $changes,
                    'updated_by' => Auth::user()->name ?? 'System'
                ]
            );

            return redirect()->route('id-templates.index')->with('success', 'Template updated successfully!');
            
        } catch (\Exception $e) {
            Log::error('Error updating template: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return back()->with('error', 'An error occurred while updating the template: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        if (Auth::user()->role !== 'Admin') {
            abort(403, 'Only administrators can delete users.');
        }
        
        try {
            $template = TemplateImage::findOrFail($id);
            $templateData = $template->toArray();
            
            // Delete images from network storage
            $frontPath = $this->networkPath . $template->image_path;
            $backPath = $this->networkPath . $template->image_path2;
            
            if (file_exists($frontPath)) {
                unlink($frontPath);
            }
            
            if (file_exists($backPath)) {
                unlink($backPath);
            }

            $template->delete();

            // Log the template deletion
            ActivityLogService::log(
                'template_deleted',
                'Deleted ID template ID: ' . $id,
                'App\Models\TemplateImage',
                $id,
                [
                    'template_data' => $templateData,
                    'deleted_by' => Auth::user()->name ?? 'System',
                    'user_role' => Auth::user()->role
                ]
            );

            return redirect()->route('id-templates.index')->with('success', 'Template deleted successfully!');
        } catch (\Exception $e) {
            Log::error('Error deleting template: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->route('id-templates.index')->with('error', 'An error occurred while deleting the template: ' . $e->getMessage());
        }
    }
    
    /**
     * Show template layout editor
     */
    public function layout($id)
    {
        $template_images = TemplateImage::findOrFail($id);
        
        return Inertia::render('IdTemplates/Layout', [
            'template' => $template_images,
            'frontImageUrl' => route('network.image', [
                'folder' => 'id_templates',
                'filename' => $template_images->image_path
            ]),
            'backImageUrl' => route('network.image', [
                'folder' => 'id_templates',
                'filename' => $template_images->image_path2
            ]),
            'image1' => $template_images->image_path,
            'image2' => $template_images->image_path2
        ]);
    }

    /**
     * Update template positions
     */
    public function updatePositions(Request $request, $id)
    {
        try {
            // Log the request for debugging
            Log::info('Update positions request for template ID: ' . $id, $request->all());
            
            // Validate the request data
            $validated = $request->validate([
                'emp_img_x' => 'required|numeric',
                'emp_img_y' => 'required|numeric',
                'emp_name_x' => 'required|numeric',
                'emp_name_y' => 'required|numeric',
                'emp_img_width' => 'required|numeric',
                'emp_img_height' => 'required|numeric',
                'emp_pos_x' => 'required|numeric',
                'emp_pos_y' => 'required|numeric',
                'emp_idno_x' => 'required|numeric',
                'emp_idno_y' => 'required|numeric',
                'emp_sig_x' => 'required|numeric',
                'emp_sig_y' => 'required|numeric',
                'emp_add_x' => 'required|numeric',
                'emp_add_y' => 'required|numeric',
                'emp_bday_x' => 'required|numeric',
                'emp_bday_y' => 'required|numeric',
                'emp_sss_x' => 'required|numeric',
                'emp_sss_y' => 'required|numeric',
                'emp_phic_x' => 'required|numeric',
                'emp_phic_y' => 'required|numeric',
                'emp_hdmf_x' => 'required|numeric',
                'emp_hdmf_y' => 'required|numeric',
                'emp_tin_x' => 'required|numeric',
                'emp_tin_y' => 'required|numeric',
                'emp_emergency_name_x' => 'required|numeric',
                'emp_emergency_name_y' => 'required|numeric',
                'emp_emergency_num_x' => 'required|numeric',
                'emp_emergency_num_y' => 'required|numeric',
                'emp_emergency_add_x' => 'required|numeric',
                'emp_emergency_add_y' => 'required|numeric',
                'emp_qrcode_x' => 'required|numeric',
                'emp_qrcode_y' => 'required|numeric',
                'emp_qrcode_width' => 'numeric',
                'emp_qrcode_height' => 'numeric',
            ]);
            
            // Find the specific template to update
            $template = TemplateImage::findOrFail($id);
            $originalPositions = $template->only(array_keys($validated));
            
            // Update the template with new positions
            $template->update($validated);
            
            // Log the template positions update
            ActivityLogService::log(
                'template_positions_updated',
                'Updated ID template layout positions for template ID: ' . $id,
                'App\Models\TemplateImage',
                $template->id,
                [
                    'old_positions' => $originalPositions,
                    'new_positions' => $validated,
                    'updated_by' => Auth::user()->name ?? 'System'
                ]
            );
            
            // Return an Inertia redirect response with flash message
            return back()->with('success', 'Template layout positions updated successfully');
        } catch (ModelNotFoundException $e) {
            return back()->with('error', 'Template not found');
        } catch (\Exception $e) {
            Log::error('Error updating template positions: ' . $e->getMessage());
            return back()->with('error', 'Error updating template positions: ' . $e->getMessage());
        }
    }
    
    /**
     * Get the URL for template images
     */
    public function getImageUrl($filename)
    {
        // Return the route to access the network image
        return route('network.image', ['folder' => 'id_templates', 'filename' => $filename]);
    }

    /**
     * Update QR code position
     */
    public function updateQrPosition(Request $request, $id)
    {
        $validated = $request->validate([
            'emp_qrcode_x' => 'required|numeric',
            'emp_qrcode_y' => 'required|numeric',
            'emp_qrcode_width' => 'required|numeric|min:50',
            'emp_qrcode_height' => 'required|numeric|min:50',
        ]);
        
        try {
            $template = DB::table('template_images')
                ->where('id', $id)
                ->first();
                
            if (!$template) {
                return response()->json([
                    'success' => false,
                    'message' => 'Template not found'
                ], 404);
            }
            
            // Update only the QR code positioning fields
            DB::table('template_images')
                ->where('id', $id)
                ->update([
                    'emp_qrcode_x' => $validated['emp_qrcode_x'],
                    'emp_qrcode_y' => $validated['emp_qrcode_y'],
                    'emp_qrcode_width' => $validated['emp_qrcode_width'],
                    'emp_qrcode_height' => $validated['emp_qrcode_height'],
                ]);
                
            // Log the update for debugging purposes
            Log::info('QR code position updated', [
                'template_id' => $id,
                'new_position' => [
                    'x' => $validated['emp_qrcode_x'],
                    'y' => $validated['emp_qrcode_y'],
                    'width' => $validated['emp_qrcode_width'],
                    'height' => $validated['emp_qrcode_height'],
                ]
            ]);
                
            return response()->json([
                'success' => true,
                'message' => 'QR code position updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating QR code position: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating QR code position: ' . $e->getMessage()
            ], 500);
        }
    }
}
