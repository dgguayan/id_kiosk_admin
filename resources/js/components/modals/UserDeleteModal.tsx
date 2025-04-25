import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { X, AlertTriangle } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface UserDeleteModalProps {
    isOpen: boolean;
    user: User | null;
    onClose: () => void;
    onSuccess: () => void;
    routeName: string;
}

export default function UserDeleteModal({ isOpen, user, onClose, onSuccess, routeName }: UserDeleteModalProps) {
    const [processing, setProcessing] = useState(false);
    
    if (!user) return null;
    
    const handleDelete = () => {
        setProcessing(true);
        router.delete(route(routeName, user.id), {
            preserveScroll: true,
            onSuccess: () => {
                setProcessing(false);
                onClose();
                onSuccess();
            },
            onError: () => {
                setProcessing(false);
            },
        });
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Delete User</DialogTitle>
                    <div>
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 inline-flex items-center justify-center rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                        >
                            <span className="sr-only">Close</span>
                            <X className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </div>
                </DialogHeader>

                <div className="py-4">
                    <div className="flex items-center justify-center text-center mb-4">
                        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-200" aria-hidden="true" />
                        </div>
                    </div>
                    <div className="mt-3 text-center">
                        <DialogDescription>
                            <p className="text-lg font-medium text-gray-900 dark:text-white">Delete {user.name}?</p>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                Are you sure you want to delete this user? This action cannot be undone. All data associated with this user will be permanently removed from the system.
                            </p>
                        </DialogDescription>
                    </div>
                </div>
                
                <DialogFooter>
                    <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-700 dark:hover:bg-red-800"
                        onClick={handleDelete}
                        disabled={processing}
                    >
                        {processing ? 'Deleting...' : 'Delete User'}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
