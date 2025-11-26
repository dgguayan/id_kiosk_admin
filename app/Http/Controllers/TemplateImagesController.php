<?php

namespace App\Http\Controllers;

use App\Models\NetworkPath;
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
        $this->networkPath = NetworkPath::getNetworkPath(
            'network_images_path', 
            '\\\\DESKTOP-PJE8A0F\\Users\\Public\\images\\'
        ) . 'id_templates\\';
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
            $validated = $request->validate([
                'businessunit_id' => 'required|exists:business_units,businessunit_id',
                'image_front' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
                'image_back' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            Log::info('Template upload started', [
                'businessunit_id' => $request->businessunit_id,
                'has_front_image' => $request->hasFile('image_front'),
                'has_back_image' => $request->hasFile('image_back')
            ]);

            // Get files
            $frontImage = $request->file('image_front');
            $backImage = $request->file('image_back');
            
            // Generate unique filenames
            $frontImageName = uniqid() . '_' . time() . '.' . $frontImage->getClientOriginalExtension();
            $backImageName = uniqid() . '_' . time() . '.' . $backImage->getClientOriginalExtension();
            
            // Try to ensure the network directory exists
            try {
                if (!file_exists($this->networkPath)) {
                    if (!mkdir($this->networkPath, 0777, true)) {
                        throw new \Exception('Failed to create network directory');
                    }
                }
            } catch (\Exception $e) {
                Log::warning('Network path not available, using fallback storage', [
                    'network_path' => $this->networkPath,
                    'error' => $e->getMessage()
                ]);
                
                // Fallback: Store in Laravel storage/app/public instead
                $frontImageName = $frontImage->store('id_templates', 'public');
                $backImageName = $backImage->store('id_templates', 'public');
                
                // Remove the 'id_templates/' prefix as it's stored in image_path
                $frontImageName = basename($frontImageName);
                $backImageName = basename($backImageName);
            }
            
            // Only try network storage if directory was successfully created
            if (file_exists($this->networkPath) && is_writable($this->networkPath)) {
                try {
                    $frontImage->move($this->networkPath, $frontImageName);
                    $backImage->move($this->networkPath, $backImageName);
                    Log::info('Files stored in network path', [
                        'front' => $frontImageName,
                        'back' => $backImageName
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to move files to network path', [
                        'error' => $e->getMessage()
                    ]);
                    throw $e;
                }
            }

            // Save to database with default coordinates
            $template = TemplateImage::create([
                'businessunit_id' => $validated['businessunit_id'],
                'image_path' => $frontImageName,
                'image_path2' => $backImageName,
                'emp_img_x' => 177,
                'emp_img_y' => 338,
                'emp_img_width' => 300,
                'emp_img_height' => 300,
                'emp_name_x' => 325,
                'emp_name_y' => 675,
                'emp_pos_x' => 325,
                'emp_pos_y' => 700,
                'emp_idno_x' => 325,
                'emp_idno_y' => 725,
                'emp_sig_x' => 325,
                'emp_sig_y' => 760,
                'emp_qrcode_x' => 325,
                'emp_qrcode_y' => 500,
                'emp_qrcode_width' => 150,
                'emp_qrcode_height' => 150,
                'emp_add_x' => 325,
                'emp_add_y' => 225,
                'emp_bday_x' => 325,
                'emp_bday_y' => 261,
                'emp_sss_x' => 325,
                'emp_sss_y' => 286,
                'emp_phic_x' => 325,
                'emp_phic_y' => 311,
                'emp_hdmf_x' => 325,
                'emp_hdmf_y' => 336,
                'emp_tin_x' => 325,
                'emp_tin_y' => 361,
                'emp_emergency_name_x' => 325,
                'emp_emergency_name_y' => 626,
                'emp_emergency_num_x' => 325,
                'emp_emergency_num_y' => 681,
                'emp_emergency_add_x' => 325,
                'emp_emergency_add_y' => 739,
                'emp_back_idno_x' => 325,
                'emp_back_idno_y' => 400,
                'hidden_elements' => json_encode([]),
            ]);

            Log::info('Template created successfully', [
                'template_id' => $template->id,
                'businessunit_id' => $template->businessunit_id
            ]);

            // Log the template creation
            ActivityLogService::log(
                'template_created',
                'Created a new ID template for business unit ID: ' . $validated['businessunit_id'],
                'App\Models\TemplateImage',
                $template->id,
                [
                    'businessunit_id' => $validated['businessunit_id'],
                    'front_image' => $frontImageName,
                    'back_image' => $backImageName,
                    'created_by' => Auth::user()->name ?? 'System'
                ]
            );

            return redirect()->route('id-templates.index')->with('success', 'Template added successfully!');

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error storing template', [
                'errors' => $e->errors()
            ]);
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('Error storing template images: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return back()->with('error', 'An error occurred while saving the template: ' . $e->getMessage())->withInput();
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
                'emp_back_idno_x' => 'required|numeric',
                'emp_back_idno_y' => 'required|numeric',
                'hidden_elements' => 'nullable|array',
            ]);
                
            // Find the specific template to update
            $template = TemplateImage::findOrFail($id);
            $originalPositions = $template->only(array_keys($validated));
            
            // Handle the hidden_elements field
            if (isset($validated['hidden_elements'])) {
                // Ensure it's properly converted to JSON for storage
                $template->hidden_elements = json_encode($validated['hidden_elements']);
                
                // Debug log
                Log::info('Storing hidden elements', [
                    'template_id' => $id,
                    'hidden_elements' => $validated['hidden_elements'],
                    'encoded' => json_encode($validated['hidden_elements'])
                ]);
            } else {
                // Explicitly set to empty array if not provided
                $template->hidden_elements = json_encode([]);
            }
            
            // Update the template with new positions
            foreach ($validated as $key => $value) {
                if ($key !== 'hidden_elements') {
                    $template->{$key} = $value;
                }
            }
            
            $template->save();
                
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
