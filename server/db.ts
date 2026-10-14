import mysql from 'mysql2/promise';

const rawPort = parseInt(process.env.MYSQL_PORT || '3306', 10);
const cleanPort = (rawPort === 306 || isNaN(rawPort) || rawPort <= 0) ? 3306 : rawPort;

// Configuração da conexão MySQL na Hostinger via Variáveis de Ambiente (.env)
export const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: cleanPort,
  user: process.env.MYSQL_USER || 'u342198764_admsql',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'u342198764_motolegado',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 8000,
};

let pool: mysql.Pool | null = null;

let isMysqlOnline = true;
let lastCheckTime = 0;
const CHECK_INTERVAL = 10000; // 10 segundos

export function getDbPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

export async function safeMySqlQuery<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  try {
    const p = getDbPool();
    const result: any = await Promise.race([
      p.query(sql, params),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
    ]);
    isMysqlOnline = true;
    lastCheckTime = Date.now();
    return result;
  } catch (err: any) {
    console.warn('[Hostinger MySQL] Aviso na execução da query:', err?.message || err);
    isMysqlOnline = false;
    lastCheckTime = Date.now();
    return null;
  }
}

// Criação automática de tabelas na inicialização do servidor
export async function initDatabaseTables(): Promise<{ success: boolean; message: string }> {
  try {
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      connectTimeout: 7000,
    });

    // 1. Tabela de Pilotos
    await connection.query(`
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
        bio TEXT NULL,
        avatar_url TEXT NULL,
        role ENUM('admin', 'pilot', 'partner', 'organizer') DEFAULT 'pilot',
        plan ENUM('gratuito', 'pago', 'bonificado') DEFAULT 'gratuito',
        points INT DEFAULT 0,
        tier VARCHAR(50) DEFAULT 'Bronze',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Garantir colunas essenciais caso a tabela 'pilots' já existisse previamente
    const columnsToEnsure = [
      "ALTER TABLE pilots ADD COLUMN password_hash VARCHAR(255) NULL AFTER email",
      "ALTER TABLE pilots ADD COLUMN points INT DEFAULT 0",
      "ALTER TABLE pilots ADD COLUMN tier VARCHAR(50) DEFAULT 'Bronze'",
      "ALTER TABLE pilots ADD COLUMN role ENUM('admin', 'pilot', 'partner', 'organizer') DEFAULT 'pilot'",
      "ALTER TABLE pilots ADD COLUMN plan ENUM('gratuito', 'pago', 'bonificado') DEFAULT 'gratuito'",
      "ALTER TABLE pilots ADD COLUMN motorcycle VARCHAR(150) NULL",
      "ALTER TABLE pilots ADD COLUMN motorcycle_year VARCHAR(10) NULL",
      "ALTER TABLE pilots ADD COLUMN motorcycle_plate VARCHAR(20) NULL",
      "ALTER TABLE pilots ADD COLUMN motorcycle_nickname VARCHAR(100) NULL",
      "ALTER TABLE pilots ADD COLUMN motorcycle_photos JSON NULL",
      "ALTER TABLE pilots ADD COLUMN bio TEXT NULL",
      "ALTER TABLE pilots ADD COLUMN avatar_url TEXT NULL",
      "ALTER TABLE pilots ADD COLUMN personal_logo_url TEXT NULL",
      "ALTER TABLE pilots ADD COLUMN city VARCHAR(100) NULL",
      "ALTER TABLE pilots ADD COLUMN state VARCHAR(10) NULL",
      "ALTER TABLE pilots ADD COLUMN cep VARCHAR(20) NULL",
      "ALTER TABLE pilots ADD COLUMN street VARCHAR(200) NULL",
      "ALTER TABLE pilots ADD COLUMN street_number VARCHAR(50) NULL",
      "ALTER TABLE pilots ADD COLUMN neighborhood VARCHAR(100) NULL",
      "ALTER TABLE pilots ADD COLUMN default_start_point TINYINT(1) DEFAULT 1",
      "ALTER TABLE pilots ADD COLUMN club_name VARCHAR(150) NULL",
      "ALTER TABLE pilots ADD COLUMN blood_type VARCHAR(10) NULL",
      "ALTER TABLE pilots ADD COLUMN emergency_contact VARCHAR(150) NULL",
      "ALTER TABLE pilots ADD COLUMN emergency_phone VARCHAR(30) NULL"
    ];
    for (const sql of columnsToEnsure) {
      try {
        await connection.query(sql);
      } catch (err: any) {
        // Ignora se coluna já existir (#1060)
      }
    }

    // 2. Tabela de Viagens
    await connection.query(`
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
    `);

    // 3. Tabela de Rotas
    await connection.query(`
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
    `);

    // 4. Tabela de Eventos
    await connection.query(`
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
    `);

    // 5. Tabela de Parceiros
    await connection.query(`
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
    `);

    // 6. Tabela da Comunidade
    await connection.query(`
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
    `);

    // 7. Tabela de Motoclubes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS clubs (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        city VARCHAR(100) NULL,
        state VARCHAR(10) NULL,
        members_count INT DEFAULT 1,
        rating DECIMAL(3,2) DEFAULT 5.0,
        image TEXT NULL,
        logo TEXT NULL,
        description TEXT NULL,
        category VARCHAR(100) DEFAULT 'Tradicional',
        president_name VARCHAR(150) NULL,
        contact_phone VARCHAR(30) NULL,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 8. Tabela de Pagamentos / Solicitações PIX
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payment_requests (
        id VARCHAR(64) PRIMARY KEY,
        pilot_id VARCHAR(64) NOT NULL,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(150) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        method VARCHAR(50) DEFAULT 'pix_direct',
        status VARCHAR(30) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP NULL,
        approved_by VARCHAR(150) NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Migrações e compatibilidade de colunas para bancos já criados
    const extraColumns = [
      "ALTER TABLE routes ADD COLUMN author_name VARCHAR(150) NULL",
      "ALTER TABLE routes ADD COLUMN author_avatar TEXT NULL",
      "ALTER TABLE routes ADD COLUMN maps_address TEXT NULL",
      "ALTER TABLE routes ADD COLUMN maps_url TEXT NULL",
      "ALTER TABLE routes ADD COLUMN rider_tips TEXT NULL",
      "ALTER TABLE routes ADD COLUMN ai_tourist_info TEXT NULL",
      "ALTER TABLE routes ADD COLUMN duration VARCHAR(50) NULL",
      "ALTER TABLE routes ADD COLUMN rating DECIMAL(3,2) DEFAULT 5.0",
      "ALTER TABLE routes ADD COLUMN total_ratings_count INT DEFAULT 1",
      "ALTER TABLE routes ADD COLUMN rating_metrics JSON NULL",
      "ALTER TABLE routes ADD COLUMN reviews JSON NULL",
      "ALTER TABLE routes ADD COLUMN rejection_reason TEXT NULL",
      "ALTER TABLE events ADD COLUMN created_by VARCHAR(150) NULL",
      "ALTER TABLE events ADD COLUMN end_date DATE NULL",
      "ALTER TABLE events ADD COLUMN time VARCHAR(20) DEFAULT '09:00'",
      "ALTER TABLE events ADD COLUMN end_time VARCHAR(20) NULL",
      "ALTER TABLE events ADD COLUMN distance_km DECIMAL(10,2) DEFAULT 0",
      "ALTER TABLE events ADD COLUMN rejection_reason TEXT NULL",
      "ALTER TABLE events ADD COLUMN member_count INT DEFAULT 0",
      "ALTER TABLE partners ADD COLUMN news TEXT NULL",
      "ALTER TABLE partners ADD COLUMN whatsapp VARCHAR(30) NULL",
      "ALTER TABLE partners ADD COLUMN corporate_contact VARCHAR(150) NULL",
      "ALTER TABLE partners ADD COLUMN website TEXT NULL",
      "ALTER TABLE partners ADD COLUMN map_url TEXT NULL",
      "ALTER TABLE partners ADD COLUMN rating DECIMAL(3,2) DEFAULT 5.0",
      "ALTER TABLE partners ADD COLUMN highlight TINYINT(1) DEFAULT 0",
      "ALTER TABLE partners ADD COLUMN responsible JSON NULL",
      "ALTER TABLE partners ADD COLUMN posts JSON NULL",
      "ALTER TABLE community_posts ADD COLUMN author_name VARCHAR(150) NULL",
      "ALTER TABLE community_posts ADD COLUMN author_avatar TEXT NULL",
      "ALTER TABLE community_posts ADD COLUMN author_role VARCHAR(50) DEFAULT 'pilot'",
      "ALTER TABLE community_posts ADD COLUMN category VARCHAR(100) DEFAULT 'Geral'",
      "ALTER TABLE community_posts ADD COLUMN comments_count INT DEFAULT 0",
      "ALTER TABLE community_posts ADD COLUMN comments_list JSON NULL",
      "ALTER TABLE community_posts ADD COLUMN rejection_reason TEXT NULL"
    ];

    for (const sql of extraColumns) {
      try {
        await connection.query(sql);
      } catch {
        // Ignora caso a coluna já exista
      }
    }

    // Inserir / Garantir Administrador Principal no Banco de Dados
    await connection.query(`
      INSERT INTO pilots (id, email, name, role, plan, tier)
      VALUES ('admin_ciceroranieri', 'ciceroranieri@gmail.com', 'Cícero Ranieri', 'admin', 'pago', 'Diamante')
      ON DUPLICATE KEY UPDATE role = 'admin', plan = 'pago';
    `);

    await connection.end();
    return { success: true, message: 'Tabelas MySQL inicializadas com sucesso na Hostinger!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Erro ao inicializar tabelas' };
  }
}

export async function testDbConnection(overrideHost?: string): Promise<{ success: boolean; message: string; tables?: string[] }> {
  try {
    const configToTest = overrideHost ? { ...dbConfig, host: overrideHost } : dbConfig;
    const connection = await mysql.createConnection({
      host: configToTest.host,
      port: configToTest.port,
      user: configToTest.user,
      password: configToTest.password,
      database: configToTest.database,
      connectTimeout: 7000,
    });

    const [rows] = await connection.query('SHOW TABLES');
    await connection.end();

    const tableNames = Array.isArray(rows) 
      ? rows.map((r: any) => Object.values(r)[0] as string)
      : [];

    return {
      success: true,
      message: `Conectado com sucesso ao MySQL na Hostinger! (${configToTest.host})`,
      tables: tableNames
    };
  } catch (err: any) {
    const msg = err?.message || 'Falha ao conectar ao banco de dados';
    let friendlyMessage = msg;
    if (msg.includes('Access denied for user') || msg.includes('access denied')) {
      friendlyMessage = `Acesso negado para o host remoto. Na Hostinger (hPanel -> Bancos de Dados -> MySQL Remoto), adicione o caractere '%' para autorizar o teste do AI Studio. (No site em produção da Hostinger a conexão é local via localhost e já funciona nativamente).`;
    } else if (msg.includes('ETIMEDOUT') || msg.includes('ECONNREFUSED')) {
      friendlyMessage = `Conexão expirou ao tentar alcançar ${overrideHost || dbConfig.host}. Verifique se a porta é 3306 e se o MySQL Remoto está ativo no painel da Hostinger.`;
    }
    return {
      success: false,
      message: friendlyMessage,
    };
  }
}
