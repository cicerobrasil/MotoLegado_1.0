import mysql from 'mysql2/promise';

// Configuração da conexão MySQL na Hostinger
export const dbConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'u342198764_admsql',
  password: process.env.MYSQL_PASSWORD || 'D4?2EOEwy',
  database: process.env.MYSQL_DATABASE || 'u342198764_motolegado',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 8000,
};

let pool: mysql.Pool | null = null;

export function getDbPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
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
