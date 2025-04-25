import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { XCircle, CheckCircle } from 'lucide-react';
import { Table } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { Search, Plus, Edit, Trash, Eye, Shield } from 'lucide-react';
import { debounce } from 'lodash';
import { ChevronUp, ChevronDown } from 'lucide-react';
import UserViewModal from '@/components/modals/UserViewModal';
import UserEditModal from '@/components/modals/UserEditModal';
import UserAddModal from '@/components/modals/UserAddModal';
import UserDeleteModal from '@/components/modals/UserDeleteModal';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User Management',
        href: '/user-management',
    },
];

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
    email_verified_at: string | null;
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

export default function UserManagement({ 
    users = [], 
    meta = null, 
    filters = {},
    currentUserRole = 'HR',
}: { 
    users?: User[], 
    meta?: PageMeta | null,
    filters?: {
        search?: string;
        role?: string;
        page?: number;
        per_page?: number;
    },
    currentUserRole?: string;
}) {
    const [loading, setLoading] = useState(true);
    const [usersData, setUsersData] = useState<User[]>(users);
    const [currentPage, setCurrentPage] = useState(meta?.current_page || 1);
    const [lastPage, setLastPage] = useState(meta?.last_page || 1);
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [sortField, setSortField] = useState<string>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [roleFilter, setRoleFilter] = useState(filters?.role || '');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [userToView, setUserToView] = useState<User | null>(null);
    
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);

    const [addModalOpen, setAddModalOpen] = useState(false);
    
    // Check if current user is admin
    const isAdmin = currentUserRole === 'Admin';

    const roles = ['Admin', 'HR'];
    
    useEffect(() => {
        setUsersData(Array.isArray(users) ? users : []);
        setLoading(false);
        if (meta) {
            setCurrentPage(meta.current_page);
            setLastPage(meta.last_page);
        }
    }, [users, meta, filters]);
    
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        setLoading(true);
        router.get(route('user-management.index', { 
            page, 
            search: searchQuery,
            role: roleFilter,
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
        router.get(route('user-management.index', { 
            search: query, 
            page: 1,
            role: roleFilter,
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

    const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setRoleFilter(value);
        setCurrentPage(1);
        setLoading(true);
        router.get(route('user-management.index', { 
            page: 1, 
            search: searchQuery,
            role: value,
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
        router.get(route('user-management.index', { 
            page: currentPage, 
            search: searchQuery,
            role: roleFilter,
            sort_by: field,
            sort_direction: newDirection
        }), {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => setLoading(false),
        });
    };

    const openViewModal = (user: User) => {
        setUserToView(user);
        setViewModalOpen(true);
    };

    const closeViewModal = () => {
        setViewModalOpen(false);
        setTimeout(() => {
            setUserToView(null);
        }, 200);
    };

    const openAddModal = () => {
        setAddModalOpen(true);
    };

    const closeAddModal = () => {
        setAddModalOpen(false);
    };

    const openEditModal = (user: User) => {
        setUserToEdit(user);
        setEditModalOpen(true);
    };

    const closeEditModal = () => {
        setEditModalOpen(false);
        setTimeout(() => {
            setUserToEdit(null);
        }, 200);
    };
    
    const openDeleteModal = (user: User) => {
        setUserToDelete(user);
        setDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
        setTimeout(() => {
            setUserToDelete(null);
        }, 200);
    };

    const handleDeleteSuccess = () => {
        if (userToDelete) {
            setSuccessMessage(`Successfully deleted user ${userToDelete.name}`);
            
            // Refresh the data
            setLoading(true);
            router.get(route('user-management.index'), {
                page: currentPage,
                search: searchQuery,
                role: roleFilter,
                sort_by: sortField,
                sort_direction: sortOrder
            }, {
                only: ['users', 'meta'],
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => setLoading(false)
            });
            
            setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
        }
    };

    const handleAddSuccess = () => {
        setSuccessMessage(`User added successfully`);
        
        // Refresh the user list
        setLoading(true);
        router.get(route('user-management.index'), {
            page: currentPage,
            search: searchQuery,
            role: roleFilter,
            sort_by: sortField,
            sort_direction: sortOrder
        }, {
            only: ['users', 'meta'],
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => setLoading(false)
        });
        
        setTimeout(() => {
            setSuccessMessage(null);
        }, 3000);
    };

    const handleEditSuccess = () => {
        setSuccessMessage(`User updated successfully`);
        setLoading(true);
        router.reload();
    };

    const handleEditFromViewModal = (user: User) => {
        closeViewModal();
        openEditModal(user);
    };

    const getUserInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Management" />
            
            <div className="px-4 sm:px-6 lg:px-8 mt-3">
                <div className="sm:flex sm:items-center">
                    <div className="sm:flex-auto">
                        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">User Management</h1>
                        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                            Manage system users and their respective roles.
                        </p>
                    </div>

                    <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                        <button
                            type="button"
                            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-transparent bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:w-auto dark:bg-white dark:text-black dark:hover:bg-gray-200 dark:focus:ring-gray-400"
                            onClick={openAddModal}
                        >
                            <Plus className="h-4 w-4" /> Add User
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
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                        </div>
                    </div>
                    
                    <div className="min-w-[200px]">
                        <select
                            value={roleFilter}
                            onChange={handleRoleFilterChange}
                            className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                        >
                            <option value="">All Roles</option>
                            {roles.map(role => (
                                <option key={role} value={role}>
                                    {role}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-8 flex flex-col">
                    <Table.Root className='uppercase'>
                        <Table.Header>
                            <tr>
                                <Table.Cell header>
                                    <div className='cursor-pointer flex justify-center items-center' onClick={() => handleSort('name')}>
                                        <span>User</span>
                                        <span className="ml-1 flex-shrink-0 w-4">
                                            {sortField === 'name' && (
                                                sortOrder === 'asc' 
                                                    ? <ChevronUp className="h-4 w-4" /> 
                                                    : <ChevronDown className="h-4 w-4" />
                                            )}
                                        </span>
                                    </div>
                                </Table.Cell>
                                <Table.Cell header>
                                    <div className='cursor-pointer flex justify-center items-center' onClick={() => handleSort('email')}>
                                        <span>Email</span>
                                        <span className="ml-1 flex-shrink-0 w-4">
                                            {sortField === 'email' && (
                                                sortOrder === 'asc' 
                                                    ? <ChevronUp className="h-4 w-4" /> 
                                                    : <ChevronDown className="h-4 w-4" />
                                            )}
                                        </span>
                                    </div>
                                </Table.Cell>
                                <Table.Cell header>
                                    <div className='cursor-pointer flex justify-center items-center' onClick={() => handleSort('role')}>
                                        <span>Role</span>
                                        <span className="ml-1 flex-shrink-0 w-4">
                                            {sortField === 'role' && (
                                                sortOrder === 'asc' 
                                                    ? <ChevronUp className="h-4 w-4" /> 
                                                    : <ChevronDown className="h-4 w-4" />
                                            )}
                                        </span>
                                    </div>
                                </Table.Cell>
                                <Table.Cell header>
                                    <div className='cursor-pointer flex justify-center items-center' onClick={() => handleSort('created_at')}>
                                        <span>Created At</span>
                                        <span className="ml-1 flex-shrink-0 w-4">
                                            {sortField === 'created_at' && (
                                                sortOrder === 'asc' 
                                                    ? <ChevronUp className="h-4 w-4" /> 
                                                    : <ChevronDown className="h-4 w-4" />
                                            )}
                                        </span>
                                    </div>
                                </Table.Cell>
                                <Table.Cell header>
                                    <div className='cursor-pointer flex justify-center items-center'>
                                        <span>Status</span>
                                    </div>
                                </Table.Cell>
                                <Table.Cell header>
                                    <div className="text-center">Actions</div>
                                </Table.Cell>
                            </tr>
                        </Table.Header>
                        <Table.Body 
                            isLoading={loading} 
                            colSpan={6}
                            emptyMessage="No users found"
                        >
                            {usersData.map((user) => (
                                <Table.Row key={user.id}>
                                    <Table.Cell>
                                        <div className="flex items-center">
                                            <div className={`flex-shrink-0 h-8 w-8 rounded-full ${getAvatarColor(user.name)} flex items-center justify-center text-white font-medium`}>
                                                {getUserInitials(user.name)}
                                            </div>
                                            <div className="ml-4">
                                                <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                                            </div>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>{user.email}</Table.Cell>
                                    <Table.Cell className='text-center'>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            user.role === 'Admin' 
                                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' 
                                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                        }`}>
                                            {user.role === 'Admin' && <Shield className="w-3 h-3 mr-1" />}
                                            {user.role}
                                        </span>
                                    </Table.Cell>
                                    <Table.Cell className='text-center'>
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </Table.Cell>
                                    <Table.Cell className='text-center'>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            user.email_verified_at 
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                        }`}>
                                            {user.email_verified_at ? 'Verified' : 'Pending'}
                                        </span>
                                    </Table.Cell>
                                    <Table.Cell className='text-center'>
                                        <div className="flex justify-center space-x-2">
                                            <button 
                                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                onClick={() => openViewModal(user)}
                                            >
                                                <Eye className="h-4 w-4" />
                                                <span className="sr-only">View {user.name}</span>
                                            </button>
                                            <button 
                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                onClick={() => openEditModal(user)}
                                            >
                                                <Edit className="h-4 w-4" />
                                                <span className="sr-only">Edit {user.name}</span>
                                            </button>
                                            {isAdmin && (
                                                <button 
                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                    onClick={() => openDeleteModal(user)}
                                                >
                                                    <Trash className="h-4 w-4" />
                                                    <span className="sr-only">Delete {user.name}</span>
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

            {/* Modals */}
            <UserViewModal
                isOpen={viewModalOpen}
                user={userToView}
                onClose={closeViewModal}
                showEditButton={true}
                onEdit={handleEditFromViewModal}
            />

            <UserEditModal 
                isOpen={editModalOpen}
                user={userToEdit}
                onClose={closeEditModal}
                roles={roles}
                onSuccess={handleEditSuccess}
                isAdmin={isAdmin}
            />

            <UserAddModal
                isOpen={addModalOpen}
                onClose={closeAddModal}
                roles={roles}
                onSuccess={handleAddSuccess}
                isAdmin={isAdmin}
            />

            {isAdmin && (
                <UserDeleteModal
                    isOpen={deleteModalOpen}
                    onClose={closeDeleteModal}
                    user={userToDelete}
                    onSuccess={handleDeleteSuccess}
                    routeName="user-management.destroy"
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
