import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Table } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { Search, Eye, CreditCard, Edit, Plus, Trash } from 'lucide-react';
import { debounce } from 'lodash';
import { ChevronUp, ChevronDown } from 'lucide-react';
import EmployeeViewModal from '@/components/modals/EmployeeViewModal';
import EmployeeEditModal from '@/components/modals/EmployeeEditModal';
import EmployeeAddModal from '@/components/modals/EmployeeAddModal';
import EmployeeDeleteModal from '@/components/modals/EmployeeDeleteModal';
import EmployeeBulkDeleteModal from '@/components/modals/EmployeeBulkDeleteModal';
import { CheckCircle, XCircle } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pending ID List',
        href: '/pending-id',
    },
];

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

export default function PendingId({ 
    employees = [], 
    meta = null, 
    filters = {},
    businessUnits = [],
    currentUserRole = ''  // Add this prop
}: { 
    employees?: Employee[], 
    meta?: PageMeta | null,
    filters?: {
        search?: string;
        businessunit_id?: string;
        page?: number;
        per_page?: number;
    },
    businessUnits?: Array<{id: number, businessunit_name: string}>,
    currentUserRole?: string;
}) {
    const [loading, setLoading] = useState(true);
    const [employeesData, setEmployeesData] = useState<Employee[]>(employees);
    const [currentPage, setCurrentPage] = useState(meta?.current_page || 1);
    const [lastPage, setLastPage] = useState(meta?.last_page || 1);
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [sortField, setSortField] = useState<string>('employee_lastname');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [businessUnitFilter, setBusinessUnitFilter] = useState(filters?.businessunit_id || '');
    
    // Add selection state
    const [selectedEmployees, setSelectedEmployees] = useState<Record<number, boolean>>({});
    const [selectAll, setSelectAll] = useState(false);
    
    // View modal state
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [employeeToView, setEmployeeToView] = useState<Employee | null>(null);

    // Edit modal state
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
    
    // Add modal state
    const [addModalOpen, setAddModalOpen] = useState(false);
    
    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
    
    // Bulk delete modal state
    const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
    
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    
    // Compute selected employee count
    const selectedEmployeeCount = Object.values(selectedEmployees).filter(Boolean).length;
    
    // Get the selected employee UUIDs
    const getSelectedEmployeeUuids = () => {
        return Object.entries(selectedEmployees)
            .filter(([_, isSelected]) => isSelected)
            .map(([uuid]) => uuid);
    };
    
    useEffect(() => {
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
        
        router.get(route('pending-id.index', { 
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
        
        router.get(route('pending-id.index', { 
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
        
        router.get(route('pending-id.index', { 
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

    const handleSort = (field: string) => {
        const newDirection = field === sortField && sortOrder === 'asc' ? 'desc' : 'asc';
        
        setSortField(field);
        setSortOrder(newDirection);
        
        setLoading(true);
        router.get(route('pending-id.index', { 
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

    // Functions for bulk delete
    const openBulkDeleteModal = () => {
        setBulkDeleteModalOpen(true);
    };

    const closeBulkDeleteModal = () => {
        setBulkDeleteModalOpen(false);
    };

    const handleBulkDeleteSuccess = () => {
        setSuccessMessage(`Successfully deleted ${selectedEmployeeCount} employees`);
        
        // Clear selections
        setSelectedEmployees({});
        setSelectAll(false);
        
        // Refresh the data
        setLoading(true);
        router.get(route('pending-id.index'), {
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
    };
    
    // Function for bulk export
    const handleBulkExport = () => {
        if (selectedEmployeeCount > 0) {
            // Get selected employee UUIDs
            const employeeUuids = getSelectedEmployeeUuids();
            
            // Submit a POST request to the bulk-id-preview route
            router.post(route('employee.bulk-id-preview'), { uuids: employeeUuids });
        }
    };

    // Delete single employee functions
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

    // Update the handleDeleteSuccess function to match the Employee Index implementation
    const handleDeleteSuccess = () => {
        if (employeeToDelete) {
            setSuccessMessage(`Successfully deleted ${employeeToDelete.employee_firstname} ${employeeToDelete.employee_lastname}`);
            
            // Refresh the data
            setLoading(true);
            router.get(route('pending-id.index'), {
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
        }
    };

    // View employee details functions
    const openViewModal = (employee: Employee) => {
        const formattedEmployee = {
            ...employee,
            birthday: employee.birthday 
                ? new Date(employee.birthday).toISOString().split('T')[0]
                : ''
        };
        
        setEmployeeToView(formattedEmployee);
        setViewModalOpen(true);
    };

    const closeViewModal = () => {
        setViewModalOpen(false);
        setTimeout(() => {
            setEmployeeToView(null);
        }, 200);
    };

    // Edit employee functions
    const openEditModal = (employee: Employee) => {
        setEmployeeToEdit(employee);
        setEditModalOpen(true);
    };

    const closeEditModal = () => {
        setEditModalOpen(false);
        setTimeout(() => {
            setEmployeeToEdit(null);
        }, 200);
    };

    const handleEditSuccess = () => {
        setSuccessMessage(`Employee updated successfully`);
        
        // Refresh the employees list
        setLoading(true);
        router.get(route('pending-id.index', { 
            page: currentPage, 
            search: searchQuery,
            businessunit_id: businessUnitFilter,
            sort_by: sortField,
            sort_direction: sortOrder
        }), {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => setLoading(false),
        });
        
        setTimeout(() => {
            setSuccessMessage(null);
        }, 3000);
    };

    const handleEditFromViewModal = (employee: Employee) => {
        closeViewModal();
        openEditModal(employee);
    };

    // Add employee function
    const openAddModal = () => {
        setAddModalOpen(true);
    };

    const closeAddModal = () => {
        setAddModalOpen(false);
    };

    const handleAddSuccess = () => {
        setSuccessMessage(`Employee added successfully`);
        
        // Refresh the employees list
        setLoading(true);
        router.get(route('pending-id.index', { 
            page: currentPage, 
            search: searchQuery,
            businessunit_id: businessUnitFilter,
            sort_by: sortField,
            sort_direction: sortOrder
        }), {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => setLoading(false),
        });
        
        setTimeout(() => {
            setSuccessMessage(null);
        }, 3000);
    };

    const isAdmin = currentUserRole === 'Admin';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pending ID List" />
            
            <div className="px-4 sm:px-6 lg:px-8 mt-3">
                <div className="sm:flex sm:items-center">
                    <div className="sm:flex-auto">
                        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">List of Pending IDs</h1>
                        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                            A list of all employees with pending ID status that need to be processed.
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
                        {selectedEmployeeCount > 1 && (
                            <div className="flex items-center space-x-2">
                                <button
                                    type="button"
                                    onClick={handleBulkExport}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-700 dark:hover:bg-green-800"
                                >
                                    <span className="text-sm dark:text-gray-300 mr-1.5">
                                        {selectedEmployeeCount}
                                    </span>
                                    <CreditCard className="h-4 w-4 mr-1.5" />
                                    Export ID Cards
                                </button>
                                {isAdmin && (
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
                                )}
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
                            emptyMessage="No pending ID requests found"
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
                                                title="View Employee Details"
                                            >
                                                <Eye className="h-4 w-4" />
                                                <span className="sr-only">View {employee.employee_firstname}</span>
                                            </button>
                                            <button 
                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                onClick={() => openEditModal(employee)}
                                                title="Edit Employee"
                                            >
                                                <Edit className="h-4 w-4" />
                                                <span className="sr-only">Edit {employee.employee_firstname}</span>
                                            </button>
                                            {isAdmin && (
                                                <button 
                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                    onClick={() => openDeleteModal(employee)}
                                                    title="Delete Employee"
                                                >
                                                    <Trash className="h-4 w-4" />
                                                    <span className="sr-only">Delete {employee.employee_firstname}</span>
                                                </button>
                                            )}
                                            <button 
                                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                                onClick={() => router.visit(route('employee.id-preview', employee.uuid))}
                                                title="Generate ID Card"
                                            >
                                                <CreditCard className="h-4 w-4" />
                                                <span className="sr-only">ID Card {employee.employee_firstname}</span>
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

            {/* Use the reusable EmployeeViewModal component */}
            <EmployeeViewModal
                isOpen={viewModalOpen}
                employee={employeeToView}
                onClose={closeViewModal}
                showEditButton={true}
                onEdit={handleEditFromViewModal}
            />
            
            {/* Add the EmployeeEditModal component */}
            <EmployeeEditModal 
                isOpen={editModalOpen}
                employee={employeeToEdit}
                onClose={closeEditModal}
                businessUnits={businessUnits}
                onSuccess={handleEditSuccess}
            />

            {/* Add the EmployeeAddModal component */}
            <EmployeeAddModal
                isOpen={addModalOpen}
                onClose={closeAddModal}
                businessUnits={businessUnits}
                onSuccess={handleAddSuccess}
            />

            {/* Replace with reusable EmployeeDeleteModal component */}
            {isAdmin && (
                <EmployeeDeleteModal
                    isOpen={deleteModalOpen}
                    onClose={closeDeleteModal}
                    employee={employeeToDelete}
                    onSuccess={handleDeleteSuccess}
                    routeName="pending-id.destroy"
                />
            )}

            {/* Replace with reusable EmployeeBulkDeleteModal component */}
            {isAdmin && (
                <EmployeeBulkDeleteModal
                    isOpen={bulkDeleteModalOpen}
                    onClose={closeBulkDeleteModal}
                    selectedCount={selectedEmployeeCount}
                    selectedUuids={getSelectedEmployeeUuids()}
                    onSuccess={handleBulkDeleteSuccess}
                    routeName="pending-id.bulk-destroy"
                />
            )}

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
