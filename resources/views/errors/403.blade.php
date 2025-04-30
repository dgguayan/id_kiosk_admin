<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="{{ session('theme', 'light') }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Access Denied</title>
    
    <!-- Include your application's CSS -->
    <link rel="stylesheet" href="{{ mix('/css/app.css') }}">
    
    <style>
        :root {
            --error-text: #1f2937;
            --error-bg: #ffffff;
            --error-code: #ef4444;
            --button-bg: #3b82f6;
            --button-hover: #2563eb;
            --button-text: #ffffff;
        }
        
        .dark {
            --error-text: #f3f4f6;
            --error-bg: #1f2937;
            --error-code: #f87171;
            --button-bg: #3b82f6;
            --button-hover: #60a5fa;
            --button-text: #ffffff;
        }
        
        body {
            background-color: var(--error-bg);
            color: var(--error-text);
        }
        
        .error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
            padding: 2rem;
        }
        .error-code {
            font-size: 6rem;
            font-weight: bold;
            color: var(--error-code);
            margin-bottom: 1rem;
        }
        .error-title {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 1rem;
        }
        .error-message {
            font-size: 1.2rem;
            margin-bottom: 2rem;
        }
        .back-button {
            display: inline-block;
            background-color: var(--error-text);
            color: var(--error-bg);
            padding: 0.75rem 1.5rem;
            border-radius: 0.375rem;
            font-weight: 500;
            text-decoration: none;
            transition: background-color 0.2s, color 0.2s;
        }
        .back-button:hover {
            background-color: var(--error-bg);
            color: var(--error-text);
            outline: 1px solid var(--error-text);
        }
    </style>
    
    <!-- Add this script to detect system dark mode preference -->
    <script>
        // Check for saved theme preference or use the system preference
        const getThemePreference = () => {
            if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
                return localStorage.getItem('theme');
            }
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        };
        
        const theme = getThemePreference();
        document.documentElement.classList.toggle('dark', theme === 'dark');
        
        // Optional: Store this preference
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('theme', theme);
        }
    </script>
</head>
<body class="antialiased">
    <div class="error-container">
        <img 
            src="/images/logos/mmhi-logo.png" 
            style="filter: {{ session('theme', 'light') === 'dark' ? 'invert(1)' : 'none' }};"
            alt="Company Logo" 
            style="max-height: 80px; margin-bottom: 2rem;"
            id="logo-img"
        >
        
        <div class="error-code">403</div>
        <div class="error-title">Access Denied</div>
        <div class="error-message">{{ $exception->getMessage() ?: 'You do not have permission to access this page.' }}</div>
        
        <a href="{{ route('dashboard') }}" class="back-button">
            Return to Dashboard
        </a>
    </div>
    
    <script>
        // Update image based on actual class presence
        function updateLogo() {
            const isDark = document.documentElement.classList.contains('dark');
            const logoImg = document.getElementById('logo-img');
            if (logoImg) {
                logoImg.style.filter = isDark ? 'invert(1)' : 'none';
            }
        }
        
        // Run once on page load
        updateLogo();
        
        // Optional: Add observer to update if theme changes while page is open
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (
                    mutation.type === 'attributes' &&
                    mutation.attributeName === 'class'
                ) {
                    updateLogo();
                }
            });
        });
        
        observer.observe(document.documentElement, { attributes: true });
    </script>
</body>
</html>
