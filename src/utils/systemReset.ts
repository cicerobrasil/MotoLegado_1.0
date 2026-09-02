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
}
