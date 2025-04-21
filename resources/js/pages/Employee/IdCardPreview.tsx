import React, { useEffect, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ArrowLeft, Download, AlertCircle } from 'lucide-react';

interface IdCardPreviewProps {
    employee: {
        uuid: number;
        id_no: string;
        employee_firstname: string;
        employee_middlename?: string;
        employee_lastname: string;
        employee_name_extension: string;
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
    },
    templateImages: {
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
    };
    frontTemplate: string;
    backTemplate: string;
}

const IdCardPreview: React.FC<IdCardPreviewProps> = ({ employee, templateImages, frontTemplate, backTemplate }) => {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Employee List', href: '/employee' },
        { title: 'ID Card Preview', href: `/employee/${employee.uuid}/id-preview` },
    ];

    const frontCanvasRef = useRef<HTMLCanvasElement>(null);
    const backCanvasRef = useRef<HTMLCanvasElement>(null);
    
    const [loadingStatus, setLoadingStatus] = useState<string>("Loading images...");
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [loadingProgress, setLoadingProgress] = useState({
        frontTemplate: false,
        backTemplate: false,
        employeeImage: false,
        signatureImage: false,
        qrcodeImage: false
    });

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showDebugInfo, setShowDebugInfo] = useState(false);

    // Store loaded images
    const [loadedImages, setLoadedImages] = useState<{
        frontImg?: HTMLImageElement;
        backImg?: HTMLImageElement;
        employeeImg?: HTMLImageElement;
        signatureImg?: HTMLImageElement;
        qrcodeImg?: HTMLImageElement;
    }>({});

    useEffect(() => {
        // Function to safely load an image with error handling
        const loadImageSafely = (src: string, onLoad: (img: HTMLImageElement) => void, onError: () => void) => {
            if (!src) {
                console.error("Empty image source provided");
                onError();
                return null;
            }

            console.log(`Attempting to load image from: ${src}`);
            
            const img = new Image();
            img.crossOrigin = "Anonymous";
            
            img.onload = () => {
                console.log(`Successfully loaded image from: ${src}`);
                onLoad(img);
            };
            
            img.onerror = (e) => {
                console.error(`Failed to load image from: ${src}`, e);
                onError();
            };
            
            img.src = src;
            return img;
        };

        // Create a function to try loading from multiple sources
        const loadWithFallbacks = (primarySrc: string, fallbackSrc: string, onLoad: (img: HTMLImageElement) => void) => {
            loadImageSafely(
                primarySrc,
                onLoad,
                () => {
                    // If primary source fails, try fallback
                    console.log(`Primary source failed, trying fallback: ${fallbackSrc}`);
                    const fallbackImg = new Image();
                    fallbackImg.crossOrigin = "Anonymous";
                    fallbackImg.onload = () => {
                        console.log(`Fallback image loaded successfully from: ${fallbackSrc}`);
                        onLoad(fallbackImg);
                    };
                    fallbackImg.onerror = () => {
                        console.error(`Both primary and fallback image loading failed`);
                        // Create a canvas as final fallback
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
                            ctx.fillText('Template Not Available', canvas.width/2, canvas.height/2);
                            
                            // Convert canvas to image
                            const tempImg = new Image();
                            tempImg.src = canvas.toDataURL('image/png');
                            tempImg.onload = () => onLoad(tempImg);
                        }
                    };
                    fallbackImg.src = fallbackSrc;
                }
            );
        };

        // Load front template with fallbacks
        loadWithFallbacks(
            frontTemplate,
            '/images/default_front_template.png',
            (img) => {
                setLoadingProgress(prev => ({ ...prev, frontTemplate: true }));
                setLoadedImages(prev => ({ ...prev, frontImg: img }));
            }
        );

        // Load back template with fallbacks
        loadWithFallbacks(
            backTemplate,
            '/images/default_back_template.png',
            (img) => {
                setLoadingProgress(prev => ({ ...prev, backTemplate: true }));
                setLoadedImages(prev => ({ ...prev, backImg: img }));
            }
        );

        // Only attempt to load employee image if it exists
        if (employee.image_person) {
            const employeeImageUrl = route('network.image', { folder: 'employee', filename: employee.image_person });
            loadImageSafely(
                employeeImageUrl,
                (img) => {
                    setLoadingProgress(prev => ({ ...prev, employeeImage: true }));
                    setLoadedImages(prev => ({ ...prev, employeeImg: img }));
                },
                () => {
                    setLoadingProgress(prev => ({ ...prev, employeeImage: true }));
                    setErrorMessage(prev => prev || "Could not load some employee images. Using placeholders instead.");
                }
            );
        } else {
            setLoadingProgress(prev => ({ ...prev, employeeImage: true }));
        }

        // Only attempt to load signature if it exists
        if (employee.image_signature) {
            const signatureImageUrl = route('network.image', { folder: 'signature', filename: employee.image_signature });
            loadImageSafely(
                signatureImageUrl,
                (img) => {
                    setLoadingProgress(prev => ({ ...prev, signatureImage: true }));
                    setLoadedImages(prev => ({ ...prev, signatureImg: img }));
                },
                () => {
                    setLoadingProgress(prev => ({ ...prev, signatureImage: true }));
                }
            );
        } else {
            setLoadingProgress(prev => ({ ...prev, signatureImage: true }));
        }

        // Only attempt to load QR code if it exists
        if (employee.image_qrcode) {
            const qrcodeImageUrl = route('network.image', { folder: 'qrcode', filename: employee.image_qrcode });
            loadImageSafely(
                qrcodeImageUrl,
                (img) => {
                    setLoadingProgress(prev => ({ ...prev, qrcodeImage: true }));
                    setLoadedImages(prev => ({ ...prev, qrcodeImg: img }));
                },
                () => {
                    setLoadingProgress(prev => ({ ...prev, qrcodeImage: true }));
                }
            );
        } else {
            setLoadingProgress(prev => ({ ...prev, qrcodeImage: true }));
        }
    }, [employee, frontTemplate, backTemplate]);

    // Render canvases whenever images load or template images change
    useEffect(() => {
        const { frontImg, backImg, employeeImg, signatureImg, qrcodeImg } = loadedImages;
        
        // Debug template positions
        console.log("Current template positions object:", templateImages);
        console.log("QR code coordinates:", {
            x: templateImages.emp_qrcode_x,
            y: templateImages.emp_qrcode_y,
            width: templateImages.emp_qrcode_width,
            height: templateImages.emp_qrcode_height
        });

        // Render front canvas if front template is loaded
        if (frontImg && frontCanvasRef.current) {
            renderFrontCanvas(frontImg, employeeImg, signatureImg);
        }

        // Render back canvas if back template is loaded
        if (backImg && backCanvasRef.current) {
            renderBackCanvas(backImg, qrcodeImg);
        }
        
        // Log template positions when they're available
        if (Object.keys(templateImages).length > 0) {
            console.log("Template positions loaded:", templateImages);
        }
    }, [loadedImages, templateImages]);

    // Helper function to render the front canvas
    const renderFrontCanvas = (frontImg: HTMLImageElement, employeeImg?: HTMLImageElement, signatureImg?: HTMLImageElement) => {
        const canvas = frontCanvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        try {
            // Draw template background
            ctx.drawImage(frontImg, 0, 0, canvas.width, canvas.height);
            
            // Draw employee image if loaded - using top-left coordinates
            if (employeeImg) {
                const height = templateImages.emp_img_height || 265;
                const width = templateImages.emp_img_width || 265;
                const x = templateImages.emp_img_x || 193;
                const y = templateImages.emp_img_y || 338;
                
                // This is already using top-left coordinates, so no adjustment needed
                ctx.drawImage(employeeImg, x, y, width, height);
            }
            
            // Draw employee name - using center coordinates
            const empNameX = templateImages.emp_name_x || 341;
            const empNameY = templateImages.emp_name_y || 675;
            const fullName = `${employee.employee_firstname} ${employee.employee_middlename || ''} ${employee.employee_lastname} ${employee.employee_name_extension || ''}`.trim();
            ctx.font = 'bold 30px "Calibri", "Roboto", sans-serif';
            ctx.textAlign = "center";
            ctx.textBaseline = "middle"; // This ensures vertical centering
            ctx.fillText(fullName, empNameX, empNameY);
            
            // Draw position - using center coordinates
            const empPosX = templateImages.emp_pos_x || 341;
            const empPosY = templateImages.emp_pos_y || 700;
            ctx.font = 'italic 25px "Calibri", "Roboto", sans-serif';
            ctx.textAlign = "center";
            ctx.textBaseline = "middle"; // This ensures vertical centering
            ctx.fillText(employee.position || 'N/A', empPosX, empPosY);
            
            // Draw ID number
            const empIdNoX = templateImages.emp_idno_x || 325;
            const empIdNoY = templateImages.emp_idno_y || 725;
            ctx.font = 'bold 18px "Calibri", "Roboto", sans-serif';
            ctx.textAlign = "center";
            ctx.fillText(employee.id_no, empIdNoX, empIdNoY);
            
            // Draw signature - already adjusts for center coordinates
            if (signatureImg) {
                const signatureWidth = 273;
                const signatureHeight = 193;
                const empSigX = templateImages.emp_sig_x || 341;
                const empSigY = templateImages.emp_sig_y || 780;
                
                // Already correctly adjusted for center point
                ctx.drawImage(
                    signatureImg, 
                    empSigX - (signatureWidth / 2), 
                    empSigY - (signatureHeight / 2), 
                    signatureWidth, 
                    signatureHeight
                );
            }
        } catch (error) {
            console.error("Error rendering front canvas:", error);
            setErrorMessage("Error rendering ID card. Please try again later.");
        }
    };
    
    // Helper function to render the back canvas
    const renderBackCanvas = (backImg: HTMLImageElement, qrcodeImg?: HTMLImageElement) => {
        const canvas = backCanvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        try {
            // Draw template background
            ctx.drawImage(backImg, 0, 0, canvas.width, canvas.height);
            
            // Draw QR code - using top-left coordinates
            if (qrcodeImg) {
                const qrX = templateImages.emp_qrcode_x || 483;
                const qrY = templateImages.emp_qrcode_y || 88;
                const qrWidth = templateImages.emp_qrcode_width || 150;
                const qrHeight = templateImages.emp_qrcode_height || 150;
                
                // Correctly uses top-left positioning
                ctx.drawImage(qrcodeImg, qrX, qrY, qrWidth, qrHeight);
            }
            
            // For back text elements, use left-alignment with vertical centering
            ctx.font = '25px "Calibri", "Roboto", sans-serif';
            ctx.fillStyle = 'black';
            ctx.textAlign = "left";
            ctx.textBaseline = "middle"; // Important for proper vertical alignment
            
            // Draw address
            const empAddX = templateImages.emp_add_x || 150;
            const empAddY = templateImages.emp_add_y || 225;
            ctx.fillText(employee.address || 'N/A', empAddX, empAddY);
            
            // Draw birthdate with vertical centering
            const empBdayX = templateImages.emp_bday_x || 150;
            const empBdayY = templateImages.emp_bday_y || 257;
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
            const empSssX = templateImages.emp_sss_x || 150;
            const empSssY = templateImages.emp_sss_y || 283;
            ctx.font = '25px "Calibri", "Roboto", sans-serif';
            ctx.fillText(employee.sss_no || 'N/A', empSssX, empSssY);
            
            // Draw PHIC number
            const empPhicX = templateImages.emp_phic_x || 150;
            const empPhicY = templateImages.emp_phic_y || 308;
            ctx.fillText(employee.phic_no || 'N/A', empPhicX, empPhicY);
            
            // Draw HDMF number
            const empHdmfX = templateImages.emp_hdmf_x || 150;
            const empHdmfY = templateImages.emp_hdmf_y || 333;
            ctx.fillText(employee.hdmf_no || 'N/A', empHdmfX, empHdmfY);
            
            // Draw TIN number
            const empTinX = templateImages.emp_tin_x || 150;
            const empTinY = templateImages.emp_tin_y || 360;
            ctx.fillText(employee.tin_no || 'N/A', empTinX, empTinY);
            
            // Draw emergency contact information
            const empEmergencyNameX = templateImages.emp_emergency_name_x || 150;
            const empEmergencyNameY = templateImages.emp_emergency_name_y || 626;
            ctx.font = '25px "Calibri", "Roboto", sans-serif';
            const emergencyNameMaxWidth = 400; // Maximum width for emergency contact name
            ctx.fillText(employee.emergency_name || 'N/A', empEmergencyNameX, empEmergencyNameY);
            
            // Draw emergency contact number
            const empEmergencyNumX = templateImages.emp_emergency_num_x || 150;
            const empEmergencyNumY = templateImages.emp_emergency_num_y || 680;
            ctx.fillText(employee.emergency_contact_number || 'N/A', empEmergencyNumX, empEmergencyNumY);
            
            // Draw emergency contact address
            const empEmergencyAddX = templateImages.emp_emergency_add_x || 150;
            const empEmergencyAddY = templateImages.emp_emergency_add_y || 738;
            ctx.fillText(employee.emergency_address || 'N/A', empEmergencyAddX, empEmergencyAddY);
        } catch (error) {
            console.error("Error rendering back canvas:", error);
            setErrorMessage("Error rendering ID card. Please try again later.");
        }
    };

    useEffect(() => {
        const { frontTemplate, backTemplate, employeeImage, signatureImage, qrcodeImage } = loadingProgress;
        const totalImages = 5;
        const loadedImages = [frontTemplate, backTemplate, employeeImage, signatureImage, qrcodeImage].filter(Boolean).length;
            
        if (loadedImages < totalImages) {
            setLoadingStatus(`Loading images (${loadedImages}/${totalImages})...`);
        } else {
            setLoadingStatus("All images loaded successfully!");
        }
    }, [loadingProgress]);

    const handleExportIdCard = async () => {
        const allImagesLoaded = Object.values(loadingProgress).every(Boolean);
        if (!allImagesLoaded) {
            alert("Please wait for all images to fully load before exporting.");
            return;
        }
        setIsExporting(true);

        try {
            const employeeId = employee.id_no;
            const employeeFullName = `${employee.employee_firstname} ${employee.employee_middlename || ''} ${employee.employee_lastname} ${employee.employee_name_extension || ''}`.trim().replace(/\s+/g, "_");
            const folderName = `${employeeId}_${employeeFullName}`;
            const zip = new JSZip();
            const folder = zip.folder(folderName);
            if (!folder) {
                throw new Error("Failed to create folder in ZIP");
            }

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

            const frontFileName = `${employeeId}_${employeeFullName}_front.png`;
            const backFileName = `${employeeId}_${employeeFullName}_back.png`;
            const zipFileName = `${employeeId}_${employeeFullName}.zip`;

            const frontCanvas = frontCanvasRef.current;
            const backCanvas = backCanvasRef.current;
            if (!frontCanvas || !backCanvas) {
                throw new Error("Canvas elements not found");
            }

            const frontBlob = await captureCanvasAsBlob(frontCanvas);
            const backBlob = await captureCanvasAsBlob(backCanvas);
            folder.file(frontFileName, frontBlob, { binary: true });
            folder.file(backFileName, backBlob, { binary: true });

            const csvContent = 'FRONT,BACK\n' + `${frontFileName},${backFileName}`;
            folder.file('id_card_paths.csv', csvContent);

            const readmeContent = 
                'ID CARD EXPORT INSTRUCTIONS\n\n' +
                'This ZIP file contains the front and back images of the employee ID card.\n' +
                `Employee: ${employee.employee_firstname} ${employee.employee_lastname}\n` +
                `ID Number: ${employee.id_no}\n\n` +
                'The CSV file contains the filenames of the front and back images for reference.';
            folder.file('README.txt', readmeContent);

            const zipContent = await zip.generateAsync({ type: "blob" });
            saveAs(zipContent, zipFileName);

            alert(`ID Card exported successfully!\nFiles will be downloaded as ${zipFileName}`);
        } catch (error) {
            console.error("Error exporting ID card:", error);
            setErrorMessage(`Error exporting ID card: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`ID Card Preview - ${employee.employee_firstname} ${employee.employee_lastname}`} />
            <div className="px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                            ID Card Preview
                        </h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {employee.employee_firstname} {employee.employee_lastname} - {employee.id_no}
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
                            onClick={handleExportIdCard}
                            disabled={!Object.values(loadingProgress).every(Boolean) || isExporting}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-600"
                        >
                            {isExporting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating ZIP...
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" /> Export ID Card
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="mb-4 text-center">
                    <p className={`text-sm font-medium ${Object.values(loadingProgress).every(Boolean) ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                        {loadingStatus}
                    </p>
                </div>

                {errorMessage && (
                    <div className="mb-4 bg-red-50 dark:bg-red-900/30 p-4 rounded-md">
                        <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
                            <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
                        </div>
                    </div>
                )}

                <div className="flex flex-col lg:flex-row justify-center gap-8 mt-6">
                    <div className="flex flex-col items-center">
                        <h2 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Front</h2>
                        <div className="border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden">
                            <canvas
                                ref={frontCanvasRef}
                                width="651"
                                height="1005"
                                className="max-w-full h-auto"
                            ></canvas>
                        </div>
                    </div>
                    <div className="flex flex-col items-center">
                        <h2 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Back</h2>
                        <div className="border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden">
                            <canvas
                                ref={backCanvasRef}
                                width="651"
                                height="1005"
                                className="max-w-full h-auto"
                            ></canvas>
                        </div>
                    </div>
                </div>

                {/* Debug panel */}
                <div className="mt-8">
                    <button
                        onClick={() => setShowDebugInfo(!showDebugInfo)}
                        className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                        {showDebugInfo ? 'Hide Debug Info' : 'Show Debug Info'}
                    </button>
                    {showDebugInfo && (
                        <div className="mt-4">
                            <h3 className="text-md font-medium mb-2">QR Code Positioning Debug</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
                                    <p><strong>Raw Template Values:</strong></p>
                                    <pre className="text-xs overflow-x-auto bg-gray-200 dark:bg-gray-700 p-2 rounded">
                                        {JSON.stringify({
                                            emp_qrcode_x: templateImages.emp_qrcode_x,
                                            emp_qrcode_y: templateImages.emp_qrcode_y,
                                            emp_qrcode_width: templateImages.emp_qrcode_width,
                                            emp_qrcode_height: templateImages.emp_qrcode_height
                                        }, null, 2)}
                                    </pre>
                                </div>
                                <div className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
                                    <p><strong>Computed Values:</strong></p>
                                    <pre className="text-xs overflow-x-auto bg-gray-200 dark:bg-gray-700 p-2 rounded">
                                        {JSON.stringify({
                                            qrX: templateImages.emp_qrcode_x !== undefined ? Number(templateImages.emp_qrcode_x) : 483,
                                            qrY: templateImages.emp_qrcode_y !== undefined ? Number(templateImages.emp_qrcode_y) : 88,
                                            qrWidth: templateImages.emp_qrcode_width !== undefined ? Number(templateImages.emp_qrcode_width) : 150,
                                            qrHeight: templateImages.emp_qrcode_height !== undefined ? Number(templateImages.emp_qrcode_height) : 150
                                        }, null, 2)}
                                    </pre>
                                </div>
                            </div>
                            <h3 className="text-md font-medium mb-2">All Template Positions</h3>
                            <pre className="text-xs overflow-x-auto bg-gray-200 dark:bg-gray-700 p-2 rounded">
                                {JSON.stringify(templateImages, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default IdCardPreview;
