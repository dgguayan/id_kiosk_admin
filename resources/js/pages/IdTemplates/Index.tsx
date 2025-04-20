import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CheckCircle, XCircle, Plus, Edit, Info } from 'lucide-react';
import { Search } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'ID Templates',
        href: '/id-templates',
    },
];

interface BusinessUnit {
    businessunit_id: number;
    businessunit_name: string;
}

interface TemplateImage {
    id: number;
    businessunit_id: number;
    image_path: string;
    image_path2: string;
    businessUnit: BusinessUnit;
}

export default function IdTemplatesIndex({ 
    templates = [], 
    businessUnits = [], 
    pageTitle = '', 
    selectedBusinessUnit = 'all' 
}: { 
    templates?: TemplateImage[],
    businessUnits?: BusinessUnit[],
    pageTitle?: string,
    selectedBusinessUnit?: string | number
}) {
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [frontImagePreview, setFrontImagePreview] = useState<string | null>(null);
    const [backImagePreview, setBackImagePreview] = useState<string | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateImage | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filterValue, setFilterValue] = useState<string>(selectedBusinessUnit?.toString() || 'all');
    const [imageErrored, setImageErrored] = useState<Record<string, boolean>>({});

    const [formData, setFormData] = useState({
        businessunit_id: '',
        image_front: null as File | null,
        image_back: null as File | null,
    });

    // Function to get the correct image URL
    const getStorageImageUrl = (imagePath: string) => {
        if (!imagePath) return '';
        
        // Handle case where imagePath already contains '/storage/'
        if (imagePath.includes('/storage/')) {
            return imagePath;
        }
        
        // First try to use network image route
        try {
            return route('network.image', {
                folder: 'id_templates',
                filename: imagePath
            });
        } catch (e) {
            // Fallback to local storage if route generation fails
            return `/storage/images/${imagePath}`;
        }
    };
    
    // Handle image error
    const handleImageError = (id: string) => {
        setImageErrored(prev => ({
            ...prev,
            [id]: true
        }));
    };

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Handle file input changes
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Update form data
            setFormData({
                ...formData,
                [e.target.name]: file
            });
            
            // Create preview URL
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    if (type === 'front') {
                        setFrontImagePreview(reader.result);
                    } else {
                        setBackImagePreview(reader.result);
                    }
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle form submission
    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isSubmitting) return;
        setIsSubmitting(true);
        
        // Create form data for file upload
        const submitData = new FormData();
        submitData.append('businessunit_id', formData.businessunit_id);
        if (formData.image_front) {
            submitData.append('image_front', formData.image_front);
        }
        if (formData.image_back) {
            submitData.append('image_back', formData.image_back);
        }
        
        router.post(route('id-templates.store'), submitData, {
            onSuccess: () => {
                setIsSubmitting(false);
                closeAddModal();
                setSuccessMessage('Template added successfully');
                
                setTimeout(() => {
                    setSuccessMessage(null);
                }, 3000);
            },
            onError: (errors) => {
                setIsSubmitting(false);
                console.error(errors);
            },
        });
    };

    // Handle edit form submission
    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isSubmitting || !selectedTemplate) return;
        setIsSubmitting(true);
        
        // Create form data for file upload
        const submitData = new FormData();
        submitData.append('businessunit_id', formData.businessunit_id);
        submitData.append('_method', 'PUT'); // For method spoofing in Laravel
        
        if (formData.image_front) {
            submitData.append('image_front', formData.image_front);
        }
        if (formData.image_back) {
            submitData.append('image_back', formData.image_back);
        }
        
        router.post(route('id-templates.update', selectedTemplate.id), submitData, {
            onSuccess: () => {
                setIsSubmitting(false);
                closeEditModal();
                setSuccessMessage('Template updated successfully');
                
                setTimeout(() => {
                    setSuccessMessage(null);
                }, 3000);
            },
            onError: (errors) => {
                setIsSubmitting(false);
                console.error(errors);
            },
        });
    };

    // Modal control functions
    const openAddModal = () => {
        setFormData({
            businessunit_id: '',
            image_front: null,
            image_back: null,
        });
        setFrontImagePreview(null);
        setBackImagePreview(null);
        setAddModalOpen(true);
    };

    const closeAddModal = () => {
        setAddModalOpen(false);
    };

    const openEditModal = (template: TemplateImage) => {
        setSelectedTemplate(template);
        setFormData({
            businessunit_id: String(template.businessunit_id),
            image_front: null,
            image_back: null,
        });
        setFrontImagePreview(null);
        setBackImagePreview(null);
        setEditModalOpen(true);
    };

    const closeEditModal = () => {
        setEditModalOpen(false);
        setSelectedTemplate(null);
    };

    // Handle filter change
    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setFilterValue(value);
        
        router.get(route('id-templates.index'), {
            business_unit: value
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle} />
            
            <div className="px-4 sm:px-6 lg:px-8 mt-3">
                <div className="sm:flex sm:items-center">
                    <div className="sm:flex-auto">
                        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">{pageTitle}</h1>
                        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                            Manage ID card templates for all business units.
                        </p>
                    </div>

                    <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                        <button
                            type="button"
                            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-transparent bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:w-auto dark:bg-white dark:text-black dark:hover:bg-gray-200 dark:focus:ring-gray-400"
                            onClick={openAddModal}
                        >
                            <Plus className="h-4 w-4" /> Add Template
                        </button>
                    </div>
                </div>
                
                <div className="mt-5 flex flex-wrap gap-4 items-center">
                    <div className="max-w-xs">
                        <label htmlFor="business_unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Filter by Business Unit
                        </label>
                        <select
                            id="business_unit"
                            name="business_unit"
                            className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:text-sm"
                            value={filterValue as string}
                            onChange={handleFilterChange}
                        >
                            <option value="all">All Business Units</option>
                            {businessUnits.map((unit) => (
                                <option key={unit.businessunit_id} value={unit.businessunit_id}>
                                    {unit.businessunit_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="max-w-md flex-1 ml-auto">
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
                                placeholder="Search templates..."
                            />
                        </div>
                    </div>
                </div>

                {/* Templates Grid */}
                <div className="mt-8">
                    {templates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 dark:bg-gray-900 rounded-md">
                            <div className="flex justify-center items-center h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Templates Found</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                There are no ID templates available for the selected criteria.
                            </p>
                            <button
                                type="button"
                                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                                onClick={openAddModal}
                            >
                                <Plus className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" /> Add New Template
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {templates.map((template) => (
                                <div
                                    key={template.id}
                                    className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:shadow-md"
                                >
                                    <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-4">
                                        {businessUnits.find(unit => unit.businessunit_id === template.businessunit_id)?.businessunit_name || 'N/A'}
                                    </h3>
                                    
                                    <div className="flex justify-between mb-4">
                                        <Link 
                                            href={route('id-templates.layout', template.id)}
                                            className="inline-flex items-center rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                                        >
                                            <Info className="h-4 w-4 mr-2" /> View ID Layouts
                                        </Link>
                                        
                                        <button
                                            onClick={() => openEditModal(template)}
                                            className="inline-flex items-center rounded-md bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                        >
                                            <Edit className="h-4 w-4 mr-2" /> Edit
                                        </button>
                                    </div>
                                    
                                    <div className="flex gap-4">
                                        <div className="flex-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-900 dark:border-gray-600 flex items-center justify-center">
                                            <img
                                                src={getStorageImageUrl(template.image_path)}
                                                alt="ID Front Template"
                                                className={`max-h-48 object-contain ${imageErrored[`front-${template.id}`] ? 'opacity-50' : ''}`}
                                                onError={() => handleImageError(`front-${template.id}`)}
                                            />
                                        </div>
                                        <div className="flex-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-900 dark:border-gray-600 flex items-center justify-center">
                                            <img
                                                src={getStorageImageUrl(template.image_path2)}
                                                alt="ID Back Template"
                                                className={`max-h-48 object-contain ${imageErrored[`back-${template.id}`] ? 'opacity-50' : ''}`}
                                                onError={() => handleImageError(`back-${template.id}`)}
                                            />
                                        </div>
                                    </div>
                                    {(imageErrored[`front-${template.id}`] || imageErrored[`back-${template.id}`]) && (
                                        <p className="text-center text-yellow-600 dark:text-yellow-500 text-sm mt-2">
                                            Some images couldn't be loaded. Make sure they exist in storage.
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Template Modal */}
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
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity dark:bg-gray-900 dark:bg-opacity-75" />
                    </Transition.Child>

                    <div className="fixed inset-0 z-10 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                enterTo="opacity-100 translate-y-0 sm:scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            >
                                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 dark:bg-gray-800">
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
                                        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                            <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 dark:text-white text-center">
                                                Add ID Template
                                            </Dialog.Title>
                                            
                                            <form onSubmit={handleAddSubmit} className="mt-6">
                                                <div className="mb-4">
                                                    <label htmlFor="businessunit_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Business Unit *
                                                    </label>
                                                    <select
                                                        id="businessunit_id"
                                                        name="businessunit_id"
                                                        value={formData.businessunit_id}
                                                        onChange={handleInputChange}
                                                        className="mt-1 block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:text-sm"
                                                        required
                                                    >
                                                        <option value="">Select Business Unit</option>
                                                        {businessUnits.map((unit) => (
                                                            <option key={unit.businessunit_id} value={unit.businessunit_id}>
                                                                {unit.businessunit_name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Image Previews */}
                                                <div className="flex justify-center gap-4 mb-4">
                                                    <div className="text-center">
                                                        <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Front Template Preview</p>
                                                        <div className="h-40 w-32 border border-gray-300 dark:border-gray-600 rounded-md flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                                                            {frontImagePreview ? (
                                                                <img src={frontImagePreview} alt="Front Preview" className="max-h-full max-w-full object-contain" />
                                                            ) : (
                                                                <span className="text-gray-400 text-sm dark:text-gray-500">No image</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Back Template Preview</p>
                                                        <div className="h-40 w-32 border border-gray-300 dark:border-gray-600 rounded-md flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                                                            {backImagePreview ? (
                                                                <img src={backImagePreview} alt="Back Preview" className="max-h-full max-w-full object-contain" />
                                                            ) : (
                                                                <span className="text-gray-400 text-sm dark:text-gray-500">No image</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* File Upload Fields */}
                                                <div className="flex justify-between gap-4 mb-6">
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Upload Front Template *
                                                        </label>
                                                        <input
                                                            type="file"
                                                            name="image_front"
                                                            onChange={(e) => handleFileChange(e, 'front')}
                                                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:text-sm"
                                                            accept="image/*"
                                                            required
                                                        />
                                                    </div>
                                                    
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Upload Back Template *
                                                        </label>
                                                        <input
                                                            type="file"
                                                            name="image_back"
                                                            onChange={(e) => handleFileChange(e, 'back')}
                                                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:text-sm"
                                                            accept="image/*"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-5 flex justify-between">
                                                    <button
                                                        type="button"
                                                        className="inline-flex w-auto justify-center rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                                                        onClick={closeAddModal}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={isSubmitting}
                                                        className="inline-flex w-auto justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-green-700 dark:hover:bg-green-600"
                                                    >
                                                        {isSubmitting ? (
                                                            <>
                                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                Uploading...
                                                            </>
                                                        ) : (
                                                            'Upload Template'
                                                        )}
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

            {/* Edit Template Modal */}
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
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity dark:bg-gray-900 dark:bg-opacity-75" />
                    </Transition.Child>

                    <div className="fixed inset-0 z-10 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                enterTo="opacity-100 translate-y-0 sm:scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            >
                                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 dark:bg-gray-800">
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
                                        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                            <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 dark:text-white text-center">
                                                Edit ID Template
                                            </Dialog.Title>
                                            
                                            {selectedTemplate && (
                                                <form onSubmit={handleEditSubmit} className="mt-6">
                                                    <div className="mb-4">
                                                        <label htmlFor="businessunit_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            Business Unit *
                                                        </label>
                                                        <select
                                                            id="businessunit_id"
                                                            name="businessunit_id"
                                                            value={formData.businessunit_id || ''}
                                                            onChange={handleInputChange}
                                                            className="mt-1 block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:text-sm"
                                                        >
                                                            {businessUnits.map((unit) => (
                                                                <option key={unit.businessunit_id} value={unit.businessunit_id}>
                                                                    {unit.businessunit_name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Image Previews */}
                                                    <div className="flex justify-center gap-4 mb-4">
                                                        <div className="text-center">
                                                            <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Front Template</p>
                                                            <div className="h-40 w-32 border border-gray-300 dark:border-gray-600 rounded-md flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                                                                <img 
                                                                    src={frontImagePreview || getStorageImageUrl(selectedTemplate.image_path)} 
                                                                    alt="Front Template" 
                                                                    className="max-h-full max-w-full object-contain"
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement;
                                                                        target.classList.add('opacity-50');
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Back Template</p>
                                                            <div className="h-40 w-32 border border-gray-300 dark:border-gray-600 rounded-md flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                                                                <img 
                                                                    src={backImagePreview || getStorageImageUrl(selectedTemplate.image_path2)}
                                                                    alt="Back Template" 
                                                                    className="max-h-full max-w-full object-contain"
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement;
                                                                        target.classList.add('opacity-50');
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* File Upload Fields */}
                                                    <div className="flex justify-between gap-4 mb-6">
                                                        <div className="flex-1">
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Upload New Front Template
                                                            </label>
                                                            <input
                                                                type="file"
                                                                name="image_front"
                                                                onChange={(e) => handleFileChange(e, 'front')}
                                                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:text-sm"
                                                                accept="image/*"
                                                            />
                                                        </div>
                                                        
                                                        <div className="flex-1">
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Upload New Back Template
                                                            </label>
                                                            <input
                                                                type="file"
                                                                name="image_back"
                                                                onChange={(e) => handleFileChange(e, 'back')}
                                                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:text-sm"
                                                                accept="image/*"
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="mt-5 flex justify-between">
                                                        <button
                                                            type="button"
                                                            className="inline-flex w-auto justify-center rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                                                            onClick={closeEditModal}
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            disabled={isSubmitting}
                                                            className="inline-flex w-auto justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-green-700 dark:hover:bg-green-600"
                                                        >
                                                            {isSubmitting ? (
                                                                <>
                                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                    Updating...
                                                                </>
                                                            ) : (
                                                                'Update Template'
                                                            )}
                                                        </button>
                                                    </div>
                                                </form>
                                            )}
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>

            {/* Success Message Toast */}
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
