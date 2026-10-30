// MotoLegado - Service Worker com Suporte a Notificações Push & PWA
const CACHE_NAME = 'motolegado-pwa-v2-live';

// Recursos críticos para cache inicial (NUNCA incluir rotas HTML como '/' para não servir index obsoleto)
const PRECACHE_ASSETS = [
  '/favicon-32x32.png',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Falha não crítica no precache de alguns recursos:', err);
      });
    })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptação de Requisições de Rede (Garante que HTML e API sempre venham da rede)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignora rotas de API e chamadas externas não GET
  if (url.pathname.startsWith('/api/') || event.request.method !== 'GET') {
    return;
  }

  // Navegação de páginas (HTML) NUNCA deve ser servida de cache velho: busca sempre a versão fresca
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Ignora chamadas do Vite HMR ou extensões do Chrome
  if (url.protocol === 'chrome-extension:' || url.pathname.includes('/@vite/') || url.pathname.includes('/@fs/')) {
    return;
  }

  // Para imagens e ícones, tenta cache primeiro
  if (
    event.request.destination === 'image' || 
    url.pathname.endsWith('.png') || 
    url.pathname.endsWith('.svg') || 
    url.pathname.endsWith('.jpg')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => cachedResponse);
      })
    );
  }
});

// =========================================================================
// SISTEMA DE NOTIFICAÇÕES PUSH
// =========================================================================

// Evento disparado quando uma notificação Push do servidor é recebida
self.addEventListener('push', (event) => {
  console.log('[SW] Notificação Push recebida:', event);

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'Novo Roteiro no MotoLegado! 🏍️',
        body: event.data.text()
      };
    }
  }

  const title = data.title || 'Novo Roteiro Compartilhado! 🏍️';
  const routeId = data.routeId || '';
  const targetUrl = data.url || (routeId ? `/routes?routeId=${routeId}` : '/routes');

  const options = {
    body: data.body || 'Um dos seus contatos compartilhou um novo roteiro para acelerar no MotoLegado.',
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/favicon-32x32.png',
    image: data.image || undefined,
    data: {
      url: targetUrl,
      routeId: routeId,
      timestamp: Date.now()
    },
    tag: data.tag || `motolegado-route-${routeId || Date.now()}`,
    renotify: true,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'open_route',
        title: 'Ver Roteiro 🗺️'
      },
      {
        action: 'dismiss',
        title: 'Fechar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Evento disparado quando o usuário clica na notificação do sistema
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Usuário clicou na notificação:', event);
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/routes';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se já houver uma aba aberta do MotoLegado, foca nela e redireciona
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Se não houver janela aberta, abre uma nova
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Comunicação interna com a aplicação React via postMessage
self.addEventListener('message', (event) => {
  if (!event.data) return;

  // Disparo direto de notificação via Service Worker Registration
  if (event.data.type === 'SHOW_ROUTE_NOTIFICATION') {
    const { title, options } = event.data;
    const defaultOptions = {
      icon: '/pwa-192x192.png',
      badge: '/favicon-32x32.png',
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open_route', title: 'Ver Roteiro 🗺️' },
        { action: 'dismiss', title: 'Fechar' }
      ],
      ...options
    };

    self.registration.showNotification(title || 'Novo Roteiro Compartilhado! 🏍️', defaultOptions);
  } else if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
