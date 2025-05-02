import { useState } from 'react';
import { router } from '@inertiajs/react';
import { X } from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog';

interface EmployeeAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    businessUnits: Array<{id: number, businessunit_name: string}>;
    onSuccess?: () => void;
}

const EmployeeAddModal: React.FC<EmployeeAddModalProps> = ({
    isOpen,
    onClose,
    businessUnits,
    onSuccess
}) => {
    const [newEmployee, setNewEmployee] = useState({
        employee_firstname: '',
        employee_middlename: '',
        employee_lastname: '',
        employee_name_extension: '',
        businessunit_id: '',
        employment_status: 'Active',
        position: '',
        birthday: '',
        address: '',
        id_status: 'pending',
        tin_no: '',
        sss_no: '',
        phic_no: '',
        hdmf_no: '',
        emergency_name: '',
        emergency_contact_number: '',
        emergency_address: '',
    });
    
    const [employeeFiles, setEmployeeFiles] = useState<Record<string, File>>({});
    const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewEmployee(prev => ({
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const { name, files } = e.target;
            const file = files[0];
            
            // Save the file for upload
            setEmployeeFiles(prev => ({
                ...prev,
                [name]: file
            }));
            
            // Create and display preview
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setFilePreviews(prev => ({
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

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isSubmitting) return;
        
        // Debug the data being sent
        console.log('Sending employee data:', newEmployee);
        console.log('Sending employee files:', employeeFiles);
        
        setIsSubmitting(true);
        
        // Create FormData to handle both text fields and file uploads
        const formData = new FormData();
        
        // Add all employee text fields
        Object.entries(newEmployee).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                formData.append(key, value.toString());
            }
        });
        
        // Add all employee files
        Object.entries(employeeFiles).forEach(([key, file]) => {
            formData.append(key, file);
        });
        
        router.post(route('employee.store'), formData, {
            onSuccess: (response) => {
                console.log('Success response:', response);
                setIsSubmitting(false);
                resetForm();
                if (onSuccess) {
                    onSuccess();
                }
            },
            onError: (errors) => {
                console.error('Error response:', errors);
                setIsSubmitting(false);
                setErrors(errors);
            }
        });
    };
    
    const resetForm = () => {
        setNewEmployee({
            employee_firstname: '',
            employee_middlename: '',
            employee_lastname: '',
            employee_name_extension: '',
            businessunit_id: '',
            employment_status: 'Active',
            position: '',
            birthday: '',
            address: '',
            id_status: 'pending',
            tin_no: '',
            sss_no: '',
            phic_no: '',
            hdmf_no: '',
            emergency_name: '',
            emergency_contact_number: '',
            emergency_address: '',
        });
        setEmployeeFiles({});
        setFilePreviews({});
        setErrors({});
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                onClose();
                // Reset form with a slight delay to avoid visual glitches
                setTimeout(resetForm, 200);
            }
        }}>
            <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Employee</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleAddSubmit} className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Left Side - Images */}
                        <div className="md:w-1/3 space-y-6">
                            <div>
                                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                                    Images & Documents
                                </h4>
                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="image_person" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Profile Photo
                                        </label>
                                        <div className="mt-2 flex flex-col items-center">
                                            {filePreviews.image_person ? (
                                                <img 
                                                    src={filePreviews.image_person} 
                                                    alt="Profile preview" 
                                                    className="h-40 w-40 object-cover rounded-md border border-gray-300 dark:border-gray-600"
                                                />
                                            ) : (
                                                <div className="h-40 w-40 bg-gray-100 dark:bg-gray-800 rounded-md border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">No photo</span>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                name="image_person"
                                                id="image_person"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="mt-3 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 dark:text-gray-400"
                                            />
                                            {errors.image_person && (
                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.image_person}</p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="image_signature" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Signature
                                        </label>
                                        <div className="mt-2 flex flex-col items-center">
                                            {filePreviews.image_signature ? (
                                                <img 
                                                    src={filePreviews.image_signature} 
                                                    alt="Signature preview" 
                                                    className="h-24 w-40 object-contain rounded-md border border-gray-300 dark:border-gray-600"
                                                />
                                            ) : (
                                                <div className="h-24 w-40 bg-gray-100 dark:bg-gray-800 rounded-md border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">No signature</span>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                name="image_signature"
                                                id="image_signature"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="mt-3 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 dark:text-gray-400"
                                            />
                                            {errors.image_signature && (
                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.image_signature}</p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="image_qrcode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            QR Code
                                        </label>
                                        <div className="mt-2 flex flex-col items-center">
                                            {filePreviews.image_qrcode ? (
                                                <img 
                                                    src={filePreviews.image_qrcode} 
                                                    alt="QR Code preview" 
                                                    className="h-40 w-40 object-contain rounded-md border border-gray-300 dark:border-gray-600"
                                                />
                                            ) : (
                                                <div className="h-40 w-40 bg-gray-100 dark:bg-gray-800 rounded-md border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">No QR code</span>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                name="image_qrcode"
                                                id="image_qrcode"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="mt-3 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 dark:text-gray-400"
                                            />
                                            {errors.image_qrcode && (
                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.image_qrcode}</p>
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
                                        <label htmlFor="employee_firstname" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            First Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="employee_firstname"
                                            id="employee_firstname"
                                            value={newEmployee.employee_firstname}
                                            onChange={handleInputChange}
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
                                        <label htmlFor="employee_lastname" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Last Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="employee_lastname"
                                            id="employee_lastname"
                                            value={newEmployee.employee_lastname}
                                            onChange={handleInputChange}
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
                                        <label htmlFor="employee_middlename" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Middle Name
                                        </label>
                                        <input
                                            type="text"
                                            name="employee_middlename"
                                            id="employee_middlename"
                                            value={newEmployee.employee_middlename}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="employee_name_extension" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Name Extension
                                        </label>
                                        <input
                                            type="text"
                                            name="employee_name_extension"
                                            id="employee_name_extension"
                                            placeholder="Jr., Sr., III, etc."
                                            value={newEmployee.employee_name_extension}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="birthday" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Birthday
                                        </label>
                                        <input
                                            type="date"
                                            name="birthday"
                                            id="birthday"
                                            value={newEmployee.birthday || ''}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                    
                                    <div className="sm:col-span-2">
                                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Address
                                        </label>
                                        <input
                                            type="text"
                                            name="address"
                                            id="address"
                                            value={newEmployee.address || ''}
                                            onChange={handleInputChange}
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
                                        <label htmlFor="position" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Position *
                                        </label>
                                        <input
                                            type="text"
                                            name="position"
                                            id="position"
                                            value={newEmployee.position}
                                            onChange={handleInputChange}
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
                                        <label htmlFor="businessunit_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Business Unit *
                                        </label>
                                        <select
                                            name="businessunit_id"
                                            id="businessunit_id"
                                            value={newEmployee.businessunit_id}
                                            onChange={handleInputChange}
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
                                        <label htmlFor="employment_status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Employment Status *
                                        </label>
                                        <select
                                            name="employment_status"
                                            id="employment_status"
                                            value={newEmployee.employment_status}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="id_status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            ID Status
                                        </label>
                                        <select
                                            name="id_status"
                                            id="id_status"
                                            value={newEmployee.id_status || ''}
                                            onChange={handleInputChange}
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
                                        <label htmlFor="tin_no" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            TIN Number
                                        </label>
                                        <input
                                            type="text"
                                            name="tin_no"
                                            id="tin_no"
                                            value={newEmployee.tin_no || ''}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="sss_no" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            SSS Number
                                        </label>
                                        <input
                                            type="text"
                                            name="sss_no"
                                            id="sss_no"
                                            value={newEmployee.sss_no || ''}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="phic_no" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            PhilHealth Number
                                        </label>
                                        <input
                                            type="text"
                                            name="phic_no"
                                            id="phic_no"
                                            value={newEmployee.phic_no || ''}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="hdmf_no" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Pag-IBIG Number
                                        </label>
                                        <input
                                            type="text"
                                            name="hdmf_no"
                                            id="hdmf_no"
                                            value={newEmployee.hdmf_no || ''}
                                            onChange={handleInputChange}
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
                                        <label htmlFor="emergency_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Contact Name
                                        </label>
                                        <input
                                            type="text"
                                            name="emergency_name"
                                            id="emergency_name"
                                            value={newEmployee.emergency_name || ''}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="emergency_contact_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Contact Number
                                        </label>
                                        <input
                                            type="text"
                                            name="emergency_contact_number"
                                            id="emergency_contact_number"
                                            value={newEmployee.emergency_contact_number || ''}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                    
                                    <div className="sm:col-span-2">
                                        <label htmlFor="emergency_address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Contact Address
                                        </label>
                                        <input
                                            type="text"
                                            name="emergency_address"
                                            id="emergency_address"
                                            value={newEmployee.emergency_address || ''}
                                            onChange={handleInputChange}
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
                            disabled={isSubmitting}
                            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={resetForm}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-700 dark:hover:bg-indigo-800"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                'Add Employee'
                            )}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EmployeeAddModal;
