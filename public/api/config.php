<?php
/**
 * Configuração de Conexão com o Banco de Dados MySQL na Hostinger
 * MotoLegado - Plataforma de Motociclistas
 */

// 1. Tentar carregar variáveis de ambiente de múltiplos locais seguros no servidor
$envLocations = [
    dirname(__DIR__, 2) . '/.env', // Seguro: 1 nível acima de public_html (fora da raiz web acessível)
    dirname(__DIR__) . '/.env',    // Na raiz public_html/.env (protegido por .htaccess)
    __DIR__ . '/.env'              // Na pasta api/.env
];

foreach ($envLocations as $envFile) {
    if (file_exists($envFile) && is_readable($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || strpos($line, '#') === 0) continue;
            if (strpos($line, '=') !== false) {
                list($key, $val) = explode('=', $line, 2);
                $key = trim($key);
                $val = trim($val, " \t\n\r\0\x0B\"'");
                if (!getenv($key)) {
                    putenv("$key=$val");
                    $_ENV[$key] = $val;
                    $_SERVER[$key] = $val;
                }
            }
        }
        break; // Carregou o primeiro .env encontrado
    }
}

// 2. Extração segura das variáveis de ambiente (prioriza portal da Hostinger / getenv / $_ENV / $_SERVER)
function getEnvVar($key, $default = '') {
    $val = getenv($key);
    if ($val !== false && $val !== '') return $val;
    if (isset($_ENV[$key]) && $_ENV[$key] !== '') return $_ENV[$key];
    if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') return $_SERVER[$key];
    return $default;
}

// Configurações do banco MySQL na Hostinger via Variáveis de Ambiente
define('DB_HOST', getEnvVar('MYSQL_HOST', 'localhost'));
define('DB_PORT', getEnvVar('MYSQL_PORT', '3306'));
define('DB_NAME', getEnvVar('MYSQL_DATABASE', 'u342198764_motolegado'));
define('DB_USER', getEnvVar('MYSQL_USER', 'u342198764_admsql'));
define('DB_PASS', getEnvVar('MYSQL_PASSWORD', ''));

// Função de conexão segura com PDO com fallback inteligente de hosts na Hostinger
function getDatabaseConnection() {
    static $pdo = null;
    static $lastError = null;
    if ($pdo !== null) return $pdo;

    $candidateHosts = [DB_HOST, 'localhost', '127.0.0.1', 'srv891.hstgr.io'];
    $hosts = array_unique(array_filter($candidateHosts));

    $port = DB_PORT;
    $dbname = DB_NAME;
    $user = DB_USER;
    $pass = DB_PASS;

    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
    ];

    foreach ($hosts as $h) {
        try {
            $dsn = "mysql:host={$h};port={$port};dbname={$dbname};charset=utf8mb4";
            $conn = new PDO($dsn, $user, $pass, $options);
            $pdo = $conn;
            return $pdo;
        } catch (PDOException $e) {
            $lastError = $e->getMessage();
            error_log("[MotoLegado MySQL] Erro no host {$h}: " . $lastError);
        }
    }

    return null;
}

function getDatabaseLastError() {
    global $lastError;
    return $lastError;
}
