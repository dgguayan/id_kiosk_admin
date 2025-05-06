import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, AlignCenter, Move, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';

interface TemplateCoordinates {
    // Front elements
    emp_img_x: number;
    emp_img_y: number;
    emp_img_width: number;
    emp_img_height: number;
    emp_name_x: number;
    emp_name_y: number;
    emp_pos_x: number;
    emp_pos_y: number;
    emp_idno_x: number;
    emp_idno_y: number;
    emp_sig_x: number;
    emp_sig_y: number;

    // Back elements
    emp_qrcode_x: number;
    emp_qrcode_y: number;
    emp_qrcode_width: number;
    emp_qrcode_height: number;
    emp_add_x: number;
    emp_add_y: number;
    emp_bday_x: number;
    emp_bday_y: number;
    emp_sss_x: number;
    emp_sss_y: number;
    emp_phic_x: number;
    emp_phic_y: number;
    emp_hdmf_x: number;
    emp_hdmf_y: number;
    emp_tin_x: number;
    emp_tin_y: number;
    emp_emergency_name_x: number;
    emp_emergency_name_y: number;
    emp_emergency_num_x: number;
    emp_emergency_num_y: number;
    emp_emergency_add_x: number;
    emp_emergency_add_y: number;
    emp_back_idno_x: number;
    emp_back_idno_y: number;
}

interface TemplateImages {
    id: number;
    businessunit_id: number;
    image_path: string;
    image_path2: string;
    hidden_elements?: string[] | string;
}

interface LayoutProps {
    template: TemplateImages & TemplateCoordinates;
    image1?: string;
    image2?: string;
    pageTitle?: string;
}

// Define element types
type ElementType =
    | 'emp_img'
    | 'emp_name'
    | 'emp_pos'
    | 'emp_idno'
    | 'emp_sig'
    | 'emp_qrcode'
    | 'emp_add'
    | 'emp_bday'
    | 'emp_sss'
    | 'emp_phic'
    | 'emp_hdmf'
    | 'emp_tin'
    | 'emp_emergency_name'
    | 'emp_emergency_num'
    | 'emp_emergency_add'
    | 'emp_back_idno';

// Element metadata for rendering
interface ElementMeta {
    label: string;
    side: 'front' | 'back';
    width?: number;
    height?: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'ID Templates',
        href: '/id-templates',
    },
    {
        title: 'Layout Editor',
        href: '#',
    },
];

export default function IdTemplateLayout({
    template,
    image1,
    image2,
    pageTitle = 'ID Template Layout Editor',
}: LayoutProps) {
    const [coordinates, setCoordinates] = useState<TemplateCoordinates>({
        // Front elements
        emp_img_x: template.emp_img_x ?? 177,
        emp_img_y: template.emp_img_y ?? 338,
        emp_img_width: template.emp_img_width ?? 300,
        emp_img_height: template.emp_img_height ?? 300,
        emp_name_x: template.emp_name_x ?? 325,
        emp_name_y: template.emp_name_y ?? 675,
        emp_pos_x: template.emp_pos_x ?? 325,
        emp_pos_y: template.emp_pos_y ?? 700,
        emp_idno_x: template.emp_idno_x ?? 325,
        emp_idno_y: template.emp_idno_y ?? 725,
        emp_sig_x: template.emp_sig_x ?? 325,
        emp_sig_y: template.emp_sig_y ?? 760,

        // Back elements
        emp_qrcode_x: template.emp_qrcode_x ?? 325,
        emp_qrcode_y: template.emp_qrcode_y ?? 500,
        emp_qrcode_width: template.emp_qrcode_width ?? 150,
        emp_qrcode_height: template.emp_qrcode_height ?? 150,
        emp_add_x: template.emp_add_x ?? 325,
        emp_add_y: template.emp_add_y ?? 225,
        emp_bday_x: template.emp_bday_x ?? 325,
        emp_bday_y: template.emp_bday_y ?? 261,
        emp_sss_x: template.emp_sss_x ?? 325,
        emp_sss_y: template.emp_sss_y ?? 286,
        emp_phic_x: template.emp_phic_x ?? 325,
        emp_phic_y: template.emp_phic_y ?? 311,
        emp_hdmf_x: template.emp_hdmf_x ?? 325,
        emp_hdmf_y: template.emp_hdmf_y ?? 336,
        emp_tin_x: template.emp_tin_x ?? 325,
        emp_tin_y: template.emp_tin_y ?? 361,
        emp_emergency_name_x: template.emp_emergency_name_x ?? 325,
        emp_emergency_name_y: template.emp_emergency_name_y ?? 626,
        emp_emergency_num_x: template.emp_emergency_num_x ?? 325,
        emp_emergency_num_y: template.emp_emergency_num_y ?? 681,
        emp_emergency_add_x: template.emp_emergency_add_x ?? 325,
        emp_emergency_add_y: template.emp_emergency_add_y ?? 739,
        emp_back_idno_x: template.emp_back_idno_x ?? 325,
        emp_back_idno_y: template.emp_back_idno_y ?? 400,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const frontCanvasRef = useRef<HTMLCanvasElement>(null);
    const backCanvasRef = useRef<HTMLCanvasElement>(null);
    const [frontImage] = useState<HTMLImageElement>(new Image());
    const [backImage] = useState<HTMLImageElement>(new Image());
    const [imagesLoaded, setImagesLoaded] = useState<boolean>(false);
    const [imageLoadErrors, setImageLoadErrors] = useState<{ front: boolean; back: boolean }>({
        front: false,
        back: false,
    });
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Dragging state
    const [draggedElement, setDraggedElement] = useState<ElementType | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Resizing state
    const [isResizing, setIsResizing] = useState(false);
    const [resizeCorner, setResizeCorner] = useState<'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | null>(null);

    // Hidden elements state
    const [hiddenElements, setHiddenElements] = useState<Set<ElementType>>(() => {
        // Check if template has hidden_elements property and parse it
        if (template.hidden_elements) {
            try {
                // It could be already parsed or still a JSON string
                const hiddenElementsArray = typeof template.hidden_elements === 'string' 
                    ? JSON.parse(template.hidden_elements) 
                    : template.hidden_elements;
                    
                // Make sure it's an array before converting to Set
                if (Array.isArray(hiddenElementsArray)) {
                    console.log("Loaded hidden elements from server:", hiddenElementsArray);
                    return new Set(hiddenElementsArray as ElementType[]);
                }
            } catch (err) {
                console.error("Error parsing hidden elements:", err);
            }
        }
        return new Set();
    });

    // Element metadata lookup
    const elementMeta: Record<ElementType, ElementMeta> = {
        emp_img: { label: 'Photo', side: 'front', width: coordinates.emp_img_width, height: coordinates.emp_img_height },
        emp_name: { label: 'Name', side: 'front' },
        emp_pos: { label: 'Position', side: 'front' },
        emp_idno: { label: 'ID Number', side: 'front' },
        emp_sig: { label: 'Signature', side: 'front' },
        emp_qrcode: { label: 'QR Code', side: 'back', width: coordinates.emp_qrcode_width, height: coordinates.emp_qrcode_height },
        emp_add: { label: 'Address', side: 'back' },
        emp_bday: { label: 'Birthdate', side: 'back' },
        emp_sss: { label: 'SSS', side: 'back' },
        emp_phic: { label: 'PhilHealth', side: 'back' },
        emp_hdmf: { label: 'HDMF', side: 'back' },
        emp_tin: { label: 'TIN', side: 'back' },
        emp_emergency_name: { label: 'Emergency Contact', side: 'back' },
        emp_emergency_num: { label: 'Emergency Number', side: 'back' },
        emp_emergency_add: { label: 'Emergency Address', side: 'back' },
        emp_back_idno: { label: 'ID Number (Back)', side: 'back' },
    };

    // Get network image URL function
    const getNetworkImageUrl = (filename: string) => {
        try {
            return route('network.image', {
                folder: 'id_templates',
                filename: filename,
            });
        } catch (e) {
            console.error('Error generating network image URL:', e);
            return `/storage/images/id_templates/${filename}`;
        }
    };

    // Setup canvases
    useEffect(() => {
        if (frontCanvasRef.current) {
            frontCanvasRef.current.width = 651;
            frontCanvasRef.current.height = 1005;
        }
        if (backCanvasRef.current) {
            backCanvasRef.current.width = 651;
            backCanvasRef.current.height = 1005;
        }
    }, []);

    useEffect(() => {
        const loadImages = async () => {
            let frontLoaded = false;
            let backLoaded = false;

            // Load front image
            if (image1) {
                try {
                    await new Promise<void>((resolve, reject) => {
                        frontImage.onload = () => {
                            frontLoaded = true;
                            resolve();
                        };
                        frontImage.onerror = (error) => {
                            console.error('Error loading front image:', error);
                            setImageLoadErrors((prev) => ({ ...prev, front: true }));
                            reject();
                        };
                        frontImage.src = getNetworkImageUrl(image1);
                    });
                } catch (e) {
                    console.error('Failed to load front image:', e);
                }
            }

            // Load back image
            if (image2) {
                try {
                    await new Promise<void>((resolve, reject) => {
                        backImage.onload = () => {
                            backLoaded = true;
                            resolve();
                        };
                        backImage.onerror = (error) => {
                            console.error('Error loading back image:', error);
                            setImageLoadErrors((prev) => ({ ...prev, back: true }));
                            reject();
                        };
                        backImage.src = getNetworkImageUrl(image2);
                    });
                } catch (e) {
                    console.error('Failed to load back image:', e);
                }
            }

            setImagesLoaded(true);

            if (frontLoaded) drawFrontCanvas();
            if (backLoaded) drawBackCanvas();
        };

        loadImages();
    }, [image1, image2]);

    // Redraw canvases when coordinates change or dragging state changes
    useEffect(() => {
        if (imagesLoaded) {
            if (!imageLoadErrors.front) drawFrontCanvas();
            if (!imageLoadErrors.back) drawBackCanvas();
        }
    }, [coordinates, imagesLoaded, isDragging, draggedElement]);

    // NEW effect: Redraw canvases when hidden elements change
    useEffect(() => {
        if (imagesLoaded) {
            drawFrontCanvas();
            drawBackCanvas();
        }
    }, [hiddenElements]);

    // Helper to get element bounds for hit testing
    const getElementBounds = (element: ElementType) => {
        const x = coordinates[`${element}_x` as keyof TemplateCoordinates] as number;
        const y = coordinates[`${element}_y` as keyof TemplateCoordinates] as number;

        let width = 100;
        let height = 20;

        // Special cases for elements with specific sizes
        if (element === 'emp_img') {
            width = coordinates.emp_img_width;
            height = coordinates.emp_img_height;
        } else if (element === 'emp_qrcode') {
            width = coordinates.emp_qrcode_width;
            height = coordinates.emp_qrcode_height;
        } else if (element === 'emp_sig') {
            width = 270;  // Smaller, more reasonable width
            height = 190;  // Smaller, more reasonable height
            
            // For signature, center around the coordinate
            return {
                left: x - width / 2,
                top: y - height / 2,
                right: x + width / 2,
                bottom: y + height / 2,
                width,
                height,
            };
        } else if (element.includes('emergency')) {
            width = 200;
            height = 20;
        }

        // For QR code and Photo, use the coordinate point as the top-left corner
        if (element === 'emp_img' || element === 'emp_qrcode') {
            return {
                left: x,
                top: y,
                right: x + width,
                bottom: y + height,
                width,
                height,
            };
        }
        
        // For most text elements on the back side of the card, use left alignment
        // These are elements that should be left-aligned in the ID card
        const backTextElements = [
            'emp_add', 'emp_bday', 'emp_sss', 'emp_phic', 'emp_hdmf', 'emp_tin',
            'emp_emergency_name', 'emp_emergency_num', 'emp_emergency_add', 'emp_back_idno'
        ];
        
        if (backTextElements.includes(element)) {
            // For back text elements, use left alignment with vertical centering
            return {
                left: x,
                top: y - height/2,
                right: x + width,
                bottom: y + height/2,
                width,
                height,
            };
        }
        
        // For remaining elements (front side text), center them around the coordinate point
        return {
            left: x - width / 2,
            top: y - height / 2,
            right: x + width / 2,
            bottom: y + height / 2,
            width,
            height,
        };
    };

    // Update the isPointInElement function to use the actual visual bounds
    const isPointInElement = (element: ElementType, x: number, y: number) => {
        // Skip hidden elements
        if (hiddenElements.has(element)) return false;
        
        const bounds = getElementBounds(element);
        
        // For standard image elements, use the full rectangle
        if (element === 'emp_img' || element === 'emp_qrcode') {
            return x >= bounds.left && x <= bounds.right && 
                    y >= bounds.top && y <= bounds.bottom;
        }
        
        // For text elements, calculate the actual text width + padding
        // First set the appropriate font to get accurate measurements
        const ctx = frontCanvasRef.current?.getContext('2d');
        if (!ctx) return false;
        
        // Set font based on element type
        const backTextElements = [
            'emp_add', 'emp_bday', 'emp_sss', 'emp_phic', 'emp_hdmf', 'emp_tin',
            'emp_emergency_name', 'emp_emergency_num', 'emp_emergency_add', 'emp_back_idno'
        ];
        
        if (element === 'emp_name') {
            ctx.font = 'bold 30px "Calibri", "Roboto", sans-serif';
        } else if (element === 'emp_pos') {
            ctx.font = 'italic 25px "Calibri", "Roboto", sans-serif';
        } else if (element === 'emp_idno') {
            ctx.font = 'bold 18px "Calibri", "Roboto", sans-serif';
        } else if (backTextElements.includes(element)) {
            ctx.font = '25px "Calibri", "Roboto", sans-serif';
        } else {
            ctx.font = '18px "Calibri", "Roboto", sans-serif';
        }
        
        // Determine sample text based on element type
        let sampleText = elementMeta[element].label;
        if (element === 'emp_name') {
            sampleText = "Employee Name";
        } else if (element === 'emp_pos') {
            sampleText = "Position";
        } else if (element === 'emp_idno') {
            sampleText = "IDNO";
        } else if (element === 'emp_back_idno') { // Add this case
            sampleText = "Back IDNO";
        } else if (element === 'emp_sig') {
            sampleText = "Employee Signature";
        } else if (element === 'emp_add') {
            sampleText = "123 Sample Street, City";
        } else if (element === 'emp_bday') {
            sampleText = "Birthdate: Month Day, Year";
        } else if (element === 'emp_sss') {
            sampleText = "SSS: 12-3456789-0";
        } else if (element === 'emp_phic') {
            sampleText = "PHIC: 98-7654321-0";
        } else if (element === 'emp_hdmf') {
            sampleText = "HDMF: 1234-5678-9012";
        } else if (element === 'emp_tin') {
            sampleText = "TIN: 123-456-789-000";
        } else if (element === 'emp_emergency_name') {
            sampleText = "Emergency Contact";
        } else if (element === 'emp_emergency_num') {
            sampleText = "(123) 456-7890";
        } else if (element === 'emp_emergency_add') {
            sampleText = "456 Emergency Address, City";
        }
        
        // Calculate text dimensions with padding
        const textMetrics = ctx.measureText(sampleText);
        const textWidth = textMetrics.width;
        const horizontalPadding = 20;
        let adjustedWidth = textWidth + horizontalPadding;
        
        // Calculate height with padding
        let adjustedHeight = bounds.height;
        if (element === 'emp_add' || element === 'emp_emergency_add') {
            adjustedHeight = 45; // Taller for multiline text
        }
        
        // Calculate actual bounds based on element type
        let actualLeft, actualTop, actualRight, actualBottom;
        
        if (backTextElements.includes(element)) {
            // For back elements - use left-aligned bounds
            actualLeft = bounds.left;
            actualTop = bounds.top;
            actualRight = bounds.left + adjustedWidth;
            actualBottom = bounds.top + adjustedHeight;
        } else if (element === 'emp_sig') {
            // Use same dimensions as in other places
            const sigWidth = 270;
            const sigHeight = 190;
            
            // Calculate actual bounds for signature element
            const sigLeft = bounds.left;
            const sigTop = bounds.top;
            
            // Check if point is within signature bounds - return a boolean
            return x >= sigLeft && x <= sigLeft + sigWidth && 
                   y >= sigTop && y <= sigTop + sigHeight;
        } else {
            // For centered elements (front side text elements)
            actualLeft = bounds.left + (bounds.width - adjustedWidth) / 2;
            actualTop = bounds.top;
            actualRight = actualLeft + adjustedWidth;
            actualBottom = actualTop + adjustedHeight;
        }
        
        // Check if point is within the adjusted bounds
        return x >= actualLeft && x <= actualRight && 
                y >= actualTop && y <= actualBottom;
    };

    // Handle mouse down on canvas to start dragging
    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>, side: 'front' | 'back') => {
        const canvas = e.currentTarget;
        const rect = canvas.getBoundingClientRect();

        // Calculate the actual position on the canvas considering scaling
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        // Check for resize handles on the employee image (front side only)
        if (side === 'front') {
            const imgBounds = getElementBounds('emp_img');
            const handleSize = 10;
            
            // Check each corner for resize handles
            const isInTopLeft = Math.abs(x - imgBounds.left) <= handleSize && 
                               Math.abs(y - imgBounds.top) <= handleSize;
            const isInTopRight = Math.abs(x - (imgBounds.left + imgBounds.width)) <= handleSize && 
                                Math.abs(y - imgBounds.top) <= handleSize;
            const isInBottomLeft = Math.abs(x - imgBounds.left) <= handleSize && 
                                  Math.abs(y - (imgBounds.top + imgBounds.height)) <= handleSize;
            const isInBottomRight = Math.abs(x - (imgBounds.left + imgBounds.width)) <= handleSize && 
                                   Math.abs(y - (imgBounds.top + imgBounds.height)) <= handleSize;
            
            if (isInTopLeft || isInTopRight || isInBottomLeft || isInBottomRight) {
                setIsResizing(true);
                setDraggedElement('emp_img');
                
                if (isInTopLeft) setResizeCorner('topLeft');
                else if (isInTopRight) setResizeCorner('topRight');
                else if (isInBottomLeft) setResizeCorner('bottomLeft');
                else setResizeCorner('bottomRight');
                
                // Store the initial mouse position for delta calculation
                setDragOffset({ x, y });
                return; // Exit early - we're resizing not dragging
            }
        }

        // Check which element was clicked
        const elements = Object.keys(elementMeta) as ElementType[];
        for (let i = elements.length - 1; i >= 0; i--) {
            const element = elements[i];
            if (elementMeta[element].side === side && isPointInElement(element, x, y)) {
                setDraggedElement(element);
                setIsDragging(true);

                // Different drag offset calculation based on element type
                if (element === 'emp_img' || element === 'emp_qrcode') {
                    // For images/QR code, calculate offset from cursor to top-left corner
                    const elementX = coordinates[`${element}_x` as keyof TemplateCoordinates] as number;
                    const elementY = coordinates[`${element}_y` as keyof TemplateCoordinates] as number;
                    
                    setDragOffset({
                        x: x - elementX,
                        y: y - elementY
                    });
                } else {
                    // For text elements, keep the existing center-based approach
                    const bounds = getElementBounds(element);
                    const centerX = bounds.left + bounds.width / 2;
                    const centerY = bounds.top + bounds.height / 2;
                    
                    setDragOffset({ 
                        x: x - centerX, 
                        y: y - centerY 
                    });
                }
                
                break;
            }
        }
    };

    // Handle mouse move for dragging and resizing
    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if ((!isDragging && !isResizing) || !draggedElement) return;

        const canvas = e.currentTarget;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        // Handle resizing
        if (isResizing && draggedElement === 'emp_img' && resizeCorner) {
            // Get current position and dimensions
            const currentX = coordinates.emp_img_x;
            const currentY = coordinates.emp_img_y;
            const currentWidth = coordinates.emp_img_width;
            const currentHeight = coordinates.emp_img_height;
            
            // Calculate changes based on movement
            const deltaX = x - dragOffset.x;
            const deltaY = y - dragOffset.y;
            
            // Update coordinates based on which corner is being dragged
            let newX = currentX;
            let newY = currentY;
            let newWidth = currentWidth;
            let newHeight = currentHeight;
            
            switch (resizeCorner) {
                case 'topLeft':
                    newX = Math.min(currentX + deltaX, currentX + currentWidth - 50);
                    newY = Math.min(currentY + deltaY, currentY + currentHeight - 50);
                    newWidth = currentWidth - deltaX;
                    newHeight = currentHeight - deltaY;
                    break;
                case 'topRight':
                    newY = Math.min(currentY + deltaY, currentY + currentHeight - 50);
                    newWidth = currentWidth + deltaX;
                    newHeight = currentHeight - deltaY;
                    break;
                case 'bottomLeft':
                    newX = Math.min(currentX + deltaX, currentX + currentWidth - 50);
                    newWidth = currentWidth - deltaX;
                    newHeight = currentHeight + deltaY;
                    break;
                case 'bottomRight':
                    newWidth = currentWidth + deltaX;
                    newHeight = currentHeight + deltaY;
                    break;
            }
            
            // Ensure minimum size
            newWidth = Math.max(50, newWidth);
            newHeight = Math.max(50, newHeight);
            
            // Update coordinates state
            setCoordinates(prev => ({
                ...prev,
                emp_img_x: Math.round(newX),
                emp_img_y: Math.round(newY),
                emp_img_width: Math.round(newWidth),
                emp_img_height: Math.round(newHeight)
            }));
            
            // Update drag offset for next move
            setDragOffset({ x, y });
            
            return;
        }
        
        // Existing dragging code...
        if (isDragging && draggedElement) {
            if (draggedElement === 'emp_img' || draggedElement === 'emp_qrcode') {
                // For image and QR code, directly apply the offset from the drag start point
                const newX = Math.max(0, Math.min(x - dragOffset.x, canvas.width - 50));
                const newY = Math.max(0, Math.min(y - dragOffset.y, canvas.height - 50));
                
                // Update coordinates using direct positioning (top-left based)
                setCoordinates(prev => ({
                    ...prev,
                    [`${draggedElement}_x`]: Math.round(newX),
                    [`${draggedElement}_y`]: Math.round(newY)
                }));
            } else {
                // For text elements, keep using the center-based approach
                const newX = x - dragOffset.x;
                const newY = y - dragOffset.y;
                
                // But convert to the appropriate coordinate system before saving
                let finalX = newX;
                let finalY = newY;
                
                // For back text elements, convert from center to left alignment
                const backTextElements = [
                    'emp_add', 'emp_bday', 'emp_sss', 'emp_phic', 'emp_hdmf', 'emp_tin',
                    'emp_emergency_name', 'emp_emergency_num', 'emp_emergency_add', 'emp_back_idno'
                ];
                
                if (backTextElements.includes(draggedElement)) {
                    // Since we dragged from the center but need to store as left-aligned
                    const bounds = getElementBounds(draggedElement);
                    finalX = newX - bounds.width / 2;
                }
                
                // Update coordinates with the appropriate reference point
                setCoordinates(prev => ({
                    ...prev,
                    [`${draggedElement}_x`]: Math.round(finalX),
                    [`${draggedElement}_y`]: Math.round(finalY)
                }));
            }
        }
    };

    // Handle mouse up to end dragging
    const handleCanvasMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
        setResizeCorner(null);
        setDraggedElement(null);
    };

    // Handle mouse leave to end dragging
    const handleCanvasMouseLeave = () => {
        if (isDragging || isResizing) {
            setIsDragging(false);
            setIsResizing(false);
            setResizeCorner(null);
            setDraggedElement(null);
        }
    };

    // Add this to your component
    const handleCanvasMouseOver = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!frontCanvasRef.current) return;
        
        const canvas = e.currentTarget;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        const imgBounds = getElementBounds('emp_img');
        const handleSize = 10;
        
        // Check if cursor is over any resize handle
        const isInTopLeft = Math.abs(x - imgBounds.left) <= handleSize && Math.abs(y - imgBounds.top) <= handleSize;
        const isInTopRight = Math.abs(x - (imgBounds.left + imgBounds.width)) <= handleSize && Math.abs(y - imgBounds.top) <= handleSize;
        const isInBottomLeft = Math.abs(x - imgBounds.left) <= handleSize && Math.abs(y - (imgBounds.top + imgBounds.height)) <= handleSize;
        const isInBottomRight = Math.abs(x - (imgBounds.left + imgBounds.width)) <= handleSize && Math.abs(y - (imgBounds.top + imgBounds.height)) <= handleSize;
        
        if (isInTopLeft || isInTopRight || isInBottomLeft || isInBottomRight) {
            canvas.style.cursor = 'nwse-resize';
        } else {
            // Check if we're over any element
            const elements = Object.keys(elementMeta) as ElementType[];
            let overElement = false;
            
            for (const element of elements) {
                if (elementMeta[element].side === 'front' && isPointInElement(element, x, y)) {
                    overElement = true;
                    break;
                }
            }
            
            canvas.style.cursor = overElement ? 'move' : 'default';
        }
    };

    // Draw sample elements on front canvas
    const drawFrontCanvas = () => {
        const canvas = frontCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw ID template background
        if (!imageLoadErrors.front) {
            ctx.drawImage(frontImage, 0, 0, canvas.width, canvas.height);
        } else {
            // Draw placeholder if image failed to load
            ctx.fillStyle = '#f3f4f6';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#6b7280';
            ctx.font = '24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Front template image not available', canvas.width / 2, canvas.height / 2);
        }

        // Draw all elements - hidden ones will be skipped within drawElement
        drawElement(ctx, 'emp_img', 'rgba(200, 200, 200, 0.7)');
        drawElement(ctx, 'emp_name', 'rgba(100, 149, 237, 0.7)');
        drawElement(ctx, 'emp_pos', 'rgba(144, 238, 144, 0.7)');
        drawElement(ctx, 'emp_idno', 'rgba(255, 182, 193, 0.7)');
        drawElement(ctx, 'emp_sig', 'rgba(255, 215, 0, 0.7)');
    };

    // Draw sample elements on back canvas
    const drawBackCanvas = () => {
        const canvas = backCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw ID template background
        if (!imageLoadErrors.back) {
            ctx.drawImage(backImage, 0, 0, canvas.width, canvas.height);
        } else {
            // Draw placeholder if image failed to load
            ctx.fillStyle = '#f3f4f6';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#6b7280';
            ctx.font = '24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Back template image not available', canvas.width / 2, canvas.height / 2);
        }

        // Draw all elements - hidden ones will be skipped within drawElement
        drawElement(ctx, 'emp_qrcode', 'rgba(200, 200, 200, 0.7)');
        drawElement(ctx, 'emp_add', 'rgba(100, 149, 237, 0.7)');
        drawElement(ctx, 'emp_bday', 'rgba(144, 238, 144, 0.7)');
        drawElement(ctx, 'emp_sss', 'rgba(255, 182, 193, 0.7)');
        drawElement(ctx, 'emp_phic', 'rgba(255, 182, 193, 0.7)');
        drawElement(ctx, 'emp_hdmf', 'rgba(255, 182, 193, 0.7)');
        drawElement(ctx, 'emp_tin', 'rgba(255, 182, 193, 0.7)');
        drawElement(ctx, 'emp_emergency_name', 'rgba(255, 215, 0, 0.7)');
        drawElement(ctx, 'emp_emergency_num', 'rgba(255, 215, 0, 0.7)');
        drawElement(ctx, 'emp_emergency_add', 'rgba(255, 215, 0, 0.7)');
        drawElement(ctx, 'emp_back_idno', 'rgba(255, 182, 193, 0.7)');
    };

    // Updated drawElement function to show hidden elements with reduced opacity
    const drawElement = (ctx: CanvasRenderingContext2D, element: ElementType, color: string) => {
        const bounds = getElementBounds(element);
        const backTextElements = [
            'emp_add', 'emp_bday', 'emp_sss', 'emp_phic', 'emp_hdmf', 'emp_tin',
            'emp_emergency_name', 'emp_emergency_num', 'emp_emergency_add', 'emp_back_idno'
        ];
        
        // Set opacity based on whether element is hidden or not
        ctx.globalAlpha = hiddenElements.has(element) ? 0.08 : 1.0;

        // Set font first so we can measure text
        if (element === 'emp_name') {
            ctx.font = 'bold 30px "Calibri", "Roboto", sans-serif';
        } else if (element === 'emp_pos') {
            ctx.font = 'italic 25px "Calibri", "Roboto", sans-serif';
        } else if (element === 'emp_idno') {
            ctx.font = 'bold 18px "Calibri", "Roboto", sans-serif';
        } else if (backTextElements.includes(element)) {
            ctx.font = '25px "Calibri", "Roboto", sans-serif';
        } else {
            ctx.font = '18px "Calibri", "Roboto", sans-serif';
        }

        let sampleText = elementMeta[element].label;
        if (element === 'emp_name') {
            sampleText = "Employee Name";
        } else if (element === 'emp_pos') {
            sampleText = "Position";
        } else if (element === 'emp_idno') {
            sampleText = "IDNO";
        } else if (element === 'emp_back_idno') { // Add this case
            sampleText = "Back IDNO";
        } else if (element === 'emp_sig') {
            sampleText = "Employee Signature";
        } else if (element === 'emp_add') {
            sampleText = "123 Sample Street, City";
        } else if (element === 'emp_bday') {
            sampleText = "Birthdate: Month Day, Year";
        } else if (element === 'emp_sss') {
            sampleText = "SSS: 12-3456789-0";
        } else if (element === 'emp_phic') {
            sampleText = "PHIC: 98-7654321-0";
        } else if (element === 'emp_hdmf') {
            sampleText = "HDMF: 1234-5678-9012";
        } else if (element === 'emp_tin') {
            sampleText = "TIN: 123-456-789-000";
        } else if (element === 'emp_emergency_name') {
            sampleText = "Emergency Contact";
        } else if (element === 'emp_emergency_num') {
            sampleText = "(123) 456-7890";
        } else if (element === 'emp_emergency_add') {
            sampleText = "456 Emergency Address, City";
        }

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (element === 'emp_img' || element === 'emp_qrcode') {
            // Draw the rectangle with appropriate transparency
            ctx.fillStyle = color;
            ctx.fillRect(bounds.left, bounds.top, bounds.width, bounds.height);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(bounds.left, bounds.top, bounds.width, bounds.height);

            // If hidden, add a crossed-out effect
            if (hiddenElements.has(element)) {
                ctx.beginPath();
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 2;
                ctx.moveTo(bounds.left, bounds.top);
                ctx.lineTo(bounds.left + bounds.width, bounds.top + bounds.height);
                ctx.moveTo(bounds.left + bounds.width, bounds.top);
                ctx.lineTo(bounds.left, bounds.top + bounds.height);
                ctx.stroke();
                ctx.lineWidth = 1;
            }

            // Add resize handles for emp_img (only when not hidden)
            if (draggedElement === 'emp_img') {
                const handleSize = 10;
                ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
                ctx.fillRect(bounds.left - handleSize / 2, bounds.top - handleSize / 2, handleSize, handleSize);
                ctx.fillRect(bounds.left + bounds.width - handleSize / 2, bounds.top - handleSize / 2, handleSize, handleSize);
                ctx.fillRect(bounds.left - handleSize / 2, bounds.top + bounds.height - handleSize / 2, handleSize, handleSize);
                ctx.fillRect(bounds.left + bounds.width - handleSize / 2, bounds.top + bounds.height - handleSize / 2, handleSize, handleSize);
            }
        } else if (element === 'emp_sig') {
            // Get the bounds from the getElementBounds function
            const sigWidth = 270;
            const sigHeight = 190;
            
            // Use the same bounds for drawing as we do for hit detection
            const adjustedWidth = sigWidth;
            const adjustedHeight = sigHeight;
            
            // Calculate centered position (since signature should be centered)
            const adjustedLeft = bounds.left + (bounds.width - adjustedWidth) / 2;
            const adjustedTop = bounds.top + (bounds.height - adjustedHeight) / 2;
            
            // Draw a rectangle for the signature box with actual dimensions
            ctx.fillStyle = color;
            ctx.fillRect(adjustedLeft, adjustedTop, adjustedWidth, adjustedHeight);
            
            // Add a signature-like line for visual indication
            ctx.beginPath();
            ctx.moveTo(adjustedLeft + 20, adjustedTop + adjustedHeight/2);
            ctx.bezierCurveTo(
                adjustedLeft + adjustedWidth/3, adjustedTop + adjustedHeight/3,
                adjustedLeft + adjustedWidth/2, adjustedTop + adjustedHeight/1.5,
                adjustedLeft + adjustedWidth - 20, adjustedTop + adjustedHeight/2
            );
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            // If hidden, add a crossed-out effect
            if (hiddenElements.has(element)) {
                ctx.beginPath();
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 2;
                ctx.moveTo(adjustedLeft, adjustedTop);
                ctx.lineTo(adjustedLeft + adjustedWidth, adjustedTop + adjustedHeight);
                ctx.moveTo(adjustedLeft + adjustedWidth, adjustedTop);
                ctx.lineTo(adjustedLeft, adjustedTop + adjustedHeight);
                ctx.stroke();
                ctx.lineWidth = 1;
            }
        } else {
            // Calculate the actual text width plus padding
            const metrics = ctx.measureText(sampleText);
            const textWidth = metrics.width;
            const horizontalPadding = 20; // Add some padding on both sides
            const verticalPadding = 10;  // Add some padding on top and bottom
            
            let adjustedWidth = textWidth + horizontalPadding;
            let adjustedHeight = bounds.height;

            // For multiline text elements, adjust height
            if (element === 'emp_add' || element === 'emp_emergency_add') {
                adjustedHeight = 22.5; // Allow for 2 lines of text
            }
            
            // Calculate actual bounds based on element type
            let adjustedLeft, adjustedTop;
            
            if (backTextElements.includes(element)) {
                // For back elements - left aligned, but considering the text width
                adjustedLeft = bounds.left;
                adjustedTop = bounds.top;
            } else {
                // For centered elements
                adjustedLeft = bounds.left + (bounds.width - adjustedWidth) / 2;
                adjustedTop = bounds.top;
            }
            
            // Draw the colored background with appropriate transparency
            ctx.fillStyle = color;
            ctx.fillRect(adjustedLeft, adjustedTop, adjustedWidth, adjustedHeight);
            
            // Draw sample text
            ctx.fillStyle = '#000000';
            
            if (backTextElements.includes(element)) {
                // Left-align the text for back elements, but position it properly
                ctx.textAlign = 'left';
                ctx.fillText(sampleText, adjustedLeft + 5, adjustedTop + adjustedHeight / 2);
            } else {
                // Center the text for other elements
                ctx.textAlign = 'center';
                ctx.fillText(sampleText, adjustedLeft + adjustedWidth / 2, adjustedTop + adjustedHeight / 2);
            }
            
            // If hidden, add a line through the text
            if (hiddenElements.has(element)) {
                ctx.beginPath();
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 1;
                
                if (backTextElements.includes(element)) {
                    // For left-aligned text, draw line through the text area
                    ctx.moveTo(adjustedLeft, adjustedTop + adjustedHeight / 2);
                    ctx.lineTo(adjustedLeft + adjustedWidth, adjustedTop + adjustedHeight / 2);
                } else {
                    // For centered text, draw line through the text area
                    const centerY = adjustedTop + adjustedHeight / 2;
                    ctx.moveTo(adjustedLeft, centerY);
                    ctx.lineTo(adjustedLeft + adjustedWidth, centerY);
                }
                
                ctx.stroke();
                ctx.lineWidth = 1;
            }
            
            // Draw visual guides for alignment (only when selected and not hidden)
            if (draggedElement === element && !hiddenElements.has(element)) {
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                ctx.setLineDash([2, 2]);
                
                // Show vertical center line for all elements
                const centerY = adjustedTop + adjustedHeight / 2;
                ctx.beginPath();
                ctx.moveTo(adjustedLeft, centerY);
                ctx.lineTo(adjustedLeft + adjustedWidth, centerY);
                ctx.stroke();
                
                // For centered elements, also show center alignment
                if (!backTextElements.includes(element)) {
                    const centerX = adjustedLeft + adjustedWidth / 2;
                    ctx.beginPath();
                    ctx.moveTo(centerX, adjustedTop);
                    ctx.lineTo(centerX, adjustedTop + adjustedHeight);
                    ctx.stroke();
                }
                
                ctx.restore();
            }
        }

        // If this element is being dragged (only possible if not hidden), add a visual indicator
        if (draggedElement === element && !hiddenElements.has(element)) {
            // Calculate the actual bounds we're using
            const actualLeft = element === 'emp_img' || element === 'emp_qrcode' ? bounds.left : 
                             backTextElements.includes(element) ? bounds.left :
                             bounds.left + (bounds.width - ctx.measureText(sampleText).width - 20) / 2;
            
            const actualWidth = element === 'emp_img' || element === 'emp_qrcode' ? bounds.width : 
                              ctx.measureText(sampleText).width + 20;
            
            // Draw selection border that fits the actual element size
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                actualLeft - 2, 
                bounds.top - 2, 
                actualWidth + 4, 
                (element === 'emp_add' || element === 'emp_emergency_add' ? 22.5 : bounds.height) + 4
            );

            // Add element name when dragging
            ctx.fillStyle = '#ff0000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            
            // Position label above the element
            ctx.fillText(
                elementMeta[element].label, 
                actualLeft + actualWidth / 2, 
                bounds.top - 5
            );

            ctx.lineWidth = 1;
        }
        
        // Reset global alpha to default
        ctx.globalAlpha = 1.0;
    };

    // Update element position and redraw canvas
    const updateElementPosition = (element: string, property: string, value: string) => {
        const numValue = parseInt(value);
        if (isNaN(numValue)) return;

        const key = `${element}_${property}` as keyof TemplateCoordinates;

        setCoordinates((prev) => ({
            ...prev,
            [key]: numValue,
        }));
    };

    // Center element horizontally
    const centerElement = (element: string) => {
        // Canvas width is 651
        const canvasCenter = 651 / 2;

        // Update the X coordinate for the specified element
        const key = `${element}_x` as keyof TemplateCoordinates;

        setCoordinates((prev) => ({
            ...prev,
            [key]: canvasCenter,
        }));
    };

    // Save changes
    const saveChanges = () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setSuccessMessage(null);

        // Map our coordinates object to match the expected format in the server
        const mappedCoordinates = { ...coordinates };
        
        // Convert hidden elements Set to array for storage and log it for debugging
        const hiddenElementsArray = Array.from(hiddenElements);
        console.log("Sending hidden elements to server:", hiddenElementsArray);

        router.post(route('id-templates.update-positions', template.id), 
            { 
                ...mappedCoordinates,
                hidden_elements: hiddenElementsArray  // Ensure this matches what the controller expects
            }, 
            {
                onSuccess: (page) => {
                    console.log("Success response:", page);
                    setSuccessMessage('Template coordinates saved successfully!');
                    setIsSubmitting(false);
                    
                    // Hide success message after 3 seconds
                    setTimeout(() => {
                        setSuccessMessage(null);
                    }, 3000);
                },
                onError: (errors) => {
                    console.error("Error response:", errors);
                    setIsSubmitting(false);
                    const errorMessage = Object.values(errors).flat().join('\n');
                    setSuccessMessage(`Error: ${errorMessage || 'Failed to update template layout'}`);
                    
                    // Hide error message after 5 seconds
                    setTimeout(() => {
                        setSuccessMessage(null);
                    }, 5000);
                }
            }
        );
    };

    // Update your toggleElementVisibility function
    const toggleElementVisibility = (element: ElementType) => {
        setHiddenElements((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(element)) {
                newSet.delete(element);
            } else {
                newSet.add(element);
            }
            return newSet;
        });
        // Note: No need to call drawFrontCanvas/drawBackCanvas here 
        // because the useEffect above will handle that
    };

    const HideShowToggle = ({ element }: { element: ElementType }) => {
      const isHidden = hiddenElements.has(element);
      
      return (
        <button
          className={`flex items-center px-1 py-0.5 rounded text-xs ${
            isHidden
              ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border border-dashed border-gray-400'
              : 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
          }`}
          onClick={() => toggleElementVisibility(element)}
          title={isHidden ? 'Show element' : 'Hide element'}
        >
          {isHidden ? (
            <>
              <EyeOff className="h-3 w-3 mr-1" /> Hidden
            </>
          ) : (
            <>
              <Eye className="h-3 w-3 mr-1" /> Visible
            </>
          )}
        </button>
      );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle} />

            {/* Header */}
            <div className="px-4 sm:px-6 lg:px-8 py-5 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <Link
                        href={route('id-templates.index')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Templates
                    </Link>

                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">ID Card Template Manager</h2>

                    <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-md border border-transparent bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:w-auto dark:bg-white dark:text-black dark:hover:bg-gray-200 dark:focus:ring-gray-400"
                        onClick={saveChanges}
                        disabled={isSubmitting}
                    >
                        <Save className="h-4 w-4" />
                        {isSubmitting ? 'Saving...' : 'Save Template'}
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="px-2 sm:px-4 lg:px-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Front controls - more compact */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="bg-gray-100 dark:bg-gray-900 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-xs font-semibold text-gray-900 dark:text-white">Front Elements</h3>
                        </div>
                        <div className="p-2 max-h-[750px] overflow-y-auto space-y-2">
                            {/* Instructions for drag */}
                            <div className="p-2 mb-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                <p className="text-xs text-blue-700 dark:text-blue-400 flex items-center">
                                    <Move className="h-3 w-3 mr-1" />
                                    Drag elements directly on canvas
                                </p>
                            </div>

                            {/* Photo */}
                            <div className="pb-2 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Photo</span>
                                    <HideShowToggle element="emp_img" />
                                </div>
                                <div className="grid grid-cols-2 gap-1 mb-1">
                                    <div className="flex items-center">
                                        <span className="w-4 h-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">X</span>
                                        <input
                                            type="number"
                                            value={coordinates.emp_img_x}
                                            onChange={(e) => updateElementPosition('emp_img', 'x', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-4 h-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">Y</span>
                                        <input
                                            type="number"
                                            value={coordinates.emp_img_y}
                                            onChange={(e) => updateElementPosition('emp_img', 'y', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-1">
                                    <div className="flex items-center">
                                        <span className="w-4 h-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">W</span>
                                        <input
                                            type="number"
                                            value={coordinates.emp_img_width}
                                            onChange={(e) => updateElementPosition('emp_img', 'width', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-4 h-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">H</span>
                                        <input
                                            type="number"
                                            value={coordinates.emp_img_height}
                                            onChange={(e) => updateElementPosition('emp_img', 'height', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Name */}
                            <div className="pb-2 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Name</span>
                                    <button
                                        className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                        onClick={() => centerElement('emp_name')}
                                    >
                                        <AlignCenter className="h-2 w-2 mr-0.5" /> Center
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-1">
                                    <div className="flex items-center">
                                        <span className="w-4 h-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">X</span>
                                        <input
                                            type="number"
                                            value={coordinates.emp_name_x}
                                            onChange={(e) => updateElementPosition('emp_name', 'x', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-4 h-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">Y</span>
                                        <input
                                            type="number"
                                            value={coordinates.emp_name_y}
                                            onChange={(e) => updateElementPosition('emp_name', 'y', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Position */}
                            <div className="pb-2 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Position</span>
                                    <button
                                        className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                        onClick={() => centerElement('emp_pos')}
                                    >
                                        <AlignCenter className="h-2 w-2 mr-0.5" /> Center
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-1">
                                    <div className="flex items-center">
                                        <span className="w-4 h-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">X</span>
                                        <input
                                            type="number"
                                            value={coordinates.emp_pos_x}
                                            onChange={(e) => updateElementPosition('emp_pos', 'x', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-4 h-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">Y</span>
                                        <input
                                            type="number"
                                            value={coordinates.emp_pos_y}
                                            onChange={(e) => updateElementPosition('emp_pos', 'y', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ID Number */}
                            <div className='pb-2 border-b border-gray-100 dark:border-gray-700'>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">ID Number</span>
                                    <HideShowToggle element="emp_idno" />
                                    <button
                                        className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                        onClick={() => centerElement('emp_idno')}
                                    >
                                        <AlignCenter className="h-2 w-2 mr-0.5" /> Center
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-1">
                                    <div className="flex items-center">
                                        <span className="w-4 h-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">X</span>
                                        <input
                                            type="number"
                                            value={coordinates.emp_idno_x}
                                            onChange={(e) => updateElementPosition('emp_idno', 'x', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-4 h-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">Y</span>
                                        <input
                                            type="number"
                                            value={coordinates.emp_idno_y}
                                            onChange={(e) => updateElementPosition('emp_idno', 'y', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Signature */}
                            <div className="pb-2 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Signature</span>
                                    <button
                                        className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                        onClick={() => centerElement('emp_sig')}
                                    >
                                        <AlignCenter className="h-2 w-2 mr-0.5" /> Center
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-1">
                                    <div className="flex items-center">
                                        <span className="w-4 h-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">X</span>
                                        <input
                                            type="number"
                                            value={coordinates.emp_sig_x}
                                            onChange={(e) => updateElementPosition('emp_sig', 'x', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-4 h-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">Y</span>
                                        <input
                                            type="number"
                                            value={coordinates.emp_sig_y}
                                            onChange={(e) => updateElementPosition('emp_sig', 'y', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Canvas Area - Expanded */}
                <div className="lg:col-span-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Front Canvas */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2 text-center">
                            <div className="flex items-center justify-center">
                                <canvas
                                    ref={frontCanvasRef}
                                    width="651"
                                    height="1005"
                                    className="w-full h-auto border border-gray-200 dark:border-gray-700 cursor-move"
                                    onMouseDown={(e) => handleCanvasMouseDown(e, 'front')}
                                    onMouseMove={handleCanvasMouseMove}
                                    onMouseUp={handleCanvasMouseUp}
                                    onMouseLeave={handleCanvasMouseLeave}
                                    onMouseOver={handleCanvasMouseOver}
                                ></canvas>
                            </div>
                            {imageLoadErrors.front && (
                                <p className="text-yellow-600 dark:text-yellow-500 text-xs mt-1">
                                    Failed to load front template image.
                                </p>
                            )}
                        </div>

                        {/* Back Canvas */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2 text-center">
                            <div className="flex items-center justify-center">
                                <canvas
                                    ref={backCanvasRef}
                                    width="651"
                                    height="1005"
                                    className="w-full h-auto border border-gray-200 dark:border-gray-700 cursor-move"
                                    onMouseDown={(e) => handleCanvasMouseDown(e, 'back')}
                                    onMouseMove={handleCanvasMouseMove}
                                    onMouseUp={handleCanvasMouseUp}
                                    onMouseLeave={handleCanvasMouseLeave}
                                ></canvas>
                            </div>
                            {imageLoadErrors.back && (
                                <p className="text-yellow-600 dark:text-yellow-500 text-xs mt-1">
                                    Failed to load back template image.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Back controls - More compact */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="bg-gray-100 dark:bg-gray-900 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-xs font-semibold text-gray-900 dark:text-white">Back Elements</h3>
                        </div>
                        <div className="p-2 max-h-[750px] overflow-y-auto space-y-2">
                            {/* QR Code */}
                            <div className="pb-2 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">QR Code</span>
                                    <HideShowToggle element='emp_qrcode' />
                                    <button
                                        className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                        onClick={() => centerElement('emp_qrcode')}
                                    >
                                        <AlignCenter className="h-2 w-2 mr-0.5" /> Center
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-1 mb-1">
                                    <div className="flex items-center">
                                        <span className="w-4 h-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">X</span>
                                        <input
                                            type="number"
                                            value={coordinates.emp_qrcode_x}
                                            onChange={(e) => updateElementPosition('emp_qrcode', 'x', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-4 h-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">Y</span>
                                        <input
                                            type="number"
                                            value={coordinates.emp_qrcode_y}
                                            onChange={(e) => updateElementPosition('emp_qrcode', 'y', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-1">
                                    <div className="flex items-center">
                                        <span className="w-4 h-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">W</span>
                                        <input
                                            type="number"
                                            value={coordinates.emp_qrcode_width}
                                            onChange={(e) => updateElementPosition('emp_qrcode', 'width', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-4 h-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">H</span>
                                        <input
                                            type="number"
                                            value={coordinates.emp_qrcode_height}
                                            onChange={(e) => updateElementPosition('emp_qrcode', 'height', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Address */}
                            <div className="pb-2 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Address</span>
                                    <HideShowToggle element='emp_add' />
                                    <button
                                        className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                        onClick={() => centerElement('emp_add')}
                                    >
                                        <AlignCenter className="h-2 w-2 mr-0.5" /> Center
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-1">
                                    <div className="flex items-center">
                                        <span className="w-4 h-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">X</span>
                                        <input
                                            type="number"
                                            value={coordinates.emp_add_x}
                                            onChange={(e) => updateElementPosition('emp_add', 'x', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-4 h-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">Y</span>
                                        <input
                                            type="number"
                                            value={coordinates.emp_add_y}
                                            onChange={(e) => updateElementPosition('emp_add', 'y', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Birthdate, SSS, TIN in a more compact accordion-like layout */}
                            <div className="space-y-2">
                                {/* Birthdate */}
                                <div className="pb-2 border-b border-gray-100 dark:border-gray-700">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Birthdate</span>
                                        <div className="flex space-x-1">
                                            <button
                                                className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                                onClick={() => centerElement('emp_bday')}
                                            >
                                                <AlignCenter className="h-2 w-2 mr-0.5" /> Center
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1">
                                        <div className="flex items-center">
                                            <span className="w-4 h-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">X</span>
                                            <input
                                                type="number"
                                                value={coordinates.emp_bday_x}
                                                onChange={(e) => updateElementPosition('emp_bday', 'x', e.target.value)}
                                                className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                            />
                                        </div>
                                        <div className="flex items-center">
                                            <span className="w-4 h-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">Y</span>
                                            <input
                                                type="number"
                                                value={coordinates.emp_bday_y}
                                                onChange={(e) => updateElementPosition('emp_bday', 'y', e.target.value)}
                                                className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Government IDs in a compact layout */}
                                <div className="grid grid-cols-1 gap-2">
                                    {/* SSS */}
                                    <div className="pb-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">SSS</span>
                                            <div className="flex space-x-1">
                                                <div className="flex items-center">
                                                    <span className="text-xs text-gray-500">X:</span>
                                                    <input
                                                        type="number"
                                                        value={coordinates.emp_sss_x}
                                                        onChange={(e) => updateElementPosition('emp_sss', 'x', e.target.value)}
                                                        className="ml-1 w-12 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                                    />
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="text-xs text-gray-500">Y:</span>
                                                    <input
                                                        type="number"
                                                        value={coordinates.emp_sss_y}
                                                        onChange={(e) => updateElementPosition('emp_sss', 'y', e.target.value)}
                                                        className="ml-1 w-12 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                                    />
                                                </div>
                                            </div>
                                    </div>

                                    {/* HDMF */}
                                    <div className="pb-1 border-b border-gray-100 dark:border-gray-700">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">HDMF</span>
                                            <div className="flex space-x-1">
                                                <div className="flex items-center">
                                                    <span className="text-xs text-gray-500">X:</span>
                                                    <input
                                                        type="number"
                                                        value={coordinates.emp_hdmf_x}
                                                        onChange={(e) => updateElementPosition('emp_hdmf', 'x', e.target.value)}
                                                        className="ml-1 w-12 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                                    />
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="text-xs text-gray-500">Y:</span>
                                                    <input
                                                        type="number"
                                                        value={coordinates.emp_hdmf_y}
                                                        onChange={(e) => updateElementPosition('emp_hdmf', 'y', e.target.value)}
                                                        className="ml-1 w-12 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Emergency Contacts */}
                                <div className="border-t border-gray-100 dark:border-gray-700 pt-2">
                                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Emergency Contacts</div>
                                    
                                    {/* Emergency Name */}
                                    <div className="pb-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500">Name</span>
                                            <div className="flex space-x-1">
                                                <div className="flex items-center">
                                                    <span className="text-xs text-gray-500">X:</span>
                                                    <input
                                                        type="number"
                                                        value={coordinates.emp_emergency_name_x}
                                                        onChange={(e) => updateElementPosition('emp_emergency_name', 'x', e.target.value)}
                                                        className="ml-1 w-12 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                                    />
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="text-xs text-gray-500">Y:</span>
                                                    <input
                                                        type="number"
                                                        value={coordinates.emp_emergency_name_y}
                                                        onChange={(e) => updateElementPosition('emp_emergency_name', 'y', e.target.value)}
                                                        className="ml-1 w-12 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Emergency Number */}
                                    <div className="pb-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500">Phone</span>
                                            <div className="flex space-x-1">
                                                <div className="flex items-center">
                                                    <span className="text-xs text-gray-500">X:</span>
                                                    <input
                                                        type="number"
                                                        value={coordinates.emp_emergency_num_x}
                                                        onChange={(e) => updateElementPosition('emp_emergency_num', 'x', e.target.value)}
                                                        className="ml-1 w-12 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                                    />
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="text-xs text-gray-500">Y:</span>
                                                    <input
                                                        type="number"
                                                        value={coordinates.emp_emergency_num_y}
                                                        onChange={(e) => updateElementPosition('emp_emergency_num', 'y', e.target.value)}
                                                        className="ml-1 w-12 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Emergency Address */}
                                    <div className="pb-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500">Address</span>
                                            <div className="flex space-x-1">
                                                <div className="flex items-center">
                                                    <span className="text-xs text-gray-500">X:</span>
                                                    <input
                                                        type="number"
                                                        value={coordinates.emp_emergency_add_x}
                                                        onChange={(e) => updateElementPosition('emp_emergency_add', 'x', e.target.value)}
                                                        className="ml-1 w-12 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                                    />
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="text-xs text-gray-500">Y:</span>
                                                    <input
                                                        type="number"
                                                        value={coordinates.emp_emergency_add_y}
                                                        onChange={(e) => updateElementPosition('emp_emergency_add', 'y', e.target.value)}
                                                        className="ml-1 w-12 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Back ID Number */}
                                    <div className="pb-2 border-b border-gray-100 dark:border-gray-700">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">ID Number (Back)</span>
                                            <div className="flex space-x-1">
                                                <HideShowToggle element="emp_back_idno" />
                                                <button
                                                    className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                                    onClick={() => centerElement('emp_back_idno')}
                                                >
                                                    <AlignCenter className="h-2 w-2 mr-0.5" /> Center
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-1">
                                            <div className="flex items-center">
                                                <span className="w-4 h-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">X</span>
                                                <input
                                                    type="number"
                                                    value={coordinates.emp_back_idno_x}
                                                    onChange={(e) => updateElementPosition('emp_back_idno', 'x', e.target.value)}
                                                    className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                                />
                                            </div>
                                            <div className="flex items-center">
                                                <span className="w-4 h-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">Y</span>
                                                <input
                                                    type="number"
                                                    value={coordinates.emp_back_idno_y}
                                                    onChange={(e) => updateElementPosition('emp_back_idno', 'y', e.target.value)}
                                                    className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-center py-0.5"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>

            {/* Dragging info toast */}
            {isDragging && (
                <div className="fixed bottom-4 right-4 bg-gray-900 text-white rounded-md shadow-lg px-4 py-2">
                    <p className="text-sm">Dragging: {draggedElement && elementMeta[draggedElement]?.label}</p>
                </div>
            )}

            {/* Success message toast */}
            {successMessage && (
                <div className="fixed top-4 right-4 z-50 max-w-md">
                    <div className={`rounded-md p-4 shadow-lg ${successMessage.includes('Error:') 
                        ? 'bg-red-50 dark:bg-red-900' 
                        : 'bg-green-50 dark:bg-green-900'}`}>
                        <div className="flex">
                            <div className="flex-shrink-0">
                                {successMessage.includes('Error:') ? (
                                    <XCircle className="h-5 w-5 text-red-400 dark:text-red-300" aria-hidden="true" />
                                ) : (
                                    <CheckCircle className="h-5 w-5 text-green-400 dark:text-green-300" aria-hidden="true" />
                                )}
                            </div>
                            <div className="ml-3">
                                <p className={`text-sm font-medium ${successMessage.includes('Error:') 
                                    ? 'text-red-800 dark:text-red-200' 
                                    : 'text-green-800 dark:text-green-200'}`}>
                                    {successMessage}
                                </p>
                            </div>
                            <div className="ml-auto pl-3">
                                <div className="-mx-1.5 -my-1.5">
                                    <button
                                        type="button"
                                        className={`inline-flex rounded-md p-1.5 ${successMessage.includes('Error:')
                                            ? 'bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800'
                                            : 'bg-green-50 text-green-500 hover:bg-green-100 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800'}`}
                                        onClick={() => setSuccessMessage(null)}
                                    >
                                        <span className="sr-only">Dismiss</span>
                                        <XCircle className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
