import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import SlideAuth from '@/components/SlideAuth';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

    // Auth component is directly embedded, so we just need 
    // this function to switch between modes
    const switchAuthMode = (mode: 'login' | 'register') => {
        setAuthMode(mode);
    };

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            
            <div 
                className="flex min-h-screen flex-col bg-[#FDFDFC] text-[#1b1b18] dark:bg-[#0a0a0a] dark:text-[#EDEDEC] bg-cover bg-center" 
                style={{ backgroundImage: 'url(/images/designs/MMHI_Background.png)' }}
            >
                <div className="flex flex-1 p-4 lg:p-8">
                    <div className="mx-auto flex w-full max-w-7xl flex-col lg:flex-row lg:gap-12">
                        {/* Authentication section - directly embedded in page */}
                        {!auth.user && (
                            <div className="mb-8 flex-1 flex justify-center items-center lg:mb-0 lg:order-2">
                                <SlideAuth initialMode={authMode} embedded={true} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
