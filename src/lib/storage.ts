export const STORAGE_BUCKET = 'motolegado-media';

export type StorageFolder = 
  | 'avatars' 
  | 'logos' 
  | 'bikes' 
  | 'trips' 
  | 'clubs' 
  | 'posts' 
  | 'routes';

export interface UploadOptions {
  folder: StorageFolder;
  userId?: string;
  maxDimension?: number;
  quality?: number;
}

export interface UploadResult {
  url: string;
  success: boolean;
  isCloudStorage: boolean;
  error?: string;
}

/**
 * Redimensiona e comprime uma imagem no navegador antes do upload.
 * Reduz fotos de câmeras de celular (10MB-25MB) para ~200KB-400KB em alta fidelidade,
 * garantindo uploads instantâneos mesmo em redes móveis 3G/4G.
 */
export async function compressImage(
  file: File | Blob, 
  maxDimension = 1600, 
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve) => {
    // Se for svg, não comprimir via canvas
    if ('type' in file && file.type === 'image/svg+xml') {
      resolve(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // Fallback: resolve original file se o canvas falhar
    };

    img.src = objectUrl;
  });
}

/**
 * Converte Blob para DataURL (Base64) como fallback resiliente caso o upload falhe.
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Realiza o upload da imagem otimizada para o servidor (/api/upload).
 * Se o servidor responder com sucesso, retorna a URL estática (/uploads/...).
 * Caso o servidor esteja temporariamente offline ou ocorra algum erro, 
 * recorre ao DataURL comprimido para não interromper a experiência do piloto.
 */
export async function uploadImageToStorage(
  file: File,
  options: UploadOptions
): Promise<UploadResult> {
  const { folder, userId, maxDimension = 1600, quality = 0.85 } = options;

  // Validação preliminar
  if (!file.type.startsWith('image/')) {
    return {
      url: '',
      success: false,
      isCloudStorage: false,
      error: 'Formato inválido. Selecione um arquivo de imagem (JPEG, PNG, WebP, etc.).'
    };
  }

  // 1. Comprimir imagem no cliente (Canvas) para economizar banda e armazenamento
  let blobToUpload: Blob;
  try {
    blobToUpload = await compressImage(file, maxDimension, quality);
  } catch (err) {
    blobToUpload = file;
  }

  // Converter para DataURL (Base64)
  let dataUrl: string;
  try {
    dataUrl = await blobToDataUrl(blobToUpload);
  } catch (err: any) {
    return {
      url: '',
      success: false,
      isCloudStorage: false,
      error: 'Falha ao processar a imagem: ' + (err?.message || 'Erro desconhecido')
    };
  }

  // 2. Enviar para a API do Servidor Node.js (/api/upload)
  try {
    const cleanUserId = (userId || 'pilot').replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = Date.now();
    const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const filename = `${cleanUserId}_${timestamp}.${extension}`;

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: dataUrl,
        folder,
        filename
      })
    });

    const json = await response.json().catch(() => null);

    if (response.ok && json && json.success && json.url) {
      return {
        url: json.url,
        success: true,
        isCloudStorage: true
      };
    } else {
      console.warn('Servidor retornou erro no upload, utilizando armazenamento resiliente em dataURL:', json?.error);
    }
  } catch (apiErr: any) {
    console.warn('Erro ao conectar ao endpoint /api/upload, ativando fallback local:', apiErr?.message);
  }

  // 3. Fallback Resiliente: se a API falhar ou estiver desconectada, retorna o DataURL comprimido
  return {
    url: dataUrl,
    success: true,
    isCloudStorage: false
  };
}
