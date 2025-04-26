import { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';

type SlideAuthProps = {
    initialMode: 'login' | 'forgot';
    embedded?: boolean; // Prop to determine if it's embedded in the page
    onClose?: () => void;
};

export default function SlideAuth({ initialMode, embedded = false, onClose }: SlideAuthProps) {
    const [mode, setMode] = useState<'login' | 'forgot'>(initialMode);
    const [isMobile, setIsMobile] = useState(false);
    
    // Login form
    const loginForm = useForm<{
        email: string;
        password: string;
        remember: boolean;
    }>({
        email: '',
        password: '',
        remember: false,
    });

    // Forgot password form
    const forgotPasswordForm = useForm({
        email: '',
    });

    // Check screen size
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        
        return () => {
            window.removeEventListener('resize', checkScreenSize);
        };
    }, []);

    // Handle login submission
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        loginForm.post(route('login'), {
            onFinish: () => loginForm.reset('password'),
        });
    };

    // Handle forgot password submission
    const handleForgotPassword = (e: React.FormEvent) => {
        e.preventDefault();
        forgotPasswordForm.post(route('password.email'), {
            onFinish: () => forgotPasswordForm.reset(),
        });
    };

    // If embedded, render without modal wrapper
    if (embedded) {
        return (
            <div 
                className={`bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-hidden relative w-full ${isMobile ? 'max-w-md' : 'max-w-4xl'}`}
                style={{ 
                    height: isMobile ? 'auto' : '550px'
                }}
            >
                {/* Container with animation */}
                <div className={`${isMobile ? 'flex flex-col' : 'flex h-full'}`}>
                    {/* For mobile: Tabs at top */}
                    {isMobile && (
                        <div className="flex border-b dark:border-gray-700">
                            <button 
                                className={`flex-1 py-4 text-center font-semibold ${mode === 'login' 
                                    ? 'text-red-500 border-b-2 border-red-500' 
                                    : 'text-gray-500 dark:text-gray-400'}`}
                                onClick={() => setMode('login')}
                            >
                                Sign In
                            </button>
                            <button 
                                className={`flex-1 py-4 text-center font-semibold ${mode === 'forgot' 
                                    ? 'text-purple-500 border-b-2 border-purple-500' 
                                    : 'text-gray-500 dark:text-gray-400'}`}
                                onClick={() => setMode('forgot')}
                            >
                                Forgot Password
                            </button>
                        </div>
                    )}

                    {/* For desktop: Sliding panel */}
                    {!isMobile && (
                        <div className="w-full flex relative h-full">
                            {/* Left panel - Image/Welcome */}
                            <div 
                                className={`w-1/2 absolute top-0 bottom-0 transition-all duration-700 ease-in-out bg-gradient-to-br 
                                ${mode === 'login' ? 'from-gray-900 to-black left-0' : 'from-gray-900 to-black left-1/2'}`}
                            >
                                <div className="flex flex-col items-center justify-center h-full text-white p-8">
                                    <h2 className="text-3xl font-bold mb-4">
                                        {mode === 'login' ? 'Welcome to M.Montesclaros Kiosk ID!' : 'Forgot Your Password?'}
                                    </h2>
                                    <p className="text-center mb-8">
                                        {mode === 'login' 
                                            ? "Please sign in to start managing the employee IDs."
                                            : "Enter your email and we'll send you a reset link."}
                                    </p>
                                    <button 
                                        className="px-8 py-2 rounded-full bg-transparent border-2 border-white hover:bg-white/10 transition-all"
                                        onClick={() => setMode(mode === 'login' ? 'forgot' : 'login')}
                                    >
                                        {mode === 'login' ? 'Forgot Password' : 'Back to Login'}
                                    </button>
                                </div>
                            </div>

                            {/* Right panel - Forms */}
                            <div 
                                className={`w-1/2 absolute top-0 bottom-0 bg-white dark:bg-gray-900 transition-all duration-700 ease-in-out
                                ${mode === 'login' ? 'left-1/2' : 'left-0'}`}
                            >
                                {/* Login form */}
                                <div className={`h-full w-full absolute top-0 ${mode === 'login' ? 'opacity-100 visible' : 'opacity-0 invisible'} transition-all duration-500`}>
                                    <div className="flex flex-col items-center justify-center h-full p-8">
                                        <div className="w-full mb-4 flex justify-center">
                                            <img
                                                src="/images/designs/MMHI_01.png"
                                                alt="Logo"
                                                className="h-24 object-contain"
                                            />
                                        </div>
                                        <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">Sign In</h1>
                                        <form onSubmit={handleLogin} className="w-full max-w-sm">
                                            <div className="mb-4">
                                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                                <input
                                                    id="email"
                                                    type="email"
                                                    value={loginForm.data.email}
                                                    onChange={e => loginForm.setData('email', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                    placeholder="Your email"
                                                    required
                                                />
                                                {loginForm.errors.email && <div className="text-red-500 text-sm mt-1">{loginForm.errors.email}</div>}
                                            </div>

                                            <div className="mb-4">
                                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                                <input
                                                    id="password"
                                                    type="password"
                                                    value={loginForm.data.password}
                                                    onChange={e => loginForm.setData('password', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                    placeholder="Your password"
                                                    required
                                                />
                                                {loginForm.errors.password && <div className="text-red-500 text-sm mt-1">{loginForm.errors.password}</div>}
                                            </div>

                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center">
                                                    <input
                                                        id="remember-me"
                                                        name="remember-me"
                                                        type="checkbox"
                                                        checked={loginForm.data.remember}
                                                        onChange={e => loginForm.setData('remember', e.target.checked)}
                                                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                    />
                                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                                        Remember me
                                                    </label>
                                                </div>

                                                {/* <button 
                                                    type="button"
                                                    onClick={() => setMode('forgot')} 
                                                    className="text-sm font-medium text-red-600 hover:text-red-500 dark:text-red-400"
                                                >
                                                    Forgot password?
                                                </button> */}
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={loginForm.processing}
                                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                                            >
                                                {loginForm.processing ? 'Signing in...' : 'Sign in'}
                                            </button>
                                        </form>
                                    </div>
                                </div>

                                {/* Forgot password form */}
                                <div className={`h-full w-full absolute top-0 ${mode === 'forgot' ? 'opacity-100 visible' : 'opacity-0 invisible'} transition-all duration-500`}>
                                    <div className="flex flex-col items-center justify-center h-full p-8">
                                        <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-white">Reset Password</h1>
                                        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
                                            Enter your email address and we'll send you a link to reset your password.
                                        </p>
                                        <form onSubmit={handleForgotPassword} className="w-full max-w-sm">
                                            <div className="mb-6">
                                                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                                <input
                                                    id="forgot-email"
                                                    type="email"
                                                    value={forgotPasswordForm.data.email}
                                                    onChange={e => forgotPasswordForm.setData('email', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white"
                                                    placeholder="Your email"
                                                    required
                                                />
                                                {forgotPasswordForm.errors.email && <div className="text-red-500 text-sm mt-1">{forgotPasswordForm.errors.email}</div>}
                                            </div>

                                            {forgotPasswordForm.recentlySuccessful && (
                                                <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md text-sm">
                                                    Password reset link has been sent to your email.
                                                </div>
                                            )}

                                            <button
                                                type="submit"
                                                disabled={forgotPasswordForm.processing}
                                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                                            >
                                                {forgotPasswordForm.processing ? 'Sending...' : 'Send Reset Link'}
                                            </button>

                                            <div className="mt-4 text-center">
                                                <button 
                                                    type="button"
                                                    onClick={() => setMode('login')}
                                                    className="text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                                                >
                                                    Back to login
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Mobile view forms */}
                    {isMobile && (
                        <div className="p-6">
                            {/* Login form for mobile */}
                            {mode === 'login' && (
                                <div className="animate-fadeIn">
                                    <form onSubmit={handleLogin} className="w-full">
                                        <div className="mb-4">
                                            <label htmlFor="email-mobile" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                            <input
                                                id="email-mobile"
                                                type="email"
                                                value={loginForm.data.email}
                                                onChange={e => loginForm.setData('email', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                placeholder="Your email"
                                                required
                                            />
                                            {loginForm.errors.email && <div className="text-red-500 text-sm mt-1">{loginForm.errors.email}</div>}
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="password-mobile" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                            <input
                                                id="password-mobile"
                                                type="password"
                                                value={loginForm.data.password}
                                                onChange={e => loginForm.setData('password', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                placeholder="Your password"
                                                required
                                            />
                                            {loginForm.errors.password && <div className="text-red-500 text-sm mt-1">{loginForm.errors.password}</div>}
                                        </div>

                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center">
                                                <input
                                                    id="remember-me-mobile"
                                                    name="remember-me"
                                                    type="checkbox"
                                                    checked={loginForm.data.remember}
                                                    onChange={e => loginForm.setData('remember', e.target.checked)}
                                                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="remember-me-mobile" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                                    Remember me
                                                </label>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loginForm.processing}
                                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                                        >
                                            {loginForm.processing ? 'Signing in...' : 'Sign in'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Forgot password form for mobile */}
                            {mode === 'forgot' && (
                                <div className="animate-fadeIn">
                                    <form onSubmit={handleForgotPassword} className="w-full">
                                        <div className="mb-6">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                                Enter your email address and we'll send you a link to reset your password.
                                            </p>
                                            <label htmlFor="forgot-email-mobile" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                            <input
                                                id="forgot-email-mobile"
                                                type="email"
                                                value={forgotPasswordForm.data.email}
                                                onChange={e => forgotPasswordForm.setData('email', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white"
                                                placeholder="Your email"
                                                required
                                            />
                                            {forgotPasswordForm.errors.email && <div className="text-red-500 text-sm mt-1">{forgotPasswordForm.errors.email}</div>}
                                        </div>

                                        {forgotPasswordForm.recentlySuccessful && (
                                            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md text-sm">
                                                Password reset link has been sent to your email.
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={forgotPasswordForm.processing}
                                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                                        >
                                            {forgotPasswordForm.processing ? 'Sending...' : 'Send Reset Link'}
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Otherwise render as modal (original behavior)
    return (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={e => e.target === e.currentTarget && onClose?.()}
        >
            <div 
                className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden relative w-full max-w-md md:max-w-2xl lg:max-w-4xl"
                style={{ 
                    height: isMobile ? 'auto' : '550px'
                }}
            >
                {/* Close button */}
                <button 
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-10"
                    onClick={onClose}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Container with animation */}
                <div className={`${isMobile ? 'flex flex-col' : 'flex h-full'}`}>
                    {/* For mobile: Tabs at top */}
                    {isMobile && (
                        <div className="flex border-b dark:border-gray-700">
                            <button 
                                className={`flex-1 py-4 text-center font-semibold ${mode === 'login' 
                                    ? 'text-red-500 border-b-2 border-red-500' 
                                    : 'text-gray-500 dark:text-gray-400'}`}
                                onClick={() => setMode('login')}
                            >
                                Sign In
                            </button>
                            <button 
                                className={`flex-1 py-4 text-center font-semibold ${mode === 'forgot' 
                                    ? 'text-purple-500 border-b-2 border-purple-500' 
                                    : 'text-gray-500 dark:text-gray-400'}`}
                                onClick={() => setMode('forgot')}
                            >
                                Forgot Password
                            </button>
                        </div>
                    )}

                    {/* For desktop: Sliding panel */}
                    {!isMobile && (
                        <div className="w-full flex relative h-full">
                            {/* Left panel - Image/Welcome */}
                            <div 
                                className={`w-1/2 absolute top-0 bottom-0 transition-all duration-700 ease-in-out bg-gradient-to-br 
                                ${mode === 'login' ? 'from-black-500 to-black-500 left-0' : 'from-red-500 to-purple-600 left-1/2'}`}
                            >
                                <div className="flex flex-col items-center justify-center h-full text-white p-8">
                                    <h2 className="text-3xl font-bold mb-4">
                                        {mode === 'login' ? 'Welcome to M.Montesclaros Kiosk ID!' : 'Forgot Your Password?'}
                                    </h2>
                                    <p className="text-center mb-8">
                                        {mode === 'login' 
                                            ? "Can't remember your password? Click the button below to reset it."
                                            : "Remember your password? Sign in to access your account."}
                                    </p>
                                    <button 
                                        className="px-8 py-2 rounded-full bg-transparent border-2 border-white hover:bg-white/10 transition-all"
                                        onClick={() => setMode(mode === 'login' ? 'forgot' : 'login')}
                                    >
                                        {mode === 'login' ? 'Reset Password' : 'Back to Login'}
                                    </button>
                                </div>
                            </div>

                            {/* Right panel - Forms */}
                            <div 
                                className={`w-1/2 absolute top-0 bottom-0 bg-white dark:bg-gray-900 transition-all duration-700 ease-in-out
                                ${mode === 'login' ? 'left-1/2' : 'left-0'}`}
                            >
                                {/* Login form */}
                                <div className={`h-full w-full absolute top-0 ${mode === 'login' ? 'opacity-100 visible' : 'opacity-0 invisible'} transition-all duration-500`}>
                                    <div className="flex flex-col items-center justify-center h-full p-8">
                                        <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">Sign In</h1>
                                        <form onSubmit={handleLogin} className="w-full max-w-sm">
                                            <div className="mb-4">
                                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                                <input
                                                    id="email"
                                                    type="email"
                                                    value={loginForm.data.email}
                                                    onChange={e => loginForm.setData('email', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                    placeholder="Your email"
                                                    required
                                                />
                                                {loginForm.errors.email && <div className="text-red-500 text-sm mt-1">{loginForm.errors.email}</div>}
                                            </div>

                                            <div className="mb-4">
                                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                                <input
                                                    id="password"
                                                    type="password"
                                                    value={loginForm.data.password}
                                                    onChange={e => loginForm.setData('password', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                    placeholder="Your password"
                                                    required
                                                />
                                                {loginForm.errors.password && <div className="text-red-500 text-sm mt-1">{loginForm.errors.password}</div>}
                                            </div>

                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center">
                                                    <input
                                                        id="remember-me"
                                                        name="remember-me"
                                                        type="checkbox"
                                                        checked={loginForm.data.remember}
                                                        onChange={e => loginForm.setData('remember', e.target.checked)}
                                                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                    />
                                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                                        Remember me
                                                    </label>
                                                </div>

                                                {/* <button 
                                                    type="button"
                                                    onClick={() => setMode('forgot')} 
                                                    className="text-sm font-medium text-red-600 hover:text-red-500 dark:text-red-400"
                                                >
                                                    Forgot password?
                                                </button> */}
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={loginForm.processing}
                                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                            >
                                                {loginForm.processing ? 'Signing in...' : 'Sign in'}
                                            </button>
                                        </form>
                                    </div>
                                </div>

                                {/* Forgot password form */}
                                <div className={`h-full w-full absolute top-0 ${mode === 'forgot' ? 'opacity-100 visible' : 'opacity-0 invisible'} transition-all duration-500`}>
                                    <div className="flex flex-col items-center justify-center h-full p-8">
                                        <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-white">Reset Password</h1>
                                        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
                                            Enter your email address and we'll send you a link to reset your password.
                                        </p>
                                        <form onSubmit={handleForgotPassword} className="w-full max-w-sm">
                                            <div className="mb-6">
                                                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                                <input
                                                    id="forgot-email"
                                                    type="email"
                                                    value={forgotPasswordForm.data.email}
                                                    onChange={e => forgotPasswordForm.setData('email', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white"
                                                    placeholder="Your email"
                                                    required
                                                />
                                                {forgotPasswordForm.errors.email && <div className="text-red-500 text-sm mt-1">{forgotPasswordForm.errors.email}</div>}
                                            </div>

                                            {forgotPasswordForm.recentlySuccessful && (
                                                <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md text-sm">
                                                    Password reset link has been sent to your email.
                                                </div>
                                            )}

                                            <button
                                                type="submit"
                                                disabled={forgotPasswordForm.processing}
                                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                                            >
                                                {forgotPasswordForm.processing ? 'Sending...' : 'Send Reset Link'}
                                            </button>

                                            <div className="mt-4 text-center">
                                                <button 
                                                    type="button"
                                                    onClick={() => setMode('login')}
                                                    className="text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                                                >
                                                    Back to login
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Mobile view forms */}
                    {isMobile && (
                        <div className="p-6">
                            {/* Login form for mobile */}
                            {mode === 'login' && (
                                <div className="animate-fadeIn">
                                    <form onSubmit={handleLogin} className="w-full">
                                        <div className="mb-4">
                                            <label htmlFor="email-mobile" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                            <input
                                                id="email-mobile"
                                                type="email"
                                                value={loginForm.data.email}
                                                onChange={e => loginForm.setData('email', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                placeholder="Your email"
                                                required
                                            />
                                            {loginForm.errors.email && <div className="text-red-500 text-sm mt-1">{loginForm.errors.email}</div>}
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="password-mobile" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                            <input
                                                id="password-mobile"
                                                type="password"
                                                value={loginForm.data.password}
                                                onChange={e => loginForm.setData('password', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                placeholder="Your password"
                                                required
                                            />
                                            {loginForm.errors.password && <div className="text-red-500 text-sm mt-1">{loginForm.errors.password}</div>}
                                        </div>

                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center">
                                                <input
                                                    id="remember-me-mobile"
                                                    name="remember-me"
                                                    type="checkbox"
                                                    checked={loginForm.data.remember}
                                                    onChange={e => loginForm.setData('remember', e.target.checked)}
                                                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="remember-me-mobile" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                                    Remember me
                                                </label>
                                            </div>

                                            <button 
                                                type="button"
                                                onClick={() => setMode('forgot')} 
                                                className="text-sm font-medium text-red-600 hover:text-red-500 dark:text-red-400"
                                            >
                                                Forgot?
                                            </button>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loginForm.processing}
                                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            {loginForm.processing ? 'Signing in...' : 'Sign in'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Forgot password form for mobile */}
                            {mode === 'forgot' && (
                                <div className="animate-fadeIn">
                                    <form onSubmit={handleForgotPassword} className="w-full">
                                        <div className="mb-6">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                                Enter your email address and we'll send you a link to reset your password.
                                            </p>
                                            <label htmlFor="forgot-email-mobile" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                            <input
                                                id="forgot-email-mobile"
                                                type="email"
                                                value={forgotPasswordForm.data.email}
                                                onChange={e => forgotPasswordForm.setData('email', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white"
                                                placeholder="Your email"
                                                required
                                            />
                                            {forgotPasswordForm.errors.email && <div className="text-red-500 text-sm mt-1">{forgotPasswordForm.errors.email}</div>}
                                        </div>

                                        {forgotPasswordForm.recentlySuccessful && (
                                            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md text-sm">
                                                Password reset link has been sent to your email.
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={forgotPasswordForm.processing}
                                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                                        >
                                            {forgotPasswordForm.processing ? 'Sending...' : 'Send Reset Link'}
                                        </button>

                                        <div className="mt-4 text-center">
                                            <button 
                                                type="button"
                                                onClick={() => setMode('login')}
                                                className="text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                                            >
                                                Back to login
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
