import crypto from 'crypto';
import { Request, Response } from 'express';
import { getDbPool } from './db';

// Geração de Hash seguro usando PBKDF2 nativo do Node.js (sem dependências externas que possam falhar no build da Hostinger)
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  try {
    const [salt, key] = storedHash.split(':');
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512');
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch (err) {
    return false;
  }
}

// Sanitizar perfil do piloto (remover campos sensíveis como hash da senha)
export function sanitizePilot(pilot: any) {
  if (!pilot) return null;
  const { password_hash, ...safePilot } = pilot;
  return {
    ...safePilot,
    is_pro: safePilot.role === 'admin' || safePilot.plan === 'pago' || safePilot.plan === 'bonificado',
    avatar_url: safePilot.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(safePilot.name || 'Piloto')}&background=ea580c&color=ffffff&bold=true`
  };
}

// 1. Endpoint de Cadastro Real no MySQL da Hostinger
export async function handleRegister(req: Request, res: Response) {
  try {
    const { email, password, name, motorcycle, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nome, e-mail e senha são obrigatórios.' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'A senha deve conter no mínimo 6 caracteres.' 
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();
    const pool = getDbPool();

    // Verificar se o e-mail já existe
    const [existing]: any = await pool.query(
      'SELECT id, email FROM pilots WHERE LOWER(email) = ?', 
      [cleanEmail]
    );

    if (existing && existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Este e-mail já está cadastrado no MotoLegado. Faça login ou use outro e-mail.' 
      });
    }

    // Regra de perfil: Admin se for o criador ou e-mail admin
    const isAdmin = cleanEmail === 'ciceroranieri@gmail.com' || cleanEmail.startsWith('admin@');
    const role = isAdmin ? 'admin' : 'pilot';
    const plan = isAdmin ? 'pago' : 'gratuito';
    const tier = isAdmin ? 'Diamante' : 'Bronze';
    const points = isAdmin ? 1000 : 100;

    const id = 'pilot_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex');
    const passwordHash = hashPassword(password);
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=ea580c&color=ffffff&bold=true`;

    await pool.query(`
      INSERT INTO pilots (
        id, email, password_hash, name, motorcycle, phone, role, plan, tier, points, avatar_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, 
      cleanEmail, 
      passwordHash, 
      cleanName, 
      motorcycle || null, 
      phone || null, 
      role, 
      plan, 
      tier, 
      points, 
      avatarUrl
    ]);

    const [created]: any = await pool.query('SELECT * FROM pilots WHERE id = ?', [id]);
    const safePilot = sanitizePilot(created[0]);

    return res.status(201).json({
      success: true,
      message: 'Cadastro realizado com sucesso!',
      pilot: safePilot
    });

  } catch (err: any) {
    console.error('[AUTH REGISTER ERROR]:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro no servidor ao realizar cadastro: ' + (err.message || 'Erro inesperado') 
    });
  }
}

// 2. Endpoint de Login Real com Verificação de Senha no MySQL da Hostinger
export async function handleLogin(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'E-mail e senha são obrigatórios.' 
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const pool = getDbPool();

    // Buscar piloto no banco
    const [rows]: any = await pool.query(
      'SELECT * FROM pilots WHERE LOWER(email) = ?', 
      [cleanEmail]
    );

    // Se o usuário não existir no banco
    if (!rows || rows.length === 0) {
      // Facilidade para o administrador inicial (evita bloqueio acidental)
      if (cleanEmail === 'ciceroranieri@gmail.com' || cleanEmail === 'admin@motolegado.com.br') {
        const isAdmin = true;
        const name = cleanEmail === 'ciceroranieri@gmail.com' ? 'Cícero Ranieri' : 'Administrador MotoLegado';
        const id = 'admin_' + Date.now();
        const passwordHash = hashPassword(password);
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ea580c&color=ffffff&bold=true`;

        await pool.query(`
          INSERT INTO pilots (id, email, password_hash, name, role, plan, tier, points, avatar_url)
          VALUES (?, ?, ?, ?, 'admin', 'pago', 'Diamante', 1000, ?)
        `, [id, cleanEmail, passwordHash, name, avatarUrl]);

        const [createdAdmin]: any = await pool.query('SELECT * FROM pilots WHERE id = ?', [id]);
        return res.json({
          success: true,
          message: 'Administrador inicial criado e autenticado com sucesso!',
          pilot: sanitizePilot(createdAdmin[0])
        });
      }

      return res.status(401).json({ 
        success: false, 
        error: 'E-mail ou senha incorretos.' 
      });
    }

    const pilot = rows[0];

    // Se o usuário existir mas não tiver senha cadastrada ainda (ex: criado via SQL manual prévio)
    if (!pilot.password_hash) {
      const newHash = hashPassword(password);
      await pool.query('UPDATE pilots SET password_hash = ? WHERE id = ?', [newHash, pilot.id]);
      return res.json({
        success: true,
        message: 'Senha definida com sucesso e login realizado!',
        pilot: sanitizePilot(pilot)
      });
    }

    // Validação real da senha armazenada
    const isPasswordValid = verifyPassword(password, pilot.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        error: 'E-mail ou senha incorretos.' 
      });
    }

    return res.json({
      success: true,
      message: 'Login realizado com sucesso!',
      pilot: sanitizePilot(pilot)
    });

  } catch (err: any) {
    console.error('[AUTH LOGIN ERROR]:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro no servidor ao validar login: ' + (err.message || 'Erro inesperado') 
    });
  }
}

// 3. Endpoint para Obter Perfil Atualizado do Piloto
export async function handleGetMe(req: Request, res: Response) {
  try {
    const id = req.params.id || (req.query.id as string);
    if (!id) {
      return res.status(400).json({ success: false, error: 'ID do piloto não informado' });
    }

    const pool = getDbPool();
    const [rows]: any = await pool.query('SELECT * FROM pilots WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Piloto não encontrado' });
    }

    return res.json({ success: true, pilot: sanitizePilot(rows[0]) });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
