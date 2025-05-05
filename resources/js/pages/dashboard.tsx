import BusinessUnitCard from '@/components/Dashboard/businessunitcard';
import StatCard from '@/components/Dashboard/statcard';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage, Link } from '@inertiajs/react';
import { ChartArea, AlertTriangle, ClockIcon } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

const staticDashboardData = {
    totalEmployees: 0,
    pendingIDs: 0,
    totalIDCounter: 0,
    businessUnits: [
        {
            id: 1,
            code: 'MMHI',
            name: 'Holdings Incorporated',
            totalEmployees: 0,
            idCompletionPercentage: 0,
            logoUrl: '/images/logos/mmhi-logo.png'
        },
        {
            id: 2,
            code: 'MMFI',
            name: 'Farms Incorporated',
            totalEmployees: 0,
            idCompletionPercentage: 0,
            logoUrl: '/images/logos/mmfi-logo.png'
            
        },
        {
            id: 3,
            code: 'MMEI',
            name: 'Enterprises Incorporated',
            totalEmployees: 0,
            idCompletionPercentage: 0,
            logoUrl: '/images/logos/mmei-logo.png'
        },
        {
            id: 4,
            code: 'MMHC',
            name: 'Hospitality Corporation',
            totalEmployees: 0,
            idCompletionPercentage: 0,
            logoUrl: '/images/logos/mmhc-logo.png'
        },
        {
            id: 5,
            code: 'MMDC',
            name: 'Development Corporation',
            totalEmployees: 0,
            idCompletionPercentage: 0,
            logoUrl: '/images/logos/mmdc-logo.png'
        }
    ]
};

export default function Dashboard() {
    const { dashboardData = staticDashboardData, expiringIDs = [] } = usePage().props as any;
    
    const {
        totalEmployees, 
        pendingIDs, 
        totalIDCounter, 
        businessUnits
    } = dashboardData;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employee ID Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold">Employee ID Dashboard</h1>
                    <div className="text-sm text-gray-500 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Overview of employee ID status and distribution across business units
                    </div>
                </div>

                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <StatCard 
                        title="Pending IDs" 
                        value={pendingIDs}
                        iconType="pending"
                        href="/pending-id"
                    />
                    <StatCard 
                        title="Total Employees" 
                        value={totalEmployees}
                        iconType="total"
                        href="/employee"
                    />
                    <StatCard 
                        title="Total ID Processed" 
                        value={totalIDCounter}
                        iconType="processed"
                        href="/employee"
                    />
                </div>

                {/* Expiring IDs Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div className="flex items-center">
                            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">IDs Requiring Attention</h3>
                        </div>
                        <Link href="/employee" className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400">
                            View All
                        </Link>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Employee
                                    </th>
                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Business Unit
                                    </th>
                                    <th scope="col" className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Status
                                    </th>
                                    <th scope="col" className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Expiry Date
                                    </th>
                                    <th scope="col" className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                                {expiringIDs && expiringIDs.length > 0 ? (
                                    expiringIDs.map((employee: any) => {
                                        // Calculate expiry date and status
                                        const exportDate = new Date(employee.id_last_exported_at);
                                        const expiryDate = new Date(exportDate);
                                        expiryDate.setFullYear(expiryDate.getFullYear() + 2);
                                        
                                        const today = new Date();
                                        const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                        const formattedExpiryDate = expiryDate.toLocaleDateString();
                                        
                                        return (
                                            <tr key={employee.uuid}>
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {employee.employee_lastname}, {employee.employee_firstname} {employee.employee_middlename?.[0]}. {employee.employee_name_extension}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 dark:text-white">{employee.businessunit_name}</div>
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-center">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        daysRemaining <= 0 
                                                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' 
                                                            : daysRemaining <= 30
                                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' 
                                                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                    }`}>
                                                        {daysRemaining <= 0 
                                                            ? 'Expired' 
                                                            : daysRemaining <= 30
                                                                ? 'Expiring Soon' 
                                                                : 'Valid'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">
                                                    <div className="flex items-center justify-center">
                                                        <ClockIcon className="h-4 w-4 mr-1" />
                                                        {formattedExpiryDate}
                                                        <span className={`ml-2 px-1.5 py-0.5 text-xs rounded ${
                                                            daysRemaining <= 0 
                                                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' 
                                                                : daysRemaining <= 30
                                                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' 
                                                                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                        }`}>
                                                            {daysRemaining <= 0 
                                                                ? `${Math.abs(daysRemaining)} days overdue` 
                                                                : `${daysRemaining} days left`
                                                            }
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-center text-sm font-medium">
                                                    <Link 
                                                        href={`/employee/${employee.uuid}/id-preview`}
                                                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                    >
                                                        Renew ID
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                            No expiring IDs found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div>
                    <h2 className="text-xl font-semibold mb-4">All of M. Montesclaros Business Units</h2>
                    
                    {businessUnits
                        .filter((unit: { name: string; }) => unit.name === 'MMHI')
                        .map((unit: typeof businessUnits[0]) => (
                            <BusinessUnitCard 
                                key={unit.id}
                                unit={unit}
                                isMainHQ={true}
                            />
                        ))
                    }

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                        {businessUnits
                            .filter((unit: { name: string; }) => unit.name !== 'MMHI')
                            .map((unit: typeof businessUnits[0]) => (
                                <BusinessUnitCard 
                                    key={unit.id}
                                    unit={unit}
                                    isMainHQ={false}
                                />
                            ))
                        }
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
