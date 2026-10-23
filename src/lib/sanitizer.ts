import DOMPurify from 'dompurify';

/**
 * Sanitiza uma string individual utilizando DOMPurify para prevenir XSS e injeção de scripts maliciosos.
 * @param value String de entrada
 * @param stripAllTags Se true, remove quaisquer tags HTML residuais além dos scripts maliciosos
 */
export function sanitizeString(value: string, stripAllTags = false): string {
  if (!value || typeof value !== 'string') return value;

  // Preserva payloads de imagem em base64 intactos
  if (value.startsWith('data:image/') && value.includes(';base64,')) {
    return value;
  }

  // Sanitização estrita com DOMPurify
  const sanitized = DOMPurify.sanitize(value, {
    ALLOWED_TAGS: stripAllTags ? [] : ['b', 'i', 'em', 'strong', 'p', 'br', 'span', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['class', 'style'],
    ALLOW_DATA_ATTR: false,
    SAFE_FOR_TEMPLATES: true,
  });

  return typeof sanitized === 'string' ? sanitized.trim() : String(sanitized);
}

/**
 * Sanitiza recursivamente objetos, arrays e strings antes de serem enviados à API / Banco de Dados.
 * Preserva números, booleanos, nulls, buffers e URLs de imagens em base64.
 */
export function sanitizeData<T>(input: T, stripAllTags = false): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    return sanitizeString(input, stripAllTags) as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map(item => sanitizeData(item, stripAllTags)) as unknown as T;
  }

  if (typeof input === 'object') {
    // Preservar objetos especiais como Date, File, Blob, etc.
    if (input instanceof Date || input instanceof RegExp || (typeof Blob !== 'undefined' && input instanceof Blob)) {
      return input;
    }

    const sanitizedObj: Record<string, any> = {};
    for (const [key, val] of Object.entries(input)) {
      // Campos de senha são preservados como texto puro para não corromper hashes criptográficos
      if (key.toLowerCase().includes('password') || key === 'senha') {
        sanitizedObj[key] = val;
      } else {
        sanitizedObj[key] = sanitizeData(val, stripAllTags);
      }
    }
    return sanitizedObj as T;
  }

  return input;
}

export default {
  sanitizeString,
  sanitizeData,
};
