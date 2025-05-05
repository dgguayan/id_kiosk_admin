import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog';

interface Employee {
    uuid: number;
    id_no: string;
    employee_firstname: string;
    employee_middlename?: string;
    employee_lastname: string;
    employee_name_extension: string;
    businessunit_id: number;
    businessunit_name?: string;
    employment_status: string;
    position: string;
    employee_id_counter: number;
    image_person?: string | null;
    image_signature?: string | null;
    image_qrcode?: string | null;
    birthday?: string;
    address?: string;
    id_status?: string;
    tin_no?: string;
    sss_no?: string;
    phic_no?: string;
    hdmf_no?: string;
    emergency_name?: string;
    emergency_contact_number?: string;
    emergency_address?: string;
}

interface EmployeeEditModalProps {
    isOpen: boolean;
    employee: Employee | null;
    onClose: () => void;
    businessUnits: Array<{id: number, businessunit_name: string}>;
    onSuccess?: () => void;
}

const EmployeeEditModal: React.FC<EmployeeEditModalProps> = ({
    isOpen,
    employee,
    onClose,
    businessUnits,
    onSuccess
}) => {
    const [editFormData, setEditFormData] = useState({
        employee_firstname: '',
        employee_middlename: '',
        employee_lastname: '',
        employee_name_extension: '',
        businessunit_id: '',
        employment_status: 'Active',
        position: '',
        birthday: '',
        address: '',
        id_status: 'printed',
        tin_no: '',
        sss_no: '',
        phic_no: '',
        hdmf_no: '',
        emergency_name: '',
        emergency_contact_number: '',
        emergency_address: '',
    });
    const [editFiles, setEditFiles] = useState<Record<string, File>>({});
    const [editFilePreviews, setEditFilePreviews] = useState<Record<string, string>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (employee) {
            const formattedBirthday = employee.birthday 
                ? new Date(employee.birthday).toISOString().split('T')[0]
                : '';
            
            setEditFormData({
                employee_firstname: employee.employee_firstname || '',
                employee_middlename: employee.employee_middlename || '',
                employee_lastname: employee.employee_lastname || '',
                employee_name_extension: employee.employee_name_extension || '',
                businessunit_id: employee.businessunit_id?.toString() || '',
                employment_status: employee.employment_status || 'Active',
                position: employee.position || '',
                birthday: formattedBirthday,
                address: employee.address || '',
                id_status: employee.id_status || 'printed',
                tin_no: employee.tin_no || '',
                sss_no: employee.sss_no || '',
                phic_no: employee.phic_no || '',
                hdmf_no: employee.hdmf_no || '',
                emergency_name: employee.emergency_name || '',
                emergency_contact_number: employee.emergency_contact_number || '',
                emergency_address: employee.emergency_address || '',
            });
            
            // Set image previews if available
            const previews: Record<string, string> = {};
            if (employee.image_person) previews.image_person = employee.image_person;
            if (employee.image_signature) previews.image_signature = employee.image_signature;
            if (employee.image_qrcode) previews.image_qrcode = employee.image_qrcode;
            setEditFilePreviews(previews);
        }
    }, [employee]);

    const closeModal = () => {
        onClose();
        setTimeout(() => {
            setEditFormData({
                employee_firstname: '',
                employee_middlename: '',
                employee_lastname: '',
                employee_name_extension: '',
                businessunit_id: '',
                employment_status: 'Active',
                position: '',
                birthday: '',
                address: '',
                id_status: 'printed',
                tin_no: '',
                sss_no: '',
                phic_no: '',
                hdmf_no: '',
                emergency_name: '',
                emergency_contact_number: '',
                emergency_address: '',
            });
            setEditFiles({});
            setEditFilePreviews({});
            setErrors({});
        }, 200);
    };

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error for this field when user types
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const { name, files } = e.target;
            const file = files[0];
            
            // Save the file for upload
            setEditFiles(prev => ({
                ...prev,
                [name]: file
            }));
            
            // Create and display preview
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setEditFilePreviews(prev => ({
                        ...prev,
                        [name]: event.target!.result as string
                    }));
                }
            };
            reader.readAsDataURL(file);
            
            // Clear error for this field
            if (errors[name]) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[name];
                    return newErrors;
                });
            }
        }
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isEditing || !employee) return;
        
        // Debug log
        console.log('Starting employee update submission:', employee.uuid);
        console.log('Updating employee data:', editFormData);
        console.log('Updating employee files:', editFiles);
        
        setIsEditing(true);
        
        // Create FormData for the update
        const formData = new FormData();
        
        // Add _method field for Laravel to handle PUT requests
        formData.append('_method', 'PUT');
        
        // Add all employee text fields
        Object.entries(editFormData).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                formData.append(key, value.toString());
            }
        });
        
        // Add all employee files
        Object.entries(editFiles).forEach(([key, file]) => {
            formData.append(key, file);
        });
        
        // Use the correct route and ensure it's working by using the correct parameter
        console.log('Employee UUID for update:', employee.uuid);
        
        // Use a timeout to ensure this function completes before the form is being submitted
        setTimeout(() => {
            router.post(`/employee/${employee.uuid}`, formData, {
                onSuccess: (response) => {
                    console.log('Update success response:', response);
                    setIsEditing(false);
                    closeModal();
                    
                    if (onSuccess) {
                        onSuccess();
                    } else {
                        // Default behavior - reload the page
                        router.reload();
                    }
                },
                onError: (errors) => {
                    console.error('Error response from update:', errors);
                    setIsEditing(false);
                    setErrors(errors);
                },
                onFinish: () => {
                    console.log('Update request finished');
                    setIsEditing(false);
                }
            });
        }, 100);
    };

    if (!employee) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                closeModal();
            }
        }}>
            <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Employee: {employee.employee_firstname} {employee.employee_lastname}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleEditSubmit} className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Left Side - Images */}
                        <div className="md:w-1/3 space-y-6">
                            <div>
                                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                                    Images & Documents
                                </h4>
                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="edit_image_person" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Profile Photo
                                        </label>
                                        <div className="mt-2 flex flex-col items-center">
                                            {editFilePreviews.image_person ? (
                                                <img 
                                                    src={editFilePreviews.image_person.startsWith('data:') 
                                                        ? editFilePreviews.image_person 
                                                        : route('network.image', {
                                                            folder: 'employee',
                                                            filename: editFilePreviews.image_person
                                                        })} 
                                                    alt="Profile preview" 
                                                    className="h-40 w-40 object-cover rounded-md border border-gray-300 dark:border-gray-600"
                                                    onError={(e) => {
                                                        e.currentTarget.onerror = null;
                                                        e.currentTarget.src = route('employee.placeholder-image');
                                                    }}
                                                />
                                            ) : (
                                                <div className="h-40 w-40 bg-gray-100 dark:bg-gray-800 rounded-md border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">No photo</span>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                name="image_person"
                                                id="edit_image_person"
                                                accept="image/*"
                                                onChange={handleEditFileChange}
                                                className="mt-3 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 dark:text-gray-400"
                                            />
                                            {errors.image_person && (
                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.image_person}</p>
                                            )}
                                            {/* Store original network path */}
                                            {employee.image_person && (
                                                <input type="hidden" name="original_image_person" value={employee.image_person} />
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="edit_image_signature" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Signature
                                        </label>
                                        <div className="mt-2 flex flex-col items-center">
                                            {editFilePreviews.image_signature ? (
                                                <img 
                                                    src={editFilePreviews.image_signature.startsWith('data:') 
                                                        ? editFilePreviews.image_signature 
                                                        : route('network.image', {
                                                            folder: 'signature',
                                                            filename: editFilePreviews.image_signature
                                                        })} 
                                                    alt="Signature preview" 
                                                    className="h-24 w-40 object-contain rounded-md border border-gray-300 dark:border-gray-600"
                                                    onError={(e) => {
                                                        e.currentTarget.onerror = null;
                                                        e.currentTarget.src = route('employee.placeholder-image');
                                                    }}
                                                />
                                            ) : (
                                                <div className="h-24 w-40 bg-gray-100 dark:bg-gray-800 rounded-md border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">No signature</span>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                name="image_signature"
                                                id="edit_image_signature"
                                                accept="image/*"
                                                onChange={handleEditFileChange}
                                                className="mt-3 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 dark:text-gray-400"
                                            />
                                            {errors.image_signature && (
                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.image_signature}</p>
                                            )}
                                            {/* Store original network path */}
                                            {employee.image_signature && (
                                                <input type="hidden" name="original_image_signature" value={employee.image_signature} />
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="edit_image_qrcode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            QR Code
                                        </label>
                                        <div className="mt-2 flex flex-col items-center">
                                            {editFilePreviews.image_qrcode ? (
                                                <img 
                                                    src={editFilePreviews.image_qrcode.startsWith('data:') 
                                                        ? editFilePreviews.image_qrcode
                                                        : route('network.image', {
                                                            folder: 'qrcode',
                                                            filename: editFilePreviews.image_qrcode
                                                        })} 
                                                    alt="QR Code preview" 
                                                    className="h-40 w-40 object-contain rounded-md border border-gray-300 dark:border-gray-600"
                                                    onError={(e) => {
                                                        e.currentTarget.onerror = null;
                                                        e.currentTarget.src = route('employee.placeholder-image');
                                                    }}
                                                />
                                            ) : (
                                                <div className="h-40 w-40 bg-gray-100 dark:bg-gray-800 rounded-md border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">No QR code</span>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                name="image_qrcode"
                                                id="edit_image_qrcode"
                                                accept="image/*"
                                                onChange={handleEditFileChange}
                                                className="mt-3 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 dark:text-gray-400"
                                            />
                                            {errors.image_qrcode && (
                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.image_qrcode}</p>
                                            )}
                                            {/* Store original network path */}
                                            {employee.image_qrcode && (
                                                <input type="hidden" name="original_image_qrcode" value={employee.image_qrcode} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Right Side - Information */}
                        <div className="md:w-2/3 space-y-6">
                            <div>
                                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                                    Personal Information
                                </h4>
                                <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-4">
                                    <div>
                                        <label htmlFor="edit_employee_firstname" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            First Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="employee_firstname"
                                            id="edit_employee_firstname"
                                            value={editFormData.employee_firstname}
                                            onChange={handleEditInputChange}
                                            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm
                                                ${errors.employee_firstname 
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-700' 
                                                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700'
                                                } dark:bg-gray-800 dark:text-white`}
                                        />
                                        {errors.employee_firstname && (
                                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.employee_firstname}</p>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="edit_employee_lastname" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Last Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="employee_lastname"
                                            id="edit_employee_lastname"
                                            value={editFormData.employee_lastname}
                                            onChange={handleEditInputChange}
                                            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm
                                                ${errors.employee_lastname 
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-700' 
                                                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700'
                                                } dark:bg-gray-800 dark:text-white`}
                                        />
                                        {errors.employee_lastname && (
                                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.employee_lastname}</p>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="edit_employee_middlename" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Middle Name
                                        </label>
                                        <input
                                            type="text"
                                            name="employee_middlename"
                                            id="edit_employee_middlename"
                                            value={editFormData.employee_middlename}
                                            onChange={handleEditInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="edit_employee_name_extension" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Name Extension
                                        </label>
                                        <input
                                            type="text"
                                            name="employee_name_extension"
                                            id="edit_employee_name_extension"
                                            placeholder="Jr., Sr., III, etc."
                                            value={editFormData.employee_name_extension}
                                            onChange={handleEditInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="edit_birthday" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Birthday
                                        </label>
                                        <input
                                            type="date"
                                            name="birthday"
                                            id="edit_birthday"
                                            value={editFormData.birthday || ''}
                                            onChange={handleEditInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                    
                                    <div className="sm:col-span-2">
                                        <label htmlFor="edit_address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Address
                                        </label>
                                        <input
                                            type="text"
                                            name="address"
                                            id="edit_address"
                                            value={editFormData.address}
                                            onChange={handleEditInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                                    Employment Information
                                </h4>
                                <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-4">
                                    <div>
                                        <label htmlFor="edit_position" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Position *
                                        </label>
                                        <input
                                            type="text"
                                            name="position"
                                            id="edit_position"
                                            value={editFormData.position}
                                            onChange={handleEditInputChange}
                                            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm
                                                ${errors.position 
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-700' 
                                                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700'
                                                } dark:bg-gray-800 dark:text-white`}
                                        />
                                        {errors.position && (
                                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.position}</p>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="edit_businessunit_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Business Unit *
                                        </label>
                                        <select
                                            name="businessunit_id"
                                            id="edit_businessunit_id"
                                            value={editFormData.businessunit_id}
                                            onChange={handleEditInputChange}
                                            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm
                                                ${errors.businessunit_id 
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-700' 
                                                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700'
                                                } dark:bg-gray-800 dark:text-white`}
                                        >
                                            <option value="">Select Business Unit</option>
                                            {businessUnits.map(unit => (
                                                <option key={unit.id} value={unit.id.toString()}>
                                                    {unit.businessunit_name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.businessunit_id && (
                                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.businessunit_id}</p>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="edit_employment_status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Employment Status *
                                        </label>
                                        <select
                                            name="employment_status"
                                            id="edit_employment_status"
                                            value={editFormData.employment_status}
                                            onChange={handleEditInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="edit_id_status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            ID Status
                                        </label>
                                        <select
                                            name="id_status"
                                            id="edit_id_status"
                                            value={editFormData.id_status}
                                            onChange={handleEditInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        >
                                            <option value="">Select Status</option>
                                            <option value="pending">Pending</option>
                                            <option value="printed">Printed</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                                    Government IDs
                                </h4>
                                <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-4">
                                    <div>
                                        <label htmlFor="edit_tin_no" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            TIN Number
                                        </label>
                                        <input
                                            type="text"
                                            name="tin_no"
                                            id="edit_tin_no"
                                            value={editFormData.tin_no}
                                            onChange={handleEditInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="edit_sss_no" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            SSS Number
                                        </label>
                                        <input
                                            type="text"
                                            name="sss_no"
                                            id="edit_sss_no"
                                            value={editFormData.sss_no}
                                            onChange={handleEditInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="edit_phic_no" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            PhilHealth Number
                                        </label>
                                        <input
                                            type="text"
                                            name="phic_no"
                                            id="edit_phic_no"
                                            value={editFormData.phic_no}
                                            onChange={handleEditInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="edit_hdmf_no" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            HDMF Number
                                        </label>
                                        <input
                                            type="text"
                                            name="hdmf_no"
                                            id="edit_hdmf_no"
                                            value={editFormData.hdmf_no}
                                            onChange={handleEditInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                                    Emergency Contact
                                </h4>
                                <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-4">
                                    <div>
                                        <label htmlFor="edit_emergency_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Contact Name
                                        </label>
                                        <input
                                            type="text"
                                            name="emergency_name"
                                            id="edit_emergency_name"
                                            value={editFormData.emergency_name}
                                            onChange={handleEditInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="edit_emergency_contact_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Contact Number
                                        </label>
                                        <input
                                            type="text"
                                            name="emergency_contact_number"
                                            id="edit_emergency_contact_number"
                                            value={editFormData.emergency_contact_number}
                                            onChange={handleEditInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                    
                                    <div className="sm:col-span-2">
                                        <label htmlFor="edit_emergency_address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Contact Address
                                        </label>
                                        <input
                                            type="text"
                                            name="emergency_address"
                                            id="edit_emergency_address"
                                            value={editFormData.emergency_address}
                                            onChange={handleEditInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <button
                            type="button"
                            disabled={isEditing}
                            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={closeModal}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isEditing}
                            className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-700 dark:hover:bg-indigo-800"
                        >
                            {isEditing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EmployeeEditModal;
