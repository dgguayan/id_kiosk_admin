import BusinessUnitCard from '@/components/Dashboard/businessunitcard';
import StatCard from '@/components/Dashboard/statcard';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

const staticDashboardData = {
    inactiveEmployees: 25,
    pendingIDs: 25,
    totalWithID: 0,
    businessUnits: [
        {
            id: 1,
            code: 'MMHI',
            name: 'Main Headquarters',
            totalEmployees: 8,
            idCompletionPercentage: 0,
            logoUrl: '/images/logos/mmhi-logo.png'
        },
        {
            id: 2,
            code: 'MMEI',
            name: 'Enterprises, Inc.',
            totalEmployees: 13,
            idCompletionPercentage: 0,
            logoUrl: '/images/logos/mmei-logo.png'
        },
        {
            id: 3,
            code: 'MMFI',
            name: 'Farms Incorporated',
            totalEmployees: 14,
            idCompletionPercentage: 0,
            logoUrl: '/images/logos/mmfi-logo.png'
        },
        {
            id: 4,
            code: 'MMHC',
            name: 'Hospitality Corporation',
            totalEmployees: 4,
            idCompletionPercentage: 0,
            logoUrl: '/images/logos/mmhc-logo.png'
        },
        {
            id: 5,
            code: 'MMDC',
            name: 'Development Corporation',
            totalEmployees: 11,
            idCompletionPercentage: 0,
            logoUrl: '/images/logos/mmdc-logo.png'
        }
    ]
};

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employee ID Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header section */}
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold">Employee ID Dashboard</h1>
                    <div className="text-sm text-gray-500 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Overview of employee ID status and distribution across business units
                    </div>
                </div>

                {/* Summary statistics cards */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <StatCard 
                        title="Inactive Employees" 
                        value={staticDashboardData.inactiveEmployees} 
                        iconType="inactive"
                    />
                    <StatCard 
                        title="Pending Existing IDs" 
                        value={staticDashboardData.pendingIDs} 
                        iconType="pending"
                    />
                    <StatCard 
                        title="Total Employees with ID" 
                        value={staticDashboardData.totalWithID} 
                        iconType="total"
                    />
                </div>

                {/* Business units section */}
                <div>
                    {/* Business Units Heading */}
                    <h2 className="text-xl font-semibold mb-4">M. Montesclaros Business Units</h2>
                    
                    {/* Main HQ Card - Larger */}
                    {staticDashboardData.businessUnits
                        .filter(unit => unit.code === 'MMHI')
                        .map(unit => (
                            <BusinessUnitCard 
                                key={unit.id}
                                unit={unit}
                                isMainHQ={true}
                            />
                        ))
                    }

                    {/* Other Business Units */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                        {staticDashboardData.businessUnits
                            .filter(unit => unit.code !== 'MMHI')
                            .map(unit => (
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
