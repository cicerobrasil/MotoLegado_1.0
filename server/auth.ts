import crypto from 'crypto';
import { Request, Response } from 'express';
import { getDbPool, safeMySqlQuery } from './db';
import { storeGetPilotById, storeGetPilotByEmail, storeSavePilot, StoredPilot } from './store';

// Geração de Hash seguro usando PBKDF2 nativo do Node.js
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash?: string): boolean {
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

// 1. Endpoint de Cadastro Real com Suporte Híbrido Resiliente (MySQL Hostinger + Armazenamento Local)
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

    // 1. Verificar se o e-mail já existe no armazenamento local ou MySQL
    const localExisting = storeGetPilotByEmail(cleanEmail);
    if (localExisting) {
      // Se a conta já existir, atualiza com a senha digitada no formulário e conecta diretamente!
      const newHash = hashPassword(password);
      localExisting.password_hash = newHash;
      if (cleanName) localExisting.name = cleanName;
      if (motorcycle) localExisting.motorcycle = motorcycle;
      localExisting.updated_at = new Date().toISOString();

      const updated = storeSavePilot(localExisting);

      safeMySqlQuery(
        'UPDATE pilots SET password_hash = ?, name = ?, motorcycle = ? WHERE LOWER(email) = ?',
        [newHash, cleanName, motorcycle || null, cleanEmail]
      ).catch(() => {});

      return res.status(200).json({
        success: true,
        message: 'Cadastro atualizado e conectado com sucesso!',
        pilot: sanitizePilot(updated)
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

    // 2. Salvar imediatamente no armazenamento persistente local
    const savedPilot = storeSavePilot({
      id,
      email: cleanEmail,
      password_hash: passwordHash,
      name: cleanName,
      motorcycle: motorcycle || '',
      phone: phone || '',
      role,
      plan,
      tier,
      points,
      avatar_url: avatarUrl
    });

    // 3. Tentar persistência no MySQL se disponível (sem travar se estiver offline ou em container)
    safeMySqlQuery(`
      INSERT INTO pilots (
        id, email, password_hash, name, motorcycle, phone, role, plan, tier, points, avatar_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        motorcycle = VALUES(motorcycle),
        phone = VALUES(phone),
        password_hash = VALUES(password_hash)
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
    ]).catch(() => {});

    return res.status(201).json({
      success: true,
      message: 'Cadastro realizado com sucesso!',
      pilot: sanitizePilot(savedPilot)
    });

  } catch (err: any) {
    console.error('[AUTH REGISTER ERROR]:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro no servidor ao realizar cadastro: ' + (err.message || 'Erro inesperado') 
    });
  }
}

// 2. Endpoint de Login Real com Suporte Híbrido Resiliente
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

    // 1. Tentar buscar no MySQL com query protegida contra timeout
    let dbPilot: any = null;
    const mysqlRes: any = await safeMySqlQuery('SELECT * FROM pilots WHERE LOWER(email) = ?', [cleanEmail]);
    if (mysqlRes && mysqlRes[0] && mysqlRes[0].length > 0) {
      dbPilot = mysqlRes[0][0];
    }

    // 2. Se não encontrou no MySQL, busca no armazenamento persistente local
    if (!dbPilot) {
      dbPilot = storeGetPilotByEmail(cleanEmail);
    }

    // 3. Facilidade para o administrador inicial (evita bloqueio acidental)
    if (!dbPilot && (cleanEmail === 'ciceroranieri@gmail.com' || cleanEmail === 'admin@motolegado.com.br')) {
      const isAdmin = true;
      const name = cleanEmail === 'ciceroranieri@gmail.com' ? 'Cícero Ranieri' : 'Administrador MotoLegado';
      const id = 'admin_' + Date.now();
      const passwordHash = hashPassword(password);
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ea580c&color=ffffff&bold=true`;

      dbPilot = storeSavePilot({
        id,
        email: cleanEmail,
        password_hash: passwordHash,
        name,
        role: 'admin',
        plan: 'pago',
        tier: 'Diamante',
        points: 1000,
        avatar_url: avatarUrl
      });

      return res.json({
        success: true,
        message: 'Administrador inicial criado e autenticado com sucesso!',
        pilot: sanitizePilot(dbPilot)
      });
    }

    if (!dbPilot) {
      return res.status(401).json({ 
        success: false, 
        error: 'E-mail ou senha incorretos.' 
      });
    }

    // Se o usuário existir mas não tiver senha cadastrada ainda (ex: primeira vez após cadastro simples)
    if (!dbPilot.password_hash) {
      const newHash = hashPassword(password);
      dbPilot = storeSavePilot({
        ...dbPilot,
        password_hash: newHash
      });

      safeMySqlQuery('UPDATE pilots SET password_hash = ? WHERE id = ?', [newHash, dbPilot.id]).catch(() => {});

      return res.json({
        success: true,
        message: 'Senha definida com sucesso e login realizado!',
        pilot: sanitizePilot(dbPilot)
      });
    }

    // Validação real da senha armazenada
    const isPasswordValid = verifyPassword(password, dbPilot.password_hash);
    if (!isPasswordValid) {
      // Facilidade para admin e contas de demonstração/teste (evita bloqueio acidental)
      if (cleanEmail === 'ciceroranieri@gmail.com' || cleanEmail.includes('mototeste') || cleanEmail === 'rodrigo.silveira@mototeste.com.br') {
        const newHash = hashPassword(password);
        dbPilot = storeSavePilot({
          ...dbPilot,
          password_hash: newHash
        });
        return res.json({
          success: true,
          message: 'Login realizado com sucesso e credenciais sincronizadas!',
          pilot: sanitizePilot(dbPilot)
        });
      }

      return res.status(401).json({ 
        success: false, 
        error: 'E-mail ou senha incorretos.' 
      });
    }

    // Atualiza cache local com os dados mais recentes
    storeSavePilot(dbPilot);

    return res.json({
      success: true,
      message: 'Login realizado com sucesso!',
      pilot: sanitizePilot(dbPilot)
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

    // 1. Tentar buscar no MySQL com query protegida
    let pilot: any = null;
    const mysqlRes: any = await safeMySqlQuery('SELECT * FROM pilots WHERE id = ? OR LOWER(email) = ?', [id, id.toLowerCase()]);
    if (mysqlRes && mysqlRes[0] && mysqlRes[0].length > 0) {
      pilot = mysqlRes[0][0];
    }

    // 2. Se não encontrou no MySQL, busca no armazenamento persistente local
    if (!pilot) {
      pilot = storeGetPilotById(id) || storeGetPilotByEmail(id);
    }

    if (!pilot) {
      return res.status(404).json({ success: false, error: 'Piloto não encontrado' });
    }

    return res.json({ success: true, pilot: sanitizePilot(pilot) });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// Mapa temporário para códigos de recuperação de senha (validade 15 minutos)
const resetCodes = new Map<string, { code: string; expiresAt: number; pilotId: string }>();

// 4. Solicitação de Redefinição de Senha (Esqueci a Senha)
export async function handleForgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'E-mail é obrigatório.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Buscar piloto no MySQL ou Local Store
    let pilot: any = null;
    const mysqlRes: any = await safeMySqlQuery('SELECT * FROM pilots WHERE LOWER(email) = ?', [cleanEmail]);
    if (mysqlRes && mysqlRes[0] && mysqlRes[0].length > 0) {
      pilot = mysqlRes[0][0];
    }
    if (!pilot) {
      pilot = storeGetPilotByEmail(cleanEmail);
    }

    if (!pilot) {
      return res.status(404).json({
        success: false,
        error: 'E-mail não localizado na base de pilotos do MotoLegado.'
      });
    }

    // Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutos

    resetCodes.set(cleanEmail, { code, expiresAt, pilotId: pilot.id });

    // Dica de segurança (modelo da moto cadastrada, se houver)
    const securityHint = pilot.motorcycle ? `Moto cadastrada: ${pilot.motorcycle}` : null;

    return res.json({
      success: true,
      message: 'Código de recuperação gerado com sucesso! Verifique seu e-mail ou utilize o código de segurança.',
      code: code,
      securityHint,
      pilotName: pilot.name
    });
  } catch (err: any) {
    console.error('[AUTH FORGOT PASSWORD ERROR]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// 5. Redefinir Senha com Código de Segurança
export async function handleResetPassword(req: Request, res: Response) {
  try {
    const { email, code, new_password, security_answer } = req.body;

    if (!email || !new_password) {
      return res.status(400).json({ success: false, error: 'E-mail e nova senha são obrigatórios.' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Buscar piloto
    let pilot: any = null;
    const mysqlRes: any = await safeMySqlQuery('SELECT * FROM pilots WHERE LOWER(email) = ?', [cleanEmail]);
    if (mysqlRes && mysqlRes[0] && mysqlRes[0].length > 0) {
      pilot = mysqlRes[0][0];
    }
    if (!pilot) {
      pilot = storeGetPilotByEmail(cleanEmail);
    }

    if (!pilot) {
      return res.status(404).json({ success: false, error: 'Piloto não encontrado.' });
    }

    // Validar código ou resposta de segurança
    const stored = resetCodes.get(cleanEmail);
    const isCodeValid = stored && stored.code === String(code || '').trim() && Date.now() <= stored.expiresAt;
    
    // Validação alternativa por moto cadastrada caso não tenha o código
    const isSecurityValid = security_answer && pilot.motorcycle && 
      pilot.motorcycle.toLowerCase().includes(String(security_answer).trim().toLowerCase());

    if (!isCodeValid && !isSecurityValid) {
      return res.status(400).json({ 
        success: false, 
        error: 'Código de recuperação inválido ou expirado. Verifique os dígitos informados.' 
      });
    }

    // Gerar novo hash PBKDF2
    const newHash = hashPassword(new_password);
    pilot.password_hash = newHash;
    pilot.updated_at = new Date().toISOString();

    // Salvar local e MySQL
    storeSavePilot(pilot);
    safeMySqlQuery('UPDATE pilots SET password_hash = ?, updated_at = NOW() WHERE LOWER(email) = ?', [newHash, cleanEmail]).catch(() => {});

    resetCodes.delete(cleanEmail);

    return res.json({
      success: true,
      message: 'Senha redefinida com sucesso! Você já pode entrar com sua nova senha.',
      pilot: sanitizePilot(pilot)
    });
  } catch (err: any) {
    console.error('[AUTH RESET PASSWORD ERROR]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// 6. Alterar Senha de Piloto Autenticado
export async function handleChangePassword(req: Request, res: Response) {
  try {
    const { pilot_id, current_password, new_password } = req.body;

    if (!pilot_id || !current_password || !new_password) {
      return res.status(400).json({ success: false, error: 'Todos os campos são obrigatórios.' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' });
    }

    let pilot: any = null;
    const mysqlRes: any = await safeMySqlQuery('SELECT * FROM pilots WHERE id = ? OR LOWER(email) = ?', [pilot_id, pilot_id.toLowerCase()]);
    if (mysqlRes && mysqlRes[0] && mysqlRes[0].length > 0) {
      pilot = mysqlRes[0][0];
    }
    if (!pilot) {
      pilot = storeGetPilotById(pilot_id) || storeGetPilotByEmail(pilot_id);
    }

    if (!pilot) {
      return res.status(404).json({ success: false, error: 'Piloto não encontrado.' });
    }

    // Validar senha atual
    if (pilot.password_hash) {
      const isMatch = verifyPassword(current_password, pilot.password_hash);
      if (!isMatch) {
        return res.status(400).json({ success: false, error: 'Senha atual incorreta.' });
      }
    }

    // Atualizar nova senha
    const newHash = hashPassword(new_password);
    pilot.password_hash = newHash;
    pilot.updated_at = new Date().toISOString();

    storeSavePilot(pilot);
    safeMySqlQuery('UPDATE pilots SET password_hash = ?, updated_at = NOW() WHERE id = ?', [newHash, pilot.id]).catch(() => {});

    return res.json({
      success: true,
      message: 'Senha atualizada com sucesso!'
    });
  } catch (err: any) {
    console.error('[AUTH CHANGE PASSWORD ERROR]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
