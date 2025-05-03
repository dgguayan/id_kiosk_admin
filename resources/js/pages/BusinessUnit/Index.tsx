import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { Table } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { Search, Plus, Edit, Trash } from 'lucide-react';
import { debounce } from 'lodash';
import { ChevronUp, ChevronDown } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Business Units',
        href: '/business-unit',
    },
];

interface BusinessUnit {
    businessunit_id: string;
    businessunit_name: string;
    businessunit_code: string;
    businessunit_image_path?: string;
}

interface PageMeta {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
}

export default function BusinessUnitIndex({ 
    businessUnits = [], 
    meta = null, 
    filters = {},
    currentUserRole = ''  // Add a default value here
}: { 
    businessUnits?: BusinessUnit[], 
    meta?: PageMeta | null,
    filters?: {
        search?: string;
        page?: number;
        per_page?: number;
    },
    currentUserRole?: string;
}) {
    // Add debugging logs to see what data is coming in
    console.log('BusinessUnitIndex rendered with data:', { businessUnits, meta, filters });
    
    // Define isAdmin based on currentUserRole
    const isAdmin = currentUserRole === 'Admin'; // Match the exact capitalization used in UserManagement
    
    const [loading, setLoading] = useState(true);
    const [businessUnitsData, setBusinessUnitsData] = useState<BusinessUnit[]>(businessUnits);
    const [currentPage, setCurrentPage] = useState(meta?.current_page || 1);
    const [lastPage, setLastPage] = useState(meta?.last_page || 1);
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [selectedBusinessUnits, setSelectedBusinessUnits] = useState<Record<string, boolean>>({});
    const [selectAll, setSelectAll] = useState(false);
    const [sortField, setSortField] = useState<string>('businessunit_name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [businessUnitToDelete, setBusinessUnitToDelete] = useState<BusinessUnit | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [newBusinessUnit, setNewBusinessUnit] = useState({
        businessunit_name: '',
        businessunit_code: '',
        businessunit_image: null as File | null,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [businessUnitToEdit, setBusinessUnitToEdit] = useState<BusinessUnit | null>(null);
    const [editFormData, setEditFormData] = useState({
        businessunit_name: '',
        businessunit_code: '',
        businessunit_image: null as File | null, // Add this line
    });

    const [isEditing, setIsEditing] = useState(false);

    // Compute selected business unit count
    const selectedBusinessUnitCount = Object.values(selectedBusinessUnits).filter(Boolean).length;

    // Get the selected business unit IDs
    const getSelectedBusinessUnitIds = () => {
        return Object.entries(selectedBusinessUnits)
            .filter(([_, isSelected]) => isSelected)
            .map(([id]) => id);
    };

    // Functions for bulk delete
    const openBulkDeleteModal = () => {
        setBulkDeleteModalOpen(true);
    };

    const closeBulkDeleteModal = () => {
        setBulkDeleteModalOpen(false);
    };

    const confirmBulkDelete = () => {
        if (selectedBusinessUnitCount > 0 && !isBulkDeleting) {
            setIsBulkDeleting(true);
            
            // Get selected business unit IDs
            const businessUnitIds = getSelectedBusinessUnitIds();
            
            // Send delete request
            router.post(route('business-unit.bulk-destroy'), { ids: businessUnitIds }, {
                onSuccess: () => {
                    setLoading(false);
                    setIsBulkDeleting(false);
                    setSuccessMessage(`Successfully deleted ${selectedBusinessUnitCount} business units`);
                    closeBulkDeleteModal();
                    
                    // Clear selections
                    setSelectedBusinessUnits({});
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
        console.log('Received business units:', businessUnits);
        console.log('Received meta:', meta);
        console.log('Received filters:', filters);
        
        setBusinessUnitsData(Array.isArray(businessUnits) ? businessUnits : []);
        setLoading(false);
        if (meta) {
            setCurrentPage(meta.current_page);
            setLastPage(meta.last_page);
        }
    }, [businessUnits, meta, filters]);
    
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        setLoading(true);
        
        router.get(route('business-unit.index', { 
            page, 
            search: searchQuery,
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
        
        router.get(route('business-unit.index', { 
            search: query, 
            page: 1,
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

    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, []);

    const handleSelectAll = () => {
        const newSelectAll = !selectAll;
        setSelectAll(newSelectAll);
        
        const newSelectedBusinessUnits: Record<string, boolean> = {};
        businessUnitsData.forEach(businessUnit => {
            newSelectedBusinessUnits[businessUnit.businessunit_id] = newSelectAll;
        });
        
        setSelectedBusinessUnits(newSelectedBusinessUnits);
    };
    
    const handleSelectBusinessUnit = (id: string) => {
        const newSelectedBusinessUnits = {
            ...selectedBusinessUnits,
            [id]: !selectedBusinessUnits[id]
        };
        
        setSelectedBusinessUnits(newSelectedBusinessUnits);
        
        const allSelected = businessUnitsData.every(businessUnit => newSelectedBusinessUnits[businessUnit.businessunit_id]);
        setSelectAll(allSelected);
    };

    // Sort handler
    const handleSort = (field: string) => {
        const newDirection = field === sortField && sortOrder === 'asc' ? 'desc' : 'asc';
        
        setSortField(field);
        setSortOrder(newDirection);
        
        setLoading(true);
        router.get(route('business-unit.index', { 
            page: currentPage, 
            search: searchQuery,
            sort_by: field,
            sort_direction: newDirection
        }), {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => setLoading(false),
        });
    };

    //delete modal
    const openDeleteModal = (businessUnit: BusinessUnit) => {
        setBusinessUnitToDelete(businessUnit);
        setDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
        setTimeout(() => {
            setBusinessUnitToDelete(null);
        }, 200);
    };

    const confirmDelete = () => {
        if (businessUnitToDelete && !isDeleting) {
            setIsDeleting(true);
            
            router.delete(route('business-unit.destroy', businessUnitToDelete.businessunit_id), {
                onSuccess: () => {
                    setLoading(false);
                    setIsDeleting(false);
                    setSuccessMessage(`Successfully deleted ${businessUnitToDelete.businessunit_name}`);
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

    const openAddModal = () => {
        setAddModalOpen(true);
    };

    const closeAddModal = () => {
        setAddModalOpen(false);
        setNewBusinessUnit({
            businessunit_name: '',
            businessunit_code: '',
            businessunit_image: null as File | null,
        });
        setErrors({});
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, files } = e.target;
        
        // Handle file input separately
        if (name === 'businessunit_image' && files && files.length > 0) {
            setNewBusinessUnit(prev => ({
                ...prev,
                businessunit_image: files[0]
            }));
        } else {
            setNewBusinessUnit(prev => ({
                ...prev,
                [name]: value
            }));
        }
        
        // Clear error for this field when user types
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isSubmitting) return;
        
        setIsSubmitting(true);
        
        // Create FormData to handle file upload
        const formData = new FormData();
        formData.append('businessunit_name', newBusinessUnit.businessunit_name);
        
        // Make sure this line is actually executed
        if (newBusinessUnit.businessunit_code) {
            formData.append('businessunit_code', newBusinessUnit.businessunit_code);
            console.log('Added businessunit_code to form data:', newBusinessUnit.businessunit_code);
        }
        
        // Only append image if it's selected
        if (newBusinessUnit.businessunit_image) {
            formData.append('businessunit_image', newBusinessUnit.businessunit_image);
        }
        
        router.post(route('business-unit.store'), formData, {
            onSuccess: () => {
                setIsSubmitting(false);
                closeAddModal();
                setSuccessMessage(`Business unit ${newBusinessUnit.businessunit_name} added successfully`);
                
                // Refresh the business unit list
                setLoading(true);
                router.get(route('business-unit.index'), {
                    page: currentPage,
                    search: searchQuery,
                    sort_by: sortField,
                    sort_direction: sortOrder
                }, {
                    only: ['businessUnits', 'meta'],
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => setLoading(false)
                });
                
                setTimeout(() => {
                    setSuccessMessage(null);
                }, 3000);
            },
            onError: (errors) => {
                setIsSubmitting(false);
                setErrors(errors);
            },
            forceFormData: true, // Important: force FormData for file uploads
        });
    };

    const openEditModal = (businessUnit: BusinessUnit) => {
        setBusinessUnitToEdit(businessUnit);
        
        setEditFormData({
            businessunit_name: businessUnit.businessunit_name,
            businessunit_code: businessUnit.businessunit_code || '',
            businessunit_image: null,
        });
        
        setEditModalOpen(true);
    };

    const closeEditModal = () => {
        setEditModalOpen(false);
        setTimeout(() => {
            setBusinessUnitToEdit(null);
            setEditFormData({
                businessunit_name: '',
                businessunit_code: '',
                businessunit_image: null,
            });
            setErrors({});
        }, 200);
    };

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, files } = e.target;
        
        // Handle file input separately
        if (name === 'businessunit_image' && files && files.length > 0) {
            setEditFormData(prev => ({
                ...prev,
                businessunit_image: files[0]
            }));
        } else {
            setEditFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
        
        // Clear error for this field when user types
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isEditing || !businessUnitToEdit) return;
        
        setIsEditing(true);
        
        // Create FormData to handle file upload
        const formData = new FormData();
        formData.append('businessunit_name', editFormData.businessunit_name);
        
        // Only append image if it's selected
        if (editFormData.businessunit_image) {
            formData.append('businessunit_image', editFormData.businessunit_image);
        }
        
        // Add _method field to tell Laravel this is a PUT request
        formData.append('_method', 'PUT');
        
        // Use POST method with _method: put for file uploads in Laravel
        router.post(route('business-unit.update', businessUnitToEdit.businessunit_id), formData, {
            onSuccess: () => {
                setIsEditing(false);
                closeEditModal();
                setSuccessMessage(`Business unit ${editFormData.businessunit_name} updated successfully`);
                
                // Refresh the business unit list
                setLoading(true);
                router.get(route('business-unit.index'), {
                    page: currentPage,
                    search: searchQuery,
                    sort_by: sortField,
                    sort_direction: sortOrder
                }, {
                    only: ['businessUnits', 'meta'],
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => setLoading(false)
                });
                
                setTimeout(() => {
                    setSuccessMessage(null);
                }, 3000);
            },
            onError: (errors) => {
                setIsEditing(false);
                setErrors(errors);
            },
            forceFormData: true, // Important: force FormData for file uploads
        });
    };
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Business Units" />
            
            <div className="px-4 sm:px-6 lg:px-8 mt-3">
                <div className="sm:flex sm:items-center">
                    <div className="sm:flex-auto">
                        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">Business Units</h1>
                        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                            A list of all business units in the organization.
                        </p>
                    </div>

                    <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                        <button
                            type="button"
                            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-transparent bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:w-auto dark:bg-white dark:text-black dark:hover:bg-gray-200 dark:focus:ring-gray-400"
                            onClick={openAddModal}
                        >
                            <Plus className="h-4 w-4" /> Add Business Unit
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
                                placeholder="Search business units..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                        </div>
                    </div>

                    <div className="ml-auto">
                        {selectedBusinessUnitCount >= 2 && isAdmin && (
                            <div className="flex items-center space-x-2">
                                <button
                                    type="button"
                                    onClick={openBulkDeleteModal}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-800"
                                >
                                    <span className="text-sm dark:text-gray-300 mr-1.5">
                                        {selectedBusinessUnitCount}
                                    </span>
                                    <Trash className="h-4 w-4 mr-1.5" />
                                    Delete Selected
                                </button>
                            </div>
                        )}


                    </div>
                </div>

                <div className="mt-8 flex flex-col">
                    <Table.Root>
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
                                <Table.Cell header>
                                    <div className='cursor-pointer flex justify-center items-center' onClick={() => handleSort('businessunit_name')}>
                                        <span>Business Unit Name</span>
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
                                    <div className="text-center">Actions</div>
                                </Table.Cell>
                            </tr>
                        </Table.Header>
                        <Table.Body 
                            isLoading={loading} 
                            colSpan={3}
                            emptyMessage="No business units found"
                        >
                            {businessUnitsData.map((businessUnit) => (
                                <Table.Row key={businessUnit.businessunit_id}>
                                    <Table.Cell>
                                        <div className="flex h-5 items-center justify-center">
                                            <input 
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
                                                checked={!!selectedBusinessUnits[businessUnit.businessunit_id]}
                                                onChange={() => handleSelectBusinessUnit(businessUnit.businessunit_id)}
                                            />
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell className="font-medium text-gray-900 dark:text-white">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            {businessUnit.businessunit_image_path ? (
                                                <div className="flex-shrink-0 h-10 w-10 mx-auto mb-2">
                                                    <img 
                                                        src={`/storage/${businessUnit.businessunit_image_path}`} 
                                                        alt={businessUnit.businessunit_name}
                                                        className="h-10 w-10 object-cover rounded-md border border-gray-200 dark:border-gray-700 dark:invert"
                                                        onError={(e) => {
                                                            e.currentTarget.src = '/images/placeholder.png';
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex-shrink-0 h-10 w-10 bg-gray-100 dark:bg-gray-700 rounded-md mx-auto mb-2 flex items-center justify-center">
                                                    <span className="text-gray-400 dark:text-gray-500 text-xs">No img</span>
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <span className="text-sm font-medium truncate block">{businessUnit.businessunit_name}</span>
                                            </div>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="flex justify-center space-x-2">
                                            <button 
                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                onClick={() => openEditModal(businessUnit)}
                                            >
                                                <Edit className="h-4 w-4" />
                                                <span className="sr-only">Edit {businessUnit.businessunit_name}</span>
                                            </button>
                                            {isAdmin && (
                                                <button 
                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                    onClick={() => openDeleteModal(businessUnit)}
                                                >
                                                    <Trash className="h-4 w-4" />
                                                    <span className="sr-only">Delete {businessUnit.businessunit_name}</span>
                                                </button>
                                            )}
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
                                                Delete Business Unit
                                            </Dialog.Title>
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-500 dark:text-gray-300">
                                                    Are you sure you want to delete <span className="font-bold text-red-600 dark:text-red-400">{businessUnitToDelete?.businessunit_name}</span>? This action cannot be undone.
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
                                                Bulk Delete Business Units
                                            </Dialog.Title>
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-500 dark:text-gray-300">
                                                    Are you sure you want to delete <span className="font-bold text-red-600 dark:text-red-400">{selectedBusinessUnitCount}</span> selected business units? This action cannot be undone.
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

            {/* Add Business Unit Modal */}
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
                                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all dark:bg-gray-800 sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
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
                                                Add New Business Unit
                                            </Dialog.Title>
                                            
                                            <form onSubmit={handleAddSubmit}>
                                                <div>
                                                    <label htmlFor="businessunit_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Business Unit Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="businessunit_name"
                                                        id="businessunit_name"
                                                        value={newBusinessUnit.businessunit_name}
                                                        onChange={handleInputChange}
                                                        className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm
                                                            ${errors.businessunit_name 
                                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-700' 
                                                                : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700'
                                                            } dark:bg-gray-800 dark:text-white`}
                                                    />
                                                    {errors.businessunit_name && (
                                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.businessunit_name}</p>
                                                    )}
                                                </div>

                                                {/* Add business unit code field */}
                                                <div className="mt-4">
                                                    <label htmlFor="businessunit_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Business Unit Code *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="businessunit_code"
                                                        id="businessunit_code"
                                                        value={newBusinessUnit.businessunit_code}
                                                        onChange={handleInputChange}
                                                        placeholder="e.g., HR, IT, FIN"
                                                        className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm
                                                            ${errors.businessunit_code 
                                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-700' 
                                                                : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700'
                                                            } dark:bg-gray-800 dark:text-white`}
                                                    />
                                                    {errors.businessunit_code && (
                                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.businessunit_code}</p>
                                                    )}
                                                </div>

                                                {/* Add image upload field */}
                                                <div className="mt-4">
                                                    <label htmlFor="businessunit_image" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Business Unit Image
                                                    </label>
                                                    <div className="mt-1">
                                                        <input
                                                            type="file"
                                                            name="businessunit_image"
                                                            id="businessunit_image"
                                                            accept="image/*"
                                                            onChange={handleInputChange}
                                                            className="sr-only"
                                                        />
                                                        <label
                                                            htmlFor="businessunit_image"
                                                            className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
                                                        >
                                                            <span>{newBusinessUnit.businessunit_image ? 'Change image' : 'Upload image'}</span>
                                                        </label>
                                                        {newBusinessUnit.businessunit_image && (
                                                            <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                                                                {newBusinessUnit.businessunit_image.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {errors.businessunit_image && (
                                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.businessunit_image}</p>
                                                    )}
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
                                                            'Add Business Unit'
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

            {/* Edit Business Unit Modal */}
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
                                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all dark:bg-gray-800 sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
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
                                                Edit Business Unit
                                            </Dialog.Title>
                                            
                                            <form onSubmit={handleEditSubmit}>
                                                <div>
                                                    <label htmlFor="edit_businessunit_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Business Unit Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="businessunit_name"
                                                        id="edit_businessunit_name"
                                                        value={editFormData.businessunit_name}
                                                        onChange={handleEditInputChange}
                                                        className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm
                                                            ${errors.businessunit_name 
                                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-700' 
                                                                : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700'
                                                            } dark:bg-gray-800 dark:text-white`}
                                                    />
                                                    {errors.businessunit_name && (
                                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.businessunit_name}</p>
                                                    )}
                                                </div>
                                                
                                                {/* Add business unit code field */}
                                                <div className="mt-4">
                                                    <label htmlFor="edit_businessunit_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Business Unit Code *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="businessunit_code"
                                                        id="edit_businessunit_code"
                                                        value={editFormData.businessunit_code}
                                                        onChange={handleEditInputChange}
                                                        placeholder="e.g., HR, IT, FIN"
                                                        className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm
                                                            ${errors.businessunit_code 
                                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-700' 
                                                                : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700'
                                                            } dark:bg-gray-800 dark:text-white`}
                                                    />
                                                    {errors.businessunit_code && (
                                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.businessunit_code}</p>
                                                    )}
                                                </div>
                                                
                                                {/* Add image upload field */}
                                                <div className="mt-4">
                                                    <label htmlFor="edit_businessunit_image" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Business Unit Image
                                                    </label>
                                                    <div className="mt-1 flex items-center space-x-4">
                                                        {/* Show current image if it exists */}
                                                        {businessUnitToEdit?.businessunit_image_path && (
                                                            <div className="flex-shrink-0 h-16 w-16">
                                                                <img 
                                                                    src={`/storage/${businessUnitToEdit.businessunit_image_path}`} 
                                                                    alt={businessUnitToEdit.businessunit_name}
                                                                    className="h-16 w-16 object-cover rounded-md border border-gray-200 dark:border-gray-700"
                                                                />
                                                            </div>
                                                        )}
                                                        
                                                        <div className="flex-1">
                                                            <input
                                                                type="file"
                                                                name="businessunit_image"
                                                                id="edit_businessunit_image"
                                                                accept="image/*"
                                                                onChange={handleEditInputChange}
                                                                className="sr-only"
                                                            />
                                                            <label
                                                                htmlFor="edit_businessunit_image"
                                                                className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
                                                            >
                                                                <span>{editFormData.businessunit_image ? 'Change image' : 'Upload image'}</span>
                                                            </label>
                                                            {editFormData.businessunit_image && (
                                                                <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                                                                    {editFormData.businessunit_image.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {errors.businessunit_image && (
                                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.businessunit_image}</p>
                                                    )}
                                                </div>
                                                
                                                {/* Rest of the form */}
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
                                                            'Update Business Unit'
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
