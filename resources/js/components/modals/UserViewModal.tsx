import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { X, Edit, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
    email_verified_at: string | null;
}

interface UserViewModalProps {
    isOpen: boolean;
    user: User | null;
    onClose: () => void;
    showEditButton?: boolean;
    onEdit?: (user: User) => void;
}

export default function UserViewModal({ isOpen, user, onClose, showEditButton = false, onEdit }: UserViewModalProps) {
    if (!user) return null;

    const handleEdit = () => {
        if (onEdit) {
            onEdit(user);
        }
    };

    // Get time since account creation
    const accountAge = formatDistanceToNow(
        new Date(user.created_at),
        { addSuffix: true }
    );

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

    const getUserInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>User Details</DialogTitle>
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

                <div className="space-y-6 py-4">
                    <div className="flex items-center justify-center">
                        <div className={`h-24 w-24 rounded-full ${getAvatarColor(user.name)} flex items-center justify-center text-white text-2xl font-semibold`}>
                            {getUserInitials(user.name)}
                        </div>
                    </div>
                    
                    <div className="text-center">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{user.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700"></div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</p>
                            <p className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                                {user.role === 'Admin' && <Shield className="w-3 h-3 mr-1" />}
                                {user.role}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    user.email_verified_at 
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                }`}>
                                    {user.email_verified_at ? 'Verified' : 'Pending Verification'}
                                </span>
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</p>
                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                {new Date(user.created_at).toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Age</p>
                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                {accountAge}
                            </p>
                        </div>
                    </div>
                </div>
                
                <DialogFooter>
                    {showEditButton && onEdit && (
                        <button
                            type="button"
                            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto dark:bg-indigo-700 dark:hover:bg-indigo-800"
                            onClick={handleEdit}
                        >
                            <Edit className="h-4 w-4" /> Edit User
                        </button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
