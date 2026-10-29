// MotoLegado - Serviço de Notificações Push e Gerenciamento do Service Worker
export interface RouteShareNotification {
  id: string;
  type?: 'route_shared' | 'system';
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  recipient_id?: string;
  route_id: string;
  route_name: string;
  route_destination: string;
  route_distance?: number;
  route_duration?: string;
  route_image?: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
}

const LOCAL_STORAGE_KEY = 'motolegado_push_notifications';

// Reproduz sinal sonoro moderno de notificação estradeira usando Web Audio API
export function playPushNotificationSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Arpeggio rápido em tons característicos de aplicativo
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5
    osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.16); // D6

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  } catch {
    // Silencioso se o usuário não interagiu com a página ainda
  }
}

// Verifica status de permissão de notificações do navegador
export function getPushPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

// Solicita permissão para notificações push nativas do sistema operacional
export async function requestPushPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('[Push] Notificações não são suportadas neste navegador.');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (err) {
    console.warn('[Push] Erro ao solicitar permissão de notificação:', err);
    return false;
  }
}

// Registra e inicializa o Service Worker do MotoLegado
export async function initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('[Push SW] Service Worker registrado com sucesso no escopo:', registration.scope);

    // Se houver uma nova versão aguardando, ativa
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    return registration;
  } catch (err) {
    // Em containers fechados ou iframes com restrições de sandbox, apenas loga como aviso não-bloqueante
    console.info('[Push SW] Registro do Service Worker não disponível neste contexto (iframe/sandbox).');
    return null;
  }
}

export interface PushNotificationOptions extends NotificationOptions {
  vibrate?: number[];
  image?: string;
  routeId?: string;
  url?: string;
  actions?: Array<{ action: string; title: string; icon?: string }>;
}

// Exibe uma notificação push nativa através do Service Worker registrado
export async function showPushNotification(title: string, options: PushNotificationOptions = {}): Promise<boolean> {
  // Toca o som de notificação
  playPushNotificationSound();

  const fullOptions: any = {
    icon: '/pwa-192x192.png',
    badge: '/favicon-32x32.png',
    vibrate: [200, 100, 200],
    data: {
      url: options.url || (options.routeId ? `/routes?routeId=${options.routeId}` : '/routes'),
      routeId: options.routeId,
      timestamp: Date.now()
    },
    ...options
  };

  // 1. Tenta disparar através do Service Worker registrado (método padrão e mais robusto)
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await (reg as any).showNotification(title, fullOptions);
        console.log('[Push SW] Notificação exibida via registration.showNotification');
        return true;
      }
    } catch (swErr) {
      console.warn('[Push SW] Falha ao exibir via Service Worker, tentando fallback:', swErr);
    }
  }

  // 2. Fallback para Notification API nativa direta (se tiver permissão)
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, fullOptions);
      notif.onclick = () => {
        window.focus();
        if (options.url) {
          window.location.href = options.url;
        } else if (options.routeId) {
          window.location.href = `/routes?routeId=${options.routeId}`;
        }
        notif.close();
      };
      return true;
    } catch (notifErr) {
      console.warn('[Push] Fallback Notification() falhou:', notifErr);
    }
  }

  return false;
}

// Envia / Dispara o compartilhamento de rota para os contatos com Push Notification
export async function dispatchRouteShareNotification(payload: {
  route: {
    id: string;
    name: string;
    mapsAddress?: string;
    distance?: number;
    duration?: string;
    image?: string;
    cover_image?: string;
  };
  sender: {
    id?: string;
    name?: string;
    avatar?: string;
  };
  recipientId?: string; // 'all' ou ID do piloto contato
  customMessage?: string;
}): Promise<RouteShareNotification> {
  const { route, sender, recipientId = 'all', customMessage } = payload;

  const senderName = sender.name || 'Piloto Parceiro';
  const routeDist = route.distance ? ` (~${route.distance} km)` : '';
  const finalTitle = `Novo Roteiro: ${route.name} 🏍️`;
  const finalMessage = customMessage || `${senderName} compartilhou o roteiro "${route.name}"${routeDist} no MotoLegado. Bora acelerar juntos na estrada?`;
  const routeImg = route.cover_image || route.image || '';

  const bodyData = {
    sender_id: sender.id || 'pilot_ciceroranieri',
    sender_name: senderName,
    sender_avatar: sender.avatar || '',
    recipient_id: recipientId,
    route_id: route.id,
    route_name: route.name,
    route_destination: route.mapsAddress || 'Destino Estradeiro',
    route_distance: route.distance || 0,
    route_duration: route.duration || '',
    route_image: routeImg,
    title: finalTitle,
    message: finalMessage
  };

  let savedNotif: RouteShareNotification;

  try {
    const res = await fetch('/api/notifications/route-share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    });

    if (res.ok) {
      const data = await res.json();
      savedNotif = data.notification;
    } else {
      throw new Error('Falha na resposta da API');
    }
  } catch (err) {
    // Fallback offline / local
    savedNotif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'route_shared',
      sender_id: bodyData.sender_id,
      sender_name: bodyData.sender_name,
      sender_avatar: bodyData.sender_avatar,
      recipient_id: bodyData.recipient_id,
      route_id: bodyData.route_id,
      route_name: bodyData.route_name,
      route_destination: bodyData.route_destination,
      route_distance: bodyData.route_distance,
      route_duration: bodyData.route_duration,
      route_image: bodyData.route_image,
      title: finalTitle,
      message: finalMessage,
      created_at: new Date().toISOString(),
      read: false
    };
  }

  // Armazena no cache local do navegador para garantia de exibição imediata
  try {
    const existing = getLocalNotifications();
    const updated = [savedNotif, ...existing.filter(n => n.id !== savedNotif.id)].slice(0, 50);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch {}

  // Dispara a Notificação Push do Service Worker
  await showPushNotification(finalTitle, {
    body: finalMessage,
    icon: '/pwa-192x192.png',
    badge: '/favicon-32x32.png',
    image: routeImg || undefined,
    routeId: route.id,
    url: `/routes?routeId=${route.id}`
  });

  // Notifica todos os componentes na janela atual
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('motolegado-notification-update', { detail: savedNotif }));
  }

  return savedNotif;
}

// Dispara uma notificação de teste para o usuário validar a integração com o Service Worker
export async function testPushNotification(): Promise<boolean> {
  const sampleNotification = {
    title: '🏍️ Roteiro Compartilhado: Serra do Rio do Rastro',
    body: 'Cícero Ranieri compartilhou um roteiro de 72 km (Curvas Épicas & Mirantes) com você no MotoLegado. Toque para ver o mapa e especificações!',
    icon: '/pwa-192x192.png',
    badge: '/favicon-32x32.png',
    url: '/routes'
  };

  return await showPushNotification(sampleNotification.title, sampleNotification);
}

// Busca a lista de notificações do servidor com fallback para localStorage
export async function fetchNotifications(pilotId?: string): Promise<RouteShareNotification[]> {
  try {
    const url = pilotId ? `/api/notifications?pilot_id=${encodeURIComponent(pilotId)}` : '/api/notifications';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.notifications)) {
        // Atualiza cache local
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.notifications));
        } catch {}
        return data.notifications;
      }
    }
  } catch (err) {
    console.warn('[Notifications] Falha ao buscar da API, usando cache local:', err);
  }

  return getLocalNotifications();
}

// Obtém notificações salvas no localStorage
export function getLocalNotifications(): RouteShareNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

// Marca notificação como lida
export async function markNotificationAsRead(id: string): Promise<void> {
  try {
    await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
  } catch {}

  try {
    const local = getLocalNotifications();
    const updated = local.map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('motolegado-notification-update'));
  } catch {}
}

// Limpa todas as notificações
export async function clearAllNotifications(pilotId?: string): Promise<void> {
  try {
    await fetch('/api/notifications/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pilot_id: pilotId })
    });
  } catch {}

  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('motolegado-notification-update'));
  } catch {}
}
