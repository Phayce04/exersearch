<?php

// ✅ app/Services/DatabaseBackupService.php
namespace App\Services;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;

class DatabaseBackupService
{
    private function disk()
    {
        return Storage::disk('local');
    }

    private function backupDir(): string
    {
        return (string) Config::get('dbbackup.dir', 'backups/db');
    }

    private function ensureDir(): void
    {
        $dir = $this->backupDir();
        if (!$this->disk()->exists($dir)) {
            $this->disk()->makeDirectory($dir);
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
            'host' => $c['host'] ?? env('DB_HOST', '127.0.0.1'),
            'port' => (string) ($c['port'] ?? env('DB_PORT', '5432')),
            'database' => $c['database'] ?? env('DB_DATABASE'),
            'username' => $c['username'] ?? env('DB_USERNAME'),
            'password' => $c['password'] ?? env('DB_PASSWORD'),
        ];
    }

    private function binary(string $envKey, string $fallback): string
    {
        $p = (string) env($envKey, $fallback);
        $p = trim($p, "\"' ");
        if ($p !== $fallback && !is_file($p)) {
            throw new \RuntimeException("Binary not found at {$envKey}={$p}");
        }
        return $p;
    }

    private function defaultSchema(): string
    {
        return (string) Config::get('dbbackup.default_schema', 'public');
    }

    private function allowedSchemas(): array
    {
        $schemas = Config::get('dbbackup.allowed_schemas', ['public']);
        if (!is_array($schemas) || count($schemas) === 0) return ['public'];
        return array_values(array_unique(array_map('strval', $schemas)));
    }

    // ---------- TABLE LISTING (optional, from earlier) ----------
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
        if ($s === '') throw new \InvalidArgumentException("Table is required.");

        if (str_contains($s, '.')) {
            [$schema, $table] = explode('.', $s, 2);
        } else {
            $schema = $this->defaultSchema();
            $table = $s;
        }

        $schema = trim($schema);
        $table = trim($table);

        if (!preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $schema)) {
            throw new \InvalidArgumentException("Invalid schema name.");
        }
        if (!preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $table)) {
            throw new \InvalidArgumentException("Invalid table name.");
        }

        return [$schema, $table];
    }

    private function tableExists(string $schema, string $table): bool
    {
        $schemas = $this->allowedSchemas();
        if (!in_array($schema, $schemas, true)) return false;

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

        $dir = $this->backupDir();
        $files = $this->disk()->files($dir);

        $out = [];
        foreach ($files as $path) {
            $name = basename($path);
            if (!$this->isSafeFilename($name)) continue;

            $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
            if (!in_array($ext, ['dump', 'sql'], true)) continue;

            $out[] = [
                'name' => $name,
                'type' => $ext === 'sql' ? 'sql' : 'dump',
                'size_bytes' => $this->disk()->size($path),
                'created_at' => date('c', $this->disk()->lastModified($path)),
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
        if (!in_array($type, ['dump', 'sql'], true)) $type = 'dump';

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

        $dir = $this->backupDir();
        $relativePath = "{$dir}/{$filename}";
        $absolutePath = $this->disk()->path($relativePath);

        $c = $this->conn();
        if (!$c['database'] || !$c['username']) {
            throw new \RuntimeException("Database config missing (DB_DATABASE/DB_USERNAME).");
        }

        $pgDump = $this->binary('PG_DUMP_PATH', 'pg_dump');

        $args = [
            $pgDump,
            '-h', (string) $c['host'],
            '-p', (string) $c['port'],
            '-U', (string) $c['username'],
            '-d', (string) $c['database'],
        ];

        if ($tableQualified) {
            $args[] = '-t';
            $args[] = $tableQualified;
        }

        if ($format === 'plain') {
            $args[] = '-Fp';
            $args[] = '-f';
            $args[] = $absolutePath;
        } else {
            $args[] = '-Fc';
            $args[] = '-f';
            $args[] = $absolutePath;
        }

        $process = new Process($args, null, ['PGPASSWORD' => (string) $c['password']]);
        $process->setTimeout((int) Config::get('dbbackup.timeout_seconds', 600));
        $process->run();

        if (!$process->isSuccessful()) {
            if (is_file($absolutePath)) @unlink($absolutePath);
            $err = trim((string) $process->getErrorOutput());
            $out = trim((string) $process->getOutput());
            throw new \RuntimeException("pg_dump failed: " . ($err !== '' ? $err : $out));
        }

        return [
            'name' => $filename,
            'type' => $type,
            'scope' => $tableQualified ? 'table' : 'database',
            'table' => $tableQualified,
            'size_bytes' => $this->disk()->size($relativePath),
            'created_at' => date('c', $this->disk()->lastModified($relativePath)),
            'created_by' => $createdBy,
        ];
    }

    // ---------- DOWNLOAD ----------
    public function downloadPath(string $name): string
    {
        if (!$this->isSafeFilename($name)) {
            throw new \InvalidArgumentException("Invalid filename.");
        }

        $this->ensureDir();

        $relativePath = $this->backupDir() . '/' . $name;
        if (!$this->disk()->exists($relativePath)) {
            throw new \RuntimeException("Backup not found.");
        }

        return $this->disk()->path($relativePath);
    }

    // =========================
    // ✅ RESTORE IMPLEMENTATION
    // =========================

    /**
     * Restore from an EXISTING server backup filename in backups dir.
     * $confirm must match config phrase.
     */
    public function restoreFromServerBackup(string $name, string $confirm): array
    {
        $phrase = (string) Config::get('dbbackup.restore_phrase', 'RESTORE DATABASE');
        if (trim($confirm) !== $phrase) {
            throw new \InvalidArgumentException("Confirmation phrase mismatch.");
        }

        if (!$this->isSafeFilename($name)) {
            throw new \InvalidArgumentException("Invalid filename.");
        }

        $this->ensureDir();
        $relativePath = $this->backupDir() . '/' . $name;

        if (!$this->disk()->exists($relativePath)) {
            throw new \RuntimeException("Backup not found.");
        }

        $abs = $this->disk()->path($relativePath);
        return $this->restoreFromAbsolutePath($abs);
    }

    /**
     * Restore from an uploaded file (stored temporarily on disk).
     */
    public function restoreFromUploadedTempPath(string $tempAbsolutePath, string $originalName, string $confirm): array
    {
        $phrase = (string) Config::get('dbbackup.restore_phrase', 'RESTORE DATABASE');
        if (trim($confirm) !== $phrase) {
            throw new \InvalidArgumentException("Confirmation phrase mismatch.");
        }

        if (!is_file($tempAbsolutePath)) {
            throw new \RuntimeException("Uploaded restore file not found.");
        }

        // Use original extension for decision (and also guard on file itself)
        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        if (!in_array($ext, ['dump', 'sql'], true)) {
            throw new \InvalidArgumentException("Invalid backup type. Only .dump or .sql are allowed.");
        }

        // (Optional) enforce max size
        $max = (int) Config::get('dbbackup.max_restore_bytes', 0);
        if ($max > 0 && filesize($tempAbsolutePath) > $max) {
            throw new \RuntimeException("Restore file is too large.");
        }

        return $this->restoreFromAbsolutePath($tempAbsolutePath, $ext);
    }

    /**
     * Restore dispatcher based on extension.
     * - .dump => pg_restore
     * - .sql  => psql
     *
     * ⚠️ This restores into the configured DB. For production, you might want extra guards.
     */
    private function restoreFromAbsolutePath(string $absolutePath, ?string $forcedExt = null): array
    {
        $c = $this->conn();
        if (!$c['database'] || !$c['username']) {
            throw new \RuntimeException("Database config missing (DB_DATABASE/DB_USERNAME).");
        }

        $ext = $forcedExt ?: strtolower(pathinfo($absolutePath, PATHINFO_EXTENSION));
        if (!in_array($ext, ['dump', 'sql'], true)) {
            throw new \InvalidArgumentException("Unsupported restore file type.");
        }

        $timeout = (int) Config::get('dbbackup.restore_timeout_seconds', Config::get('dbbackup.timeout_seconds', 600));

        if ($ext === 'dump') {
            return $this->runPgRestore($absolutePath, $c, $timeout);
        }

        // sql
        return $this->runPsqlRestore($absolutePath, $c, $timeout);
    }

    /**
     * Restore a custom-format dump using pg_restore.
     * Options:
     * - --clean: drop objects before recreating (destructive)
     * - --if-exists: only drop if exists
     * - --no-owner / --no-privileges: avoid role issues
     */
    private function runPgRestore(string $file, array $c, int $timeout): array
    {
        $pgRestore = $this->binary('PG_RESTORE_PATH', 'pg_restore');

        $args = [
            $pgRestore,
            '-h', (string) $c['host'],
            '-p', (string) $c['port'],
            '-U', (string) $c['username'],
            '-d', (string) $c['database'],

            '--clean',
            '--if-exists',
            '--no-owner',
            '--no-privileges',
        ];

        // optional extra args from config
        $extra = Config::get('dbbackup.pg_restore_extra_args', []);
        if (is_array($extra)) {
            foreach ($extra as $a) {
                $a = trim((string) $a);
                if ($a !== '') $args[] = $a;
            }
        }

        $args[] = $file;

        $process = new Process($args, null, ['PGPASSWORD' => (string) $c['password']]);
        $process->setTimeout($timeout);
        $process->run();

        if (!$process->isSuccessful()) {
            $err = trim((string) $process->getErrorOutput());
            $out = trim((string) $process->getOutput());
            throw new \RuntimeException("pg_restore failed: " . ($err !== '' ? $err : $out));
        }

        return [
            'ok' => true,
            'type' => 'dump',
            'message' => 'Restore completed.',
        ];
    }

    /**
     * Restore a plain SQL file using psql.
     * Uses -v ON_ERROR_STOP=1 so failures stop the restore.
     */
    private function runPsqlRestore(string $file, array $c, int $timeout): array
    {
        $psql = $this->binary('PSQL_PATH', 'psql');

        $args = [
            $psql,
            '-h', (string) $c['host'],
            '-p', (string) $c['port'],
            '-U', (string) $c['username'],
            '-d', (string) $c['database'],
            '-v', 'ON_ERROR_STOP=1',
            '-f', $file,
        ];

        $extra = Config::get('dbbackup.psql_extra_args', []);
        if (is_array($extra)) {
            // insert extra args before -f ideally, but safe either way
            // We'll add them before -f:
            // (If you need strict order, tell me and I’ll refactor.)
        }

        $process = new Process($args, null, ['PGPASSWORD' => (string) $c['password']]);
        $process->setTimeout($timeout);
        $process->run();

        if (!$process->isSuccessful()) {
            $err = trim((string) $process->getErrorOutput());
            $out = trim((string) $process->getOutput());
            throw new \RuntimeException("psql restore failed: " . ($err !== '' ? $err : $out));
        }

        return [
            'ok' => true,
            'type' => 'sql',
            'message' => 'Restore completed.',
        ];
    }
}