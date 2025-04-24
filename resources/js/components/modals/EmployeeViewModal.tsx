import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CreditCard, XCircle } from 'lucide-react';
import { router } from '@inertiajs/react';

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

interface EmployeeViewModalProps {
    isOpen: boolean;
    employee: Employee | null;
    onClose: () => void;
    showEditButton?: boolean;
    onEdit?: (employee: Employee) => void; // Add this new prop for edit functionality
}

// Helper function to generate consistent colors based on name
const getAvatarColor = (name: string): string => {
    if (!name) return "bg-gray-500";
    
    // Generate a simple hash from the name
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // List of tailwind color classes
    const colors = [
        "bg-blue-600", "bg-indigo-600", "bg-purple-600", 
        "bg-pink-600", "bg-red-600", "bg-orange-600",
        "bg-amber-600", "bg-yellow-600", "bg-lime-600", 
        "bg-green-600", "bg-emerald-600", "bg-teal-600", 
        "bg-cyan-600", "bg-sky-600"
    ];
    
    // Return a color based on the hash
    return colors[hash % colors.length];
};

const EmployeeViewModal: React.FC<EmployeeViewModalProps> = ({ 
    isOpen, 
    employee, 
    onClose,
    showEditButton = false,
    onEdit // Add this new prop
}) => {
    if (!employee) return null;
    
    // Function to handle edit button click
    const handleEdit = () => {
        onClose();
        if (onEdit) {
            onEdit(employee);
        } else {
            // Fallback to direct router navigation if no onEdit callback is provided
            router.visit(route('employee.edit', employee.uuid));
        }
    };
    
    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-5 transition-opacity dark:bg-gray-900 dark:bg-opacity-5" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all dark:bg-gray-800 sm:my-8 sm:w-full sm:max-w-xl sm:p-6">
                                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                    <button
                                        type="button"
                                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none dark:bg-gray-800 dark:text-gray-500 dark:hover:text-gray-400"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Close</span>
                                        <XCircle className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>

                                <div className="sm:flex sm:items-start">
                                    <div className="text-center sm:mt-0 sm:text-left w-full">
                                        <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 dark:text-white mb-4 flex items-center justify-between">
                                            Employee Details
                                        </Dialog.Title>
                                        
                                        <div className="flex items-start mb-6">
                                            <div className="flex-shrink-0 mr-4">
                                                {employee.image_person ? (
                                                    <img
                                                        src={employee.image_person.startsWith('data:') 
                                                            ? employee.image_person 
                                                            : route('network.image', {
                                                                folder: 'employee',
                                                                filename: employee.image_person
                                                            })}
                                                        alt={`${employee.employee_firstname} ${employee.employee_lastname}`}
                                                        className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            const parent = e.currentTarget.parentElement;
                                                            if (parent) {
                                                                const nameInitials = document.createElement('div');
                                                                nameInitials.className = `h-24 w-24 rounded-full flex items-center justify-center text-white font-medium text-xl ${getAvatarColor(employee.employee_lastname)}`;
                                                                nameInitials.textContent = `${employee.employee_firstname[0]}${employee.employee_lastname[0]}`;
                                                                parent.appendChild(nameInitials);
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <div className={`h-24 w-24 rounded-full flex items-center justify-center text-white font-medium text-xl ${getAvatarColor(employee.employee_lastname)}`}>
                                                        {employee.employee_firstname[0]}{employee.employee_lastname[0]}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex-1">
                                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {employee.employee_lastname}, {employee.employee_firstname} {employee.employee_middlename ? employee.employee_middlename[0] + '.' : ''} {employee.employee_name_extension}
                                                </h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-300">{employee.position}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">ID No: {employee.id_no}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Business Unit: {employee.businessunit_name}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Status: <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        employee.employment_status.toLowerCase() === 'active' 
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                                    }`}>{employee.employment_status}</span>
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    ID Status: <span className={`font-medium ${
                                                        employee.id_status === 'pending' 
                                                        ? 'text-amber-600 dark:text-amber-400' 
                                                        : 'text-green-600 dark:text-green-400'
                                                    }`}>
                                                        {employee.id_status ? employee.id_status.charAt(0).toUpperCase() + employee.id_status.slice(1) : 'Not Set'}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Personal Information */}
                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                                            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                                                Personal Information
                                            </h4>
                                            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                                <div className="sm:col-span-1">
                                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Birthday</dt>
                                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                                        {employee.birthday ? 
                                                            new Date(employee.birthday).toLocaleDateString() : 
                                                            'Not specified'}
                                                    </dd>
                                                </div>
                                                
                                                <div className="sm:col-span-2">
                                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</dt>
                                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                                        {employee.address || 'Not specified'}
                                                    </dd>
                                                </div>
                                            </dl>
                                        </div>
                                        
                                        {/* Government IDs */}
                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                                            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                                                Government IDs
                                            </h4>
                                            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                                <div className="sm:col-span-1">
                                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">TIN Number</dt>
                                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                                        {employee.tin_no || 'Not specified'}
                                                    </dd>
                                                </div>
                                                
                                                <div className="sm:col-span-1">
                                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">SSS Number</dt>
                                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                                        {employee.sss_no || 'Not specified'}
                                                    </dd>
                                                </div>
                                                
                                                <div className="sm:col-span-1">
                                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">PhilHealth Number</dt>
                                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                                        {employee.phic_no || 'Not specified'}
                                                    </dd>
                                                </div>
                                                
                                                <div className="sm:col-span-1">
                                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Pag-IBIG Number</dt>
                                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                                        {employee.hdmf_no || 'Not specified'}
                                                    </dd>
                                                </div>
                                            </dl>
                                        </div>
                                        
                                        {/* Emergency Contact */}
                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                                            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                                                Emergency Contact
                                            </h4>
                                            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                                <div className="sm:col-span-1">
                                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Name</dt>
                                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                                        {employee.emergency_name || 'Not specified'}
                                                    </dd>
                                                </div>
                                                
                                                <div className="sm:col-span-1">
                                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Number</dt>
                                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                                        {employee.emergency_contact_number || 'Not specified'}
                                                    </dd>
                                                </div>
                                                
                                                <div className="sm:col-span-2">
                                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Address</dt>
                                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                                        {employee.emergency_address || 'Not specified'}
                                                    </dd>
                                                </div>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                    {showEditButton && (
                                        <button
                                            type="button"
                                            className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                                            onClick={handleEdit} // Use our new handler
                                        >
                                            Edit Employee
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 sm:ml-3 sm:w-auto"
                                        onClick={() => {
                                            onClose();
                                            router.visit(route('employee.id-preview', employee.uuid));
                                        }}
                                    >
                                        <CreditCard className="h-4 w-4 mr-2" /> {employee.id_status === 'pending' ? 'Generate' : 'View'} ID Card
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600"
                                        onClick={onClose}
                                    >
                                        Close
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

export default EmployeeViewModal;
