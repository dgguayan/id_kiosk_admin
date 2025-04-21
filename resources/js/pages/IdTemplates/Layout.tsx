import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, AlignCenter, Move, CheckCircle, XCircle } from 'lucide-react';

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
}

interface TemplateImages {
    id: number;
    businessunit_id: number;
    image_path: string;
    image_path2: string;
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
    | 'emp_emergency_add';

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
        emp_hdmf: { label: 'Pag-IBIG', side: 'back' },
        emp_tin: { label: 'TIN', side: 'back' },
        emp_emergency_name: { label: 'Emergency Contact', side: 'back' },
        emp_emergency_num: { label: 'Emergency Number', side: 'back' },
        emp_emergency_add: { label: 'Emergency Address', side: 'back' },
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
            width = 273;
            height = 193;
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
            'emp_emergency_name', 'emp_emergency_num', 'emp_emergency_add'
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

    // Check if a point is inside an element's bounds
    const isPointInElement = (element: ElementType, x: number, y: number) => {
        const bounds = getElementBounds(element);
        return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
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

        // Check which element was clicked
        const elements = Object.keys(elementMeta) as ElementType[];
        for (let i = elements.length - 1; i >= 0; i--) {
            const element = elements[i];
            if (elementMeta[element].side === side && isPointInElement(element, x, y)) {
                setDraggedElement(element);
                setIsDragging(true);

                // Calculate offset for smooth dragging
                if (element === 'emp_img' || element === 'emp_qrcode') {
                    // For boxes, calculate offset from top-left
                    const elementX = coordinates[`${element}_x` as keyof TemplateCoordinates] as number;
                    const elementY = coordinates[`${element}_y` as keyof TemplateCoordinates] as number;
                    setDragOffset({ x: x - elementX, y: y - elementY });
                } else {
                    // For centered elements, use center offset
                    setDragOffset({ x: 0, y: 0 });
                }

                break;
            }
        }
    };

    // Handle mouse move for dragging
    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDragging || !draggedElement) return;

        const canvas = e.currentTarget;
        const rect = canvas.getBoundingClientRect();

        // Calculate the actual position on the canvas considering scaling
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        let x = (e.clientX - rect.left) * scaleX;
        let y = (e.clientY - rect.top) * scaleY;

        // Adjust by drag offset
        if (draggedElement === 'emp_img' || draggedElement === 'emp_qrcode') {
            x -= dragOffset.x;
            y -= dragOffset.y;
        }

        // Restrict to canvas bounds
        x = Math.max(0, Math.min(x, canvas.width));
        y = Math.max(0, Math.min(y, canvas.height));

        // Update coordinates
        setCoordinates((prev) => ({
            ...prev,
            [`${draggedElement}_x`]: Math.round(x),
            [`${draggedElement}_y`]: Math.round(y),
        }));
    };

    // Handle mouse up to end dragging
    const handleCanvasMouseUp = () => {
        setIsDragging(false);
        setDraggedElement(null);
    };

    // Handle mouse leave to end dragging
    const handleCanvasMouseLeave = () => {
        if (isDragging) {
            setIsDragging(false);
            setDraggedElement(null);
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

        // Draw the front elements
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

        // Draw the back elements
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
    };

    // Unified function to draw an element
    const drawElement = (ctx: CanvasRenderingContext2D, element: ElementType, color: string) => {
        const bounds = getElementBounds(element);
        const backTextElements = [
            'emp_add', 'emp_bday', 'emp_sss', 'emp_phic', 'emp_hdmf', 'emp_tin',
            'emp_emergency_name', 'emp_emergency_num', 'emp_emergency_add'
        ];

        // For elements that are centered in IdCardPreview, make sure they're centered here too
        if (element === 'emp_name' || element === 'emp_pos' || element === 'emp_idno') {
            // Draw centered text using the same approach as IdCardPreview
            ctx.textAlign = "center";
        } else if (backTextElements.includes(element)) {
            // Draw left-aligned text for back elements
            ctx.textAlign = "center";
        }
        
        // Make sure the text baseline is consistent
        ctx.textBaseline = "middle";

        // Use different drawing methods for different element types
        if (element === 'emp_img' || element === 'emp_qrcode') {
            // For the photo and QR code, draw a rectangle at the exact position (top-left)
            ctx.fillStyle = color;
            ctx.fillRect(bounds.left, bounds.top, bounds.width, bounds.height);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(bounds.left, bounds.top, bounds.width, bounds.height);
        } else if (backTextElements.includes(element)) {
            // For text elements on the back side, draw left-aligned with vertical centering
            ctx.fillStyle = color;
            ctx.fillRect(bounds.left, bounds.top, bounds.width, bounds.height);
            
            // Add sample text inside the element box - using same font as IdCardPreview
            ctx.fillStyle = '#000000';
            ctx.font = '25px "Calibri", "Roboto", sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            
            // Display sample text based on element type
            let sampleText = elementMeta[element].label;
            if (element === 'emp_add') {
                sampleText = "123 Sample Street, City";
            } else if (element === 'emp_bday') {
                sampleText = "January 1, 1990";
            } else if (element === 'emp_sss') {
                sampleText = "12-3456789-0";
            } else if (element === 'emp_phic') {
                sampleText = "98-7654321-0";
            } else if (element === 'emp_hdmf') {
                sampleText = "1234-5678-9012";
            } else if (element === 'emp_tin') {
                sampleText = "123-456-789-000";
            } else if (element === 'emp_emergency_name') {
                sampleText = "Emergency Contact";
            } else if (element === 'emp_emergency_num') {
                sampleText = "(123) 456-7890";
            } else if (element === 'emp_emergency_add') {
                sampleText = "456 Emergency Address, City";
            }
            
            ctx.fillText(sampleText, bounds.left + 5, bounds.top + bounds.height/2);
            
            // Show vertical center line to help visualize alignment
            if (draggedElement === element) {
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                ctx.setLineDash([2, 2]);
                const centerY = bounds.top + bounds.height/2;
                ctx.beginPath();
                ctx.moveTo(bounds.left, centerY);
                ctx.lineTo(bounds.left + bounds.width, centerY);
                ctx.stroke();
                ctx.restore();
            }
        } else {
            // For text elements on the front, center them around the coordinate point
            ctx.fillStyle = color;
            ctx.fillRect(bounds.left, bounds.top, bounds.width, bounds.height);
            
            // Add sample text inside the element box - using same font as IdCardPreview
            ctx.fillStyle = '#000000';
            
            // Display sample text based on element type with appropriate font settings
            let sampleText = elementMeta[element].label;
            
            if (element === 'emp_name') {
                ctx.font = 'bold 30px "Calibri", "Roboto", sans-serif';
                sampleText = "John Doe";
                ctx.textBaseline = "middle";
            } else if (element === 'emp_pos') {
                ctx.font = 'italic 25px "Calibri", "Roboto", sans-serif';
                sampleText = "Software Developer";
            } else if (element === 'emp_idno') {
                ctx.font = 'bold 18px "Calibri", "Roboto", sans-serif';
                sampleText = "EMP-12345";
            } else if (element === 'emp_sig') {
                ctx.font = '18px "Calibri", "Roboto", sans-serif';
                sampleText = "Signature";
            }
            
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(sampleText, bounds.left + bounds.width/2, bounds.top + bounds.height/2);
        }

        // If this element is being dragged, add a visual indicator
        if (draggedElement === element) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.strokeRect(bounds.left - 2, bounds.top - 2, bounds.width + 4, bounds.height + 4);

            // Add element name when dragging
            ctx.fillStyle = '#ff0000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            
            // For back text elements, show label above the left side
            if (backTextElements.includes(element)) {
                ctx.fillText(elementMeta[element].label, bounds.left + 40, bounds.top - 5);
            } else {
                // For other elements, center the label
                ctx.fillText(elementMeta[element].label, bounds.left + bounds.width / 2, bounds.top - 5);
            }

            ctx.lineWidth = 1;
        }
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

        // Map our coordinates object to match the expected format in the controller
        const mappedCoordinates = {
            emp_img_x: coordinates.emp_img_x,
            emp_img_y: coordinates.emp_img_y,
            emp_img_width: coordinates.emp_img_width,
            emp_img_height: coordinates.emp_img_height,
            emp_name_x: coordinates.emp_name_x,
            emp_name_y: coordinates.emp_name_y,
            emp_pos_x: coordinates.emp_pos_x,
            emp_pos_y: coordinates.emp_pos_y,
            emp_idno_x: coordinates.emp_idno_x,
            emp_idno_y: coordinates.emp_idno_y,
            emp_sig_x: coordinates.emp_sig_x,
            emp_sig_y: coordinates.emp_sig_y,
            emp_add_x: coordinates.emp_add_x,
            emp_add_y: coordinates.emp_add_y,
            emp_bday_x: coordinates.emp_bday_x,
            emp_bday_y: coordinates.emp_bday_y,
            emp_sss_x: coordinates.emp_sss_x,
            emp_sss_y: coordinates.emp_sss_y,
            emp_phic_x: coordinates.emp_phic_x,
            emp_phic_y: coordinates.emp_phic_y,
            emp_hdmf_x: coordinates.emp_hdmf_x,
            emp_hdmf_y: coordinates.emp_hdmf_y,
            emp_tin_x: coordinates.emp_tin_x,
            emp_tin_y: coordinates.emp_tin_y,
            emp_emergency_name_x: coordinates.emp_emergency_name_x,
            emp_emergency_name_y: coordinates.emp_emergency_name_y,
            emp_emergency_num_x: coordinates.emp_emergency_num_x,
            emp_emergency_num_y: coordinates.emp_emergency_num_y,
            emp_emergency_add_x: coordinates.emp_emergency_add_x,
            emp_emergency_add_y: coordinates.emp_emergency_add_y,
            emp_qrcode_x: coordinates.emp_qrcode_x,
            emp_qrcode_y: coordinates.emp_qrcode_y,
            emp_qrcode_width: coordinates.emp_qrcode_width,
            emp_qrcode_height: coordinates.emp_qrcode_height,
        };

        router.post(route('id-templates.update-positions', template.id), mappedCoordinates, {
            onSuccess: () => {
                setIsSubmitting(false);
                setSuccessMessage('Template layout updated successfully');
                
                // Clear the success message after 3 seconds
                setTimeout(() => {
                    setSuccessMessage(null);
                }, 3000);
            },
            onError: (errors) => {
                setIsSubmitting(false);
                console.error('Failed to update template layout:', errors);
                const errorMessage = Object.values(errors).flat().join('\n');
                setSuccessMessage(`Error: ${errorMessage || 'Failed to update template layout'}`);
                
                setTimeout(() => {
                    setSuccessMessage(null);
                }, 5000);
            },
        });
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
            <div className="px-4 sm:px-6 lg:px-8 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Front controls */}
                <div className="lg:col-span-3">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="bg-gray-100 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Front Elements</h3>
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                                Position (X,Y)
                            </span>
                        </div>
                        <div className="p-4 max-h-[700px] overflow-y-auto space-y-4">
                            {/* Instructions for drag */}
                            <div className="p-2 mb-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                <p className="text-xs text-blue-700 dark:text-blue-400 flex items-center">
                                    <Move className="h-3 w-3 mr-1" />
                                    Click and drag elements directly on the template to position them
                                </p>
                            </div>

                            {/* Photo */}
                            <div className="pb-4 border-b border-gray-100 dark:border-gray-700">
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Photo Position</div>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            X
                                        </span>
                                        <input
                                            type="number"
                                            id="photo_x"
                                            value={coordinates.emp_img_x}
                                            onChange={(e) => updateElementPosition('emp_img', 'x', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            Y
                                        </span>
                                        <input
                                            type="number"
                                            id="photo_y"
                                            value={coordinates.emp_img_y}
                                            onChange={(e) => updateElementPosition('emp_img', 'y', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                </div>
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Photo Size</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            W
                                        </span>
                                        <input
                                            type="number"
                                            id="photo_width"
                                            value={coordinates.emp_img_width}
                                            onChange={(e) => updateElementPosition('emp_img', 'width', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            H
                                        </span>
                                        <input
                                            type="number"
                                            id="photo_height"
                                            value={coordinates.emp_img_height}
                                            onChange={(e) => updateElementPosition('emp_img', 'height', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Name */}
                            <div className="pb-4 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Name Position</span>
                                    <button
                                        className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                        onClick={() => centerElement('emp_name')}
                                    >
                                        <AlignCenter className="h-3 w-3 mr-1" /> Center
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            X
                                        </span>
                                        <input
                                            type="number"
                                            id="name_x"
                                            value={coordinates.emp_name_x}
                                            onChange={(e) => updateElementPosition('emp_name', 'x', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            Y
                                        </span>
                                        <input
                                            type="number"
                                            id="name_y"
                                            value={coordinates.emp_name_y}
                                            onChange={(e) => updateElementPosition('emp_name', 'y', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Position */}
                            <div className="pb-4 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Position</span>
                                    <button
                                        className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                        onClick={() => centerElement('emp_pos')}
                                    >
                                        <AlignCenter className="h-3 w-3 mr-1" /> Center
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            X
                                        </span>
                                        <input
                                            type="number"
                                            id="position_x"
                                            value={coordinates.emp_pos_x}
                                            onChange={(e) => updateElementPosition('emp_pos', 'x', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            Y
                                        </span>
                                        <input
                                            type="number"
                                            id="position_y"
                                            value={coordinates.emp_pos_y}
                                            onChange={(e) => updateElementPosition('emp_pos', 'y', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ID Number */}
                            <div className='pb-4 border-b border-gray-100 dark:border-gray-700'>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">ID Number</span>
                                    <button
                                        className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                        onClick={() => centerElement('emp_idno')}
                                    >
                                        <AlignCenter className="h-3 w-3 mr-1" /> Center
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            X
                                        </span>
                                        <input
                                            type="number"
                                            id="id_number_x"
                                            value={coordinates.emp_idno_x}
                                            onChange={(e) => updateElementPosition('emp_idno', 'x', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            Y
                                        </span>
                                        <input
                                            type="number"
                                            id="id_number_y"
                                            value={coordinates.emp_idno_y}
                                            onChange={(e) => updateElementPosition('emp_idno', 'y', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Signature */}
                            <div className="pb-4 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Signature</span>
                                    <button
                                        className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                        onClick={() => centerElement('emp_sig')}
                                    >
                                        <AlignCenter className="h-3 w-3 mr-1" /> Center
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            X
                                        </span>
                                        <input
                                            type="number"
                                            id="signature_x"
                                            value={coordinates.emp_sig_x}
                                            onChange={(e) => updateElementPosition('emp_sig', 'x', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            Y
                                        </span>
                                        <input
                                            type="number"
                                            id="signature_y"
                                            value={coordinates.emp_sig_y}
                                            onChange={(e) => updateElementPosition('emp_sig', 'y', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="lg:col-span-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Front Canvas */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center">
                            <div className="flex items-center justify-center">
                                <canvas
                                    ref={frontCanvasRef}
                                    width="651"
                                    height="1005"
                                    className="max-w-full h-auto border border-gray-200 dark:border-gray-700 cursor-move"
                                    onMouseDown={(e) => handleCanvasMouseDown(e, 'front')}
                                    onMouseMove={handleCanvasMouseMove}
                                    onMouseUp={handleCanvasMouseUp}
                                    onMouseLeave={handleCanvasMouseLeave}
                                ></canvas>
                            </div>
                            {imageLoadErrors.front && (
                                <p className="text-yellow-600 dark:text-yellow-500 text-xs mt-2">
                                    Failed to load front template image. Using placeholder.
                                </p>
                            )}
                        </div>

                        {/* Back Canvas */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center">
                            <div className="flex items-center justify-center">
                                <canvas
                                    ref={backCanvasRef}
                                    width="651"
                                    height="1005"
                                    className="max-w-full h-auto border border-gray-200 dark:border-gray-700 cursor-move"
                                    onMouseDown={(e) => handleCanvasMouseDown(e, 'back')}
                                    onMouseMove={handleCanvasMouseMove}
                                    onMouseUp={handleCanvasMouseUp}
                                    onMouseLeave={handleCanvasMouseLeave}
                                ></canvas>
                            </div>
                            {imageLoadErrors.back && (
                                <p className="text-yellow-600 dark:text-yellow-500 text-xs mt-2">
                                    Failed to load back template image. Using placeholder.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Back controls */}
                <div className="lg:col-span-3">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="bg-gray-100 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Back Elements</h3>
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                                Position (X,Y)
                            </span>
                        </div>
                        <div className="p-4 max-h-[700px] overflow-y-auto space-y-4">
                            {/* QR Code */}
                            <div className="pb-4 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">QR Code</span>
                                    <button
                                        className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                        onClick={() => centerElement('qr_code')}
                                    >
                                        <AlignCenter className="h-3 w-3 mr-1" /> Center
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            X
                                        </span>
                                        <input
                                            type="number"
                                            id="qr_code_x"
                                            value={coordinates.emp_qrcode_x}
                                            onChange={(e) => updateElementPosition('qr_code', 'x', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            Y
                                        </span>
                                        <input
                                            type="number"
                                            id="qr_code_y"
                                            value={coordinates.emp_qrcode_y}
                                            onChange={(e) => updateElementPosition('qr_code', 'y', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                </div>
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">QR Code Size</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            W
                                        </span>
                                        <input
                                            type="number"
                                            id="emp_qrcode_width"
                                            value={coordinates.emp_qrcode_width}
                                            onChange={(e) => updateElementPosition('qr_code', 'width', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            H
                                        </span>
                                        <input
                                            type="number"
                                            id="emp_qrcode_height"
                                            value={coordinates.emp_qrcode_height}
                                            onChange={(e) => updateElementPosition('qr_code', 'height', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Address */}
                            <div className="pb-4 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Address</span>
                                    <button
                                        className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                        onClick={() => centerElement('emp_add')}
                                    >
                                        <AlignCenter className="h-3 w-3 mr-1" /> Center
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            X
                                        </span>
                                        <input
                                            type="number"
                                            id="address_x"
                                            value={coordinates.emp_add_x}
                                            onChange={(e) => updateElementPosition('emp_add', 'x', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            Y
                                        </span>
                                        <input
                                            type="number"
                                            id="address_y"
                                            value={coordinates.emp_add_y}
                                            onChange={(e) => updateElementPosition('emp_add', 'y', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Birthdate */}
                            <div className="pb-4 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Birthdate</span>
                                    <button
                                        className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                        onClick={() => centerElement('emp_bday')}
                                    >
                                        <AlignCenter className="h-3 w-3 mr-1" /> Center
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            X
                                        </span>
                                        <input
                                            type="number"
                                            id="birthdate_x"
                                            value={coordinates.emp_bday_x}
                                            onChange={(e) => updateElementPosition('emp_bday', 'x', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            Y
                                        </span>
                                        <input
                                            type="number"
                                            id="birthdate_y"
                                            value={coordinates.emp_bday_y}
                                            onChange={(e) => updateElementPosition('emp_bday', 'y', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SSS */}
                            <div className="pb-4 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">SSS</span>
                                    <button
                                        className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                        onClick={() => centerElement('emp_sss')}
                                    >
                                        <AlignCenter className="h-3 w-3 mr-1" /> Center
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            X
                                        </span>
                                        <input
                                            type="number"
                                            id="sss_x"
                                            value={coordinates.emp_sss_x}
                                            onChange={(e) => updateElementPosition('emp_sss', 'x', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            Y
                                        </span>
                                        <input
                                            type="number"
                                            id="sss_y"
                                            value={coordinates.emp_sss_y}
                                            onChange={(e) => updateElementPosition('emp_sss', 'y', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* TIN */}
                            <div className="pb-4 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">TIN</span>
                                    <button
                                        className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                        onClick={() => centerElement('emp_tin')}
                                    >
                                        <AlignCenter className="h-3 w-3 mr-1" /> Center
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            X
                                        </span>
                                        <input
                                            type="number"
                                            id="tin_x"
                                            value={coordinates.emp_tin_x}
                                            onChange={(e) => updateElementPosition('emp_tin', 'x', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            Y
                                        </span>
                                        <input
                                            type="number"
                                            id="tin_y"
                                            value={coordinates.emp_tin_y}
                                            onChange={(e) => updateElementPosition('emp_tin', 'y', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* PHIC */}
                            <div className="pb-4 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">PHIC</span>
                                    <button
                                        className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                        onClick={() => centerElement('emp_phic')}
                                    >
                                        <AlignCenter className="h-3 w-3 mr-1" /> Center
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            X
                                        </span>
                                        <input
                                            type="number"
                                            id="phic_x"
                                            value={coordinates.emp_phic_x}
                                            onChange={(e) => updateElementPosition('emp_phic', 'x', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            Y
                                        </span>
                                        <input
                                            type="number"
                                            id="phic_y"
                                            value={coordinates.emp_phic_y}
                                            onChange={(e) => updateElementPosition('emp_phic', 'y', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* HDMF */}
                            <div className="pb-4 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">HDMF</span>
                                    <button
                                        className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                        onClick={() => centerElement('emp_hdmf')}
                                    >
                                        <AlignCenter className="h-3 w-3 mr-1" /> Center
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            X
                                        </span>
                                        <input
                                            type="number"
                                            id="hdmf_x"
                                            value={coordinates.emp_hdmf_x}
                                            onChange={(e) => updateElementPosition('emp_hdmf', 'x', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            Y
                                        </span>
                                        <input
                                            type="number"
                                            id="hdmf_y"
                                            value={coordinates.emp_hdmf_y}
                                            onChange={(e) => updateElementPosition('emp_hdmf', 'y', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Emergency Contact */}
                            <div className="pb-4 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Emergency Contact</span>
                                    <button
                                        className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                        onClick={() => centerElement('emp_emergency_name')}
                                    >
                                        <AlignCenter className="h-3 w-3 mr-1" /> Center
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            X
                                        </span>
                                        <input
                                            type="number"
                                            id="emergency_contact_x"
                                            value={coordinates.emp_emergency_name_x}
                                            onChange={(e) => updateElementPosition('emp_emergency_name', 'x', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            Y
                                        </span>
                                        <input
                                            type="number"
                                            id="emergency_contact_y"
                                            value={coordinates.emp_emergency_name_y}
                                            onChange={(e) => updateElementPosition('emp_emergency_name', 'y', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Emergency Number */}
                            <div className="pb-4 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Emergency Number</span>
                                    <button
                                        className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                        onClick={() => centerElement('emp_emergency_num')}
                                    >
                                        <AlignCenter className="h-3 w-3 mr-1" /> Center
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            X
                                        </span>
                                        <input
                                            type="number"
                                            id="emergency_number_x"
                                            value={coordinates.emp_emergency_num_x}
                                            onChange={(e) => updateElementPosition('emp_emergency_num', 'x', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            Y
                                        </span>
                                        <input
                                            type="number"
                                            id="emergency_number_y"
                                            value={coordinates.emp_emergency_num_y}
                                            onChange={(e) => updateElementPosition('emp_emergency_num', 'y', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Emergency Address */}
                            <div className="pb-4 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Emergency Address</span>
                                    <button
                                        className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                        onClick={() => centerElement('emp_emergency_add')}
                                    >
                                        <AlignCenter className="h-3 w-3 mr-1" /> Center
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            X
                                        </span>
                                        <input
                                            type="number"
                                            id="emergency_address_x"
                                            value={coordinates.emp_emergency_add_x}
                                            onChange={(e) => updateElementPosition('emp_emergency_add', 'x', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                            Y
                                        </span>
                                        <input
                                            type="number"
                                            id="emergency_address_y"
                                            value={coordinates.emp_emergency_add_y}
                                            onChange={(e) => updateElementPosition('emp_emergency_add', 'y', e.target.value)}
                                            className="ml-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm text-center py-1"
                                        />
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
