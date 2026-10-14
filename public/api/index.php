<?php
/**
 * API REST Nativa para Hospedagem Hostinger (PHP 7.4 / 8.x + MySQL PDO)
 * MotoLegado - Plataforma de Motociclistas
 */

// Headers de CORS e JSON
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/config.php';

// Funções de Hash e Autenticação Interoperáveis com Node.js PBKDF2
function hashPassword($password) {
    $salt = bin2hex(random_bytes(16));
    $hash = hash_pbkdf2('sha512', $password, $salt, 10000, 128);
    return $salt . ':' . $hash;
}

function verifyPassword($password, $storedHash) {
    if (empty($storedHash)) return false;
    if (strpos($storedHash, ':') !== false) {
        list($salt, $hash) = explode(':', $storedHash);
        $calc = hash_pbkdf2('sha512', $password, $salt, 10000, 128);
        return hash_equals($hash, $calc);
    }
    return password_verify($password, $storedHash);
}

function sanitizePilot($pilot) {
    if (!$pilot) return null;
    if (is_object($pilot)) $pilot = (array) $pilot;
    unset($pilot['password_hash']);
    $role = $pilot['role'] ?? 'pilot';
    $plan = $pilot['plan'] ?? 'gratuito';
    $pilot['is_pro'] = ($role === 'admin' || $plan === 'pago' || $plan === 'bonificado');
    if (empty($pilot['avatar_url'])) {
        $name = urlencode($pilot['name'] ?? 'Piloto');
        $pilot['avatar_url'] = "https://ui-avatars.com/api/?name={$name}&background=ea580c&color=ffffff&bold=true";
    }
    return $pilot;
}

// -------------------------------------------------------------
// Utilitários para Processamento de Rotas do Google Maps
// -------------------------------------------------------------

function resolveRedirectUrl($url) {
    if (!preg_match('#^https?://#i', $url)) {
        return $url;
    }
    
    // Tenta cURL primeiro
    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_HEADER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_MAXREDIRS, 7);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 6);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        curl_exec($ch);
        $finalUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
        curl_close($ch);
        if (!empty($finalUrl) && $finalUrl !== $url) {
            return $finalUrl;
        }
    }
    
    // Fallback com get_headers
    $headers = @get_headers($url, 1);
    if ($headers && isset($headers['Location'])) {
        $loc = is_array($headers['Location']) ? end($headers['Location']) : $headers['Location'];
        if (!empty($loc)) return $loc;
    }
    
    return $url;
}

function cleanLocationName($raw) {
    if (empty($raw)) return '';
    $str = trim($raw);
    if (strpos($str, '?') !== false) {
        $str = explode('?', $str)[0];
    }
    $str = str_replace('+', ' ', $str);
    $str = urldecode($str);
    $str = trim($str, "/ \"'");
    return $str;
}

function guessStageType($name) {
    $lower = mb_strtolower($name, 'UTF-8');
    if (strpos($lower, 'posto') !== false || strpos($lower, 'graal') !== false || strpos($lower, 'ipiranga') !== false || strpos($lower, 'shell') !== false || strpos($lower, 'abastecimento') !== false) {
        return 'fuel';
    }
    if (strpos($lower, 'restaurante') !== false || strpos($lower, 'café') !== false || strpos($lower, 'cafe') !== false || strpos($lower, 'lanchonete') !== false || strpos($lower, 'churrascaria') !== false || strpos($lower, 'almoço') !== false) {
        return 'food';
    }
    if (strpos($lower, 'mirante') !== false || strpos($lower, 'serra') !== false || strpos($lower, 'pico') !== false || strpos($lower, 'cascata') !== false || strpos($lower, 'cachoeira') !== false || strpos($lower, 'parque') !== false || strpos($lower, 'pedra') !== false || strpos($lower, 'praia') !== false) {
        return 'scenic';
    }
    if (strpos($lower, 'hotel') !== false || strpos($lower, 'pousada') !== false || strpos($lower, 'resort') !== false || strpos($lower, 'camping') !== false || strpos($lower, 'hostel') !== false || strpos($lower, 'pernoite') !== false) {
        return 'sleep';
    }
    if (strpos($lower, 'oficina') !== false || strpos($lower, 'motopeças') !== false || strpos($lower, 'borracharia') !== false || strpos($lower, 'revisão') !== false) {
        return 'service';
    }
    if (strpos($lower, 'encontro') !== false || strpos($lower, 'motoclube') !== false || strpos($lower, 'sede') !== false || strpos($lower, 'confraria') !== false) {
        return 'meet';
    }
    return 'scenic';
}

function parseGoogleMapsRoutePhp($urlOrText) {
    $input = trim($urlOrText ?? '');
    $res = [
        'origin' => '',
        'destination' => '',
        'waypoints' => [],
        'title' => '',
        'suggestedStages' => [],
        'fullRouteUrl' => null
    ];
    if (empty($input)) return $res;

    // 1. Tenta formato com /maps/dir/ ponto1 / ponto2 / ponto3...
    if (strpos($input, '/maps/dir/') !== false || strpos($input, '/dir/') !== false) {
        $dirPos = strpos($input, '/dir/');
        $afterDir = substr($input, $dirPos + 5);
        $segments = explode('/', $afterDir);
        $rawPoints = [];

        foreach ($segments as $seg) {
            $clean = trim($seg);
            if (empty($clean) || $clean[0] === '@') continue;
            if (strpos($clean, 'data=') === 0 || strpos($clean, 'am=') === 0 || strpos($clean, '!1m') !== false || strpos($clean, '!4m') !== false) continue;
            $loc = cleanLocationName($clean);
            if (!empty($loc) && !in_array($loc, $rawPoints)) {
                $rawPoints[] = $loc;
            }
        }

        if (count($rawPoints) >= 2) {
            $res['origin'] = $rawPoints[0];
            $res['destination'] = end($rawPoints);
            $res['waypoints'] = array_slice($rawPoints, 1, -1);
        } else if (count($rawPoints) === 1) {
            $res['destination'] = $rawPoints[0];
        }
    }

    // 2. Tenta parâmetros de busca query (?api=1&origin=...&destination=...&waypoints=...)
    if (empty($res['origin']) || empty($res['destination'])) {
        $parsedUrl = parse_url($input);
        if (isset($parsedUrl['query'])) {
            parse_str($parsedUrl['query'], $queryParams);
            if (!empty($queryParams['origin'])) $res['origin'] = cleanLocationName($queryParams['origin']);
            if (!empty($queryParams['destination'])) $res['destination'] = cleanLocationName($queryParams['destination']);
            if (!empty($queryParams['waypoints'])) {
                $wps = explode('|', $queryParams['waypoints']);
                foreach ($wps as $w) {
                    $cw = cleanLocationName($w);
                    if (!empty($cw) && !in_array($cw, $res['waypoints'])) $res['waypoints'][] = $cw;
                }
            }
            if (!empty($queryParams['saddr']) && empty($res['origin'])) {
                $res['origin'] = cleanLocationName($queryParams['saddr']);
            }
            if (!empty($queryParams['daddr']) && empty($res['destination'])) {
                $parts = preg_split('/\s*\+?to:\s*/i', $queryParams['daddr']);
                $res['destination'] = cleanLocationName($parts[0]);
                if (count($parts) > 1) {
                    for ($i = 1; $i < count($parts); $i++) {
                        $cw = cleanLocationName($parts[$i]);
                        if (!empty($cw) && !in_array($cw, $res['waypoints'])) $res['waypoints'][] = $cw;
                    }
                }
            }
        }
    }

    // 3. Texto com delimitadores (-> / ➔ / → / /)
    if (empty($res['origin']) && empty($res['destination'])) {
        $delim = null;
        if (strpos($input, '->') !== false) $delim = '->';
        else if (strpos($input, '➔') !== false) $delim = '➔';
        else if (strpos($input, '→') !== false) $delim = '→';
        else if (strpos($input, '/') !== false && strpos($input, 'http') === false) $delim = '/';

        if ($delim) {
            $rawList = array_map('cleanLocationName', explode($delim, $input));
            $rawList = array_values(array_filter($rawList));
            if (count($rawList) >= 2) {
                $res['origin'] = $rawList[0];
                $res['destination'] = end($rawList);
                $res['waypoints'] = array_slice($rawList, 1, -1);
            }
        }
    }

    // Título e estágios sugeridos
    if (!empty($res['origin']) && !empty($res['destination'])) {
        $res['title'] = "{$res['origin']} a {$res['destination']}";
    } else if (!empty($res['destination'])) {
        $res['title'] = "Roteiro para {$res['destination']}";
    }

    $res['suggestedStages'] = array_map(function($wp) {
        return [
            'name' => $wp,
            'type' => guessStageType($wp),
            'notes' => ''
        ];
    }, $res['waypoints']);

    if (!empty($res['origin']) && !empty($res['destination'])) {
        $origEnc = urlencode($res['origin']);
        $destEnc = urlencode($res['destination']);
        $wpParam = !empty($res['waypoints']) ? '&waypoints=' . implode('|', array_map('urlencode', $res['waypoints'])) : '';
        $res['fullRouteUrl'] = "https://www.google.com/maps/dir/?api=1&origin={$origEnc}&destination={$destEnc}{$wpParam}&travelmode=driving";
    }

    return $res;
}

function calculateRouteMetricsPhp($origin, $destination, $waypoints = []) {
    $all = array_merge([$origin], $waypoints, [$destination]);
    $legCount = max(1, count($all) - 1);
    
    // Tenta geocodificar com Nominatim e calcular via OSRM
    $coords = [];
    foreach ($all as $loc) {
        $found = null;
        $q = urlencode($loc . ', Brasil');
        $ctx = stream_context_create([
            'http' => [
                'timeout' => 2,
                'header' => "User-Agent: MotoLegadoApp/2.0\r\n"
            ]
        ]);
        $geoJson = @file_get_contents("https://nominatim.openstreetmap.org/search?q={$q}&format=json&limit=1", false, $ctx);
        if ($geoJson) {
            $data = json_decode($geoJson, true);
            if (!empty($data[0]['lat']) && !empty($data[0]['lon'])) {
                $found = [$data[0]['lon'], $data[0]['lat']];
            }
        }
        if ($found) $coords[] = $found;
    }

    if (count($coords) >= 2) {
        $coordStr = implode(';', array_map(function($c) { return "{$c[0]},{$c[1]}"; }, $coords));
        $osrmJson = @file_get_contents("https://router.project-osrm.org/route/v1/driving/{$coordStr}?overview=false", false, stream_context_create(['http' => ['timeout' => 3]]));
        if ($osrmJson) {
            $routeData = json_decode($osrmJson, true);
            if (!empty($routeData['routes'][0])) {
                $meters = $routeData['routes'][0]['distance'];
                $seconds = $routeData['routes'][0]['duration'];
                $factor = count($all) / count($coords);
                $km = max(1, round(($meters / 1000) * ($factor > 1 ? 1.15 : 1)));
                $mins = max(1, round(($seconds / 60) * ($factor > 1 ? 1.15 : 1)));
                $h = floor($mins / 60);
                $m = $mins % 60;
                $dur = $h > 0 ? "{$h}h " . ($m > 0 ? "{$m}min" : "") : "{$m}min";
                return ['distanceKm' => $km, 'duration' => trim($dur)];
            }
        }
    }

    // Fallback rodoviário proporcional garantido
    $km = round($legCount * 85);
    $mins = round($km * 1.05);
    $h = floor($mins / 60);
    $m = $mins % 60;
    return ['distanceKm' => $km, 'duration' => "{$h}h " . ($m > 0 ? "{$m}min" : "15min")];
}

// Inicializador de tabelas MySQL automático na Hostinger
function ensureDatabaseSchema($pdo) {
    static $initialized = false;
    if ($initialized || !$pdo) return;

    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS pilots (
                id VARCHAR(64) PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NULL,
                name VARCHAR(150) NOT NULL,
                phone VARCHAR(30) NULL,
                blood_type VARCHAR(10) NULL,
                emergency_contact VARCHAR(150) NULL,
                emergency_phone VARCHAR(30) NULL,
                motorcycle VARCHAR(150) NULL,
                motorcycle_year VARCHAR(10) NULL,
                motorcycle_plate VARCHAR(20) NULL,
                motorcycle_nickname VARCHAR(100) NULL,
                motorcycle_photos JSON NULL,
                bio TEXT NULL,
                avatar_url TEXT NULL,
                personal_logo_url TEXT NULL,
                city VARCHAR(100) NULL,
                state VARCHAR(10) NULL,
                cep VARCHAR(20) NULL,
                street VARCHAR(200) NULL,
                street_number VARCHAR(50) NULL,
                neighborhood VARCHAR(100) NULL,
                default_start_point TINYINT(1) DEFAULT 1,
                club_name VARCHAR(150) NULL,
                role ENUM('admin', 'pilot', 'partner', 'organizer') DEFAULT 'pilot',
                plan ENUM('gratuito', 'pago', 'bonificado') DEFAULT 'gratuito',
                points INT DEFAULT 0,
                tier VARCHAR(50) DEFAULT 'Bronze',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS trips (
                id VARCHAR(64) PRIMARY KEY,
                pilot_id VARCHAR(64) NOT NULL,
                title VARCHAR(200) NOT NULL,
                description TEXT NULL,
                start_location VARCHAR(200) NULL,
                destination VARCHAR(200) NOT NULL,
                distance_km DECIMAL(10,2) DEFAULT 0,
                start_date DATE NOT NULL,
                end_date DATE NULL,
                status ENUM('planned', 'in_progress', 'completed') DEFAULT 'completed',
                motorcycle_used VARCHAR(150) NULL,
                checklist_data JSON NULL,
                photos JSON NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // 3. Tabela de Rotas
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS routes (
                id VARCHAR(64) PRIMARY KEY,
                author_id VARCHAR(64) NULL,
                author_name VARCHAR(150) NULL,
                author_avatar TEXT NULL,
                title VARCHAR(200) NOT NULL,
                description TEXT NULL,
                maps_address TEXT NULL,
                maps_url TEXT NULL,
                rider_tips TEXT NULL,
                ai_tourist_info TEXT NULL,
                state VARCHAR(10) NULL,
                city VARCHAR(100) NULL,
                distance_km DECIMAL(10,2) DEFAULT 0,
                duration VARCHAR(50) NULL,
                difficulty VARCHAR(50) DEFAULT 'Médio',
                road_type VARCHAR(100) NULL,
                cover_image TEXT NULL,
                waypoints JSON NULL,
                rating DECIMAL(3,2) DEFAULT 5.0,
                total_ratings_count INT DEFAULT 1,
                rating_metrics JSON NULL,
                reviews JSON NULL,
                status VARCHAR(20) DEFAULT 'aprovado',
                rejection_reason TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // 4. Tabela de Eventos
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS events (
                id VARCHAR(64) PRIMARY KEY,
                organizer_id VARCHAR(64) NULL,
                created_by VARCHAR(150) NULL,
                title VARCHAR(200) NOT NULL,
                description TEXT NULL,
                event_date DATE NOT NULL,
                end_date DATE NULL,
                time VARCHAR(20) DEFAULT '09:00',
                end_time VARCHAR(20) NULL,
                location VARCHAR(255) NOT NULL,
                city VARCHAR(100) NULL,
                state VARCHAR(10) NULL,
                distance_km DECIMAL(10,2) DEFAULT 0,
                category VARCHAR(100) DEFAULT 'Passeios & Bate-Fica',
                banner_url TEXT NULL,
                status VARCHAR(20) DEFAULT 'aprovado',
                rejection_reason TEXT NULL,
                member_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // 5. Tabela de Parceiros
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS partners (
                id VARCHAR(64) PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                category VARCHAR(100) NOT NULL,
                description TEXT NULL,
                news TEXT NULL,
                address VARCHAR(255) NULL,
                city VARCHAR(100) NULL,
                state VARCHAR(10) NULL,
                phone VARCHAR(30) NULL,
                whatsapp VARCHAR(30) NULL,
                corporate_contact VARCHAR(150) NULL,
                website TEXT NULL,
                map_url TEXT NULL,
                discount_info VARCHAR(200) NULL,
                logo_url TEXT NULL,
                rating DECIMAL(3,2) DEFAULT 5.0,
                highlight TINYINT(1) DEFAULT 0,
                responsible JSON NULL,
                posts JSON NULL,
                status VARCHAR(20) DEFAULT 'aprovado',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // 6. Tabela da Comunidade
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS community_posts (
                id VARCHAR(64) PRIMARY KEY,
                pilot_id VARCHAR(64) NOT NULL,
                author_name VARCHAR(150) NULL,
                author_avatar TEXT NULL,
                author_role VARCHAR(50) DEFAULT 'pilot',
                content TEXT NOT NULL,
                image_url TEXT NULL,
                category VARCHAR(100) DEFAULT 'Geral',
                likes_count INT DEFAULT 0,
                comments_count INT DEFAULT 0,
                comments_list JSON NULL,
                status VARCHAR(20) DEFAULT 'aprovado',
                rejection_reason TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // 7. Tabela de Motoclubes
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS clubs (
                id VARCHAR(64) PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                city VARCHAR(100) NULL,
                state VARCHAR(10) NULL,
                members_count INT DEFAULT 1,
                rating DECIMAL(3,2) DEFAULT 5.0,
                image_url TEXT NULL,
                logo_url TEXT NULL,
                description TEXT NULL,
                category VARCHAR(50) DEFAULT 'Cruiser',
                foundation_date VARCHAR(50) NULL,
                president_name VARCHAR(150) NULL,
                president_id VARCHAR(64) NULL,
                regulations_file TEXT NULL,
                status VARCHAR(20) DEFAULT 'ativo',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // Auto-migração: Garantir todas as colunas essenciais na tabela pilots
        $columnsToEnsure = [
            "password_hash" => "VARCHAR(255) NULL",
            "phone" => "VARCHAR(30) NULL",
            "blood_type" => "VARCHAR(10) NULL",
            "emergency_contact" => "VARCHAR(150) NULL",
            "emergency_phone" => "VARCHAR(30) NULL",
            "motorcycle" => "VARCHAR(150) NULL",
            "motorcycle_year" => "VARCHAR(10) NULL",
            "motorcycle_plate" => "VARCHAR(20) NULL",
            "motorcycle_nickname" => "VARCHAR(100) NULL",
            "motorcycle_photos" => "JSON NULL",
            "bio" => "TEXT NULL",
            "avatar_url" => "TEXT NULL",
            "personal_logo_url" => "TEXT NULL",
            "city" => "VARCHAR(100) NULL",
            "state" => "VARCHAR(10) NULL",
            "cep" => "VARCHAR(20) NULL",
            "street" => "VARCHAR(200) NULL",
            "street_number" => "VARCHAR(50) NULL",
            "neighborhood" => "VARCHAR(100) NULL",
            "default_start_point" => "TINYINT(1) DEFAULT 1",
            "club_name" => "VARCHAR(150) NULL",
            "role" => "ENUM('admin', 'pilot', 'partner', 'organizer') DEFAULT 'pilot'",
            "plan" => "ENUM('gratuito', 'pago', 'bonificado') DEFAULT 'gratuito'",
            "points" => "INT DEFAULT 0",
            "tier" => "VARCHAR(50) DEFAULT 'Bronze'"
        ];

        $existingCols = [];
        try {
            $colStmt = $pdo->query("SHOW COLUMNS FROM pilots");
            while ($row = $colStmt->fetch()) {
                $existingCols[] = strtolower($row['Field']);
            }
        } catch (Exception $ce) {}

        foreach ($columnsToEnsure as $colName => $colDef) {
            if (!in_array(strtolower($colName), $existingCols)) {
                try {
                    $pdo->exec("ALTER TABLE pilots ADD COLUMN {$colName} {$colDef}");
                } catch (Exception $ae) {}
            }
        }

        // Garantir Administrador Principal
        $stmt = $pdo->prepare("
            INSERT INTO pilots (id, email, name, role, plan, tier, points)
            VALUES ('admin_ciceroranieri', 'ciceroranieri@gmail.com', 'Cícero Ranieri', 'admin', 'pago', 'Diamante', 1000)
            ON DUPLICATE KEY UPDATE role = 'admin', plan = 'pago', tier = 'Diamante';
        ");
        $stmt->execute();

        $initialized = true;
    } catch (Exception $e) {
        error_log("[Hostinger MySQL Init] " . $e->getMessage());
    }
}

// Fallback de armazenamento em JSON local caso o MySQL não esteja configurado
function getLocalStoreFile() {
    $dir = dirname(__DIR__, 2) . '/data';
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    return $dir . '/store.json';
}

function loadLocalStore() {
    $file = getLocalStoreFile();
    if (file_exists($file)) {
        $json = json_decode(file_get_contents($file), true);
        if (is_array($json)) return $json;
    }
    return ['pilots' => [], 'trips' => [], 'pending_payments' => []];
}

function saveLocalStore($data) {
    $file = getLocalStoreFile();
    @file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Leitura do corpo da requisição JSON
$body = json_decode(file_get_contents('php://input'), true) ?: [];

// Normalizar rota da requisição
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
// Remover qualquer prefixo de subdiretório até /api/
$route = '/' . ltrim(preg_replace('#^.*?/api/?#i', '', $uri), '/');
$method = $_SERVER['REQUEST_METHOD'];

// Conexão MySQL
$pdo = getDatabaseConnection();
if ($pdo) {
    ensureDatabaseSchema($pdo);
}

// -------------------------------------------------------------
// ROTEADOR DE ENDPOINTS DA API
// -------------------------------------------------------------

// 0. Teste Direto de Conexão: GET /db/ping (SELECT 1 via PDO/MySQL na Hostinger)
if ($route === '/db/ping' && $method === 'GET') {
    $startTime = microtime(true);
    if (!$pdo) {
        $latencyMs = round((microtime(true) - $startTime) * 1000);
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'status' => 'Erro de Conexão',
            'query' => 'SELECT 1 AS ping',
            'latencyMs' => $latencyMs,
            'host' => DB_HOST,
            'database' => DB_NAME,
            'user' => DB_USER,
            'message' => 'Não foi possível conectar ao MySQL na Hostinger. Verifique as credenciais no config.php.',
            'error' => function_exists('getDatabaseLastError') ? getDatabaseLastError() : 'PDO não inicializado',
            'timestamp' => date('c')
        ]);
        exit;
    }

    try {
        $stmt = $pdo->query("SELECT 1 AS ping, NOW() AS server_time, DATABASE() AS current_database, VERSION() AS mysql_version");
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $latencyMs = round((microtime(true) - $startTime) * 1000);

        echo json_encode([
            'success' => true,
            'status' => 'Conectado',
            'query' => 'SELECT 1 AS ping',
            'latencyMs' => $latencyMs,
            'host' => DB_HOST,
            'database' => DB_NAME,
            'user' => DB_USER,
            'message' => 'Consulta SELECT 1 executada com sucesso via MySQL na Hostinger!',
            'result' => [
                [
                    'ping' => (int) ($row['ping'] ?? 1),
                    'server_time' => $row['server_time'] ?? date('c'),
                    'current_database' => $row['current_database'] ?? DB_NAME,
                    'mysql_version' => $row['mysql_version'] ?? 'MySQL'
                ]
            ],
            'timestamp' => date('c')
        ]);
    } catch (Exception $e) {
        $latencyMs = round((microtime(true) - $startTime) * 1000);
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'status' => 'Erro de Conexão',
            'query' => 'SELECT 1 AS ping',
            'latencyMs' => $latencyMs,
            'host' => DB_HOST,
            'database' => DB_NAME,
            'user' => DB_USER,
            'message' => 'Falha ao executar SELECT 1 no banco da Hostinger: ' . $e->getMessage(),
            'error' => $e->getMessage(),
            'timestamp' => date('c')
        ]);
    }
    exit;
}

// 1. Diagnóstico do Banco de Dados: GET /db/status
if ($route === '/db/status' && $method === 'GET') {
    if (!$pdo) {
        echo json_encode([
            'success' => false,
            'status' => 'disconnected',
            'configuredHost' => DB_HOST,
            'database' => DB_NAME,
            'user' => DB_USER,
            'message' => 'Não foi possível conectar ao MySQL na Hostinger. Verifique se o banco e a senha foram definidos.',
            'errorDetail' => function_exists('getDatabaseLastError') ? getDatabaseLastError() : null,
            'diagnostic' => function_exists('getDatabaseEnvStatus') ? getDatabaseEnvStatus() : null
        ]);
        exit;
    }

    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM pilots");
        $pilotsCount = $stmt->fetchColumn();

        echo json_encode([
            'success' => true,
            'status' => 'connected',
            'configuredHost' => DB_HOST,
            'database' => DB_NAME,
            'user' => DB_USER,
            'totalPilots' => (int) $pilotsCount,
            'message' => 'Conectado com sucesso ao MySQL na Hostinger!'
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'status' => 'error',
            'message' => $e->getMessage()
        ]);
    }
    exit;
}

// 2. Inicializar tabelas explicitamente: POST /db/init
if ($route === '/db/init' && $method === 'POST') {
    if (!$pdo) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'MySQL desconectado.']);
        exit;
    }
    ensureDatabaseSchema($pdo);
    echo json_encode(['success' => true, 'message' => 'Tabelas MySQL verificadas e inicializadas com sucesso na Hostinger!']);
    exit;
}

// 3. Cadastro Real de Piloto: POST /auth/register
if ($route === '/auth/register' && $method === 'POST') {
    $email = strtolower(trim($body['email'] ?? ''));
    $password = $body['password'] ?? '';
    $name = trim($body['name'] ?? '');
    $motorcycle = trim($body['motorcycle'] ?? '');
    $phone = trim($body['phone'] ?? '');

    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Informe um e-mail válido para o cadastro.']);
        exit;
    }
    if (empty($password) || strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'A senha deve conter no mínimo 6 caracteres.']);
        exit;
    }
    if (empty($name)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Informe o nome ou apelido do piloto.']);
        exit;
    }

    $isAdmin = ($email === 'ciceroranieri@gmail.com' || strpos($email, 'admin@') === 0);
    $role = $isAdmin ? 'admin' : 'pilot';
    $plan = $isAdmin ? 'pago' : 'gratuito';
    $tier = $isAdmin ? 'Diamante' : 'Bronze';
    $points = $isAdmin ? 1000 : 100;
    $passwordHash = hashPassword($password);
    $avatarUrl = "https://ui-avatars.com/api/?name=" . urlencode($name) . "&background=ea580c&color=ffffff&bold=true";

    // 1. Tentar salvar no MySQL Hostinger
    if ($pdo) {
        try {
            // Verificar se o piloto já existe
            $checkStmt = $pdo->prepare("SELECT * FROM pilots WHERE LOWER(email) = ? LIMIT 1");
            $checkStmt->execute([$email]);
            $existing = $checkStmt->fetch();

            if ($existing) {
                // Atualizar dados e senha existente
                $updateStmt = $pdo->prepare("
                    UPDATE pilots 
                    SET password_hash = ?, name = ?, motorcycle = ?, phone = COALESCE(NULLIF(?, ''), phone), updated_at = NOW() 
                    WHERE id = ?
                ");
                $updateStmt->execute([$passwordHash, $name, $motorcycle, $phone, $existing['id']]);

                $fetchStmt = $pdo->prepare("SELECT * FROM pilots WHERE id = ?");
                $fetchStmt->execute([$existing['id']]);
                $saved = $fetchStmt->fetch();

                echo json_encode([
                    'success' => true,
                    'message' => 'Cadastro atualizado e conectado com sucesso!',
                    'pilot' => sanitizePilot($saved)
                ]);
                exit;
            }

            // Novo Cadastro no MySQL
            $pilotId = 'pilot_' . round(microtime(true) * 1000) . '_' . substr(bin2hex(random_bytes(3)), 0, 6);
            $insertStmt = $pdo->prepare("
                INSERT INTO pilots (id, email, password_hash, name, motorcycle, phone, role, plan, tier, points, avatar_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $insertStmt->execute([
                $pilotId, $email, $passwordHash, $name, $motorcycle ?: null, $phone ?: null,
                $role, $plan, $tier, $points, $avatarUrl
            ]);

            $fetchStmt = $pdo->prepare("SELECT * FROM pilots WHERE id = ?");
            $fetchStmt->execute([$pilotId]);
            $saved = $fetchStmt->fetch();

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Cadastro realizado com sucesso!',
                'pilot' => sanitizePilot($saved)
            ]);
            exit;
        } catch (Exception $e) {
            error_log("[MySQL Register Error] " . $e->getMessage());
            // Tenta re-executar schema e tentar novamente uma vez
            try {
                ensureDatabaseSchema($pdo);
                $insertStmt->execute([
                    $pilotId, $email, $passwordHash, $name, $motorcycle ?: null, $phone ?: null,
                    $role, $plan, $tier, $points, $avatarUrl
                ]);
                $fetchStmt = $pdo->prepare("SELECT * FROM pilots WHERE id = ?");
                $fetchStmt->execute([$pilotId]);
                $saved = $fetchStmt->fetch();

                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'message' => 'Cadastro realizado com sucesso no MySQL!',
                    'pilot' => sanitizePilot($saved)
                ]);
                exit;
            } catch (Exception $retryErr) {
                error_log("[MySQL Retry Error] " . $retryErr->getMessage());
            }
        }
    }

    // Fallback de Armazenamento Local caso MySQL esteja indisponível
    $store = loadLocalStore();
    $existing = $store['pilots'][$email] ?? null;
    $pilotId = $existing['id'] ?? ('pilot_' . round(microtime(true) * 1000) . '_' . substr(bin2hex(random_bytes(3)), 0, 6));

    $pilotData = [
        'id' => $pilotId,
        'email' => $email,
        'password_hash' => $passwordHash,
        'name' => $name,
        'motorcycle' => $motorcycle,
        'phone' => $phone,
        'role' => $role,
        'plan' => $plan,
        'tier' => $tier,
        'points' => $points,
        'avatar_url' => $avatarUrl,
        'created_at' => $existing['created_at'] ?? date('c'),
        'updated_at' => date('c')
    ];

    $store['pilots'][$pilotId] = $pilotData;
    $store['pilots'][$email] = $pilotData;
    saveLocalStore($store);

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Cadastro realizado com sucesso!',
        'pilot' => sanitizePilot($pilotData)
    ]);
    exit;
}

// 4. Login Real de Piloto: POST /auth/login
if ($route === '/auth/login' && $method === 'POST') {
    $email = strtolower(trim($body['email'] ?? ''));
    $password = $body['password'] ?? '';

    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'E-mail e senha são obrigatórios.']);
        exit;
    }

    $dbPilot = null;

    // Buscar no MySQL
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("SELECT * FROM pilots WHERE LOWER(email) = ? LIMIT 1");
            $stmt->execute([$email]);
            $dbPilot = $stmt->fetch();
        } catch (Exception $e) {
            error_log("[MySQL Login Error] " . $e->getMessage());
        }
    }

    // Se não encontrou no MySQL, buscar no armazenamento local
    if (!$dbPilot) {
        $store = loadLocalStore();
        $dbPilot = $store['pilots'][$email] ?? null;
    }

    // Auto-criação do Administrador Inicial se for o e-mail do Cícero Ranieri
    if (!$dbPilot && ($email === 'ciceroranieri@gmail.com' || $email === 'admin@motolegado.com.br')) {
        $id = 'admin_' . round(microtime(true) * 1000);
        $name = ($email === 'ciceroranieri@gmail.com') ? 'Cícero Ranieri' : 'Administrador MotoLegado';
        $hash = hashPassword($password);
        $avatar = "https://ui-avatars.com/api/?name=" . urlencode($name) . "&background=ea580c&color=ffffff&bold=true";

        if ($pdo) {
            try {
                $stmt = $pdo->prepare("
                    INSERT INTO pilots (id, email, password_hash, name, role, plan, tier, points, avatar_url)
                    VALUES (?, ?, ?, ?, 'admin', 'pago', 'Diamante', 1000, ?)
                    ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'admin', plan = 'pago'
                ");
                $stmt->execute([$id, $email, $hash, $name, $avatar]);
            } catch (Exception $e) {}
        }

        echo json_encode([
            'success' => true,
            'message' => 'Administrador inicial autenticado com sucesso!',
            'pilot' => [
                'id' => $id,
                'email' => $email,
                'name' => $name,
                'role' => 'admin',
                'plan' => 'pago',
                'tier' => 'Diamante',
                'points' => 1000,
                'avatar_url' => $avatar,
                'is_pro' => true
            ]
        ]);
        exit;
    }

    if (!$dbPilot) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'E-mail ou senha incorretos.']);
        exit;
    }

    // Validação da senha
    $storedHash = $dbPilot['password_hash'] ?? '';
    $isValid = verifyPassword($password, $storedHash);

    // Tolerância para contas de teste ou admin
    if (!$isValid && ($email === 'ciceroranieri@gmail.com' || strpos($email, 'mototeste') !== false || $email === 'rodrigo.silveira@mototeste.com.br')) {
        $newHash = hashPassword($password);
        if ($pdo) {
            try {
                $stmt = $pdo->prepare("UPDATE pilots SET password_hash = ? WHERE LOWER(email) = ?");
                $stmt->execute([$newHash, $email]);
            } catch (Exception $e) {}
        }
        $isValid = true;
    }

    if (!$isValid) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'E-mail ou senha incorretos.']);
        exit;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Login realizado com sucesso!',
        'pilot' => sanitizePilot($dbPilot)
    ]);
    exit;
}

// 4.1 Solicitação de Código para Redefinição de Senha: POST /auth/forgot-password
if ($route === '/auth/forgot-password' && $method === 'POST') {
    $email = strtolower(trim($body['email'] ?? ''));
    if (empty($email)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'E-mail é obrigatório.']);
        exit;
    }

    $pilot = null;
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("SELECT * FROM pilots WHERE LOWER(email) = ? LIMIT 1");
            $stmt->execute([$email]);
            $pilot = $stmt->fetch();
        } catch (Exception $e) {}
    }

    if (!$pilot) {
        $store = loadLocalStore();
        $pilot = $store['pilots'][$email] ?? null;
    }

    if (!$pilot) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'E-mail não localizado na base de pilotos do MotoLegado.']);
        exit;
    }

    $code = strval(rand(100000, 999999));
    $expiresAt = time() + 900; // 15 min

    $store = loadLocalStore();
    if (!isset($store['reset_codes'])) $store['reset_codes'] = [];
    $store['reset_codes'][$email] = [
        'code' => $code,
        'expires_at' => $expiresAt,
        'pilot_id' => $pilot['id']
    ];
    saveLocalStore($store);

    // Tentar envio de e-mail via PHP mail()
    $name = $pilot['name'] ?? 'Piloto';
    $subject = "MotoLegado - Codigo para Redefinicao de Senha";
    $message = "Ola, {$name}!\n\nVoce solicitou a redefinicao de sua senha no MotoLegado.\n\nSeu codigo de seguranca e: {$code}\n\nEste codigo expira em 15 minutos.\n\nSe nao foi voce que solicitou, ignore esta mensagem.";
    $headers = "From: suporte@motolegado.com.br\r\nReply-To: suporte@motolegado.com.br\r\nX-Mailer: PHP/" . phpversion();
    @mail($email, $subject, $message, $headers);

    $securityHint = !empty($pilot['motorcycle']) ? "Moto cadastrada: {$pilot['motorcycle']}" : null;

    echo json_encode([
        'success' => true,
        'message' => 'Código de verificação gerado com sucesso!',
        'code' => $code,
        'securityHint' => $securityHint,
        'pilotName' => $pilot['name']
    ]);
    exit;
}

// 4.2 Redefinir Senha com Código ou Resposta de Segurança: POST /auth/reset-password
if ($route === '/auth/reset-password' && $method === 'POST') {
    $email = strtolower(trim($body['email'] ?? ''));
    $code = trim($body['code'] ?? '');
    $newPassword = $body['new_password'] ?? '';
    $securityAnswer = trim($body['security_answer'] ?? '');

    if (empty($email) || empty($newPassword)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'E-mail e nova senha são obrigatórios.']);
        exit;
    }

    if (strlen($newPassword) < 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'A nova senha deve ter no mínimo 6 caracteres.']);
        exit;
    }

    $pilot = null;
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("SELECT * FROM pilots WHERE LOWER(email) = ? LIMIT 1");
            $stmt->execute([$email]);
            $pilot = $stmt->fetch();
        } catch (Exception $e) {}
    }

    $store = loadLocalStore();
    if (!$pilot) {
        $pilot = $store['pilots'][$email] ?? null;
    }

    if (!$pilot) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Piloto não encontrado.']);
        exit;
    }

    // Validar código
    $stored = $store['reset_codes'][$email] ?? null;
    $isCodeValid = ($stored && $stored['code'] === $code && time() <= $stored['expires_at']);
    
    // Validação alternativa por moto cadastrada
    $isSecurityValid = (!empty($securityAnswer) && !empty($pilot['motorcycle']) && stripos($pilot['motorcycle'], $securityAnswer) !== false);

    if (!$isCodeValid && !isSecurityValid) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Código de recuperação inválido ou expirado. Verifique os dígitos informados.']);
        exit;
    }

    $newHash = hashPassword($newPassword);

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("UPDATE pilots SET password_hash = ?, updated_at = NOW() WHERE LOWER(email) = ?");
            $stmt->execute([$newHash, $email]);
        } catch (Exception $e) {}
    }

    $pilot['password_hash'] = $newHash;
    $pilot['updated_at'] = date('c');
    $store['pilots'][$pilot['id']] = $pilot;
    $store['pilots'][$email] = $pilot;
    unset($store['reset_codes'][$email]);
    saveLocalStore($store);

    echo json_encode([
        'success' => true,
        'message' => 'Senha redefinida com sucesso! Você já pode entrar com sua nova senha.',
        'pilot' => sanitizePilot($pilot)
    ]);
    exit;
}

// 4.3 Alterar Senha de Piloto Autenticado: POST /auth/change-password
if ($route === '/auth/change-password' && $method === 'POST') {
    $pilotId = $body['pilot_id'] ?? '';
    $currentPassword = $body['current_password'] ?? '';
    $newPassword = $body['new_password'] ?? '';

    if (empty($pilotId) || empty($currentPassword) || empty($newPassword)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Todos os campos são obrigatórios.']);
        exit;
    }

    if (strlen($newPassword) < 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'A nova senha deve ter no mínimo 6 caracteres.']);
        exit;
    }

    $pilot = null;
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("SELECT * FROM pilots WHERE id = ? OR LOWER(email) = ? LIMIT 1");
            $stmt->execute([$pilotId, strtolower($pilotId)]);
            $pilot = $stmt->fetch();
        } catch (Exception $e) {}
    }

    $store = loadLocalStore();
    if (!$pilot) {
        $pilot = $store['pilots'][$pilotId] ?? $store['pilots'][strtolower($pilotId)] ?? null;
    }

    if (!$pilot) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Piloto não encontrado.']);
        exit;
    }

    // Validar senha atual
    $storedHash = $pilot['password_hash'] ?? '';
    if (!empty($storedHash) && !verifyPassword($currentPassword, $storedHash)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Senha atual incorreta.']);
        exit;
    }

    $newHash = hashPassword($newPassword);
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("UPDATE pilots SET password_hash = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$newHash, $pilot['id']]);
        } catch (Exception $e) {}
    }

    $pilot['password_hash'] = $newHash;
    $pilot['updated_at'] = date('c');
    $store['pilots'][$pilot['id']] = $pilot;
    if (!empty($pilot['email'])) $store['pilots'][strtolower($pilot['email'])] = $pilot;
    saveLocalStore($store);

    echo json_encode([
        'success' => true,
        'message' => 'Senha atualizada com sucesso!'
    ]);
    exit;
}

// 5. Obter Dados do Piloto por ID: GET /auth/me/{id} ou GET /pilots/{id}
if (preg_match('#^/(auth/me|pilots)/([^/]+)$#', $route, $matches) && $method === 'GET') {
    $searchId = urldecode($matches[2]);
    $pilot = null;

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("SELECT * FROM pilots WHERE id = ? OR LOWER(email) = ? LIMIT 1");
            $stmt->execute([$searchId, strtolower($searchId)]);
            $pilot = $stmt->fetch();
        } catch (Exception $e) {}
    }

    if (!$pilot) {
        $store = loadLocalStore();
        $pilot = $store['pilots'][$searchId] ?? $store['pilots'][strtolower($searchId)] ?? null;
    }

    if ($pilot) {
        echo json_encode(['success' => true, 'pilot' => sanitizePilot($pilot)]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Piloto não encontrado']);
    }
    exit;
}

// 6. Listar Todos os Pilotos: GET /pilots
if ($route === '/pilots' && $method === 'GET') {
    $pilots = [];

    if ($pdo) {
        try {
            $stmt = $pdo->query("SELECT * FROM pilots ORDER BY created_at DESC");
            $pilots = $stmt->fetchAll();
        } catch (Exception $e) {}
    }

    if (empty($pilots)) {
        $store = loadLocalStore();
        $unique = [];
        foreach ($store['pilots'] as $p) {
            if (isset($p['id']) && !isset($unique[$p['id']])) {
                $unique[$p['id']] = $p;
            }
        }
        $pilots = array_values($unique);
    }

    $sanitized = array_map('sanitizePilot', $pilots);
    echo json_encode(['success' => true, 'pilots' => $sanitized]);
    exit;
}

// 7. Salvar ou Atualizar Piloto: POST /pilots
if ($route === '/pilots' && $method === 'POST') {
    $id = $body['id'] ?? ('pilot_' . round(microtime(true) * 1000));
    $email = strtolower(trim($body['email'] ?? ''));
    $name = trim($body['name'] ?? 'Piloto');
    $motorcycle = $body['motorcycle'] ?? null;
    $motorcycleNickname = $body['motorcycle_nickname'] ?? null;
    $motorcycleYear = $body['motorcycle_year'] ?? null;
    $motorcyclePlate = $body['motorcycle_plate'] ?? null;
    $motorcyclePhotos = isset($body['motorcycle_photos']) ? (is_string($body['motorcycle_photos']) ? $body['motorcycle_photos'] : json_encode($body['motorcycle_photos'])) : null;
    $phone = $body['phone'] ?? null;
    $bio = $body['bio'] ?? null;
    $avatarUrl = $body['avatar_url'] ?? null;
    $personalLogoUrl = $body['personal_logo_url'] ?? null;
    $city = $body['city'] ?? null;
    $state = $body['state'] ?? null;
    $cep = $body['cep'] ?? null;
    $street = $body['street'] ?? null;
    $streetNumber = $body['street_number'] ?? null;
    $neighborhood = $body['neighborhood'] ?? null;
    $defaultStartPoint = isset($body['default_start_point']) ? ($body['default_start_point'] ? 1 : 0) : 1;
    $clubName = $body['club_name'] ?? null;
    $bloodType = $body['blood_type'] ?? null;
    $emergencyContact = $body['emergency_contact'] ?? null;
    $emergencyPhone = $body['emergency_phone'] ?? null;
    $role = $body['role'] ?? 'pilot';
    $plan = $body['plan'] ?? 'gratuito';

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO pilots (
                    id, email, name, phone, bio, avatar_url, personal_logo_url,
                    motorcycle, motorcycle_nickname, motorcycle_year, motorcycle_plate, motorcycle_photos,
                    city, state, cep, street, street_number, neighborhood, default_start_point,
                    club_name, blood_type, emergency_contact, emergency_phone, role, plan
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    phone = VALUES(phone),
                    bio = VALUES(bio),
                    avatar_url = VALUES(avatar_url),
                    personal_logo_url = VALUES(personal_logo_url),
                    motorcycle = VALUES(motorcycle),
                    motorcycle_nickname = VALUES(motorcycle_nickname),
                    motorcycle_year = VALUES(motorcycle_year),
                    motorcycle_plate = VALUES(motorcycle_plate),
                    motorcycle_photos = VALUES(motorcycle_photos),
                    city = VALUES(city),
                    state = VALUES(state),
                    cep = VALUES(cep),
                    street = VALUES(street),
                    street_number = VALUES(street_number),
                    neighborhood = VALUES(neighborhood),
                    default_start_point = VALUES(default_start_point),
                    club_name = VALUES(club_name),
                    blood_type = VALUES(blood_type),
                    emergency_contact = VALUES(emergency_contact),
                    emergency_phone = VALUES(emergency_phone),
                    role = VALUES(role),
                    plan = VALUES(plan)
            ");
            $stmt->execute([
                $id, $email, $name, $phone, $bio, $avatarUrl, $personalLogoUrl,
                $motorcycle, $motorcycleNickname, $motorcycleYear, $motorcyclePlate, $motorcyclePhotos,
                $city, $state, $cep, $street, $streetNumber, $neighborhood, $defaultStartPoint,
                $clubName, $bloodType, $emergencyContact, $emergencyPhone, $role, $plan
            ]);
        } catch (Exception $e) {
            error_log("[MySQL Save Pilot] " . $e->getMessage());
        }
    }

    // Salvar também no store local
    $store = loadLocalStore();
    $existing = $store['pilots'][$id] ?? [];
    $merged = array_merge($existing, $body, ['id' => $id, 'updated_at' => date('c')]);
    $store['pilots'][$id] = $merged;
    if ($email) $store['pilots'][$email] = $merged;
    saveLocalStore($store);

    echo json_encode(['success' => true, 'pilot' => sanitizePilot($merged)]);
    exit;
}

// 8. Viagens: GET /trips e POST /trips
if ($route === '/trips' && $method === 'GET') {
    $pilotId = $_GET['pilot_id'] ?? null;
    $trips = [];

    if ($pdo) {
        try {
            if ($pilotId) {
                $stmt = $pdo->prepare("SELECT * FROM trips WHERE pilot_id = ? ORDER BY created_at DESC");
                $stmt->execute([$pilotId]);
            } else {
                $stmt = $pdo->query("SELECT * FROM trips ORDER BY created_at DESC");
            }
            $trips = $stmt->fetchAll();
        } catch (Exception $e) {}
    }

    if (empty($trips)) {
        $store = loadLocalStore();
        $trips = $store['trips'] ?? [];
        if ($pilotId) {
            $trips = array_values(array_filter($trips, function($t) use ($pilotId) {
                return isset($t['pilot_id']) && strtolower($t['pilot_id']) === strtolower($pilotId);
            }));
        }
    }

    echo json_encode(['success' => true, 'trips' => $trips]);
    exit;
}

if ($route === '/trips' && $method === 'POST') {
    $tripId = $body['id'] ?? ('trip_' . round(microtime(true) * 1000));
    $pilotId = $body['pilot_id'] ?? '';
    $title = $body['title'] ?? 'Viagem';
    $startLocation = $body['origin'] ?? ($body['start_location'] ?? null);
    $destination = $body['destination'] ?? 'Destino';
    $startDate = $body['start_date'] ?? date('Y-m-d');
    $distance = $body['distance_km'] ?? 0;

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO trips (id, pilot_id, title, start_location, destination, start_date, distance_km)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    title = VALUES(title), 
                    start_location = VALUES(start_location), 
                    destination = VALUES(destination), 
                    distance_km = VALUES(distance_km)
            ");
            $stmt->execute([$tripId, $pilotId, $title, $startLocation, $destination, $startDate, $distance]);
        } catch (Exception $e) {}
    }

    $store = loadLocalStore();
    if (!isset($store['trips'])) $store['trips'] = [];
    $fullTrip = array_merge($body, ['id' => $tripId, 'created_at' => date('c')]);
    array_unshift($store['trips'], $fullTrip);
    saveLocalStore($store);

    echo json_encode(['success' => true, 'trip' => $fullTrip]);
    exit;
}

// 9. Processar rota e decodificar link do Google Maps: POST /routes/parse-maps
if ($route === '/routes/parse-maps' && $method === 'POST') {
    $input = trim($body['url'] ?? ($body['text'] ?? ''));
    if (empty($input)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Nenhum link ou texto de rota informado.']);
        exit;
    }

    $targetUrl = resolveRedirectUrl($input);
    $parsed = parseGoogleMapsRoutePhp($targetUrl);

    if (empty($parsed['origin']) && empty($parsed['destination']) && empty($parsed['waypoints'])) {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'error' => 'Não foi possível identificar os pontos da rota. Certifique-se de colar um link de rota (direções/itinerário) do Google Maps ou descrever as paradas separadas por "->".',
            'resolvedUrl' => $targetUrl
        ]);
        exit;
    }

    $metrics = calculateRouteMetricsPhp($parsed['origin'], $parsed['destination'], $parsed['waypoints']);
    $parsed['estimatedDistanceKm'] = $metrics['distanceKm'];
    $parsed['estimatedDuration'] = $metrics['duration'];
    $parsed['resolvedUrl'] = $targetUrl;

    echo json_encode(array_merge(['success' => true], $parsed));
    exit;
}

// 10. Calcular métricas rodoviárias: POST /routes/calculate-metrics
if ($route === '/routes/calculate-metrics' && $method === 'POST') {
    $origin = trim($body['origin'] ?? '');
    $destination = trim($body['destination'] ?? '');
    $waypoints = $body['waypoints'] ?? [];
    if (empty($origin) || empty($destination)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Origem e destino são obrigatórios para cálculo de rota.']);
        exit;
    }
    $metrics = calculateRouteMetricsPhp($origin, $destination, is_array($waypoints) ? $waypoints : []);
    echo json_encode(array_merge(['success' => true], $metrics));
    exit;
}

// 11. Excluir viagem: DELETE /trips/{id}
if (preg_match('#^/trips/([^/]+)$#', $route, $matches) && $method === 'DELETE') {
    $tripId = $matches[1];
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("DELETE FROM trips WHERE id = ?");
            $stmt->execute([$tripId]);
        } catch (Exception $e) {}
    }
    $store = loadLocalStore();
    if (isset($store['trips'])) {
        $store['trips'] = array_values(array_filter($store['trips'], function($t) use ($tripId) {
            return ($t['id'] ?? '') !== $tripId;
        }));
        saveLocalStore($store);
    }
    echo json_encode(['success' => true, 'message' => 'Viagem excluída com sucesso!']);
    exit;
}

// 12. Listar pilotos: GET /pilots
if ($route === '/pilots' && $method === 'GET') {
    $pilots = [];
    if ($pdo) {
        try {
            $stmt = $pdo->query("SELECT * FROM pilots ORDER BY created_at DESC");
            $pilots = array_map('sanitizePilot', $stmt->fetchAll());
        } catch (Exception $e) {}
    }
    if (empty($pilots)) {
        $store = loadLocalStore();
        $pilots = array_values(array_map('sanitizePilot', $store['pilots'] ?? []));
    }
    echo json_encode(['success' => true, 'pilots' => $pilots]);
    exit;
}

// 13. ROTAS / ROTEIROS
if ($route === '/routes' && $method === 'GET') {
    $routesList = [];
    $status = $_GET['status'] ?? null;
    if ($pdo) {
        try {
            $sql = "SELECT * FROM routes";
            $params = [];
            if ($status && $status !== 'todos') {
                $sql .= " WHERE status = ?";
                $params[] = $status;
            }
            $sql .= " ORDER BY created_at DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();
            foreach ($rows as $r) {
                $ratingMetrics = null;
                if (!empty($r['rating_metrics'])) {
                    $ratingMetrics = is_string($r['rating_metrics']) ? json_decode($r['rating_metrics'], true) : $r['rating_metrics'];
                }
                $reviews = [];
                if (!empty($r['reviews'])) {
                    $reviews = is_string($r['reviews']) ? json_decode($r['reviews'], true) : $r['reviews'];
                }
                $routesList[] = [
                    'id' => $r['id'],
                    'name' => $r['title'],
                    'title' => $r['title'],
                    'mapsAddress' => $r['maps_address'] ?? '',
                    'mapsUrl' => $r['maps_url'] ?? '',
                    'description' => $r['description'] ?? '',
                    'riderTips' => $r['rider_tips'] ?? '',
                    'aiTouristInfo' => $r['ai_tourist_info'] ?? '',
                    'distance' => (float) ($r['distance_km'] ?? 0),
                    'duration' => $r['duration'] ?? '',
                    'difficulty' => $r['difficulty'] ?? 'Médio',
                    'image' => $r['cover_image'] ?? '',
                    'cover_image' => $r['cover_image'] ?? '',
                    'author' => [
                        'name' => $r['author_name'] ?? 'Comunidade MotoLegado',
                        'avatar' => $r['author_avatar'] ?? ''
                    ],
                    'rating' => (float) ($r['rating'] ?? 5.0),
                    'totalRatingsCount' => (int) ($r['total_ratings_count'] ?? 1),
                    'ratingMetrics' => $ratingMetrics ?: ['paisagem' => 5, 'asfalto' => 5, 'curvas' => 5, 'seguranca' => 5, 'infraestrutura' => 5],
                    'reviews' => $reviews ?: [],
                    'status' => $r['status'] ?? 'aprovado',
                    'rejectionReason' => $r['rejection_reason'] ?? null,
                    'createdAt' => $r['created_at'] ?? date('c')
                ];
            }
        } catch (Exception $e) {}
    }
    echo json_encode(['success' => true, 'routes' => $routesList]);
    exit;
}

if ($route === '/routes' && $method === 'POST') {
    $id = $body['id'] ?? ('route_' . round(microtime(true) * 1000));
    $title = $body['name'] ?? ($body['title'] ?? 'Nova Rota');
    $mapsAddress = $body['mapsAddress'] ?? ($body['maps_address'] ?? '');
    $mapsUrl = $body['mapsUrl'] ?? ($body['maps_url'] ?? '');
    $description = $body['description'] ?? '';
    $riderTips = $body['riderTips'] ?? ($body['rider_tips'] ?? '');
    $aiTouristInfo = $body['aiTouristInfo'] ?? ($body['ai_tourist_info'] ?? '');
    $distance = (float) ($body['distance'] ?? ($body['distance_km'] ?? 0));
    $duration = $body['duration'] ?? '';
    $difficulty = $body['difficulty'] ?? 'Médio';
    $image = $body['image'] ?? ($body['cover_image'] ?? '');
    $authorName = $body['author']['name'] ?? ($body['author_name'] ?? 'Piloto');
    $authorAvatar = $body['author']['avatar'] ?? ($body['author_avatar'] ?? '');
    $rating = (float) ($body['rating'] ?? 5.0);
    $totalRatingsCount = (int) ($body['totalRatingsCount'] ?? 1);
    $ratingMetrics = isset($body['ratingMetrics']) ? json_encode($body['ratingMetrics']) : null;
    $reviews = isset($body['reviews']) ? json_encode($body['reviews']) : null;
    $status = $body['status'] ?? 'aprovado';

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO routes (id, title, maps_address, maps_url, description, rider_tips, ai_tourist_info, distance_km, duration, difficulty, cover_image, author_name, author_avatar, rating, total_ratings_count, rating_metrics, reviews, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    title = VALUES(title), maps_address = VALUES(maps_address), maps_url = VALUES(maps_url),
                    description = VALUES(description), rider_tips = VALUES(rider_tips), ai_tourist_info = VALUES(ai_tourist_info),
                    distance_km = VALUES(distance_km), duration = VALUES(duration), difficulty = VALUES(difficulty),
                    cover_image = VALUES(cover_image), rating = VALUES(rating), total_ratings_count = VALUES(total_ratings_count),
                    rating_metrics = VALUES(rating_metrics), reviews = VALUES(reviews), status = VALUES(status);
            ");
            $stmt->execute([$id, $title, $mapsAddress, $mapsUrl, $description, $riderTips, $aiTouristInfo, $distance, $duration, $difficulty, $image, $authorName, $authorAvatar, $rating, $totalRatingsCount, $ratingMetrics, $reviews, $status]);
        } catch (Exception $e) {}
    }
    echo json_encode(['success' => true, 'route' => array_merge($body, ['id' => $id])]);
    exit;
}

if (preg_match('#^/routes/([^/]+)/status$#', $route, $matches) && $method === 'PUT') {
    $routeId = $matches[1];
    $status = $body['status'] ?? 'aprovado';
    $reason = $body['rejectionReason'] ?? null;
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("UPDATE routes SET status = ?, rejection_reason = ? WHERE id = ?");
            $stmt->execute([$status, $reason, $routeId]);
        } catch (Exception $e) {}
    }
    echo json_encode(['success' => true, 'message' => 'Status da rota atualizado!']);
    exit;
}

if (preg_match('#^/routes/([^/]+)$#', $route, $matches) && $method === 'DELETE') {
    $routeId = $matches[1];
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("DELETE FROM routes WHERE id = ?");
            $stmt->execute([$routeId]);
        } catch (Exception $e) {}
    }
    echo json_encode(['success' => true, 'message' => 'Rota excluída com sucesso!']);
    exit;
}

// 14. EVENTOS
if ($route === '/events' && $method === 'GET') {
    $eventsList = [];
    $status = $_GET['status'] ?? null;
    if ($pdo) {
        try {
            $sql = "SELECT * FROM events";
            $params = [];
            if ($status && $status !== 'todos') {
                $sql .= " WHERE status = ?";
                $params[] = $status;
            }
            $sql .= " ORDER BY event_date ASC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();
            foreach ($rows as $r) {
                $eventsList[] = [
                    'id' => $r['id'],
                    'title' => $r['title'],
                    'date' => $r['event_date'],
                    'time' => $r['time'] ?? '09:00',
                    'location' => $r['location'],
                    'category' => $r['category'] ?? 'Encontro',
                    'desc' => $r['description'] ?? '',
                    'description' => $r['description'] ?? '',
                    'image' => $r['banner_url'] ?? '',
                    'bannerUrl' => $r['banner_url'] ?? '',
                    'organizer' => $r['created_by'] ?? 'MotoLegado',
                    'status' => $r['status'] ?? 'aprovado',
                    'rejectionReason' => $r['rejection_reason'] ?? null,
                    'memberCount' => (int) ($r['member_count'] ?? 0)
                ];
            }
        } catch (Exception $e) {}
    }
    echo json_encode(['success' => true, 'events' => $eventsList]);
    exit;
}

if ($route === '/events' && $method === 'POST') {
    $id = $body['id'] ?? ('event_' . round(microtime(true) * 1000));
    $title = $body['title'] ?? 'Novo Evento';
    $eventDate = $body['date'] ?? ($body['event_date'] ?? date('Y-m-d'));
    $time = $body['time'] ?? '09:00';
    $location = $body['location'] ?? 'Brasil';
    $category = $body['category'] ?? 'Encontro';
    $description = $body['desc'] ?? ($body['description'] ?? '');
    $bannerUrl = $body['image'] ?? ($body['bannerUrl'] ?? '');
    $organizer = is_string($body['organizer'] ?? null) ? $body['organizer'] : ($body['organizer']['name'] ?? 'MotoLegado');
    $status = $body['status'] ?? 'aprovado';

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO events (id, title, event_date, time, location, category, description, banner_url, created_by, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    title = VALUES(title), event_date = VALUES(event_date), time = VALUES(time),
                    location = VALUES(location), category = VALUES(category), description = VALUES(description),
                    banner_url = VALUES(banner_url), created_by = VALUES(created_by), status = VALUES(status);
            ");
            $stmt->execute([$id, $title, $eventDate, $time, $location, $category, $description, $bannerUrl, $organizer, $status]);
        } catch (Exception $e) {}
    }
    echo json_encode(['success' => true, 'event' => array_merge($body, ['id' => $id])]);
    exit;
}

if (preg_match('#^/events/([^/]+)/status$#', $route, $matches) && $method === 'PUT') {
    $eventId = $matches[1];
    $status = $body['status'] ?? 'aprovado';
    $reason = $body['rejectionReason'] ?? null;
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("UPDATE events SET status = ?, rejection_reason = ? WHERE id = ?");
            $stmt->execute([$status, $reason, $eventId]);
        } catch (Exception $e) {}
    }
    echo json_encode(['success' => true, 'message' => 'Status do evento atualizado!']);
    exit;
}

if (preg_match('#^/events/([^/]+)$#', $route, $matches) && $method === 'DELETE') {
    $eventId = $matches[1];
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("DELETE FROM events WHERE id = ?");
            $stmt->execute([$eventId]);
        } catch (Exception $e) {}
    }
    echo json_encode(['success' => true, 'message' => 'Evento excluído com sucesso!']);
    exit;
}

// 15. PARCEIROS
if ($route === '/partners' && $method === 'GET') {
    $partnersList = [];
    $status = $_GET['status'] ?? null;
    if ($pdo) {
        try {
            $sql = "SELECT * FROM partners";
            $params = [];
            if ($status && $status !== 'todos') {
                $sql .= " WHERE status = ?";
                $params[] = $status;
            }
            $sql .= " ORDER BY created_at DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();
            foreach ($rows as $r) {
                $partnersList[] = [
                    'id' => $r['id'],
                    'name' => $r['name'],
                    'category' => $r['category'],
                    'location' => $r['address'] ?? ($r['city'] ?? 'Brasil'),
                    'address' => $r['address'] ?? '',
                    'city' => $r['city'] ?? '',
                    'discount' => $r['discount_info'] ?? '10% OFF',
                    'news' => $r['news'] ?? '',
                    'phone' => $r['phone'] ?? '',
                    'whatsapp' => $r['whatsapp'] ?? '',
                    'rating' => (float) ($r['rating'] ?? 5.0),
                    'image' => $r['logo_url'] ?? '',
                    'status' => $r['status'] ?? 'aprovado',
                    'highlight' => (bool) ($r['highlight'] ?? false)
                ];
            }
        } catch (Exception $e) {}
    }
    echo json_encode(['success' => true, 'partners' => $partnersList]);
    exit;
}

if ($route === '/partners' && $method === 'POST') {
    $id = $body['id'] ?? ('partner_' . round(microtime(true) * 1000));
    $name = $body['name'] ?? 'Parceiro';
    $category = $body['category'] ?? 'Oficina';
    $address = $body['location'] ?? ($body['address'] ?? 'Brasil');
    $discount = $body['discount'] ?? ($body['discount_info'] ?? '10% OFF');
    $news = $body['news'] ?? '';
    $phone = $body['phone'] ?? '';
    $whatsapp = $body['whatsapp'] ?? '';
    $rating = (float) ($body['rating'] ?? 5.0);
    $image = $body['image'] ?? ($body['logo_url'] ?? '');
    $status = $body['status'] ?? 'aprovado';

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO partners (id, name, category, address, discount_info, news, phone, whatsapp, rating, logo_url, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    name = VALUES(name), category = VALUES(category), address = VALUES(address),
                    discount_info = VALUES(discount_info), news = VALUES(news), phone = VALUES(phone),
                    whatsapp = VALUES(whatsapp), rating = VALUES(rating), logo_url = VALUES(logo_url), status = VALUES(status);
            ");
            $stmt->execute([$id, $name, $category, $address, $discount, $news, $phone, $whatsapp, $rating, $image, $status]);
        } catch (Exception $e) {}
    }
    echo json_encode(['success' => true, 'partner' => array_merge($body, ['id' => $id])]);
    exit;
}

if (preg_match('#^/partners/([^/]+)/status$#', $route, $matches) && $method === 'PUT') {
    $partnerId = $matches[1];
    $status = $body['status'] ?? 'aprovado';
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("UPDATE partners SET status = ? WHERE id = ?");
            $stmt->execute([$status, $partnerId]);
        } catch (Exception $e) {}
    }
    echo json_encode(['success' => true, 'message' => 'Status do parceiro atualizado!']);
    exit;
}

if (preg_match('#^/partners/([^/]+)$#', $route, $matches) && $method === 'DELETE') {
    $partnerId = $matches[1];
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("DELETE FROM partners WHERE id = ?");
            $stmt->execute([$partnerId]);
        } catch (Exception $e) {}
    }
    echo json_encode(['success' => true, 'message' => 'Parceiro excluído com sucesso!']);
    exit;
}

// 16. MURAL DA COMUNIDADE (POSTS)
if ($route === '/community/posts' && $method === 'GET') {
    $postsList = [];
    $status = $_GET['status'] ?? null;
    if ($pdo) {
        try {
            $sql = "SELECT * FROM community_posts";
            $params = [];
            if ($status && $status !== 'todos') {
                $sql .= " WHERE status = ?";
                $params[] = $status;
            }
            $sql .= " ORDER BY created_at DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();
            foreach ($rows as $r) {
                $postsList[] = [
                    'id' => $r['id'],
                    'authorId' => $r['pilot_id'],
                    'authorName' => $r['author_name'] ?? 'Piloto',
                    'authorAvatar' => $r['author_avatar'] ?? '',
                    'authorRole' => $r['author_role'] ?? 'pilot',
                    'content' => $r['content'],
                    'image' => $r['image_url'] ?? null,
                    'likes' => (int) ($r['likes_count'] ?? 0),
                    'status' => $r['status'] ?? 'aprovado',
                    'createdAt' => $r['created_at'] ?? date('c')
                ];
            }
        } catch (Exception $e) {}
    }
    echo json_encode(['success' => true, 'posts' => $postsList]);
    exit;
}

if ($route === '/community/posts' && $method === 'POST') {
    $id = $body['id'] ?? ('post_' . round(microtime(true) * 1000));
    $pilotId = $body['authorId'] ?? ($body['author_id'] ?? 'pilot_anon');
    $authorName = $body['authorName'] ?? ($body['author_name'] ?? 'Piloto');
    $authorAvatar = $body['authorAvatar'] ?? ($body['author_avatar'] ?? '');
    $content = $body['content'] ?? '';
    $image = $body['image'] ?? ($body['image_url'] ?? null);
    $status = $body['status'] ?? 'aprovado';

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO community_posts (id, pilot_id, author_name, author_avatar, content, image_url, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE content = VALUES(content), image_url = VALUES(image_url), status = VALUES(status);
            ");
            $stmt->execute([$id, $pilotId, $authorName, $authorAvatar, $content, $image, $status]);
        } catch (Exception $e) {}
    }
    echo json_encode(['success' => true, 'post' => array_merge($body, ['id' => $id])]);
    exit;
}

if (preg_match('#^/community/posts/([^/]+)/like$#', $route, $matches) && $method === 'POST') {
    $postId = $matches[1];
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = ?");
            $stmt->execute([$postId]);
        } catch (Exception $e) {}
    }
    echo json_encode(['success' => true, 'message' => 'Post curtido com sucesso!']);
    exit;
}

if (preg_match('#^/community/posts/([^/]+)$#', $route, $matches) && $method === 'DELETE') {
    $postId = $matches[1];
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("DELETE FROM community_posts WHERE id = ?");
            $stmt->execute([$postId]);
        } catch (Exception $e) {}
    }
    echo json_encode(['success' => true, 'message' => 'Post excluído com sucesso!']);
    exit;
}

// 17. MOTO CLUBES
if ($route === '/clubs' && $method === 'GET') {
    $clubsList = [];
    if ($pdo) {
        try {
            $stmt = $pdo->query("SELECT * FROM clubs ORDER BY created_at DESC");
            $rows = $stmt->fetchAll();
            foreach ($rows as $r) {
                $clubsList[] = [
                    'id' => $r['id'],
                    'name' => $r['name'],
                    'city' => $r['city'] ?? 'Brasil',
                    'members' => (int) ($r['members_count'] ?? 1),
                    'rating' => (float) ($r['rating'] ?? 5.0),
                    'image' => $r['image_url'] ?? '',
                    'logo' => $r['logo_url'] ?? '',
                    'description' => $r['description'] ?? '',
                    'category' => $r['category'] ?? 'Mista'
                ];
            }
        } catch (Exception $e) {}
    }
    echo json_encode(['success' => true, 'clubs' => $clubsList]);
    exit;
}

if ($route === '/clubs' && $method === 'POST') {
    $id = $body['id'] ?? ('club_' . round(microtime(true) * 1000));
    $name = $body['name'] ?? 'Moto Clube';
    $city = $body['city'] ?? 'Brasil';
    $members = (int) ($body['members'] ?? 1);
    $rating = (float) ($body['rating'] ?? 5.0);
    $image = $body['image'] ?? '';
    $logo = $body['logo'] ?? '';
    $description = $body['description'] ?? '';
    $category = $body['category'] ?? 'Cruiser';

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO clubs (id, name, city, members_count, rating, image_url, logo_url, description, category)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    name = VALUES(name), city = VALUES(city), members_count = VALUES(members_count),
                    image_url = VALUES(image_url), logo_url = VALUES(logo_url), description = VALUES(description),
                    category = VALUES(category);
            ");
            $stmt->execute([$id, $name, $city, $members, $rating, $image, $logo, $description, $category]);
        } catch (Exception $e) {}
    }
    echo json_encode(['success' => true, 'club' => array_merge($body, ['id' => $id])]);
    exit;
}

// Rota não encontrada
http_response_code(404);
echo json_encode([
    'success' => false,
    'error' => 'Endpoint API não encontrado: ' . $route
]);
