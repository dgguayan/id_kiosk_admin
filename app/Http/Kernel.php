// Add this to the $middlewareGroups array under 'web'

protected $middlewareGroups = [
    'web' => [
        // ...existing middleware...
        \App\Http\Middleware\LogUserActivity::class,
    ],
    // ...
];
