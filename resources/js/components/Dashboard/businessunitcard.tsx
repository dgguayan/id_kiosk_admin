import * as React from 'react';
import { Link } from '@inertiajs/react';

interface BusinessUnit {
    id: number;
    code: string;
    name: string;
    totalEmployees: number;
    logoUrl?: string;
    idCompletionPercentage: number;
}

interface BusinessUnitCardProps {
    unit: BusinessUnit;
    isMainHQ: boolean;
}

const BusinessUnitCard: React.FC<BusinessUnitCardProps> = ({ unit, isMainHQ }) => {
    const getLogoPlaceholder = (code: string) => {
        const colors: Record<string, string> = {
            'MMHI': 'bg-blue-600',
            'MMEI': 'bg-green-600',
            'MMFI': 'bg-purple-600',
            'MMHC': 'bg-red-600',
            'MMDC': 'bg-yellow-600',
        };
        
        return (
            <div className={`${colors[code] || 'bg-gray-600'} h-16 w-16 flex items-center justify-center rounded-md text-white font-bold text-sm`}>
                {code}
            </div>
        );
    };

    // Generate the href that will redirect to employee list with the business unit filter applied
    const employeeFilterHref = `/employee?businessunit_id=${unit.id}`;

    return (
        <Link href={employeeFilterHref} className="block transition-transform hover:-translate-y-1">
            <div className={`relative ${isMainHQ ? 'mb-8' : ''} overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-gray-900 transition-colors`}>
                <div className="p-4 md:p-6">
                    <div className="flex justify-between items-start">
                        <div className="flex-1 mr-3">
                            <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{unit.code}</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">{unit.name}</p>
                            
                            <div className="mt-4">
                                <div className="flex items-center">
                                    <span className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{unit.totalEmployees}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 ml-2 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm">Total Employees</p>
                            </div>
                        </div>
                        <div className="flex-shrink-0 h-16 w-16 flex items-center justify-center">
                            {unit.logoUrl ? (
                                <img 
                                    src={unit.logoUrl} 
                                    alt={`${unit.name} logo`}
                                    className="max-h-16 max-w-16 h-auto w-auto object-contain filter dark:invert"
                                />
                            ) : (
                                getLogoPlaceholder(unit.code)
                            )}
                        </div>
                    </div>
                    
                    <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                            <span>ID Completion</span>
                            <span>{unit.idCompletionPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div 
                                className="bg-blue-500 dark:bg-blue-600 h-1.5 rounded-full transition-all" 
                                style={{ width: `${unit.idCompletionPercentage}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default BusinessUnitCard;