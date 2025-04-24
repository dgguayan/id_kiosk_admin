import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { XCircle, CheckCircle } from 'lucide-react';
import { Table } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { Search, Eye, Trash, RefreshCw } from 'lucide-react';
import { debounce } from 'lodash';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Activity Logs',
        href: '/activity-log',
    },
];

interface User {
    id: number;
    name: string;
}

interface ActivityLog {
    id: number;
    user_id: number | null;
    user?: User;
    action: string;
    description: string | null;
    model_type: string | null;
    model_id: string | null;
    ip_address: string | null;
    user_agent: string | null;
    properties: any | null;
    created_at: string;
    updated_at: string;
}

interface PageMeta {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
}

export default function ActivityLogIndex({ 
    logs = { data: [] }, 
    users = [],
    actionTypes = [],
    filters = {}
}: { 
    logs?: { 
        data: ActivityLog[], 
        meta?: PageMeta 
    },
    users?: User[],
    actionTypes?: string[],
    filters?: {
        search?: string;
        user_id?: string;
        action?: string;
        sort_by?: string;
        sort_direction?: 'asc' | 'desc';
        page?: number;
    }
}) {
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(logs.meta?.current_page || 1);
    const [lastPage, setLastPage] = useState(logs.meta?.last_page || 1);
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [sortField, setSortField] = useState<string>(filters?.sort_by || 'created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(filters?.sort_direction || 'desc');
    const [userFilter, setUserFilter] = useState(filters?.user_id || '');
    const [actionFilter, setActionFilter] = useState(filters?.action || '');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
    const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

    useEffect(() => {
        setLoading(false);
        if (logs.meta) {
            setCurrentPage(logs.meta.current_page);
            setLastPage(logs.meta.last_page);
        }
    }, [logs]);
    
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        setLoading(true);
        router.get(route('activity-log.index', { 
            page, 
            search: searchQuery,
            user_id: userFilter,
            action: actionFilter,
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
        router.get(route('activity-log.index', { 
            search: query, 
            page: 1,
            user_id: userFilter,
            action: actionFilter,
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

    const handleUserFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setUserFilter(value);
        setCurrentPage(1);
        setLoading(true);
        router.get(route('activity-log.index', { 
            page: 1, 
            search: searchQuery,
            user_id: value,
            action: actionFilter,
            sort_by: sortField,
            sort_direction: sortOrder
        }), {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => setLoading(false),
        });
    };

    const handleActionFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setActionFilter(value);
        setCurrentPage(1);
        setLoading(true);
        router.get(route('activity-log.index', { 
            page: 1, 
            search: searchQuery,
            user_id: userFilter,
            action: value,
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
        router.get(route('activity-log.index', { 
            page: currentPage, 
            search: searchQuery,
            user_id: userFilter,
            action: actionFilter,
            sort_by: field,
            sort_direction: newDirection
        }), {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => setLoading(false),
        });
    };

    const handleClearLogs = () => {
        setClearConfirmOpen(true);
    };

    const confirmClearLogs = () => {
        router.delete(route('activity-log.clear-all'), {
            onSuccess: () => {
                setClearConfirmOpen(false);
                setSuccessMessage('All activity logs have been cleared.');
                setTimeout(() => {
                    setSuccessMessage(null);
                }, 3000);
            }
        });
    };

    const openLogDetails = (log: ActivityLog) => {
        setSelectedLog(log);
        setIsModalOpen(true);
    };

    const closeLogDetailsModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedLog(null), 300);
    };

    const formatDateTime = (dateString: string) => {
        return format(new Date(dateString), 'MMM d, yyyy HH:mm:ss');
    };

    const formatActionType = (action: string) => {
        return action
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const getActionBadgeColor = (action: string) => {
        switch(true) {
            case action.includes('created'):
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case action.includes('updated'):
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case action.includes('deleted'):
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            case action.includes('login'):
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
            case action.includes('logout'):
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case action.includes('view'):
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Activity Logs" />
            
            <div className="px-4 sm:px-6 lg:px-8 mt-3">
                <div className="sm:flex sm:items-center">
                    <div className="sm:flex-auto">
                        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">Activity Logs</h1>
                        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                            A comprehensive history of all user activities and system events.
                        </p>
                    </div>

                    <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                        <button
                            type="button"
                            onClick={handleClearLogs}
                            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto dark:bg-red-700 dark:hover:bg-red-800 dark:focus:ring-red-600"
                        >
                            <Trash className="h-4 w-4" /> Clear All Logs
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
                                placeholder="Search logs..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                        </div>
                    </div>
                    
                    <div className="min-w-[200px]">
                        <select
                            value={userFilter}
                            onChange={handleUserFilterChange}
                            className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                        >
                            <option value="">All Users</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id.toString()}>
                                    {user.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="min-w-[200px]">
                        <select
                            value={actionFilter}
                            onChange={handleActionFilterChange}
                            className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                        >
                            <option value="">All Actions</option>
                            {actionTypes.map(action => (
                                <option key={action} value={action}>
                                    {formatActionType(action)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="ml-auto">
                        <button
                            type="button"
                            onClick={() => router.reload({ only: ['logs'] })}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                            <RefreshCw className="h-4 w-4 mr-1.5" />
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="mt-8 flex flex-col">
                    <Table.Root>
                        <Table.Header>
                            <tr>
                                <Table.Cell header>
                                    <div className='cursor-pointer flex items-center' onClick={() => handleSort('created_at')}>
                                        <span>Date & Time</span>
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
                                    <div className='cursor-pointer flex items-center' onClick={() => handleSort('user_id')}>
                                        <span>User</span>
                                        <span className="ml-1 flex-shrink-0 w-4">
                                            {sortField === 'user_id' && (
                                                sortOrder === 'asc' 
                                                    ? <ChevronUp className="h-4 w-4" /> 
                                                    : <ChevronDown className="h-4 w-4" />
                                            )}
                                        </span>
                                    </div>
                                </Table.Cell>
                                <Table.Cell header>
                                    <div className='cursor-pointer flex items-center' onClick={() => handleSort('action')}>
                                        <span>Activity</span>
                                        <span className="ml-1 flex-shrink-0 w-4">
                                            {sortField === 'action' && (
                                                sortOrder === 'asc' 
                                                    ? <ChevronUp className="h-4 w-4" /> 
                                                    : <ChevronDown className="h-4 w-4" />
                                            )}
                                        </span>
                                    </div>
                                </Table.Cell>
                                <Table.Cell header>Description</Table.Cell>
                                <Table.Cell header>IP Address</Table.Cell>
                                <Table.Cell header className="text-right">Actions</Table.Cell>
                            </tr>
                        </Table.Header>
                        <Table.Body 
                            isLoading={loading} 
                            colSpan={6}
                            emptyMessage="No activity logs found"
                        >
                            {logs.data.map((log) => (
                                <Table.Row key={log.id}>
                                    <Table.Cell className="whitespace-nowrap">
                                        {formatDateTime(log.created_at)}
                                    </Table.Cell>
                                    <Table.Cell>
                                        {log.user ? log.user.name : 'System'}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionBadgeColor(log.action)}`}>
                                            {formatActionType(log.action)}
                                        </span>
                                    </Table.Cell>
                                    <Table.Cell className="max-w-xs truncate">
                                        {log.description || '-'}
                                    </Table.Cell>
                                    <Table.Cell>
                                        {log.ip_address || '-'}
                                    </Table.Cell>
                                    <Table.Cell className='text-right'>
                                        <button 
                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                                            onClick={() => openLogDetails(log)}
                                        >
                                            <Eye className="h-4 w-4" />
                                            <span className="sr-only">View Log Details</span>
                                        </button>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                    
                    {logs.meta && (
                        <Pagination 
                            currentPage={currentPage}
                            lastPage={lastPage}
                            onPageChange={handlePageChange}
                            className="mt-5 mb-5"
                        />
                    )}
                </div>
            </div>

            {/* Log Details Modal */}
            <Dialog
                open={isModalOpen}
                onOpenChange={closeLogDetailsModal}
            >
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Activity Log Details</DialogTitle>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Date & Time</h3>
                                <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatDateTime(selectedLog.created_at)}</p>
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">User</h3>
                                <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedLog.user ? selectedLog.user.name : 'System'}</p>
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Activity Type</h3>
                                <p className="mt-1">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionBadgeColor(selectedLog.action)}`}>
                                        {formatActionType(selectedLog.action)}
                                    </span>
                                </p>
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">IP Address</h3>
                                <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedLog.ip_address || '-'}</p>
                            </div>
                            
                            <div className="md:col-span-2">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                                <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedLog.description || '-'}</p>
                            </div>
                            
                            {selectedLog.model_type && (
                                <div className="md:col-span-2">
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Related Resource</h3>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {selectedLog.model_type.split('\\').pop()} ID: {selectedLog.model_id || '-'}
                                    </p>
                                </div>
                            )}
                            
                            <div className="md:col-span-2">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">User Agent</h3>
                                <p className="mt-1 text-sm text-gray-900 dark:text-white max-h-20 overflow-y-auto">
                                    {selectedLog.user_agent || '-'}
                                </p>
                            </div>

                            {selectedLog.properties && (
                                <div className="md:col-span-2">
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Additional Data</h3>
                                    <pre className="mt-1 text-xs text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-x-auto">
                                        {JSON.stringify(selectedLog.properties, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>

                        <div className="mt-5 sm:mt-6 flex justify-end">
                            <Button variant="outline" onClick={closeLogDetailsModal}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
                </DialogContent>
            </Dialog>

            {/* Confirm Clear All Logs Modal */}
            <Dialog
                open={clearConfirmOpen}
                onOpenChange={() => setClearConfirmOpen(false)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Clear All Activity Logs</DialogTitle>
                    </DialogHeader>
                    <div className="mt-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Are you sure you want to clear all activity logs? This action cannot be undone.
                        </p>
                    </div>

                    <div className="mt-5 sm:mt-6 flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setClearConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmClearLogs}>
                            Clear All Logs
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

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
