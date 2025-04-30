import React from 'react';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    description: string;
    header?: React.ReactNode;
}

export default function AuthLayout({ children, title, description, header }: AuthLayoutProps) {
    return (
        <div className="container mx-auto flex h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                {header && header}
                <div className="text-center">
                    <h1 className="text-2xl font-bold tracking-tight dark:text-white text-gray-900">
                        {title}
                    </h1>
                    <p className="mt-2 text-sm dark:text-gray-300 text-gray-600">
                        {description}
                    </p>
                </div>
                <div className="mt-8">{children}</div>
            </div>
        </div>
    );
}
