/**
 * Utilitário de Limpeza de Cache e Estado Global - MotoLegado
 * Localização: src/utils/systemReset.ts
 * 
 * Executa a limpeza obrigatória de cache e estado global sempre que a aplicação é carregada:
 * - Força o logout imediato de usuários convidados, visitantes, pilotos modelo ou contas de teste.
 * - Limpa o sessionStorage incondicionalmente.
 * - Expurga todo e qualquer dado mockado ou simulado do localStorage (eventos, parceiros, roteiros, logs, motoclubes).
 * - Garante que somente dados autênticos persistidos no banco de dados da Hostinger permaneçam.
 */

import { initClientCacheGuard } from './cacheManager';

// IDs conhecidos de dados mockados / sementes legadas
const MOCK_EVENT_IDS = new Set([
  'e_fest_1', 'e_fest_2', 'e_sul_1', 'e_pend_1', 'e_pend_2', 
  'e0', 'e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8', 'e9'
]);

const MOCK_PARTNER_IDS = new Set(['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9']);

const MOCK_ROUTE_IDS = new Set([
  'serra-rio-rastro', 'estrada-graciosa', 'rota-das-hortensias', 
  'route-pending-1', '1', '2', '3', '4', '5'
]);

const MOCK_CLUB_IDS = new Set(['c1', 'c2', 'c3', 'c4', 'c5']);

// Chaves legadas de resíduos de teste e modo demo que devem ser sempre removidas
const DIRTY_RESIDUE_KEYS = [
  'motolegado_demo_mode',
  'motolegado_liked_posts',
  'motolegado_clubs_moderation',
  'motolegado_community_reports',
  'motolegado_partners_moderation'
];

/**
 * Verifica se um objeto de perfil, usuário ou sessão pertence a um usuário convidado,
 * mockado ou fictício de teste (ex: "Piloto MotoLegado", "Piloto Modelo", sem e-mail ou com domínio de teste).
 */
export function isMockOrTestUser(userOrSession: any): boolean {
  if (!userOrSession) return true;

  // Se for apenas uma string (ex: ID ou nome)
  if (typeof userOrSession === 'string') {
    const val = userOrSession.toLowerCase().trim();
    if (!val || val === 'guest' || val === 'pilot' || val === 'visitante' || val === 'convidado' || val.includes('modelo') || val.includes('mock')) {
      return true;
    }
    return false;
  }

  const name = String(userOrSession.name || userOrSession.displayName || '').toLowerCase().trim();
  const email = String(userOrSession.email || '').toLowerCase().trim();
  const id = String(userOrSession.id || userOrSession.uid || userOrSession.pilot_id || '').toLowerCase().trim();
  const role = String(userOrSession.role || '').toLowerCase().trim();

  // Usuários com papel explicitamente convidado ou visitante
  if (role === 'guest' || role === 'visitante' || role === 'convidado' || role === 'demo' || role === 'mock') {
    return true;
  }

  // Usuários sem e-mail ou sem formato de e-mail válido são convidados/fictícios
  if (!email || !email.includes('@')) {
    return true;
  }

  // Nomes de pilotos modelo, mockups, convidados ou testes
  if (
    name === 'piloto motolegado' ||
    name === 'piloto modelo' ||
    name === 'pm piloto modelo' ||
    name === 'convidado' ||
    name === 'guest' ||
    name === 'visitante' ||
    name === 'piloto teste' ||
    name === 'piloto' ||
    name.includes('piloto modelo') ||
    name.includes('piloto teste') ||
    name.includes('modelo') ||
    name.includes('mock') ||
    name.includes('simulação') ||
    name.includes('usuario teste') ||
    name.includes('usuário teste')
  ) {
    return true;
  }

  // Domínios ou e-mails de teste mockados
  if (
    email.includes('mototeste.com.br') ||
    email.includes('@example.com') ||
    email.includes('@teste.com') ||
    email.includes('@test.com') ||
    email.startsWith('teste@') ||
    email.startsWith('test@') ||
    email.startsWith('guest@') ||
    email.startsWith('convidado@') ||
    email.startsWith('piloto@') ||
    email.includes('piloto.modelo') ||
    email.includes('mock')
  ) {
    return true;
  }

  // IDs de convidado ou genéricos
  if (
    id === 'guest' ||
    id === 'pilot' ||
    id === 'pilot_undefined' ||
    id === 'pilot_model' ||
    id.startsWith('guest_') ||
    id.includes('model') ||
    id.includes('mock') ||
    id.includes('teste')
  ) {
    return true;
  }

  return false;
}

/**
 * Função de limpeza de cache e estado global no MotoLegado.
 * 
 * - Força o logout de usuários convidados ou de teste
 * - Limpa o sessionStorage e localStorage sempre que o aplicativo for carregado
 * - Garante que nenhum dado mockado persista
 */
export function limparCacheEEstadoGlobal(): void {
  if (typeof window === 'undefined') return;

  try {
    // 1. Executa o guardião de cache do cliente e purga de versões legadas
    initClientCacheGuard();

    // 2. Limpeza completa e incondicional do sessionStorage em cada carregamento
    try {
      sessionStorage.clear();
    } catch (e) {
      console.warn('[systemReset] Aviso ao limpar sessionStorage:', e);
    }

    // 3. Remoção incondicional de chaves globais de resíduos de teste e modo demo
    DIRTY_RESIDUE_KEYS.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch {}
    });

    // 4. Forçar logout se houver usuário convidado, modelo ou de teste
    FORCE_GUEST_AND_TEST_LOGOUT();

    // 5. Limpeza rigorosa de eventos mockados
    CLEAN_MOCK_EVENTS();

    // 6. Limpeza rigorosa de parceiros mockados
    CLEAN_MOCK_PARTNERS();

    // 7. Limpeza incondicional de roteiros locais obsoletos (banco de dados é a única verdade)
    CLEAN_MOCK_ROUTES();

    // 7. Limpeza rigorosa de viagens locais mockadas
    CLEAN_MOCK_LOGS();

    // 8. Limpeza rigorosa de motoclubes mockados
    CLEAN_MOCK_CLUBS();

    // 9. Limpeza de publicações do mural da comunidade mockadas
    CLEAN_MOCK_COMMUNITY_POSTS();

    // 10. Varredura geral de chaves no localStorage para eliminar quaisquer sobras com 'mock' ou 'teste'
    SCAN_AND_PURGE_LEAKY_KEYS();

    // 11. Disparo de eventos globais para notificar componentes React da sincronização
    try {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('community-posts-updated'));
      window.dispatchEvent(new Event('routes-updated'));
      window.dispatchEvent(new CustomEvent('motolegado_gamification_updated'));
      window.dispatchEvent(new CustomEvent('motolegado_auth_state_changed'));
    } catch {}
  } catch (err) {
    console.warn('[systemReset] Erro ao executar limpeza de cache e estado global:', err);
  }
}

/**
 * Aliases para compatibilidade e semântica de chamadas
 */
export const clearCacheAndGlobalState = limparCacheEEstadoGlobal;
export const purgeGlobalCacheAndGuestSessions = limparCacheEEstadoGlobal;

/**
 * Força logout de usuários convidados, visitantes, pilotos modelo ou contas de teste
 */
function FORCE_GUEST_AND_TEST_LOGOUT(): void {
  const storedSession = localStorage.getItem('motolegado_pilot_session');
  const storedName = localStorage.getItem('motolegado_pilot_name');
  const storedEmail = localStorage.getItem('motolegado_pilot_email');
  const storedId = localStorage.getItem('motolegado_pilot_id');

  let shouldLogout = false;

  if (storedSession) {
    try {
      const parsed = JSON.parse(storedSession);
      if (isMockOrTestUser(parsed)) {
        shouldLogout = true;
      }
    } catch {
      shouldLogout = true;
    }
  } else if (storedName || storedEmail || storedId) {
    if (isMockOrTestUser({ name: storedName, email: storedEmail, id: storedId })) {
      shouldLogout = true;
    }
  }

  if (shouldLogout) {
    const keysToRemove = [
      'motolegado_pilot_session',
      'motolegado_pilot_name',
      'motolegado_pilot_id',
      'motolegado_pilot_email',
      'motolegado_pilot_plan',
      'motolegado_pilot_profile',
      'motolegado_pilot_bike',
      'motolegado_pilot_bike_nickname',
      'motolegado_pilot_bike_year',
      'motolegado_pilot_bike_plate',
      'motolegado_pilot_bike_photos',
      'motolegado_pilot_phone',
      'motolegado_pilot_bio',
      'motolegado_pilot_address',
      'motolegado_pilot_city',
      'motolegado_pilot_state',
      'motolegado_pilot_logo',
      'motolegado_demo_mode',
      'motolegado_is_new_signup'
    ];

    keysToRemove.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });

    // Remove registros residuais associados a e-mails ou sessões de teste
    try {
      Object.keys(localStorage).forEach(k => {
        if (
          k.startsWith('motolegado_pilot_saved_') ||
          k.startsWith('motolegado_first_access_popup_seen_') ||
          k.startsWith('motolegado_logs_pilot_') ||
          k.startsWith('motolegado_logs_guest')
        ) {
          const lowerK = k.toLowerCase();
          if (
            lowerK.includes('mototeste') || 
            lowerK.includes('teste') || 
            lowerK.includes('guest') || 
            lowerK.includes('undefined') ||
            lowerK.includes('modelo') ||
            lowerK.includes('mock') ||
            lowerK.includes('pilot_')
          ) {
            localStorage.removeItem(k);
          }
        }
      });
    } catch {}

    try {
      window.dispatchEvent(new CustomEvent('motolegado_force_logout'));
    } catch {}
  }
}

/**
 * Limpeza rigorosa de eventos mockados
 */
function CLEAN_MOCK_EVENTS(): void {
  const currentEvents = localStorage.getItem('motolegado_events');
  if (currentEvents) {
    try {
      const parsed = JSON.parse(currentEvents);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((e: any) => {
          if (!e || !e.id) return false;
          if (MOCK_EVENT_IDS.has(String(e.id))) return false;
          const title = String(e.title || '').toLowerCase();
          const desc = String(e.description || '').toLowerCase();
          if (
            title.includes('evento teste') || 
            title.includes('simulação') || 
            title.includes('mock') ||
            desc.includes('evento teste') ||
            desc.includes('simulação')
          ) {
            return false;
          }
          return true;
        });
        localStorage.setItem('motolegado_events', JSON.stringify(cleaned));
      }
    } catch {
      localStorage.setItem('motolegado_events', JSON.stringify([]));
    }
  }
}

/**
 * Limpeza rigorosa de parceiros mockados
 */
function CLEAN_MOCK_PARTNERS(): void {
  const currentPartners = localStorage.getItem('motolegado_partners');
  if (currentPartners) {
    try {
      const parsed = JSON.parse(currentPartners);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((p: any) => {
          if (!p || !p.id) return false;
          if (MOCK_PARTNER_IDS.has(String(p.id))) return false;
          const name = String(p.name || '').toLowerCase();
          const desc = String(p.description || '').toLowerCase();
          if (
            name.includes('aço & fogo') || 
            name.includes('minha empresa') || 
            name.includes('empresa teste') || 
            name.includes('parceiro teste') ||
            name.includes('mock') ||
            desc.includes('empresa teste')
          ) {
            return false;
          }
          return true;
        });
        localStorage.setItem('motolegado_partners', JSON.stringify(cleaned));
      }
    } catch {
      localStorage.setItem('motolegado_partners', JSON.stringify([]));
    }
  }
}

/**
 * Limpeza incondicional de cache de roteiros
 * Garante que dados excluídos ou obsoletos em estações antigas nunca ressurjam
 */
function CLEAN_MOCK_ROUTES(): void {
  const checkKeys = ['motolegado_routes', 'motolegado_routes_v3'];
  checkKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch {}
  });
}

/**
 * Limpeza rigorosa de viagens locais mockadas ou sem piloto válido
 */
function CLEAN_MOCK_LOGS(): void {
  const rawLogs = localStorage.getItem('motolegado_logs');
  if (rawLogs) {
    try {
      const parsed = JSON.parse(rawLogs);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((l: any) => {
          if (!l) return false;
          const pid = String(l.pilot_id || '').toLowerCase().trim();
          if (!pid || pid === 'guest' || pid === 'pilot' || pid === 'undefined' || pid.includes('mototeste') || pid.includes('mock')) {
            return false;
          }
          const title = String(l.title || '').toLowerCase();
          if (title.includes('viagem teste') || title.includes('simulação') || title.includes('mock')) {
            return false;
          }
          return true;
        });
        localStorage.setItem('motolegado_logs', JSON.stringify(cleaned));
      }
    } catch {
      localStorage.setItem('motolegado_logs', JSON.stringify([]));
    }
  }
}

/**
 * Limpeza de motoclubes mockados
 */
function CLEAN_MOCK_CLUBS(): void {
  const clubsStr = localStorage.getItem('motolegado_clubs');
  if (clubsStr) {
    try {
      const parsed = JSON.parse(clubsStr);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((c: any) => {
          if (!c || !c.id) return false;
          if (MOCK_CLUB_IDS.has(String(c.id))) return false;
          const name = String(c.name || '').toLowerCase();
          if (name.includes('teste') || name.includes('mock') || name.includes('simulação')) return false;
          return true;
        });
        localStorage.setItem('motolegado_clubs', JSON.stringify(cleaned));
      }
    } catch {
      localStorage.setItem('motolegado_clubs', JSON.stringify([]));
    }
  }
}

/**
 * Limpeza de posts mockados no feed da comunidade
 */
function CLEAN_MOCK_COMMUNITY_POSTS(): void {
  const postsStr = localStorage.getItem('motolegado_community_posts_v1');
  if (postsStr) {
    try {
      const parsed = JSON.parse(postsStr);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((p: any) => {
          if (!p) return false;
          const author = String(p.authorName || p.author_name || '').toLowerCase();
          const content = String(p.content || '').toLowerCase();
          if (
            author.includes('piloto modelo') || 
            author.includes('piloto teste') || 
            author.includes('mock') ||
            content.includes('post teste') ||
            content.includes('simulação')
          ) {
            return false;
          }
          return true;
        });
        localStorage.setItem('motolegado_community_posts_v1', JSON.stringify(cleaned));
      }
    } catch {
      localStorage.setItem('motolegado_community_posts_v1', JSON.stringify([]));
    }
  }
}

/**
 * Varre o localStorage e remove chaves órfãs ou poluídas
 */
function SCAN_AND_PURGE_LEAKY_KEYS(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      const lower = key.toLowerCase();
      if (
        lower.includes('__mock') || 
        lower.includes('mock_data') || 
        lower.includes('test_data') ||
        lower.includes('motolegado_demo')
      ) {
        localStorage.removeItem(key);
      }
    });
  } catch {}
}

/**
 * Função de reset manual exposta para manutenção administrativa
 */
export function resetSystemData(): void {
  limparCacheEEstadoGlobal();
  localStorage.setItem('motolegado_logs', JSON.stringify([]));
  localStorage.setItem('motolegado_community_posts_v1', JSON.stringify([]));
  localStorage.setItem('motolegado_events', JSON.stringify([]));
  localStorage.setItem('motolegado_routes', JSON.stringify([]));
  localStorage.setItem('motolegado_routes_v3', JSON.stringify([]));
  localStorage.setItem('motolegado_partners', JSON.stringify([]));
  localStorage.setItem('motolegado_clubs', JSON.stringify([]));
}

// Execução imediata e incondicional em todo carregamento do aplicativo
if (typeof window !== 'undefined') {
  limparCacheEEstadoGlobal();
}

export default limparCacheEEstadoGlobal;
