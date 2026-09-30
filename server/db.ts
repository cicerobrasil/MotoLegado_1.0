import mysql from 'mysql2/promise';

// Configuração da conexão MySQL na Hostinger via Variáveis de Ambiente (.env)
export const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'u342198764_admsql',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'u342198764_motolegado',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 8000,
};

let pool: mysql.Pool | null = null;

let isMysqlOnline = false;
let lastCheckTime = 0;
const CHECK_INTERVAL = 30000; // 30 segundos

export function getDbPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

export async function safeMySqlQuery<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const now = Date.now();
  if (!isMysqlOnline && (now - lastCheckTime < CHECK_INTERVAL)) {
    return null;
  }

  try {
    const p = getDbPool();
    const result: any = await Promise.race([
      p.query(sql, params),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
    ]);
    isMysqlOnline = true;
    lastCheckTime = now;
    return result;
  } catch (err: any) {
    isMysqlOnline = false;
    lastCheckTime = now;
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
        title VARCHAR(200) NOT NULL,
        description TEXT NULL,
        state VARCHAR(10) NULL,
        city VARCHAR(100) NULL,
        distance_km DECIMAL(10,2) DEFAULT 0,
        difficulty ENUM('facil', 'moderada', 'dificil', 'extrema') DEFAULT 'moderada',
        road_type VARCHAR(100) NULL,
        cover_image TEXT NULL,
        waypoints JSON NULL,
        status ENUM('approved', 'pending', 'rejected') DEFAULT 'approved',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Tabela de Eventos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS events (
        id VARCHAR(64) PRIMARY KEY,
        organizer_id VARCHAR(64) NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT NULL,
        event_date DATE NOT NULL,
        location VARCHAR(255) NOT NULL,
        city VARCHAR(100) NULL,
        state VARCHAR(10) NULL,
        banner_url TEXT NULL,
        status ENUM('active', 'pending', 'cancelled') DEFAULT 'active',
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
        address VARCHAR(255) NULL,
        city VARCHAR(100) NULL,
        state VARCHAR(10) NULL,
        phone VARCHAR(30) NULL,
        discount_info VARCHAR(200) NULL,
        logo_url TEXT NULL,
        status ENUM('approved', 'pending', 'inactive') DEFAULT 'approved',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Tabela da Comunidade
    await connection.query(`
      CREATE TABLE IF NOT EXISTS community_posts (
        id VARCHAR(64) PRIMARY KEY,
        pilot_id VARCHAR(64) NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT NULL,
        likes_count INT DEFAULT 0,
        status ENUM('published', 'flagged', 'archived') DEFAULT 'published',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

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
    return {
      success: false,
      message: err?.message || 'Falha ao conectar ao banco de dados',
    };
  }
}
