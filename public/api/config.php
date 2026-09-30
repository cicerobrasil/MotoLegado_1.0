<?php
/**
 * Configuração de Conexão com o Banco de Dados MySQL na Hostinger
 * MotoLegado - Plataforma de Motociclistas
 */

// Tentar carregar variáveis de ambiente do arquivo .env caso exista na raiz
$envFile = dirname(__DIR__, 2) . '/.env';
if (!file_exists($envFile)) {
    $envFile = dirname(__DIR__) . '/.env';
}

if (file_exists($envFile)) {
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
            }
        }
    }
}

// Configurações padrão do banco de dados na Hostinger
// IMPORTANTE: Na Hostinger, o host é sempre 'localhost'
define('DB_HOST', getenv('MYSQL_HOST') ?: 'localhost');
define('DB_PORT', getenv('MYSQL_PORT') ?: '3306');
define('DB_NAME', getenv('MYSQL_DATABASE') ?: 'u342198764_motolegado');
define('DB_USER', getenv('MYSQL_USER') ?: 'u342198764_admsql');

// Senha do usuário MySQL na Hostinger.
// Se você não usa .env, a senha padrão abaixo garante a conexão imediata:
define('DB_PASS', getenv('MYSQL_PASSWORD') !== false && getenv('MYSQL_PASSWORD') !== '' ? getenv('MYSQL_PASSWORD') : 'e+2YGyRn>sdX');

// Função de conexão segura com PDO
function getDatabaseConnection() {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $host = DB_HOST;
    $port = DB_PORT;
    $dbname = DB_NAME;
    $user = DB_USER;
    $pass = DB_PASS;

    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
    ];

    try {
        $pdo = new PDO($dsn, $user, $pass, $options);
        return $pdo;
    } catch (PDOException $e) {
        // Se a base de dados ainda não existe ou credenciais precisam de ajuste
        error_log("[MotoLegado MySQL] Erro de conexão: " . $e->getMessage());
        return null;
    }
}
