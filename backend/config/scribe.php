<?php

use Knuckles\Scribe\Config\AuthIn;
use Knuckles\Scribe\Config\Defaults;
use Knuckles\Scribe\Extracting\Strategies;

use function Knuckles\Scribe\Config\configureStrategy;

return [
'title' => 'ExerSearch API',

    'description' => 'Official API documentation for ExerSearch.',

    'intro_text' => <<<'INTRO'
Welcome to the ExerSearch API documentation.

This documentation provides complete details on how to interact with the ExerSearch backend, including authentication, gym listings, recommendations, and admin endpoints.
INTRO,

    // Base URL shown in docs
    'base_url' => 'https://exersearch.test',

    // Only document api/v1 routes
    'routes' => [
        [
            'match' => [
                'prefixes' => ['api/v1/*'],
                'domains' => ['*'],
            ],
        ],
    ],

    /**
     * Use external Stoplight Elements UI (cleaner like FastAPI/Swagger).
     * /docs will render the UI, and it will pull the OpenAPI spec from /docs.openapi
     */
    'type' => 'external_laravel',

    // For external mode, "elements" is the intended theme.
    'theme' => 'elements',

    'static' => [
        'output_path' => 'public/docs',
    ],

    'laravel' => [
        'add_routes' => true,
        'docs_url' => '/docs',
        'assets_directory' => null,
        'middleware' => [],
    ],

    // Settings for external docs UI (Stoplight Elements)
    'external' => [
        'html_attributes' => [
            // Where the UI fetches your OpenAPI spec from
            'apiDescriptionUrl' => '/docs.openapi',
            // Nice client-side routing
            'router' => 'hash',
            // Responsive layout
            'layout' => 'responsive',
        ],
    ],

    'try_it_out' => [
        'enabled' => true,
        'base_url' => null,
        'use_csrf' => false,
        'csrf_url' => '/sanctum/csrf-cookie',
    ],

    // Sanctum Bearer authentication
    'auth' => [
        'enabled' => true,
        'default' => false,
        'in' => AuthIn::BEARER->value,
        'name' => 'Authorization',
        // Optional: put a real token in .env as SCRIBE_AUTH_KEY if you want response calls for protected endpoints
        'use_value' => env('SCRIBE_AUTH_KEY'),
        'placeholder' => 'Bearer {YOUR_TOKEN}',
        'extra_info' => 'Use a Sanctum token in the Authorization header: <b>Bearer &lt;token&gt;</b>.',
    ],

    'example_languages' => [
        'bash',
        'javascript',
    ],

    'postman' => [
        'enabled' => true,
        'overrides' => [],
    ],

    'openapi' => [
        'enabled' => true,
        // You can switch to 3.1.0 if you want
        'version' => '3.0.3',
        'overrides' => [],
        'generators' => [],
    ],

    'groups' => [
        'default' => 'Endpoints',
        'order' => [],
    ],

    'logo' => false,

    'last_updated' => 'Last updated: {date:F j, Y}',

    'examples' => [
        'faker_seed' => 1234,
        'models_source' => ['factoryCreate', 'factoryMake', 'databaseFirst'],
    ],

    'strategies' => [
        'metadata' => [
            ...Defaults::METADATA_STRATEGIES,
        ],
        'headers' => [
            ...Defaults::HEADERS_STRATEGIES,
            Strategies\StaticData::withSettings(data: [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ]),
        ],
        'urlParameters' => [
            ...Defaults::URL_PARAMETERS_STRATEGIES,
        ],
        'queryParameters' => [
            ...Defaults::QUERY_PARAMETERS_STRATEGIES,
        ],
        'bodyParameters' => [
            ...Defaults::BODY_PARAMETERS_STRATEGIES,
        ],
        'responses' => configureStrategy(
            Defaults::RESPONSES_STRATEGIES,
            Strategies\Responses\ResponseCalls::withSettings(
                // Keep this conservative; you can expand later.
                only: ['GET *'],
                config: [
                    'app.debug' => false,
                ]
            )
        ),
        'responseFields' => [
            ...Defaults::RESPONSE_FIELDS_STRATEGIES,
        ],
    ],

    'database_connections_to_transact' => [config('database.default')],

    'fractal' => [
        'serializer' => null,
    ],
];
