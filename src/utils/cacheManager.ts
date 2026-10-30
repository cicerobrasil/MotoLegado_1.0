/**
 * MotoLegado Cache & Live Data Synchronization Manager
 * 
 * Garante que a aplicação carregue sempre a versão mais recente e os dados
 * autênticos do servidor em todas as estações e navegadores, eliminando
 * conflitos de cache local antigo (localStorage residual, Service Worker e HTTP disk cache).
 */

export const MOTOLEGADO_CACHE_VERSION = '2026.10.30_v5_live_sync';

// Chaves de entidades do sistema que devem ser mantidas sincronizadas com o banco
const ENTITY_CACHE_KEYS = [
  'motolegado_routes',
  'motolegado_routes_v3',
  'motolegado_events',
  'motolegado_partners',
  'motolegado_partners_moderation',
  'motolegado_community_posts_v1',
  'motolegado_community_reports',
  'motolegado_clubs',
  'motolegado_clubs_moderation',
  'motolegado_club_applications',
  'motolegado_mural_posts'
];

/**
 * Verifica na inicialização da aplicação se o navegador possui dados de uma versão
 * anterior ou obsoleta em cache. Caso positivo, purga os dados residuais mantendo
 * exclusivamente a sessão e preferências do piloto.
 */
export function initClientCacheGuard(): void {
  if (typeof window === 'undefined') return;

  try {
    const currentVersion = localStorage.getItem('motolegado_app_cache_v');

    if (currentVersion !== MOTOLEGADO_CACHE_VERSION) {
      console.log(`[CacheGuard] Atualizando versão do cliente para ${MOTOLEGADO_CACHE_VERSION}...`);
      
      // Limpa caches de dados de entidades para evitar ressuscitar registros antigos/excluídos
      ENTITY_CACHE_KEYS.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch {}
      });

      // Limpa os armazenamentos do Service Worker / CacheStorage
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            caches.delete(name).catch(() => {});
          });
        }).catch(() => {});
      }

      // Atualiza e força verificação de novo Service Worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((reg) => {
            reg.update().catch(() => {});
          });
        }).catch(() => {});
      }

      localStorage.setItem('motolegado_app_cache_v', MOTOLEGADO_CACHE_VERSION);
      console.log('[CacheGuard] Caches limpos com sucesso. O sistema está sincronizado com o servidor.');
    }
  } catch (err) {
    console.warn('[CacheGuard] Aviso ao verificar cache:', err);
  }
}

/**
 * Limpa todos os caches de dados locais de forma forçada e dispara sincronização
 */
export function wipeLocalEntityCache(): void {
  if (typeof window === 'undefined') return;

  try {
    ENTITY_CACHE_KEYS.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {}
    });

    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }

    // Dispara eventos para que os componentes abertos atualizem
    window.dispatchEvent(new Event('routes-updated'));
    window.dispatchEvent(new Event('community-posts-updated'));
    window.dispatchEvent(new Event('events-updated'));
  } catch (e) {
    console.warn('[CacheGuard] Erro ao limpar cache local:', e);
  }
}

/**
 * Força atualização total e recarrega a página sem cache
 */
export function forceHardReload(onBeforeReload?: () => void): void {
  if (typeof window === 'undefined') return;

  wipeLocalEntityCache();
  if (onBeforeReload) onBeforeReload();

  setTimeout(() => {
    // Adiciona timestamp na URL para desviar de qualquer proxy intermediário ou disk cache
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.set('_sync', String(Date.now()));
    window.location.href = cleanUrl.toString();
  }, 300);
}
