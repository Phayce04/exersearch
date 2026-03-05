<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
    'http://localhost:3000',  
    'http://localhost:5173',  
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'https://localhost:5173',
    'http://exersearch.test',   // ← add this
    'https://exersearch.test',  // ← and this
                            ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
