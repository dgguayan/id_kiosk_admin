import React, { useEffect, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ArrowLeft, Download, AlertCircle, Check, Loader2 } from 'lucide-react';

interface EmployeeType {
    uuid: string;
    id_no: string;
    employee_firstname: string;
    employee_middlename?: string;
    employee_lastname: string;
    employee_name_extension?: string;
    businessunit_id: number;
    businessunit_name?: string;
    position: string;
    image_person?: string;
    image_signature?: string;
    image_qrcode?: string;
    birthday?: string;
    address?: string;
    tin_no?: string;
    sss_no?: string;
    phic_no?: string;
    hdmf_no?: string;
    emergency_name?: string;
    emergency_contact_number?: string;
    emergency_address?: string;
}

interface TemplateImageConfig {
    emp_img_x?: number;
    emp_img_y?: number;
    emp_img_width?: number;
    emp_img_height?: number;
    emp_name_x?: number;
    emp_name_y?: number;
    emp_pos_x?: number;
    emp_pos_y?: number;
    emp_idno_x?: number;
    emp_idno_y?: number;
    emp_sig_x?: number;
    emp_sig_y?: number;
    emp_qrcode_x?: number;
    emp_qrcode_y?: number;
    emp_qrcode_width?: number;
    emp_qrcode_height?: number;
    emp_add_x?: number;
    emp_add_y?: number;
    emp_bday_x?: number;
    emp_bday_y?: number;
    emp_sss_x?: number;
    emp_sss_y?: number;
    emp_phic_x?: number;
    emp_phic_y?: number;
    emp_hdmf_x?: number;
    emp_hdmf_y?: number;
    emp_tin_x?: number;
    emp_tin_y?: number;
    emp_emergency_name_x?: number;
    emp_emergency_name_y?: number;
    emp_emergency_num_x?: number;
    emp_emergency_num_y?: number;
    emp_emergency_add_x?: number;
    emp_emergency_add_y?: number;
}

interface TemplateData {
    template_id: number;
    template_data: TemplateImageConfig;
    front_template: string;
    back_template: string;
}

interface BulkIdCardPreviewProps {
    employees: EmployeeType[];
    templatesByBusinessUnit: Record<number, TemplateData>;
    employeeCount: number;
    selectedUuids: string[];
}

const BulkIdCardPreview: React.FC<BulkIdCardPreviewProps> = ({ 
    employees, 
    templatesByBusinessUnit, 
    employeeCount, 
    selectedUuids
}) => {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Employee List', href: '/employee' },
        { title: 'Bulk ID Card Preview', href: '/employee/bulk-id-preview' },
    ];

    const [loadingStatus, setLoadingStatus] = useState<string>("Initializing...");
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [exportProgress, setExportProgress] = useState<number>(0);
    const [showDebugInfo, setShowDebugInfo] = useState(false);
    const [selectedCount, setSelectedCount] = useState<number>(employeeCount);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);
    const [isAllReady, setIsAllReady] = useState<boolean>(false);
    const [currentPreviewIndex, setCurrentPreviewIndex] = useState<number>(0);
    const [loadingEmployees, setLoadingEmployees] = useState<Set<string>>(new Set());
    const [loadingComplete, setLoadingComplete] = useState<boolean>(false);

    // Store canvases and loaded images for each employee
    const [employeeCanvases, setEmployeeCanvases] = useState<Record<string, { 
        frontCanvas: HTMLCanvasElement | null, 
        backCanvas: HTMLCanvasElement | null 
    }>>({});

    const [loadedImages, setLoadedImages] = useState<Record<string, {
        frontImg?: HTMLImageElement;
        backImg?: HTMLImageElement;
        employeeImg?: HTMLImageElement;
        signatureImg?: HTMLImageElement;
        qrcodeImg?: HTMLImageElement;
        isLoaded: boolean;
    }>>({});

    // Track which employees are currently selected
    const [selectedEmployees, setSelectedEmployees] = useState<Record<string, boolean>>({});

    // Initialize selectedEmployees with all employees selected
    useEffect(() => {
        const initialSelected = employees.reduce((acc, employee) => {
            acc[employee.uuid] = true;
            return acc;
        }, {} as Record<string, boolean>);
        setSelectedEmployees(initialSelected);
    }, [employees]);

    // Create canvas elements for each employee
    useEffect(() => {
        const initializeCanvases = () => {
            const canvases: Record<string, { 
                frontCanvas: HTMLCanvasElement, 
                backCanvas: HTMLCanvasElement 
            }> = {};

            employees.forEach(employee => {
                // Create front canvas
                const frontCanvas = document.createElement('canvas');
                frontCanvas.width = 651;
                frontCanvas.height = 1005;
                
                // Create back canvas
                const backCanvas = document.createElement('canvas');
                backCanvas.width = 651;
                backCanvas.height = 1005;
                
                canvases[employee.uuid] = { frontCanvas, backCanvas };
            });
            
            setEmployeeCanvases(canvases);
            setIsInitialized(true);
        };
        
        if (!isInitialized) {
            initializeCanvases();
        }
    }, [employees, isInitialized]);

    // Load all necessary images - completely redesigned to load per employee
    useEffect(() => {
        if (!isInitialized || loadingComplete) return;
        
        // Create a safe way to load all images for a single employee
        const loadEmployeeImages = async (employee: EmployeeType) => {
            // Skip if already loaded or currently loading
            if (loadedImages[employee.uuid]?.isLoaded || loadingEmployees.has(employee.uuid)) return;
            
            // Mark this employee as being loaded
            setLoadingEmployees(prev => {
                const newSet = new Set([...prev]);
                newSet.add(employee.uuid);
                return newSet;
            });
            
            const businessUnitId = employee.businessunit_id;
            const templateData = templatesByBusinessUnit[businessUnitId];
            
            if (!templateData) {
                console.error(`No template data found for business unit ${businessUnitId}`);
                setLoadingEmployees(prev => {
                    const updated = new Set([...prev]);
                    updated.delete(employee.uuid);
                    return updated;
                });
                return;
            }

            // Local copy of loaded images for this employee
            const employeeImages: {
                frontImg?: HTMLImageElement;
                backImg?: HTMLImageElement;
                employeeImg?: HTMLImageElement;
                signatureImg?: HTMLImageElement;
                qrcodeImg?: HTMLImageElement;
                isLoaded: boolean;
            } = { isLoaded: false };
            
            // Simple promise-based image loader
            const loadImage = (src: string): Promise<HTMLImageElement> => {
                return new Promise((resolve, reject) => {
                    if (!src) {
                        reject(new Error("Empty source"));
                        return;
                    }
                    
                    const img = new Image();
                    img.crossOrigin = "Anonymous";
                    
                    const timeout = setTimeout(() => {
                        reject(new Error("Timeout loading image"));
                    }, 10000);
                    
                    img.onload = () => {
                        clearTimeout(timeout);
                        resolve(img);
                    };
                    
                    img.onerror = () => {
                        clearTimeout(timeout);
                        reject(new Error(`Failed to load ${src}`));
                    };
                    
                    img.src = src;
                });
            };
            
            // Function to create a placeholder image when loading fails
            const createPlaceholderImage = async (text: string): Promise<HTMLImageElement> => {
                const canvas = document.createElement('canvas');
                canvas.width = 651;
                canvas.height = 1005;
                const ctx = canvas.getContext('2d');
                
                if (ctx) {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.strokeStyle = '#cccccc';
                    ctx.strokeRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#999999';
                    ctx.font = '20px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(text, canvas.width/2, canvas.height/2);
                    
                    return new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => resolve(img);
                        img.src = canvas.toDataURL('image/png');
                    });
                }
                
                throw new Error("Could not create placeholder");
            };
            
            try {
                // Load front template
                try {
                    employeeImages.frontImg = await loadImage(templateData.front_template);
                } catch (e) {
                    console.warn(`Could not load front template for employee ${employee.id_no}, using default`);
                    try {
                        employeeImages.frontImg = await loadImage('/images/default_front_template.png');
                    } catch {
                        employeeImages.frontImg = await createPlaceholderImage('Front Template Not Available');
                    }
                }
                
                // Load back template
                try {
                    employeeImages.backImg = await loadImage(templateData.back_template);
                } catch (e) {
                    console.warn(`Could not load back template for employee ${employee.id_no}, using default`);
                    try {
                        employeeImages.backImg = await loadImage('/images/default_back_template.png');
                    } catch {
                        employeeImages.backImg = await createPlaceholderImage('Back Template Not Available');
                    }
                }
                
                // Load employee photo if available
                if (employee.image_person) {
                    try {
                        const employeeImageUrl = route('network.image', { folder: 'employee', filename: employee.image_person });
                        employeeImages.employeeImg = await loadImage(employeeImageUrl);
                    } catch (e) {
                        console.warn(`Could not load employee photo for ${employee.id_no}`);
                    }
                }
                
                // Load signature if available
                if (employee.image_signature) {
                    try {
                        const signatureImageUrl = route('network.image', { folder: 'signature', filename: employee.image_signature });
                        employeeImages.signatureImg = await loadImage(signatureImageUrl);
                    } catch (e) {
                        console.warn(`Could not load signature for ${employee.id_no}`);
                    }
                }
                
                // Load QR code if available
                if (employee.image_qrcode) {
                    try {
                        const qrcodeImageUrl = route('network.image', { folder: 'qrcode', filename: employee.image_qrcode });
                        employeeImages.qrcodeImg = await loadImage(qrcodeImageUrl);
                    } catch (e) {
                        console.warn(`Could not load QR code for ${employee.id_no}`);
                    }
                }
                
                // Mark as loaded if we have at least the templates
                if (employeeImages.frontImg && employeeImages.backImg) {
                    employeeImages.isLoaded = true;
                }
                
                // Update the global loaded images state
                setLoadedImages(prev => ({
                    ...prev,
                    [employee.uuid]: employeeImages
                }));
                
                // Update loading status and render canvases
                updateLoadingProgress();
                
            } catch (error) {
                console.error(`Error loading images for employee ${employee.id_no}:`, error);
            } finally {
                // Mark this employee as no longer loading
                setLoadingEmployees(prev => {
                    const updated = new Set([...prev]);
                    updated.delete(employee.uuid);
                    return updated;
                });
            }
        };
        
        // Function to update loading progress
        const updateLoadingProgress = () => {
            const loadedEmployeeCount = Object.values(loadedImages).filter(e => e?.isLoaded).length;
            const totalEmployeeCount = employees.length;
            
            // Update loading status message
            setLoadingStatus(
                `Loading employee data: ${loadedEmployeeCount}/${totalEmployeeCount} employees ready`
            );
            
            // Use setTimeout to avoid React batching issues
            setTimeout(() => {
                // If all employees are loaded, mark loading as complete
                if (loadedEmployeeCount === totalEmployeeCount && totalEmployeeCount > 0) {
                    setIsAllReady(true);
                    setLoadingComplete(true);
                    setLoadingStatus(`All images loaded successfully! (${loadedEmployeeCount}/${totalEmployeeCount} employees ready)`);
                    
                    // Force re-render of canvases with all loaded images
                    renderAllCanvases();
                }
            }, 200);
        };
        
        // Function to render all canvases on completion
        const renderAllCanvases = () => {
            employees.forEach(employee => {
                const images = loadedImages[employee.uuid];
                if (!images?.isLoaded) return;
                
                const canvases = employeeCanvases[employee.uuid];
                if (!canvases) return;
                
                const businessUnitId = employee.businessunit_id;
                const templateData = templatesByBusinessUnit[businessUnitId];
                if (!templateData) return;
                
                // Render front canvas
                if (images.frontImg && canvases.frontCanvas) {
                    renderFrontCanvas(
                        employee,
                        canvases.frontCanvas,
                        images.frontImg,
                        images.employeeImg,
                        images.signatureImg,
                        templateData.template_data
                    );
                }
                
                // Render back canvas
                if (images.backImg && canvases.backCanvas) {
                    renderBackCanvas(
                        employee,
                        canvases.backCanvas,
                        images.backImg,
                        images.qrcodeImg,
                        templateData.template_data
                    );
                }
            });
        };
        
        // Initial check if everything is already loaded
        const allLoaded = employees.every(employee => loadedImages[employee.uuid]?.isLoaded);
        if (allLoaded && employees.length > 0) {
            setIsAllReady(true);
            setLoadingComplete(true);
            setLoadingStatus(`All images loaded successfully! (${employees.length}/${employees.length} employees ready)`);
            renderAllCanvases();
            return;
        }
        
        // Start loading for each employee with a slight delay between them
        employees.forEach((employee, index) => {
            setTimeout(() => {
                loadEmployeeImages(employee);
            }, index * 100); // Stagger loading to prevent overwhelming the network
        });
        
    }, [employees, isInitialized, loadedImages, templatesByBusinessUnit, loadingEmployees, loadingComplete]);

    // Simplified useEffect for tracking loading status to prevent zero count
    useEffect(() => {
        if (!isInitialized || loadingComplete) return;
        
        // Count loaded employees
        const loadedEmployeeCount = Object.values(loadedImages).filter(e => e?.isLoaded).length;
        const totalEmployeeCount = employees.length;
        
        // Only update if we have meaningful counts
        if (loadedEmployeeCount > 0 || totalEmployeeCount === 0) {
            setLoadingStatus(`Loading employee data: ${loadedEmployeeCount}/${totalEmployeeCount} employees ready`);
            
            // Check if all are loaded
            if (loadedEmployeeCount === totalEmployeeCount && totalEmployeeCount > 0) {
                setIsAllReady(true);
            }
        }
    }, [loadedImages, employees.length, isInitialized, loadingComplete]);

    // Add event listener for window resize to redraw canvases
    useEffect(() => {
        const handleResize = () => {
            if (loadingComplete && isAllReady) {
                // Get the current selected employee's UUID
                const selectedUuids = getSelectedEmployeesList();
                if (selectedUuids.length === 0) return;
                
                // Force redraw the current preview
                const currentUuid = selectedUuids[currentPreviewIndex];
                if (!currentUuid) return;
                
                const employee = employees.find(e => e.uuid === currentUuid);
                if (!employee) return;
                
                const images = loadedImages[currentUuid];
                const canvases = employeeCanvases[currentUuid];
                if (!images?.isLoaded || !canvases) return;
                
                const businessUnitId = employee.businessunit_id;
                const templateData = templatesByBusinessUnit[businessUnitId];
                if (!templateData) return;
                
                // Re-render current preview
                if (images.frontImg && canvases.frontCanvas) {
                    renderFrontCanvas(
                        employee,
                        canvases.frontCanvas,
                        images.frontImg,
                        images.employeeImg,
                        images.signatureImg,
                        templateData.template_data
                    );
                }
                
                if (images.backImg && canvases.backCanvas) {
                    renderBackCanvas(
                        employee,
                        canvases.backCanvas,
                        images.backImg,
                        images.qrcodeImg,
                        templateData.template_data
                    );
                }
            }
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [loadingComplete, isAllReady, currentPreviewIndex]);

    // Update navigation function to force redraw when changing preview
    const navigatePreview = (direction: 'next' | 'prev') => {
        const selectedUuids = getSelectedEmployeesList();
        if (selectedUuids.length === 0) return;
        
        let newIndex: number;
        if (direction === 'next') {
            newIndex = (currentPreviewIndex + 1) % selectedUuids.length;
        } else {
            newIndex = (currentPreviewIndex - 1 + selectedUuids.length) % selectedUuids.length;
        }
        
        setCurrentPreviewIndex(newIndex);
        
        // Force redraw after state update
        setTimeout(() => {
            const nextUuid = selectedUuids[newIndex];
            if (!nextUuid) return;
            
            const employee = employees.find(e => e.uuid === nextUuid);
            if (!employee) return;
            
            const images = loadedImages[nextUuid];
            const canvases = employeeCanvases[nextUuid];
            if (!images?.isLoaded || !canvases) return;
            
            const businessUnitId = employee.businessunit_id;
            const templateData = templatesByBusinessUnit[businessUnitId];
            if (!templateData) return;
            
            // Re-render canvases for the next employee
            if (images.frontImg && canvases.frontCanvas) {
                renderFrontCanvas(
                    employee,
                    canvases.frontCanvas,
                    images.frontImg,
                    images.employeeImg,
                    images.signatureImg,
                    templateData.template_data
                );
            }
            
            if (images.backImg && canvases.backCanvas) {
                renderBackCanvas(
                    employee,
                    canvases.backCanvas,
                    images.backImg,
                    images.qrcodeImg,
                    templateData.template_data
                );
            }
        }, 50); // Small timeout to ensure state update has happened
    };

    // Enhanced drawWrappedText function that considers card boundaries
    const drawWrappedText = (
        ctx: CanvasRenderingContext2D, 
        text: string, 
        x: number, 
        y: number, 
        maxWidth?: number, 
        maxLines: number = 2, 
        lineHeight: number = 25
    ) => {
        // Calculate available width based on position
        const cardWidth = ctx.canvas.width; // 651px
        const margin = 20; // Safety margin from the edge of the card
        
        // Calculate how much space is available to the right of this position
        const availableWidth = cardWidth - x - margin;
        
        // Use the smaller of maxWidth or availableWidth
        const effectiveMaxWidth = maxWidth ? Math.min(maxWidth, availableWidth) : availableWidth;
        
        // Save original font size
        const originalFont = ctx.font;
        let fontSize = parseInt(originalFont.match(/\d+/)?.[0] || "25");
        let words = text.split(' ');
        let line = '';
        let lines: string[] = [];
        
        // First try with current font size
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > effectiveMaxWidth && n > 0) {
                lines.push(line);
                line = words[n] + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line);
        
        // If we have too many lines or the text is too wide, reduce font size
        if (lines.length > maxLines || ctx.measureText(lines[0]).width > effectiveMaxWidth) {
            // Calculate font size reduction factor
            let reductionFactor = 0.9; // Start with 10% reduction
            
            if (lines.length > maxLines) {
                // More aggressive reduction if we have too many lines
                reductionFactor = Math.min(reductionFactor, maxLines / lines.length * 0.9);
            }
            
            // If first line is too wide, calculate additional reduction
            const widestLine = lines.reduce((max, line) => 
                Math.max(max, ctx.measureText(line).width), 0);
            
            if (widestLine > effectiveMaxWidth) {
                const widthReduction = effectiveMaxWidth / widestLine * 0.95;
                reductionFactor = Math.min(reductionFactor, widthReduction);
            }
            
            // Apply font size reduction with minimum size limit
            fontSize = Math.max(12, Math.floor(fontSize * reductionFactor));
            ctx.font = `${fontSize}px "Calibri", "Roboto", sans-serif`;
            
            // Reset and try again with smaller font
            lines = [];
            line = '';
            
            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                
                if (metrics.width > effectiveMaxWidth && n > 0) {
                    lines.push(line);
                    line = words[n] + ' ';
                    // If we're still going over maxLines, truncate
                    if (lines.length >= maxLines) {
                        lines[maxLines-1] = lines[maxLines-1].trim() + '...';
                        break;
                    }
                } else {
                    line = testLine;
                }
            }
            
            if (lines.length < maxLines) {
                lines.push(line);
            }
        }
        
        // Draw the text lines
        for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
            ctx.fillText(lines[i], x, y + (i * lineHeight));
        }
        
        // Restore original font
        ctx.font = originalFont;
        
        // Return the number of lines actually drawn
        return Math.min(lines.length, maxLines);
    };

    // Helper function to check if background is dark
    const isBackgroundDark = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number = 10, height: number = 10): boolean => {
        try {
            // Sample a small area around the text position
            const imageData = ctx.getImageData(
                Math.max(0, x - width/2),
                Math.max(0, y - height/2),
                Math.min(width, ctx.canvas.width - x + width/2),
                Math.min(height, ctx.canvas.height - y + height/2)
            );
            
            // Calculate average brightness
            let totalBrightness = 0;
            const pixels = imageData.data.length / 4;
            
            for (let i = 0; i < imageData.data.length; i += 4) {
                const r = imageData.data[i];
                const g = imageData.data[i + 1];
                const b = imageData.data[i + 2];
                
                // Calculate perceived brightness using the luminosity formula
                // (0.299*R + 0.587*G + 0.114*B)
                const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
                totalBrightness += brightness;
            }
            
            const averageBrightness = totalBrightness / pixels;
            
            // Consider dark if average brightness is below threshold (0-255, 128 is middle)
            return averageBrightness < 128;
        } catch (error) {
            return false; // Default to light background if there's an error
        }
    };

    // Helper function to render front canvas
    const renderFrontCanvas = (
        employee: EmployeeType,
        canvas: HTMLCanvasElement,
        frontImg: HTMLImageElement,
        employeeImg?: HTMLImageElement,
        signatureImg?: HTMLImageElement,
        templateImageConfig?: TemplateImageConfig
    ) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        try {
            // Draw template background
            ctx.drawImage(frontImg, 0, 0, canvas.width, canvas.height);
            
            // Draw employee image if loaded - using top-left coordinates
            if (employeeImg) {
                const height = templateImageConfig?.emp_img_height || 265;
                const width = templateImageConfig?.emp_img_width || 265;
                const x = templateImageConfig?.emp_img_x || 193;
                const y = templateImageConfig?.emp_img_y || 338;
                
                // This is already using top-left coordinates, so no adjustment needed
                ctx.drawImage(employeeImg, x, y, width, height);
            }
            
            // Draw employee name with dynamic color
            const empNameX = templateImageConfig?.emp_name_x || 341;
            const empNameY = templateImageConfig?.emp_name_y || 675;
            const fullName = `${employee.employee_firstname} ${employee.employee_middlename || ''} ${employee.employee_lastname} ${employee.employee_name_extension || ''}`.trim();

            // Check if background is dark and set text color accordingly
            const nameAreaIsDark = isBackgroundDark(ctx, empNameX, empNameY, 150, 30);
            ctx.fillStyle = nameAreaIsDark ? 'white' : 'black';
            ctx.font = 'bold 30px "Calibri", "Roboto", sans-serif';
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(fullName, empNameX, empNameY);

            // Draw position with dynamic color
            const empPosX = templateImageConfig?.emp_pos_x || 341;
            const empPosY = templateImageConfig?.emp_pos_y || 700;
            const posAreaIsDark = isBackgroundDark(ctx, empPosX, empPosY, 150, 30);
            ctx.fillStyle = posAreaIsDark ? 'white' : 'black';
            ctx.font = 'italic 25px "Calibri", "Roboto", sans-serif';
            ctx.textAlign = "center";
            ctx.fillText(employee.position || 'N/A', empPosX, empPosY);

            // Draw ID number with dynamic color
            const empIdNoX = templateImageConfig?.emp_idno_x || 325;
            const empIdNoY = templateImageConfig?.emp_idno_y || 725;
            const idAreaIsDark = isBackgroundDark(ctx, empIdNoX, empIdNoY, 100, 30);
            ctx.fillStyle = idAreaIsDark ? 'white' : 'black';
            ctx.font = 'bold 18px "Calibri", "Roboto", sans-serif';
            ctx.textAlign = "center";
            ctx.fillText(employee.id_no, empIdNoX, empIdNoY);
            
            // Draw signature with color inversion on dark backgrounds
            if (signatureImg) {
                const signatureWidth = 273;
                const signatureHeight = 193;
                const empSigX = templateImageConfig?.emp_sig_x || 341;
                const empSigY = templateImageConfig?.emp_sig_y || 780;
                
                // Check if signature area is dark
                const sigAreaIsDark = isBackgroundDark(ctx, empSigX, empSigY, signatureWidth / 2, signatureHeight / 2);
                
                if (sigAreaIsDark) {
                    // Create an offscreen canvas to invert the signature
                    const offscreenCanvas = document.createElement('canvas');
                    offscreenCanvas.width = signatureWidth;
                    offscreenCanvas.height = signatureHeight;
                    const offCtx = offscreenCanvas.getContext('2d');
                    
                    if (offCtx) {
                        // Draw the signature on the offscreen canvas
                        offCtx.drawImage(
                            signatureImg, 
                            0, 
                            0, 
                            signatureWidth, 
                            signatureHeight
                        );
                        
                        // Invert the colors
                        const imageData = offCtx.getImageData(0, 0, signatureWidth, signatureHeight);
                        const data = imageData.data;
                        
                        for (let i = 0; i < data.length; i += 4) {
                            // For signature, we typically want to keep transparency and just invert black to white
                            if (data[i + 3] > 0) { // If pixel is not fully transparent
                                // Detect if the pixel is dark (signature)
                                const isDark = (data[i] + data[i + 1] + data[i + 2]) / 3 < 128;
                                
                                if (isDark) {
                                    // Invert dark pixels to white
                                    data[i] = 255;     // R
                                    data[i + 1] = 255; // G
                                    data[i + 2] = 255; // B
                                    // Keep original alpha
                                }
                            }
                        }
                        
                        offCtx.putImageData(imageData, 0, 0);
                        
                        // Draw the inverted signature on the main canvas
                        ctx.drawImage(
                            offscreenCanvas, 
                            empSigX - (signatureWidth / 2), 
                            empSigY - (signatureHeight / 2), 
                            signatureWidth, 
                            signatureHeight
                        );
                    } else {
                        // Fallback to normal signature if offscreen context failed
                        ctx.drawImage(
                            signatureImg, 
                            empSigX - (signatureWidth / 2), 
                            empSigY - (signatureHeight / 2), 
                            signatureWidth, 
                            signatureHeight
                        );
                    }
                } else {
                    // Default drawing for non-dark backgrounds
                    ctx.drawImage(
                        signatureImg, 
                        empSigX - (signatureWidth / 2), 
                        empSigY - (signatureHeight / 2), 
                        signatureWidth, 
                        signatureHeight
                    );
                }
            }
        } catch (error) {
            console.error("Error rendering front canvas:", error);
        }
    };
    
    // Helper function to render the back canvas
    const renderBackCanvas = (
        employee: EmployeeType,
        canvas: HTMLCanvasElement,
        backImg: HTMLImageElement,
        qrcodeImg?: HTMLImageElement,
        templateImageConfig?: TemplateImageConfig
    ) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        try {
            // Draw template background
            ctx.drawImage(backImg, 0, 0, canvas.width, canvas.height);
            
            // Draw QR code - using top-left coordinates
            if (qrcodeImg) {
                const qrX = templateImageConfig?.emp_qrcode_x || 483;
                const qrY = templateImageConfig?.emp_qrcode_y || 88;
                const qrWidth = templateImageConfig?.emp_qrcode_width || 150;
                const qrHeight = templateImageConfig?.emp_qrcode_height || 150;
                
                // Correctly uses top-left positioning
                ctx.drawImage(qrcodeImg, qrX, qrY, qrWidth, qrHeight);
            }
            
            // For back text elements, use left-alignment with vertical centering
            ctx.font = '25px "Calibri", "Roboto", sans-serif';
            ctx.fillStyle = 'black';
            ctx.textAlign = "left";
            ctx.textBaseline = "middle"; // Important for proper vertical alignment
            
            // Draw address with dynamically calculated width
            const empAddX = templateImageConfig?.emp_add_x || 150;
            const empAddY = templateImageConfig?.emp_add_y || 225;
            ctx.font = '25px "Calibri", "Roboto", sans-serif';
            drawWrappedText(ctx, employee.address || 'N/A', empAddX, empAddY, undefined, 2);
            
            // Draw birthdate with vertical centering
            const empBdayX = templateImageConfig?.emp_bday_x || 150;
            const empBdayY = templateImageConfig?.emp_bday_y || 257;
            ctx.font = '25px "Calibri", "Roboto", sans-serif';
            
            // Format birthday if it exists
            let birthdate = 'N/A';
            if (employee.birthday) {
                const date = new Date(employee.birthday);
                birthdate = date.toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                });
            }
            ctx.fillText(birthdate, empBdayX, empBdayY);
            
            // Draw SSS number
            const empSssX = templateImageConfig?.emp_sss_x || 150;
            const empSssY = templateImageConfig?.emp_sss_y || 283;
            ctx.font = '25px "Calibri", "Roboto", sans-serif';
            ctx.fillText(employee.sss_no || 'N/A', empSssX, empSssY);
            
            // Draw PHIC number
            const empPhicX = templateImageConfig?.emp_phic_x || 150;
            const empPhicY = templateImageConfig?.emp_phic_y || 308;
            ctx.fillText(employee.phic_no || 'N/A', empPhicX, empPhicY);
            
            // Draw HDMF number
            const empHdmfX = templateImageConfig?.emp_hdmf_x || 150;
            const empHdmfY = templateImageConfig?.emp_hdmf_y || 333;
            ctx.fillText(employee.hdmf_no || 'N/A', empHdmfX, empHdmfY);
            
            // Draw TIN number
            const empTinX = templateImageConfig?.emp_tin_x || 150;
            const empTinY = templateImageConfig?.emp_tin_y || 360;
            ctx.fillText(employee.tin_no || 'N/A', empTinX, empTinY);
            
            // Draw emergency contact information
            const empEmergencyNameX = templateImageConfig?.emp_emergency_name_x || 150;
            const empEmergencyNameY = templateImageConfig?.emp_emergency_name_y || 626;
            ctx.font = '25px "Calibri", "Roboto", sans-serif';
            ctx.fillText(employee.emergency_name || 'N/A', empEmergencyNameX, empEmergencyNameY);
            
            // Draw emergency contact number
            const empEmergencyNumX = templateImageConfig?.emp_emergency_num_x || 150;
            const empEmergencyNumY = templateImageConfig?.emp_emergency_num_y || 680;
            ctx.fillText(employee.emergency_contact_number || 'N/A', empEmergencyNumX, empEmergencyNumY);
            
            // Draw emergency contact address with dynamically calculated width
            const empEmergencyAddX = templateImageConfig?.emp_emergency_add_x || 150;
            const empEmergencyAddY = templateImageConfig?.emp_emergency_add_y || 738;
            drawWrappedText(ctx, employee.emergency_address || 'N/A', empEmergencyAddX, empEmergencyAddY, undefined, 2);
        } catch (error) {
            console.error("Error rendering back canvas:", error);
        }
    };

    // Toggle selection of a specific employee
    const toggleEmployeeSelection = (uuid: string) => {
        setSelectedEmployees(prev => ({
            ...prev,
            [uuid]: !prev[uuid]
        }));
    };

    // Toggle selection of all employees
    const toggleAllEmployees = () => {
        const currentValue = selectedCount < employees.length;
        const newSelection = employees.reduce((acc, employee) => {
            acc[employee.uuid] = currentValue;
            return acc;
        }, {} as Record<string, boolean>);
        setSelectedEmployees(newSelection);
    };

    // Handle bulk export of ID cards
    const handleBulkExport = async () => {
        const selectedUuids = Object.entries(selectedEmployees)
            .filter(([_, isSelected]) => isSelected)
            .map(([uuid]) => uuid);
            
        if (selectedUuids.length === 0) {
            alert("Please select at least one employee to export.");
            return;
        }
        
        const allImagesLoaded = Object.keys(loadedImages).every(uuid => 
            selectedUuids.includes(uuid) ? loadedImages[uuid]?.isLoaded : true
        );
        
        if (!allImagesLoaded) {
            alert("Please wait for all images to fully load before exporting.");
            return;
        }
        
        setIsExporting(true);
        setExportProgress(0);

        try {
            const zip = new JSZip();
            const mainFolder = zip.folder("employee_id_cards");
            if (!mainFolder) {
                throw new Error("Failed to create main folder in ZIP");
            }
            
            const totalSelected = selectedUuids.length;
            let completed = 0;
            
            // Update status to show we're beginning the export process
            setLoadingStatus(`Starting export of ${totalSelected} employee ID cards...`);
            
            // Function to capture canvas as blob
            const captureCanvasAsBlob = (canvas: HTMLCanvasElement): Promise<Blob> => {
                return new Promise((resolve, reject) => {
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error("Failed to create blob from canvas"));
                        }
                    }, "image/png");
                });
            };
            
            // Create a master CSV file with all IDs
            let masterCsvContent = 'EMPLOYEE_ID,EMPLOYEE_NAME,FRONT_FILE,BACK_FILE\n';
            
            // Process each selected employee
            for (const uuid of selectedUuids) {
                const employee = employees.find(e => e.uuid === uuid);
                if (!employee) continue;
                
                // Update status to show which employee is being processed
                setLoadingStatus(`Processing ID card for ${employee.employee_firstname} ${employee.employee_lastname} (${++completed}/${totalSelected})`);
                
                const canvases = employeeCanvases[uuid];
                if (!canvases || !canvases.frontCanvas || !canvases.backCanvas) continue;
                
                const employeeId = employee.id_no;
                const employeeFullName = `${employee.employee_firstname} ${employee.employee_middlename || ''} ${employee.employee_lastname} ${employee.employee_name_extension || ''}`.trim().replace(/\s+/g, "_");
                
                const frontFileName = `${employeeId}_front.png`;
                const backFileName = `${employeeId}_back.png`;
                
                const frontBlob = await captureCanvasAsBlob(canvases.frontCanvas);
                const backBlob = await captureCanvasAsBlob(canvases.backCanvas);
                
                // Store files directly in the main folder with unique names
                mainFolder.file(`${employeeId}_front.png`, frontBlob, { binary: true });
                mainFolder.file(`${employeeId}_back.png`, backBlob, { binary: true });
                
                // Add to master CSV
                const displayName = `${employee.employee_firstname} ${employee.employee_lastname}`;
                masterCsvContent += `${employeeId},"${displayName}",${frontFileName},${backFileName}\n`;
                
                setExportProgress(Math.round((completed / totalSelected) * 100));
            }
            
            // Update status to show we're creating the zip file
            setLoadingStatus(`Creating ZIP file with ${totalSelected} ID cards...`);
            
            // Add master CSV to the root of the ZIP
            mainFolder.file('all_id_cards.csv', masterCsvContent);
            
            // Add readme file
            const readmeContent = 
                'BULK ID CARD EXPORT\n\n' +
                `Exported Date: ${new Date().toLocaleString()}\n` +
                `Total Employees: ${totalSelected}\n\n` +
                'Each employee folder contains:\n' +
                '- Front ID card image\n' +
                '- Back ID card image\n' +
                '- CSV file with filenames\n\n' +
                'The root folder contains a master CSV with paths to all ID cards.';
            mainFolder.file('README.txt', readmeContent);
            
            // Generate and save the ZIP file
            const zipContent = await zip.generateAsync({ 
                type: "blob",
                compression: "DEFLATE",
                compressionOptions: {
                    level: 6
                }
            }, (metadata: { percent: number; }) => {
                if (metadata.percent) {
                    setExportProgress(Math.round(metadata.percent));
                }
            });
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            saveAs(zipContent, `employee_id_cards_${timestamp}.zip`);
            
            // Final success status
            setLoadingStatus(`Successfully exported ${totalSelected} ID cards!`);
            
            alert(`Successfully exported ID cards for ${totalSelected} employees!`);
        } catch (error) {
            console.error("Error exporting ID cards:", error);
            setErrorMessage(`Error exporting ID cards: ${error instanceof Error ? error.message : 'Unknown error'}`);
            // Update status to show the error
            setLoadingStatus(`Error during export: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsExporting(false);
            setExportProgress(0);
        }
    };

    // Add navigation functions for preview
    const getSelectedEmployeesList = (): string[] => {
        return Object.entries(selectedEmployees)
            .filter(([_, isSelected]) => isSelected)
            .map(([uuid]) => uuid);
    };

    // Add a visual indicator for the loading status
    const getStatusIndicator = () => {
        const isAllReady = Object.keys(loadedImages).length === employees.length &&
            Object.values(loadedImages).every(img => img.isLoaded);

        if (isExporting) {
            return (
                <div className="flex items-center justify-center">
                    <Loader2 className="animate-spin mr-2 h-5 w-5 text-indigo-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {loadingStatus}
                    </span>
                </div>
            );
        }
        
        if (isAllReady) {
            return (
                <div className="flex items-center justify-center">
                    <Check className="mr-2 h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        {loadingStatus}
                    </span>
                </div>
            );
        }
        
        return (
            <div className="flex items-center justify-center">
                <Loader2 className="animate-spin mr-2 h-5 w-5 text-indigo-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {loadingStatus}
                </span>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Bulk ID Card Preview - ${selectedCount} Employees`} />
            <div className="px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                            Bulk ID Card Preview
                        </h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {selectedCount} of {employees.length} employees selected
                        </p>
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={() => router.visit(route('employee.index'))}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
                        </button>
                        <button
                            onClick={handleBulkExport}
                            disabled={!isAllReady || isExporting || selectedCount === 0}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-600"
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                    Exporting ({exportProgress}%)
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" /> Export {selectedCount} ID Cards
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="mb-4 text-center">
                    {getStatusIndicator()}
                </div>

                {errorMessage && (
                    <div className="mb-4 bg-red-50 dark:bg-red-900/30 p-4 rounded-md">
                        <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
                            <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                                Employee ID Cards
                            </h2>
                            <button
                                onClick={toggleAllEmployees}
                                className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                                {selectedCount === employees.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Select
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Position
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Business Unit
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {employees.map(employee => (
                                    <tr 
                                        key={employee.uuid} 
                                        className={
                                            selectedEmployees[employee.uuid] 
                                                ? 'bg-indigo-50 dark:bg-indigo-900/20' 
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }
                                        onClick={() => toggleEmployeeSelection(employee.uuid)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={!!selectedEmployees[employee.uuid]}
                                                    onChange={() => toggleEmployeeSelection(employee.uuid)}
                                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {employee.id_no}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {employee.employee_firstname} {employee.employee_lastname}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                            {employee.position}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                            {employee.businessunit_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {loadedImages[employee.uuid]?.isLoaded ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                    <Check className="h-4 w-4 mr-1" /> Ready
                                                </span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                    <Loader2 className="animate-spin h-4 w-4 mr-1" /> Loading
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Preview section for the selected employee */}
                {selectedCount > 0 && (
                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                                Preview ID Card
                            </h2>
                            
                            {selectedCount > 1 && (
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => navigatePreview('prev')}
                                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {currentPreviewIndex + 1} of {selectedCount}
                                    </span>
                                    <button
                                        onClick={() => navigatePreview('next')}
                                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {(() => {
                            const selectedUuids = getSelectedEmployeesList();
                            if (selectedUuids.length === 0) return null;
                            
                            // Get the current employee to preview based on index
                            const currentUuid = selectedUuids[currentPreviewIndex];
                            if (!currentUuid) return null;
                            
                            const employee = employees.find(e => e.uuid === currentUuid);
                            if (!employee) return null;
                            
                            const canvases = employeeCanvases[currentUuid];
                            if (!canvases) return null;
                            
                            const imgsLoaded = loadedImages[currentUuid]?.isLoaded;
                            
                            if (!imgsLoaded) {
                                return (
                                    <div className="p-4 text-center">
                                        <Loader2 className="animate-spin h-8 w-8 mx-auto mb-2" />
                                        <p>Loading preview...</p>
                                    </div>
                                );
                            }
                            
                            return (
                                <div className="flex flex-col lg:flex-row justify-center gap-8">
                                    <div className="flex flex-col items-center">
                                        <h3 className="text-md font-medium mb-2 text-gray-900 dark:text-white">
                                            Front - {employee.employee_firstname} {employee.employee_lastname}
                                        </h3>
                                        <div className="border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden">
                                            <img 
                                                src={canvases.frontCanvas?.toDataURL()} 
                                                alt="ID Front Preview"
                                                className="max-w-full h-auto"
                                                style={{ maxHeight: '1000px' }} // Increased from 400px to 600px
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <h3 className="text-md font-medium mb-2 text-gray-900 dark:text-white">
                                            Back - {employee.employee_firstname} {employee.employee_lastname}
                                        </h3>
                                        <div className="border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden">
                                            <img 
                                                src={canvases.backCanvas?.toDataURL()} 
                                                alt="ID Back Preview"
                                                className="max-w-full h-auto"
                                                style={{ maxHeight: '1000px' }} // Increased from 400px to 600px
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
                
                {isExporting && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
                            <h3 className="text-lg font-medium mb-4 text-center">
                                Exporting ID Cards
                            </h3>
                            <div className="mb-4">
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                    <div 
                                        className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full" 
                                        style={{ width: `${exportProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                                {exportProgress}% complete
                            </p>
                            <p className="text-center text-xs mt-2 text-gray-500 dark:text-gray-400">
                                Please don't close this page until the export is complete
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default BulkIdCardPreview;

