<?php
/**
 * Configuração de Conexão com o Banco de Dados MySQL na Hostinger
 * MotoLegado - Carregamento Automático do .env (em public_html ou api)
 */

function loadEnvConfig() {
    // Locais possíveis: public_html/.env ou public_html/api/.env
    $locations = [
        dirname(__DIR__) . '/.env',
        __DIR__ . '/.env',
        dirname(__DIR__, 2) . '/.env'
    ];

    $vars = [];
    foreach ($locations as $loc) {
        if (file_exists($loc) && is_readable($loc)) {
            $lines = file($loc, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            if ($lines !== false) {
                foreach ($lines as $line) {
                    $line = trim($line);
                    if ($line === '' || strpos($line, '#') === 0) continue;
                    if (strpos($line, '=') !== false) {
                        list($key, $val) = explode('=', $line, 2);
                        $key = trim($key);
                        $val = trim($val, " \t\n\r\0\x0B\"'");
                        $vars[$key] = $val;
                    }
                }
                break;
            }
        }
    }
    return $vars;
}

$env = loadEnvConfig();

// Suporte para chaves MYSQL_* e DB_*
define('DB_HOST', $env['MYSQL_HOST'] ?? $env['DB_HOST'] ?? 'localhost');
define('DB_PORT', $env['MYSQL_PORT'] ?? $env['DB_PORT'] ?? '3306');
define('DB_NAME', $env['MYSQL_DATABASE'] ?? $env['DB_NAME'] ?? 'u342198764_motolegado');
define('DB_USER', $env['MYSQL_USER'] ?? $env['DB_USER'] ?? 'u342198764_admsql');
define('DB_PASS', $env['MYSQL_PASSWORD'] ?? $env['DB_PASS'] ?? '');

$lastError = null;

function getDatabaseConnection() {
    static $pdo = null;
    global $lastError;
    if ($pdo !== null) return $pdo;

    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
    ];

    $candidates = ['localhost', '127.0.0.1'];

    foreach ($candidates as $h) {
        try {
            $dsn = "mysql:host={$h};port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $conn = new PDO($dsn, DB_USER, DB_PASS, $options);
            $pdo = $conn;
            return $pdo;
        } catch (PDOException $e) {
            $lastError = $e->getMessage();
            error_log("[MySQL] Erro ao conectar via {$h}: " . $lastError);
        }
    }

    return null;
}

function getDatabaseLastError() {
    global $lastError;
    return $lastError;
}
