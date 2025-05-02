import { useState } from 'react';
import { router } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface Employee {
    uuid: number;
    employee_firstname: string;
    employee_lastname: string;
}

interface EmployeeDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee | null;
    onSuccess?: () => void;
    routeName?: string; // Allow custom route name for different controllers
}

const EmployeeDeleteModal: React.FC<EmployeeDeleteModalProps> = ({
    isOpen,
    onClose,
    employee,
    onSuccess,
    routeName = 'employee.destroy' // Default to employee.destroy route
}) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const confirmDelete = () => {
        if (employee && !isDeleting) {
            setIsDeleting(true);
            
            router.delete(route(routeName, employee.uuid), {
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

    if (!employee) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                onClose();
            }
        }}>
            <DialogContent className="sm:max-w-md">
                <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                        <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                        <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                            Delete Employee
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500 dark:text-gray-300">
                                Are you sure you want to delete <span className="font-bold text-red-600 dark:text-red-400">{employee.employee_firstname} {employee.employee_lastname}</span>? This action cannot be undone.
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
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default EmployeeDeleteModal;
