/**
 * System Data Reset Utility for MotoLegado
 * Clears all test records, mockups, simulations, and resets all modules to a pristine clean state.
 */

export function resetSystemData() {
  // Clear user-generated activity & mock items
  localStorage.setItem('motolegado_logs', JSON.stringify([]));
  localStorage.setItem('motolegado_community_posts_v1', JSON.stringify([]));
  localStorage.setItem('motolegado_clubs_moderation', JSON.stringify([]));
  localStorage.setItem('motolegado_community_reports', JSON.stringify([]));
  localStorage.setItem('motolegado_partners_moderation', JSON.stringify([]));
  localStorage.setItem('motolegado_mural_posts', JSON.stringify([]));
  localStorage.setItem('motolegado_events', JSON.stringify([]));
  localStorage.setItem('motolegado_routes', JSON.stringify([]));
  localStorage.setItem('motolegado_routes_v3', JSON.stringify([]));
  localStorage.setItem('motolegado_partners', JSON.stringify([]));
  localStorage.setItem('motolegado_clubs', JSON.stringify([]));
  localStorage.removeItem('motolegado_demo_mode');
  localStorage.removeItem('motolegado_liked_posts');

  // Reset profile points and stats if cached
  const savedProfile = localStorage.getItem('motolegado_pilot_profile');
  if (savedProfile) {
    try {
      const parsed = JSON.parse(savedProfile);
      parsed.points = 0;
      parsed.tier = 'Bronze';
      parsed.is_pro = false;
      localStorage.setItem('motolegado_pilot_profile', JSON.stringify(parsed));
    } catch (e) {
      // ignore
    }
  }

  // Dispatch sync events across components
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('community-posts-updated'));
  window.dispatchEvent(new Event('routes-updated'));
}

// Auto-run cleanup on initial load to purge all legacy mockups and fake data
if (typeof window !== 'undefined') {
  try {
    const isCleaned = localStorage.getItem('motolegado_system_cleaned_v8');
    if (!isCleaned) {
      // Purge mock events
      const currentEvents = localStorage.getItem('motolegado_events');
      if (currentEvents) {
        try {
          const parsed = JSON.parse(currentEvents);
          const filtered = parsed.filter((e: any) => !['e_fest_1', 'e_sul_1', 'e_pend_1', 'e_pend_2', 'e0', 'e1', 'e2', 'e3', 'e4', 'e5'].includes(e.id));
          localStorage.setItem('motolegado_events', JSON.stringify(filtered));
        } catch {
          localStorage.setItem('motolegado_events', JSON.stringify([]));
        }
      } else {
        localStorage.setItem('motolegado_events', JSON.stringify([]));
      }

      // Purge mock partners
      const currentPartners = localStorage.getItem('motolegado_partners');
      if (currentPartners) {
        try {
          const parsed = JSON.parse(currentPartners);
          const filtered = parsed.filter((p: any) => !['p1', 'p2', 'p3', 'p4', 'p5'].includes(p.id) && !p.name?.includes('Aço & Fogo') && !p.name?.includes('Minha Empresa'));
          localStorage.setItem('motolegado_partners', JSON.stringify(filtered));
        } catch {
          localStorage.setItem('motolegado_partners', JSON.stringify([]));
        }
      } else {
        localStorage.setItem('motolegado_partners', JSON.stringify([]));
      }

      // Purge mock routes (including Cunha x Paraty, Serra do Rio do Rastro mocks, etc.)
      const currentRoutes = localStorage.getItem('motolegado_routes_v3') || localStorage.getItem('motolegado_routes');
      if (currentRoutes) {
        try {
          const parsed = JSON.parse(currentRoutes);
          const filtered = parsed.filter((r: any) => {
            const name = (r.name || '').toLowerCase();
            const address = (r.mapsAddress || '').toLowerCase();
            const author = (r.author?.name || '').toLowerCase();
            const isMock = ['serra-rio-rastro', 'estrada-graciosa', 'rota-das-hortensias', 'route-pending-1', '1'].includes(r.id) ||
              name.includes('cunha') || name.includes('paraty') || address.includes('cunha') || address.includes('paraty') ||
              author.includes('renato') || name.includes('estrada real');
            return !isMock;
          });
          localStorage.setItem('motolegado_routes', JSON.stringify(filtered));
          localStorage.setItem('motolegado_routes_v3', JSON.stringify(filtered));
        } catch {
          localStorage.setItem('motolegado_routes', JSON.stringify([]));
          localStorage.setItem('motolegado_routes_v3', JSON.stringify([]));
        }
      } else {
        localStorage.setItem('motolegado_routes', JSON.stringify([]));
        localStorage.setItem('motolegado_routes_v3', JSON.stringify([]));
      }

      // Purge mock clubs
      localStorage.setItem('motolegado_clubs', JSON.stringify([]));
      localStorage.setItem('motolegado_system_cleaned_v8', 'true');
    }

    // V9: Limpeza obrigatória de resíduos de testes ("Rodrigo Trovão", "88301-001", "Tempestade Alemã", fotos mockadas)
    const dirtyGlobalKeys = [
      'motolegado_pilot_phone',
      'motolegado_pilot_bio',
      'motolegado_pilot_address',
      'motolegado_pilot_city',
      'motolegado_pilot_state',
      'motolegado_pilot_bike_nickname',
      'motolegado_pilot_bike_plate',
      'motolegado_pilot_bike_photos',
      'motolegado_pilot_bike_year',
      'motolegado_pilot_logo'
    ];
    dirtyGlobalKeys.forEach(k => localStorage.removeItem(k));

    // Sanitiza a sessão salva atual caso tenha herdado os dados de simulação
    const currentSession = localStorage.getItem('motolegado_pilot_session');
    if (currentSession) {
      try {
        const parsed = JSON.parse(currentSession);
        let changed = false;
        if (parsed.bio && (parsed.bio.includes('Trovão') || parsed.bio.includes('Silveira'))) {
          parsed.bio = '';
          changed = true;
        }
        if (parsed.phone && parsed.phone.includes('98841-3210')) {
          parsed.phone = '';
          changed = true;
        }
        if (parsed.motorcycle_nickname && (parsed.motorcycle_nickname.includes('Tempestade') || parsed.motorcycle_nickname.includes('Alemã'))) {
          parsed.motorcycle_nickname = '';
          changed = true;
        }
        if (parsed.motorcycle_plate && (parsed.motorcycle_plate.includes('PLACA: R') || parsed.motorcycle_plate === 'PLACA: R')) {
          parsed.motorcycle_plate = '';
          changed = true;
        }
        if (parsed.motorcycle_year === '2022' || parsed.motorcycle_year === 2022 || parsed.motorcycle_year === '2023') {
          parsed.motorcycle_year = '';
          changed = true;
        }
        if (parsed.cep && parsed.cep.includes('88301')) {
          parsed.cep = '';
          parsed.street = '';
          parsed.street_number = '';
          parsed.neighborhood = '';
          changed = true;
        }
        if (parsed.street && parsed.street.includes('Hercílio Luz')) {
          parsed.street = '';
          parsed.street_number = '';
          parsed.neighborhood = '';
          changed = true;
        }
        if (Array.isArray(parsed.motorcycle_photos)) {
          const cleanedPhotos = parsed.motorcycle_photos.filter((p: string) => !p.includes('1558981403') && !p.includes('1558981806'));
          if (cleanedPhotos.length !== parsed.motorcycle_photos.length) {
            parsed.motorcycle_photos = cleanedPhotos;
            changed = true;
          }
        }
        if (changed) {
          localStorage.setItem('motolegado_pilot_session', JSON.stringify(parsed));
          if (parsed.email) {
            localStorage.setItem('motolegado_pilot_saved_' + parsed.email.toLowerCase().trim(), JSON.stringify(parsed));
          }
        }
      } catch (e) {}
    }
  } catch (err) {
    console.warn('[systemReset] Local storage unavailable or restricted:', err);
  }
}
