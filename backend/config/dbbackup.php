<?php

return [
    'dir' => env('DBBACKUP_DIR', 'backups/db'),
    'timeout_seconds' => (int) env('DBBACKUP_TIMEOUT', 600),

    'default_schema' => env('DBBACKUP_DEFAULT_SCHEMA', 'public'),
    'allowed_schemas' => array_values(array_filter(array_map(
        'trim',
        explode(',', env('DBBACKUP_ALLOWED_SCHEMAS', 'public'))
    ))),

    'restore_phrase' => env('DBBACKUP_RESTORE_PHRASE', 'RESTORE DATABASE'),
    'restore_timeout_seconds' => (int) env('DBBACKUP_RESTORE_TIMEOUT', 1200),

    'pg_restore_extra_args' => [],
    'psql_extra_args' => [],
    'max_restore_bytes' => 0, 
];