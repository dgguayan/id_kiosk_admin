import BusinessUnitCard from '@/components/Dashboard/businessunitcard';
import StatCard from '@/components/Dashboard/statcard';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { ChartArea } from 'lucide-react';

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
    const { dashboardData = staticDashboardData } = usePage().props as any;
    
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
