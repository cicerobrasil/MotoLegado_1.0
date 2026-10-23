import { Request, Response, NextFunction } from 'express';

/**
 * Remove tags maliciosas de scripts, iframes, objetos, embeds e manipuladores de eventos inline (ex: onload, onerror, onclick)
 * prevenindo injeções de scripts maliciosos (XSS) antes de salvar qualquer informação no banco de dados.
 */
export function sanitizeServerString(input: string): string {
  if (!input || typeof input !== 'string') return input;

  // Preserva imagens em Base64 intactas
  if (input.startsWith('data:image/') && input.includes(';base64,')) {
    return input;
  }

  let clean = input;

  // 1. Remove blocos <script>...</script>
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // 2. Remove blocos <style>...</style>, <iframe>...</iframe>, <object>...</object>, <embed>...</embed>
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  clean = clean.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  clean = clean.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');

  // 3. Remove pseudoprotocolos javascript:, vbscript:, data:text/html
  clean = clean.replace(/(?:javascript|vbscript|data\s*:\s*text\/html):/gi, 'blocked:');

  // 4. Remove manipuladores de evento inline (on\w+=...)
  clean = clean.replace(/\bon[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');

  return clean;
}

/**
 * Sanitiza recursivamente objetos e arrays
 */
export function sanitizeServerData<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    return sanitizeServerString(input) as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map(item => sanitizeServerData(item)) as unknown as T;
  }

  if (typeof input === 'object') {
    if (input instanceof Date || input instanceof RegExp || Buffer.isBuffer(input)) {
      return input;
    }

    const result: Record<string, any> = {};
    for (const [key, val] of Object.entries(input)) {
      // Preservar senhas intactas para não corromper hashes criptográficos de autenticação
      if (key.toLowerCase().includes('password') || key === 'senha') {
        result[key] = val;
      } else {
        result[key] = sanitizeServerData(val);
      }
    }
    return result as T;
  }

  return input;
}

/**
 * Middleware Express para sanitização automática de inputs em todas as rotas da API
 * Executa antes de qualquer processamento ou envio para o banco de dados MySQL
 */
export function sanitizeInputsMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeServerData(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeServerData(req.query) as any;
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeServerData(req.params) as any;
  }
  next();
}

export default {
  sanitizeServerString,
  sanitizeServerData,
  sanitizeInputsMiddleware,
};
