import { useState } from 'react';
import { router } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface EmployeeBulkDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedCount: number;
    selectedUuids: string[];
    onSuccess?: () => void;
    routeName?: string; // Allow custom route name for different controllers
}

const EmployeeBulkDeleteModal: React.FC<EmployeeBulkDeleteModalProps> = ({
    isOpen,
    onClose,
    selectedCount,
    selectedUuids,
    onSuccess,
    routeName = 'employee.bulk-destroy' // Default to employee bulk-destroy route
}) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const confirmBulkDelete = () => {
        if (selectedCount > 0 && !isDeleting) {
            setIsDeleting(true);
            
            router.post(route(routeName), { uuids: selectedUuids }, {
                onSuccess: () => {
                    setIsDeleting(false);
                    onClose();
                    
                    if (onSuccess) {
                        onSuccess();
                    }
                },
                onError: () => {
                    setIsDeleting(false);
                    onClose();
                }
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                onClose();
            }
        }}>
            <DialogContent className="sm:max-w-lg">
                <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                        <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                        <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                            Bulk Delete Employees
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500 dark:text-gray-300">
                                Are you sure you want to delete <span className="font-bold text-red-600 dark:text-red-400">{selectedCount}</span> selected employees? This action cannot be undone.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                        type="button"
                        disabled={isDeleting}
                        className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 dark:bg-red-700 dark:hover:bg-red-600 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={confirmBulkDelete}
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
                            'Delete All Selected'
                        )}
                    </button>
                    <button
                        type="button"
                        disabled={isDeleting}
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600 sm:mt-0 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default EmployeeBulkDeleteModal;
