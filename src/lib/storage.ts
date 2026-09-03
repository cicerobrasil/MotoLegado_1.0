import { supabase, isSupabaseConfigured } from './supabase';

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
  return new Promise((resolve, reject) => {
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
 * Realiza o upload real para o bucket 'motolegado-media' no Supabase Storage.
 * Retorna a URL pública do arquivo na CDN do Supabase.
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

  // Comprimir imagem no cliente
  let blobToUpload: Blob;
  try {
    blobToUpload = await compressImage(file, maxDimension, quality);
  } catch (err) {
    blobToUpload = file;
  }

  // Sanitizar nome do arquivo
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const cleanUserId = (userId || 'pilot').replace(/[^a-zA-Z0-9_-]/g, '_');
  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const filePath = `${folder}/${cleanUserId}_${timestamp}_${randomStr}.${extension}`;

  // Se o Supabase estiver configurado, realizar upload real no bucket
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, blobToUpload, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'image/jpeg'
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          return {
            url: publicUrlData.publicUrl,
            success: true,
            isCloudStorage: true
          };
        }
      } else if (error) {
        console.warn('Erro ao subir para o Supabase Storage, ativando fallback local:', error.message);
      }
    } catch (err: any) {
      console.warn('Exceção ao comunicar com o Supabase Storage:', err?.message || err);
    }
  }

  // Fallback Resiliente: se offline ou erro no Supabase, salva como DataURL comprimido
  // para que o usuário não perca a foto nem tenha o fluxo bloqueado
  try {
    const fallbackDataUrl = await blobToDataUrl(blobToUpload);
    return {
      url: fallbackDataUrl,
      success: true,
      isCloudStorage: false,
      error: !isSupabaseConfigured 
        ? 'Supabase Storage não configurado (.env). Salvo temporariamente em memória local.' 
        : undefined
    };
  } catch (fallbackErr: any) {
    return {
      url: '',
      success: false,
      isCloudStorage: false,
      error: 'Falha ao processar a imagem: ' + (fallbackErr?.message || 'Erro desconhecido')
    };
  }
}
