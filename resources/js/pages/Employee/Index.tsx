import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { Table } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { Search, Plus, Edit, Trash, UserCircle, Eye } from 'lucide-react';
import { add, debounce } from 'lodash';
import { ChevronUp, ChevronDown } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employee List',
        href: '/employee',
    },
];

// Update your Employee interface to include the image_person field
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

interface PageMeta {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
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

export default function Employee({ 
    employees = [], 
    meta = null, 
    filters = {},
    businessUnits = [] 
}: { 
    employees?: Employee[], 
    meta?: PageMeta | null,
    filters?: {
        search?: string;
        businessunit_id?: string;
        page?: number;
        per_page?: number;
    },
    businessUnits?: Array<{id: number, businessunit_name: string}>
}) {
    const [loading, setLoading] = useState(true);
    const [employeesData, setEmployeesData] = useState<Employee[]>(employees);
    const [currentPage, setCurrentPage] = useState(meta?.current_page || 1);
    const [lastPage, setLastPage] = useState(meta?.last_page || 1);
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [selectedEmployees, setSelectedEmployees] = useState<Record<number, boolean>>({});
    const [selectAll, setSelectAll] = useState(false);
    const [sortField, setSortField] = useState<string>('employee_lastname');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [businessUnitFilter, setBusinessUnitFilter] = useState(filters?.businessunit_id || '');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [employeeToView, setEmployeeToView] = useState<Employee | null>(null);

    const [addModalOpen, setAddModalOpen] = useState(false);
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
        id_status: 'printed',
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

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
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

    // Compute selected employee count
    const selectedEmployeeCount = Object.values(selectedEmployees).filter(Boolean).length;

    // Get the selected employee UUIDs
    const getSelectedEmployeeUuids = () => {
        return Object.entries(selectedEmployees)
            .filter(([_, isSelected]) => isSelected)
            .map(([uuid]) => uuid);
    };

    // Functions for bulk delete
    const openBulkDeleteModal = () => {
        setBulkDeleteModalOpen(true);
    };

    const closeBulkDeleteModal = () => {
        setBulkDeleteModalOpen(false);
    };

    const confirmBulkDelete = () => {
        if (selectedEmployeeCount > 0 && !isBulkDeleting) {
            setIsBulkDeleting(true);
            
            // Get selected employee UUIDs
            const employeeUuids = getSelectedEmployeeUuids();
            
            // Send delete request
            router.post(route('employee.bulk-destroy'), { uuids: employeeUuids }, {
                onSuccess: () => {
                    setLoading(false);
                    setIsBulkDeleting(false);
                    setSuccessMessage(`Successfully deleted ${selectedEmployeeCount} employees`);
                    closeBulkDeleteModal();
                    
                    // Clear selections
                    setSelectedEmployees({});
                    setSelectAll(false);
                    
                    setTimeout(() => {
                        setSuccessMessage(null);
                    }, 3000);
                },
                onError: () => {
                    setLoading(false);
                    setIsBulkDeleting(false);
                    closeBulkDeleteModal();
                }
            });
        }
    };
    
    useEffect(() => {
        console.log('Received employees:', employees);
        console.log('Received meta:', meta);
        console.log('Received filters:', filters);
        
        setEmployeesData(Array.isArray(employees) ? employees : []);
        setLoading(false);
        if (meta) {
            setCurrentPage(meta.current_page);
            setLastPage(meta.last_page);
        }
    }, [employees, meta, filters]);
    
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        setLoading(true);
        
        router.get(route('employee.index', { 
            page, 
            search: searchQuery,
            businessunit_id: businessUnitFilter,
            sort_by: sortField,
            sort_direction: sortOrder
        }), {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => setLoading(false),
        });
    };
    
    const debouncedSearch = debounce((query: string) => {
        setCurrentPage(1);
        setLoading(true);
        
        router.get(route('employee.index', { 
            search: query, 
            page: 1,
            businessunit_id: businessUnitFilter,
            sort_by: sortField,
            sort_direction: sortOrder
        }), {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => setLoading(false),
        });
    }, 500);
    
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        
        debouncedSearch(query);
    };

    const handleBusinessUnitFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setBusinessUnitFilter(value);
        setCurrentPage(1);
        setLoading(true);
        
        router.get(route('employee.index', { 
            page: 1, 
            search: searchQuery,
            businessunit_id: value,
            sort_by: sortField,
            sort_direction: sortOrder
        }), {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => setLoading(false),
        });
    };

    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, []);

    const handleSelectAll = () => {
        const newSelectAll = !selectAll;
        setSelectAll(newSelectAll);
        
        const newSelectedEmployees: Record<number, boolean> = {};
        employeesData.forEach(employee => {
            newSelectedEmployees[employee.uuid] = newSelectAll;
        });
        
        setSelectedEmployees(newSelectedEmployees);
    };
    
    const handleSelectEmployee = (uuid: number) => {
        const newSelectedEmployees = {
            ...selectedEmployees,
            [uuid]: !selectedEmployees[uuid]
        };
        
        setSelectedEmployees(newSelectedEmployees);
        
        const allSelected = employeesData.every(employee => newSelectedEmployees[employee.uuid]);
        setSelectAll(allSelected);
    };

    // lastname header sorter
    const handleSort = (field: string) => {
        const newDirection = field === sortField && sortOrder === 'asc' ? 'desc' : 'asc';
        
        setSortField(field);
        setSortOrder(newDirection);
        
        setLoading(true);
        router.get(route('employee.index', { 
            page: currentPage, 
            search: searchQuery,
            businessunit_id: businessUnitFilter,
            sort_by: field,
            sort_direction: newDirection
        }), {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => setLoading(false),
        });
    };

    //delete modal
    const openDeleteModal = (employee: Employee) => {
        setEmployeeToDelete(employee);
        setDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
        setTimeout(() => {
            setEmployeeToDelete(null);
        }, 200);
    };

    const confirmDelete = () => {
        if (employeeToDelete && !isDeleting) {
            setIsDeleting(true);
            
            router.delete(route('employee.destroy', employeeToDelete.uuid), {
                onSuccess: () => {
                    setLoading(false);
                    setIsDeleting(false);
                    setSuccessMessage(`Successfully deleted ${employeeToDelete.employee_firstname} ${employeeToDelete.employee_lastname}`);
                    closeDeleteModal();

                    setTimeout(() => {
                        setSuccessMessage(null);
                    }, 3000);
                },
                onError: () => {
                    setLoading(false);
                    setIsDeleting(false);
                    closeDeleteModal();
                }
            });
        }
    };

    const openViewModal = (employee: Employee) => {
        // Format birthday the same way as in the edit modal
        const formattedEmployee = {
            ...employee,
            // Format birthday for display if it exists
            birthday: employee.birthday 
                ? new Date(employee.birthday).toISOString().split('T')[0]
                : ''
        };
        
        console.log("Opening view modal for employee:", formattedEmployee);
        setEmployeeToView(formattedEmployee);
        setViewModalOpen(true);
    };

    const closeViewModal = () => {
        setViewModalOpen(false);
        setTimeout(() => {
            setEmployeeToView(null);
        }, 200);
    };

    const openAddModal = () => {
        setAddModalOpen(true);
    };

    const closeAddModal = () => {
        setAddModalOpen(false);
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
            id_status: 'printed',
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
    };
    
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
            if (value !== null && value !== undefined) {
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
                closeAddModal();
                setSuccessMessage(`Employee ${newEmployee.employee_firstname} ${newEmployee.employee_lastname} added successfully`);
                
                // Refresh the employee list
                setLoading(true);
                router.get(route('employee.index'), {
                    page: currentPage,
                    search: searchQuery,
                    businessunit_id: businessUnitFilter,
                    sort_by: sortField,
                    sort_direction: sortOrder
                }, {
                    only: ['employees', 'meta'],
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => setLoading(false)
                });
                
                setTimeout(() => {
                    setSuccessMessage(null);
                }, 3000);
            },
            onError: (errors) => {
                console.error('Error response:', errors);
                setIsSubmitting(false);
                setErrors(errors);
            }
        });
    };

    const openEditModal = (employee: Employee) => {
        setEmployeeToEdit(employee);
        
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
        
        setEditModalOpen(true);
    };

    const closeEditModal = () => {
        setEditModalOpen(false);
        setTimeout(() => {
            setEmployeeToEdit(null);
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
        
        if (isEditing || !employeeToEdit) return;
        
        // Debug log
        console.log('Starting employee update submission:', employeeToEdit.uuid);
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
        console.log('Employee UUID for update:', employeeToEdit.uuid);
        
        // Use a timeout to ensure this function completes before the form is being submitted
        setTimeout(() => {
            router.post(`/employee/${employeeToEdit.uuid}`, formData, {
                onSuccess: (response) => {
                    console.log('Update success response:', response);
                    setIsEditing(false);
                    closeEditModal();
                    setSuccessMessage(`Employee ${editFormData.employee_firstname} ${editFormData.employee_lastname} updated successfully`);
                    
                    // Refresh the employee list
                    setLoading(true);
                    router.reload(); // Force a full page reload to ensure fresh data
                },
                onError: (errors) => {
                    console.error('Error response from update:', errors);
                    setIsEditing(false);
                    setErrors(errors);
                    alert('Failed to update employee. Check the console for details.'); // Add an alert for immediate feedback
                },
                onFinish: () => {
                    console.log('Update request finished');
                    setIsEditing(false);
                }
            });
        }, 100);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employee List" />
            
            <div className="px-4 sm:px-6 lg:px-8 mt-3">
                <div className="sm:flex sm:items-center">
                    <div className="sm:flex-auto">
                        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">List of All Employees</h1>
                        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                            A list of all employees including their employee id number, name, email, position, business unit and other status.
                        </p>
                    </div>

                    <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                        <button
                            type="button"
                            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-transparent bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:w-auto dark:bg-white dark:text-black dark:hover:bg-gray-200 dark:focus:ring-gray-400"
                            onClick={openAddModal}
                        >
                            <Plus className="h-4 w-4" /> Add Employee
                        </button>
                    </div>
                </div>
                
                <div className="mt-5 flex flex-wrap gap-4 items-center">
                    <div className="max-w-md flex-1">
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
                                placeholder="Search employees..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                        </div>
                    </div>
                    
                    <div className="min-w-[200px]">
                        <select
                            value={businessUnitFilter}
                            onChange={handleBusinessUnitFilterChange}
                            className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                        >
                            <option value="">All Business Units</option>
                            {businessUnits.map(unit => (
                                <option key={unit.id} value={unit.id.toString()}>
                                    {unit.businessunit_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="ml-auto">
                        {selectedEmployeeCount >= 2 && (
                            <div className="flex items-center space-x-2">
                                <button
                                    type="button"
                                    onClick={openBulkDeleteModal}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-800"
                                >
                                    <span className="text-sm dark:text-gray-300 mr-1.5">
                                        {selectedEmployeeCount}
                                    </span>
                                    <Trash className="h-4 w-4 mr-1.5" />
                                    Delete Selected
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 flex flex-col">
                    <Table.Root className='uppercase'>
                        <Table.Header>
                            <tr>
                                <Table.Cell header className="w-16">
                                    <div className="flex justify-center">
                                        <input 
                                            type="checkbox" 
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
                                            checked={selectAll}
                                            onChange={handleSelectAll}
                                            title="Select All"
                                        />
                                    </div>
                                </Table.Cell>
                                <Table.Cell header className="text-center">
                                    <div className='cursor-pointer flex justify-center items-center' onClick={() => handleSort('id_no')}>
                                        <span>ID No.</span>
                                        <span className="ml-1 flex-shrink-0 w-4">
                                            {sortField === 'id_no' && (
                                                sortOrder === 'asc' 
                                                    ? <ChevronUp className="h-4 w-4" /> 
                                                    : <ChevronDown className="h-4 w-4" />
                                            )}
                                        </span>
                                    </div>
                                </Table.Cell>
                                <Table.Cell header>
                                    <div className='cursor-pointer flex justify-center items-center' onClick={() => handleSort('employee_lastname')}>
                                        <span>Fullname</span>
                                        <span className="ml-1 flex-shrink-0 w-4">
                                            {sortField === 'employee_lastname' && (
                                                sortOrder === 'asc' 
                                                    ? <ChevronUp className="h-4 w-4" /> 
                                                    : <ChevronDown className="h-4 w-4" />
                                            )}
                                        </span>
                                    </div>
                                </Table.Cell>
                                <Table.Cell header>
                                    <div className='cursor-pointer flex justify-center items-center' onClick={() => handleSort('businessunit_name')}>
                                        <span>Business Unit</span>
                                        <span className="ml-1 flex-shrink-0 w-4">
                                            {sortField === 'businessunit_name' && (
                                                sortOrder === 'asc' 
                                                    ? <ChevronUp className="h-4 w-4" /> 
                                                    : <ChevronDown className="h-4 w-4" />
                                            )}
                                        </span>
                                    </div>
                                </Table.Cell>
                                <Table.Cell header>
                                    <div className='cursor-pointer flex justify-center items-center' onClick={() => handleSort('position')}>
                                        <span>Position</span>
                                        <span className="ml-1 flex-shrink-0 w-4">
                                            {sortField === 'position' && (
                                                sortOrder === 'asc' 
                                                    ? <ChevronUp className="h-4 w-4" /> 
                                                    : <ChevronDown className="h-4 w-4" />
                                            )}
                                        </span>
                                    </div>
                                </Table.Cell>
                                <Table.Cell header>
                                    <div className='cursor-pointer flex justify-center items-center' onClick={() => handleSort('employment_status')}>
                                        <span>Employment Status</span>
                                        <span className="ml-1 flex-shrink-0 w-4">
                                            {sortField === 'employment_status' && (
                                                sortOrder === 'asc' 
                                                    ? <ChevronUp className="h-4 w-4" /> 
                                                    : <ChevronDown className="h-4 w-4" />
                                            )}
                                        </span>
                                    </div>
                                </Table.Cell>
                                <Table.Cell header>
                                    <div className='cursor-pointer flex justify-center items-center' onClick={() => handleSort('employee_id_counter')}>
                                        <span>Requested ID Counter</span>
                                        <span className="ml-1 flex-shrink-0 w-4">
                                            {sortField === 'employee_id_counter' && (
                                                sortOrder === 'asc' 
                                                    ? <ChevronUp className="h-4 w-4" /> 
                                                    : <ChevronDown className="h-4 w-4" />
                                            )}
                                        </span>
                                    </div>
                                </Table.Cell>
                                <Table.Cell header>
                                    <div className="text-center">Actions</div>
                                </Table.Cell>
                            </tr>
                        </Table.Header>
                        <Table.Body 
                            isLoading={loading} 
                            colSpan={8}
                            emptyMessage="No employees found"
                        >
                            {employeesData.map((employee) => (
                                <Table.Row key={employee.uuid}>
                                    <Table.Cell>
                                        <div className="flex h-5 items-center justify-center">
                                            <input 
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
                                                checked={!!selectedEmployees[employee.uuid]}
                                                onChange={() => handleSelectEmployee(employee.uuid)}
                                            />
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell className="text-center font-medium text-gray-900 dark:text-white">
                                        {employee.id_no}
                                    </Table.Cell>
                                    <Table.Cell className="text-center font-medium text-gray-900 dark:text-white">
                                        {employee.employee_lastname}, {employee.employee_firstname} {employee.employee_middlename?.[0]}. {employee.employee_name_extension}
                                    </Table.Cell>
                                    <Table.Cell className='text-center'>{employee.businessunit_name || employee.businessunit_id}</Table.Cell>
                                    <Table.Cell className='text-center'>{employee.position}</Table.Cell>
                                    <Table.Cell className='text-center'>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            employee.employment_status.toLowerCase() === 'active' 
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                        }`}>
                                            {employee.employment_status}
                                        </span>
                                    </Table.Cell>
                                    <Table.Cell className='text-center'>{employee.employee_id_counter}</Table.Cell>
                                    <Table.Cell className='text-center'>
                                        <div className="flex justify-center space-x-2">
                                            <button 
                                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                onClick={() => openViewModal(employee)}
                                            >
                                                <Eye className="h-4 w-4" />
                                                <span className="sr-only">View {employee.employee_firstname}</span>
                                            </button>
                                            <button 
                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                onClick={() => openEditModal(employee)}
                                            >
                                                <Edit className="h-4 w-4" />
                                                <span className="sr-only">Edit {employee.employee_firstname}</span>
                                            </button>
                                            <button 
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                onClick={() => openDeleteModal(employee)}
                                            >
                                                <Trash className="h-4 w-4" />
                                                <span className="sr-only">Delete {employee.employee_firstname}</span>
                                            </button>
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                    
                    {meta && (
                        <Pagination 
                            currentPage={currentPage}
                            lastPage={lastPage}
                            onPageChange={handlePageChange}
                            className="mt-5 mb-5"
                        />
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Transition.Root show={deleteModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeDeleteModal}>
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
                                enterTo="opacity-50 translate-y-0 sm:scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-50 translate-y-0 sm:scale-100"
                                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            >
                                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all dark:bg-gray-800 sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                                            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                                        </div>
                                        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                            <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                                                Delete Employee
                                            </Dialog.Title>
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-500 dark:text-gray-300">
                                                    Are you sure you want to delete <span className="font-bold text-red-600 dark:text-red-400">{employeeToDelete?.employee_firstname} {employeeToDelete?.employee_lastname}</span>? This action cannot be undone.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                        <button
                                            type="button"
                                            disabled={isDeleting}
                                            className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 dark:bg-red-700 dark:hover:bg-red-600 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={confirmDelete}
                                        >
                                            {isDeleting ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Deleting...
                                                </>
                                            ) : (
                                                'Delete'
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isDeleting}
                                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600 sm:mt-0 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={closeDeleteModal}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>

            {/* Bulk Delete Confirmation Modal */}
            <Transition.Root show={bulkDeleteModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeBulkDeleteModal}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 transition-opacity dark:bg-gray-900 dark:bg-opacity-5" />
                    </Transition.Child>

                    <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                enterTo="opacity-50 translate-y-0 sm:scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-50 translate-y-0 sm:scale-100"
                                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            >
                                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all dark:bg-gray-800 sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                                            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                                        </div>
                                        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                            <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                                                Bulk Delete Employees
                                            </Dialog.Title>
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-500 dark:text-gray-300">
                                                    Are you sure you want to delete <span className="font-bold text-red-600 dark:text-red-400">{selectedEmployeeCount}</span> selected employees? This action cannot be undone.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                        <button
                                            type="button"
                                            disabled={isBulkDeleting}
                                            className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 dark:bg-red-700 dark:hover:bg-red-600 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={confirmBulkDelete}
                                        >
                                            {isBulkDeleting ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Deleting...
                                                </>
                                            ) : (
                                                'Delete All Selected'
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isBulkDeleting}
                                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600 sm:mt-0 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={closeBulkDeleteModal}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>

            {/* View Employee Details Modal */}
            <Transition.Root show={viewModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeViewModal}>
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
                                            onClick={closeViewModal}
                                        >
                                            <span className="sr-only">Close</span>
                                            <XCircle className="h-6 w-6" aria-hidden="true" />
                                        </button>
                                    </div>
                                        {employeeToView && (
                                            <>
                                                <div className="sm:flex sm:items-start">
                                                    <div className="text-center sm:mt-0 sm:text-left w-full">
                                                        <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 dark:text-white mb-4 flex items-center justify-between">
                                                            Employee Details
                                                        </Dialog.Title>
                                                        
                                                        <div className="flex items-start mb-6">
                                                            <div className="flex-shrink-0 mr-4">
                                                                {employeeToView.image_person ? (
                                                                    <img
                                                                        src={employeeToView.image_person.startsWith('data:') 
                                                                            ? employeeToView.image_person 
                                                                            : route('network.image', {
                                                                                folder: 'employee',
                                                                                filename: employeeToView.image_person
                                                                            })}
                                                                        alt={`${employeeToView.employee_firstname} ${employeeToView.employee_lastname}`}
                                                                        className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
                                                                        onError={(e) => {
                                                                            e.currentTarget.style.display = 'none';
                                                                            const parent = e.currentTarget.parentElement;
                                                                            if (parent) {
                                                                                const nameInitials = document.createElement('div');
                                                                                nameInitials.className = `h-24 w-24 rounded-full flex items-center justify-center text-white font-medium text-xl ${getAvatarColor(employeeToView.employee_lastname)}`;
                                                                                nameInitials.textContent = `${employeeToView.employee_firstname[0]}${employeeToView.employee_lastname[0]}`;
                                                                                parent.appendChild(nameInitials);
                                                                            }
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className={`h-24 w-24 rounded-full flex items-center justify-center text-white font-medium text-xl ${getAvatarColor(employeeToView.employee_lastname)}`}>
                                                                        {employeeToView.employee_firstname[0]}{employeeToView.employee_lastname[0]}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            
                                                            <div className="flex-1">
                                                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                                    {employeeToView.employee_lastname}, {employeeToView.employee_firstname} {employeeToView.employee_middlename ? employeeToView.employee_middlename[0] + '.' : ''} {employeeToView.employee_name_extension}
                                                                </h4>
                                                                <p className="text-sm text-gray-600 dark:text-gray-300">{employeeToView.position}</p>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">ID No: {employeeToView.id_no}</p>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">Business Unit: {employeeToView.businessunit_name}</p>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Personal Information */}
                                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                                                            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                                                                Personal Information
                                                            </h4>
                                                            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                                                <div className="sm:col-span-1">
                                                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">First Name</dt>
                                                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{employeeToView.employee_firstname}</dd>
                                                                </div>
                                                                
                                                                <div className="sm:col-span-1">
                                                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Name</dt>
                                                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{employeeToView.employee_lastname}</dd>
                                                                </div>
                                                                
                                                                <div className="sm:col-span-1">
                                                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Middle Name</dt>
                                                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{employeeToView.employee_middlename || 'N/A'}</dd>
                                                                </div>
                                                                
                                                                <div className="sm:col-span-1">
                                                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Name Extension</dt>
                                                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{employeeToView.employee_name_extension || 'N/A'}</dd>
                                                                </div>
                                                                
                                                                <div className="sm:col-span-1">
                                                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Birthday</dt>
                                                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                                                        {employeeToView.birthday ? new Date(employeeToView.birthday).toLocaleDateString() : 'N/A'}
                                                                    </dd>
                                                                </div>
                                                                
                                                                <div className="sm:col-span-2">
                                                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</dt>
                                                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{employeeToView.address || 'N/A'}</dd>
                                                                </div>
                                                            </dl>
                                                        </div>
                                                        
                                                        {/* Employment Information */}
                                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                                                            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                                                                Employment Information
                                                            </h4>
                                                            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                                                <div className="sm:col-span-1">
                                                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Position</dt>
                                                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{employeeToView.position}</dd>
                                                                </div>
                                                                
                                                                <div className="sm:col-span-1">
                                                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Business Unit</dt>
                                                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{employeeToView.businessunit_name || `ID: ${employeeToView.businessunit_id}`}</dd>
                                                                </div>
                                                                
                                                                <div className="sm:col-span-1">
                                                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Employment Status</dt>
                                                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                            employeeToView.employment_status?.toLowerCase() === 'active' 
                                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                                                        }`}>
                                                                            {employeeToView.employment_status}
                                                                        </span>
                                                                    </dd>
                                                                </div>
                                                                
                                                                <div className="sm:col-span-1">
                                                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">ID Status</dt>
                                                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                                                        {employeeToView.id_status ? (
                                                                            employeeToView.id_status.charAt(0).toUpperCase() + employeeToView.id_status.slice(1)
                                                                        ) : 'N/A'}
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
                                                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{employeeToView.tin_no || 'N/A'}</dd>
                                                                </div>
                                                                
                                                                <div className="sm:col-span-1">
                                                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">SSS Number</dt>
                                                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{employeeToView.sss_no || 'N/A'}</dd>
                                                                </div>
                                                                
                                                                <div className="sm:col-span-1">
                                                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">PhilHealth Number</dt>
                                                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{employeeToView.phic_no || 'N/A'}</dd>
                                                                </div>
                                                                
                                                                <div className="sm:col-span-1">
                                                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Pag-IBIG Number</dt>
                                                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{employeeToView.hdmf_no || 'N/A'}</dd>
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
                                                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{employeeToView.emergency_name || 'N/A'}</dd>
                                                                </div>
                                                                
                                                                <div className="sm:col-span-1">
                                                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Number</dt>
                                                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{employeeToView.emergency_contact_number || 'N/A'}</dd>
                                                                </div>
                                                                
                                                                <div className="sm:col-span-2">
                                                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Address</dt>
                                                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{employeeToView.emergency_address || 'N/A'}</dd>
                                                                </div>
                                                            </dl>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                                    <button
                                                        type="button"
                                                        className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                                                        onClick={() => {
                                                            closeViewModal();
                                                            router.get(route('employee.edit', employeeToView.uuid));
                                                        }}
                                                    >
                                                        Edit Employee
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600"
                                                        onClick={closeViewModal}
                                                    >
                                                        Close
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>

            {/* Add Employee Modal */}
            <Transition.Root show={addModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeAddModal}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 transition-opacity" />
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
                                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all dark:bg-gray-800 sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                                    <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                        <button
                                            type="button"
                                            className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none dark:bg-gray-800 dark:text-gray-500 dark:hover:text-gray-400"
                                            onClick={closeAddModal}
                                        >
                                            <span className="sr-only">Close</span>
                                            <XCircle className="h-6 w-6" aria-hidden="true" />
                                        </button>
                                    </div>
                                    
                                    <div className="sm:flex sm:items-start">
                                        <div className="text-center sm:mt-0 sm:text-left w-full">
                                            <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 dark:text-white mb-4">
                                                Add New Employee
                                            </Dialog.Title>
                                            
                                            <form onSubmit={handleAddSubmit} className="space-y-6 overflow-y-auto max-h-[70vh]">
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
                                                
                                                <div>
                                                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                                                        Images & Documents
                                                    </h4>
                                                    <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-3 sm:gap-x-4">
                                                        <div>
                                                            <label htmlFor="image_person" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                Profile Photo
                                                            </label>
                                                            {filePreviews.image_person && (
                                                                <div className="mt-2 mb-2">
                                                                    <img 
                                                                        src={filePreviews.image_person} 
                                                                        alt="Profile preview" 
                                                                        className="h-20 w-20 object-cover rounded-md border border-gray-300 dark:border-gray-600"
                                                                    />
                                                                </div>
                                                            )}
                                                            <input
                                                                type="file"
                                                                name="image_person"
                                                                id="image_person"
                                                                accept="image/*"
                                                                onChange={handleFileChange}
                                                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 dark:text-gray-400"
                                                            />
                                                            {errors.image_person && (
                                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.image_person}</p>
                                                            )}
                                                        </div>
                                                        
                                                        <div>
                                                            <label htmlFor="image_signature" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                Signature
                                                            </label>
                                                            {filePreviews.image_signature && (
                                                                <div className="mt-2 mb-2">
                                                                    <img 
                                                                        src={filePreviews.image_signature} 
                                                                        alt="Signature preview" 
                                                                        className="h-20 w-auto max-w-full object-contain rounded-md border border-gray-300 dark:border-gray-600"
                                                                    />
                                                                </div>
                                                            )}
                                                            <input
                                                                type="file"
                                                                name="image_signature"
                                                                id="image_signature"
                                                                accept="image/*"
                                                                onChange={handleFileChange}
                                                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 dark:text-gray-400"
                                                            />
                                                            {errors.image_signature && (
                                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.image_signature}</p>
                                                            )}
                                                        </div>
                                                        
                                                        <div>
                                                            <label htmlFor="image_qrcode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                QR Code
                                                            </label>
                                                            {filePreviews.image_qrcode && (
                                                                <div className="mt-2 mb-2">
                                                                    <img 
                                                                        src={filePreviews.image_qrcode} 
                                                                        alt="QR Code preview" 
                                                                        className="h-20 w-20 object-contain rounded-md border border-gray-300 dark:border-gray-600"
                                                                    />
                                                                </div>
                                                            )}
                                                            <input
                                                                type="file"
                                                                name="image_qrcode"
                                                                id="image_qrcode"
                                                                accept="image/*"
                                                                onChange={handleFileChange}
                                                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 dark:text-gray-400"
                                                            />
                                                            {errors.image_qrcode && (
                                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.image_qrcode}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                                                    <button
                                                        type="submit"
                                                        disabled={isSubmitting}
                                                        className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                    <button
                                                        type="button"
                                                        disabled={isSubmitting}
                                                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        onClick={closeAddModal}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>

            {/* Edit Employee Modal */}
            <Transition.Root show={editModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeEditModal}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 transition-opacity" />
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
                                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all dark:bg-gray-800 sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                                    <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                        <button
                                            type="button"
                                            className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none dark:bg-gray-800 dark:text-gray-500 dark:hover:text-gray-400"
                                            onClick={closeEditModal}
                                        >
                                            <span className="sr-only">Close</span>
                                            <XCircle className="h-6 w-6" aria-hidden="true" />
                                        </button>
                                    </div>
                                    
                                    <div className="sm:flex sm:items-start">
                                        <div className="text-center sm:mt-0 sm:text-left w-full">
                                            <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 dark:text-white mb-4">
                                                Edit Employee: {employeeToEdit?.employee_firstname} {employeeToEdit?.employee_lastname}
                                            </Dialog.Title>
                                            
                                            <form onSubmit={handleEditSubmit} className="space-y-6 overflow-y-auto max-h-[70vh]">
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
                                                                Pag-IBIG Number
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
                                                
                                                <div>
                                                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                                                        Images & Documents
                                                    </h4>
                                                    <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-3 sm:gap-x-4">
                                                        <div>
                                                            <label htmlFor="edit_image_person" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                Profile Photo
                                                            </label>
                                                            {editFilePreviews.image_person && (
                                                                <div className="mt-2 mb-2">
                                                                    <img 
                                                                        src={editFilePreviews.image_person.startsWith('data:') 
                                                                            ? editFilePreviews.image_person 
                                                                            : route('network.image', {
                                                                                folder: 'employee',
                                                                                filename: editFilePreviews.image_person
                                                                            })}
                                                                        alt="Profile" 
                                                                        className="h-20 w-20 object-cover rounded-md border border-gray-300 dark:border-gray-600"
                                                                        onError={(e) => {
                                                                            e.currentTarget.onerror = null;
                                                                            e.currentTarget.src = route('employee.placeholder-image');
                                                                        }}
                                                                    />
                                                                </div>
                                                            )}
                                                            <input
                                                                type="file"
                                                                name="image_person"
                                                                id="edit_image_person"
                                                                accept="image/*"
                                                                onChange={handleEditFileChange}
                                                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 dark:text-gray-400"
                                                            />
                                                            {errors.image_person && (
                                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.image_person}</p>
                                                            )}
                                                            {/* Store original network path */}
                                                            {employeeToEdit?.image_person && (
                                                                <input type="hidden" name="original_image_person" value={employeeToEdit.image_person} />
                                                            )}
                                                        </div>

                                                        <div>
                                                            <label htmlFor="edit_image_signature" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                Signature
                                                            </label>
                                                            {editFilePreviews.image_signature && (
                                                                <div className="mt-2 mb-2">
                                                                    <img 
                                                                        src={editFilePreviews.image_signature.startsWith('data:') 
                                                                            ? editFilePreviews.image_signature 
                                                                            : route('network.image', {
                                                                                folder: 'signature',
                                                                                filename: editFilePreviews.image_signature
                                                                            })} 
                                                                        alt="Signature" 
                                                                        className="h-20 w-auto max-w-full object-contain rounded-md border border-gray-300 dark:border-gray-600"
                                                                        onError={(e) => {
                                                                            e.currentTarget.onerror = null;
                                                                            e.currentTarget.src = route('employee.placeholder-image');
                                                                        }}
                                                                    />
                                                                </div>
                                                            )}
                                                            <input
                                                                type="file"
                                                                name="image_signature"
                                                                id="edit_image_signature"
                                                                accept="image/*"
                                                                onChange={handleEditFileChange}
                                                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 dark:text-gray-400"
                                                            />
                                                            {errors.image_signature && (
                                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.image_signature}</p>
                                                            )}
                                                            {/* Store original network path */}
                                                            {employeeToEdit?.image_signature && (
                                                                <input type="hidden" name="original_image_signature" value={employeeToEdit.image_signature} />
                                                            )}
                                                        </div>

                                                        <div>
                                                            <label htmlFor="edit_image_qrcode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                QR Code
                                                            </label>
                                                            {editFilePreviews.image_qrcode && (
                                                                <div className="mt-2 mb-2">
                                                                    <img 
                                                                        src={editFilePreviews.image_qrcode.startsWith('data:') 
                                                                            ? editFilePreviews.image_qrcode
                                                                            : route('network.image', {
                                                                                folder: 'qrcode',
                                                                                filename: editFilePreviews.image_qrcode
                                                                            })} 
                                                                        alt="QR Code" 
                                                                        className="h-20 w-20 object-contain rounded-md border border-gray-300 dark:border-gray-600"
                                                                        onError={(e) => {
                                                                            e.currentTarget.onerror = null;
                                                                            e.currentTarget.src = route('employee.placeholder-image');
                                                                        }}
                                                                    />
                                                                </div>
                                                            )}
                                                            <input
                                                                type="file"
                                                                name="image_qrcode"
                                                                id="edit_image_qrcode"
                                                                accept="image/*"
                                                                onChange={handleEditFileChange}
                                                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 dark:text-gray-400"
                                                            />
                                                            {errors.image_qrcode && (
                                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.image_qrcode}</p>
                                                            )}
                                                            {/* Store original network path */}
                                                            {employeeToEdit?.image_qrcode && (
                                                                <input type="hidden" name="original_image_qrcode" value={employeeToEdit.image_qrcode} />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                                                    <button
                                                        type="submit"
                                                        disabled={isEditing}
                                                        className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                    <button
                                                        type="button"
                                                        disabled={isEditing}
                                                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        onClick={closeEditModal}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>

            {successMessage && (
                <div className="fixed top-4 right-4 z-50 max-w-md">
                    <div className="rounded-md bg-green-50 p-4 shadow-lg dark:bg-green-900">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <CheckCircle className="h-5 w-5 text-green-400 dark:text-green-300" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-green-800 dark:text-green-200">{successMessage}</p>
                            </div>
                            <div className="ml-auto pl-3">
                                <div className="-mx-1.5 -my-1.5">
                                    <button
                                        type="button"
                                        className="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-green-50 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800"
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

