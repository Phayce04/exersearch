<?php

namespace App\Services;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Symfony\Component\Process\ExecutableFinder;
use Symfony\Component\Process\Process;

class DatabaseBackupService
{
    private function backupBasePath(): string
    {
        $custom = (string) env('DB_BACKUP_PATH', '');
        if (trim($custom) !== '') {
            return rtrim($custom, '/\\');
        }

        $railwayVolume = (string) env('RAILWAY_VOLUME_MOUNT_PATH', '');
        if (trim($railwayVolume) !== '') {
            return rtrim($railwayVolume, '/\\') . DIRECTORY_SEPARATOR . 'app' . DIRECTORY_SEPARATOR . 'backups' . DIRECTORY_SEPARATOR . 'db';
        }

        return storage_path('app/backups/db');
    }

    private function ensureDir(): void
    {
        $dir = $this->backupBasePath();

        if (!is_dir($dir)) {
            if (!@mkdir($dir, 0775, true) && !is_dir($dir)) {
                throw new \RuntimeException("Failed to create backup directory: {$dir}");
            }
        }

        if (!is_writable($dir)) {
            throw new \RuntimeException("Backup directory is not writable: {$dir}");
        }
    }

    private function isSafeFilename(string $name): bool
    {
        return (bool) preg_match('/^[A-Za-z0-9._-]+$/', $name);
    }

    private function conn(): array
    {
        $c = config('database.connections.pgsql', []);

        return [
            'host' => (string) ($c['host'] ?? env('DB_HOST', env('PGHOST', '127.0.0.1'))),
            'port' => (string) ($c['port'] ?? env('DB_PORT', env('PGPORT', '5432'))),
            'database' => (string) ($c['database'] ?? env('DB_DATABASE', env('PGDATABASE', ''))),
            'username' => (string) ($c['username'] ?? env('DB_USERNAME', env('PGUSER', ''))),
            'password' => (string) ($c['password'] ?? env('DB_PASSWORD', env('PGPASSWORD', ''))),
        ];
    }

    private function binary(string $envKey, string $fallback): string
    {
        $configured = trim((string) env($envKey, ''), "\"' ");

        if ($configured !== '') {
            if (!is_file($configured)) {
                throw new \RuntimeException("Binary not found at {$envKey}={$configured}");
            }

            return $configured;
        }

        $finder = new ExecutableFinder();
        $found = $finder->find($fallback);

        if (!$found) {
            throw new \RuntimeException(
                "Required executable [{$fallback}] was not found in PATH. " .
                "Set {$envKey} to the full binary path or install PostgreSQL client tools."
            );
        }

        return $found;
    }

    private function defaultSchema(): string
    {
        return (string) Config::get('dbbackup.default_schema', 'public');
    }

    private function allowedSchemas(): array
    {
        $schemas = Config::get('dbbackup.allowed_schemas', ['public']);

        if (!is_array($schemas) || count($schemas) === 0) {
            return ['public'];
        }

        return array_values(array_unique(array_map('strval', $schemas)));
    }

    private function absoluteBackupPath(string $filename): string
    {
        return $this->backupBasePath() . DIRECTORY_SEPARATOR . $filename;
    }

    private function requiredConnection(array $c): array
    {
        if (
            trim($c['host']) === '' ||
            trim($c['port']) === '' ||
            trim($c['database']) === '' ||
            trim($c['username']) === ''
        ) {
            throw new \RuntimeException(
                'Database config missing. Required values: host, port, database, username.'
            );
        }

        return $c;
    }

    // ---------- TABLE LISTING ----------
    public function listTables(): array
    {
        $schemas = $this->allowedSchemas();
        $placeholders = implode(',', array_fill(0, count($schemas), '?'));

        $rows = DB::connection('pgsql')->select(
            "select table_schema, table_name
             from information_schema.tables
             where table_type = 'BASE TABLE'
               and table_schema in ($placeholders)
             order by table_schema, table_name",
            $schemas
        );

        return array_map(fn ($r) => "{$r->table_schema}.{$r->table_name}", $rows);
    }

    private function parseQualifiedTable(string $input): array
    {
        $s = trim($input);
        if ($s === '') {
            throw new \InvalidArgumentException('Table is required.');
        }

        if (str_contains($s, '.')) {
            [$schema, $table] = explode('.', $s, 2);
        } else {
            $schema = $this->defaultSchema();
            $table = $s;
        }

        $schema = trim($schema);
        $table = trim($table);

        if (!preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $schema)) {
            throw new \InvalidArgumentException('Invalid schema name.');
        }

        if (!preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $table)) {
            throw new \InvalidArgumentException('Invalid table name.');
        }

        return [$schema, $table];
    }

    private function tableExists(string $schema, string $table): bool
    {
        $schemas = $this->allowedSchemas();
        if (!in_array($schema, $schemas, true)) {
            return false;
        }

        $row = DB::connection('pgsql')->selectOne(
            "select 1
             from information_schema.tables
             where table_schema = ?
               and table_name = ?
               and table_type = 'BASE TABLE'
             limit 1",
            [$schema, $table]
        );

        return (bool) $row;
    }

    // ---------- BACKUP LIST ----------
    public function listBackups(): array
    {
        $this->ensureDir();

        $dir = $this->backupBasePath();
        $files = glob($dir . DIRECTORY_SEPARATOR . '*') ?: [];
        $out = [];

        foreach ($files as $path) {
            if (!is_file($path)) {
                continue;
            }

            $name = basename($path);
            if (!$this->isSafeFilename($name)) {
                continue;
            }

            $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
            if (!in_array($ext, ['dump', 'sql'], true)) {
                continue;
            }

            $out[] = [
                'name' => $name,
                'type' => $ext === 'sql' ? 'sql' : 'dump',
                'size_bytes' => @filesize($path) ?: 0,
                'created_at' => date('c', @filemtime($path) ?: time()),
            ];
        }

        usort($out, fn ($a, $b) => strtotime($b['created_at']) <=> strtotime($a['created_at']));

        return $out;
    }

    // ---------- BACKUP CREATE ----------
    public function createBackup(?string $createdBy = null, string $type = 'dump', ?string $table = null): array
    {
        $this->ensureDir();

        $type = strtolower(trim($type));
        if (!in_array($type, ['dump', 'sql'], true)) {
            $type = 'dump';
        }

        $format = $type === 'sql' ? 'plain' : 'custom';
        $ext = $type === 'sql' ? 'sql' : 'dump';

        $tableQualified = null;
        $slug = 'db';

        if ($table !== null && trim($table) !== '') {
            [$schema, $tbl] = $this->parseQualifiedTable($table);

            if (!$this->tableExists($schema, $tbl)) {
                throw new \RuntimeException("Table not found or not allowed: {$schema}.{$tbl}");
            }

            $tableQualified = "{$schema}.{$tbl}";
            $slug = "{$schema}_{$tbl}";
        }

        $stamp = now()->format('Y-m-d_H-i-s');
        $rand = Str::lower(Str::random(6));
        $filename = "backup_{$slug}_{$stamp}_{$rand}.{$ext}";
        $absolutePath = $this->absoluteBackupPath($filename);

        $c = $this->requiredConnection($this->conn());
        $pgDump = $this->binary('PG_DUMP_PATH', 'pg_dump');

        $args = [
            $pgDump,
            '-h', $c['host'],
            '-p', $c['port'],
            '-U', $c['username'],
            '-d', $c['database'],
        ];

        if ($tableQualified) {
            $args[] = '-t';
            $args[] = $tableQualified;
        }

        $args[] = $format === 'plain' ? '-Fp' : '-Fc';
        $args[] = '-f';
        $args[] = $absolutePath;

        $process = new Process($args, null, [
            'PGPASSWORD' => $c['password'],
            'PATH' => getenv('PATH') ?: '',
        ]);

        $process->setTimeout((int) Config::get('dbbackup.timeout_seconds', 600));

        try {
            $process->mustRun();
        } catch (ProcessFailedException $e) {
            if (is_file($absolutePath)) {
                @unlink($absolutePath);
            }

            $stderr = trim($process->getErrorOutput());
            $stdout = trim($process->getOutput());

            throw new \RuntimeException(
                'pg_dump failed: ' . ($stderr !== '' ? $stderr : ($stdout !== '' ? $stdout : $e->getMessage()))
            );
        }

        return [
            'name' => $filename,
            'type' => $type,
            'scope' => $tableQualified ? 'table' : 'database',
            'table' => $tableQualified,
            'size_bytes' => @filesize($absolutePath) ?: 0,
            'created_at' => date('c', @filemtime($absolutePath) ?: time()),
            'created_by' => $createdBy,
        ];
    }

    // ---------- DOWNLOAD ----------
    public function downloadPath(string $name): string
    {
        if (!$this->isSafeFilename($name)) {
            throw new \InvalidArgumentException('Invalid filename.');
        }

        $this->ensureDir();

        $absolutePath = $this->absoluteBackupPath($name);

        if (!is_file($absolutePath)) {
            throw new \RuntimeException('Backup not found.');
        }

        return $absolutePath;
    }

    // ---------- RESTORE ----------
    public function restoreFromServerBackup(string $name, string $confirm): array
    {
        $phrase = (string) Config::get('dbbackup.restore_phrase', 'RESTORE DATABASE');
        if (trim($confirm) !== $phrase) {
            throw new \InvalidArgumentException('Confirmation phrase mismatch.');
        }

        if (!$this->isSafeFilename($name)) {
            throw new \InvalidArgumentException('Invalid filename.');
        }

        $this->ensureDir();

        $abs = $this->absoluteBackupPath($name);

        if (!is_file($abs)) {
            throw new \RuntimeException('Backup not found.');
        }

        return $this->restoreFromAbsolutePath($abs);
    }

    public function restoreFromUploadedTempPath(string $tempAbsolutePath, string $originalName, string $confirm): array
    {
        $phrase = (string) Config::get('dbbackup.restore_phrase', 'RESTORE DATABASE');
        if (trim($confirm) !== $phrase) {
            throw new \InvalidArgumentException('Confirmation phrase mismatch.');
        }

        if (!is_file($tempAbsolutePath)) {
            throw new \RuntimeException('Uploaded restore file not found.');
        }

        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        if (!in_array($ext, ['dump', 'sql'], true)) {
            throw new \InvalidArgumentException('Invalid backup type. Only .dump or .sql are allowed.');
        }

        $max = (int) Config::get('dbbackup.max_restore_bytes', 0);
        if ($max > 0 && filesize($tempAbsolutePath) > $max) {
            throw new \RuntimeException('Restore file is too large.');
        }

        return $this->restoreFromAbsolutePath($tempAbsolutePath, $ext);
    }

    private function restoreFromAbsolutePath(string $absolutePath, ?string $forcedExt = null): array
    {
        $c = $this->requiredConnection($this->conn());

        $ext = $forcedExt ?: strtolower(pathinfo($absolutePath, PATHINFO_EXTENSION));
        if (!in_array($ext, ['dump', 'sql'], true)) {
            throw new \InvalidArgumentException('Unsupported restore file type.');
        }

        $timeout = (int) Config::get(
            'dbbackup.restore_timeout_seconds',
            Config::get('dbbackup.timeout_seconds', 600)
        );

        return $ext === 'dump'
            ? $this->runPgRestore($absolutePath, $c, $timeout)
            : $this->runPsqlRestore($absolutePath, $c, $timeout);
    }

    private function runPgRestore(string $file, array $c, int $timeout): array
    {
        $pgRestore = $this->binary('PG_RESTORE_PATH', 'pg_restore');

        $args = [
            $pgRestore,
            '-h', $c['host'],
            '-p', $c['port'],
            '-U', $c['username'],
            '-d', $c['database'],
            '--clean',
            '--if-exists',
            '--no-owner',
            '--no-privileges',
        ];

        $extra = Config::get('dbbackup.pg_restore_extra_args', []);
        if (is_array($extra)) {
            foreach ($extra as $a) {
                $a = trim((string) $a);
                if ($a !== '') {
                    $args[] = $a;
                }
            }
        }

        $args[] = $file;

        $process = new Process($args, null, [
            'PGPASSWORD' => $c['password'],
            'PATH' => getenv('PATH') ?: '',
        ]);
        $process->setTimeout($timeout);

        try {
            $process->mustRun();
        } catch (ProcessFailedException $e) {
            $stderr = trim($process->getErrorOutput());
            $stdout = trim($process->getOutput());

            throw new \RuntimeException(
                'pg_restore failed: ' . ($stderr !== '' ? $stderr : ($stdout !== '' ? $stdout : $e->getMessage()))
            );
        }

        return [
            'ok' => true,
            'type' => 'dump',
            'message' => 'Restore completed.',
        ];
    }

    private function runPsqlRestore(string $file, array $c, int $timeout): array
    {
        $psql = $this->binary('PSQL_PATH', 'psql');

        $args = [
            $psql,
            '-h', $c['host'],
            '-p', $c['port'],
            '-U', $c['username'],
            '-d', $c['database'],
            '-v', 'ON_ERROR_STOP=1',
        ];

        $extra = Config::get('dbbackup.psql_extra_args', []);
        if (is_array($extra)) {
            foreach ($extra as $a) {
                $a = trim((string) $a);
                if ($a !== '') {
                    $args[] = $a;
                }
            }
        }

        $args[] = '-f';
        $args[] = $file;

        $process = new Process($args, null, [
            'PGPASSWORD' => $c['password'],
            'PATH' => getenv('PATH') ?: '',
        ]);
        $process->setTimeout($timeout);

        try {
            $process->mustRun();
        } catch (ProcessFailedException $e) {
            $stderr = trim($process->getErrorOutput());
            $stdout = trim($process->getOutput());

            throw new \RuntimeException(
                'psql restore failed: ' . ($stderr !== '' ? $stderr : ($stdout !== '' ? $stdout : $e->getMessage()))
            );
        }

        return [
            'ok' => true,
            'type' => 'sql',
            'message' => 'Restore completed.',
        ];
    }
}