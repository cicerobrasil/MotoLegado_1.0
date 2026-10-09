import fs from 'fs';
import path from 'path';

export interface StoredPilot {
  id: string;
  email: string;
  password_hash?: string;
  name: string;
  phone?: string;
  blood_type?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  motorcycle?: string;
  motorcycle_nickname?: string;
  motorcycle_year?: string;
  motorcycle_plate?: string;
  motorcycle_photos?: string[] | string;
  bio?: string;
  avatar_url?: string;
  personal_logo_url?: string;
  city?: string;
  state?: string;
  cep?: string;
  street?: string;
  street_number?: string;
  neighborhood?: string;
  default_start_point?: boolean | number;
  club_name?: string;
  role?: 'admin' | 'pilot' | 'partner' | 'organizer';
  plan?: 'gratuito' | 'pago' | 'bonificado';
  points?: number;
  tier?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StoredTrip {
  id: string;
  pilot_id: string;
  title: string;
  origin?: string;
  start_location?: string;
  destination: string;
  distance_km?: number;
  start_date: string;
  end_date?: string;
  description?: string;
  image?: string;
  status?: string;
  motorcycle_used?: string;
  checklist_data?: any;
  photos?: any;
  created_at?: string;
}

export interface StoredPaymentRequest {
  id: string;
  pilot_id: string;
  email: string;
  name: string;
  amount: number;
  method: 'pix_direct' | 'mercado_pago';
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at?: string;
  approved_by?: string;
}

interface DataStore {
  pilots: Record<string, StoredPilot>;
  trips: StoredTrip[];
  pending_payments?: StoredPaymentRequest[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

// Piloto padrão inicial garantido (Admin Cícero Ranieri)
const DEFAULT_ADMIN: StoredPilot = {
  id: 'admin_ciceroranieri',
  email: 'ciceroranieri@gmail.com',
  name: 'Cícero Ranieri',
  role: 'admin',
  plan: 'pago',
  tier: 'Diamante',
  points: 1000,
  avatar_url: 'https://ui-avatars.com/api/?name=C%C3%ADcero+Ranieri&background=ea580c&color=ffffff&bold=true',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadStore(): DataStore {
  ensureDataDir();
  if (fs.existsSync(STORE_FILE)) {
    try {
      const content = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (!parsed.pilots) parsed.pilots = {};
      if (!parsed.trips) parsed.trips = [];
      if (!parsed.pilots['admin_ciceroranieri'] && !parsed.pilots['ciceroranieri@gmail.com']) {
        parsed.pilots[DEFAULT_ADMIN.id] = { ...DEFAULT_ADMIN };
      }
      return parsed;
    } catch (e) {
      console.warn('[STORE] Falha ao carregar store.json, recriando:', e);
    }
  }

  const initialStore: DataStore = {
    pilots: {
      [DEFAULT_ADMIN.id]: { ...DEFAULT_ADMIN },
      [DEFAULT_ADMIN.email.toLowerCase()]: { ...DEFAULT_ADMIN }
    },
    trips: []
  };
  saveStore(initialStore);
  return initialStore;
}

function saveStore(store: DataStore) {
  try {
    ensureDataDir();
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('[STORE] Erro ao salvar store.json:', err);
  }
}

// Obter piloto por ID
export function storeGetPilotById(id: string): StoredPilot | null {
  if (!id) return null;
  const store = loadStore();
  if (store.pilots[id]) return store.pilots[id];

  // Buscar por id case-insensitive
  const targetId = id.toLowerCase();
  for (const p of Object.values(store.pilots)) {
    if (p.id && p.id.toLowerCase() === targetId) return p;
  }
  return null;
}

// Obter piloto por Email
export function storeGetPilotByEmail(email: string): StoredPilot | null {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();
  const store = loadStore();
  if (store.pilots[cleanEmail]) return store.pilots[cleanEmail];

  for (const p of Object.values(store.pilots)) {
    if (p.email && p.email.toLowerCase().trim() === cleanEmail) return p;
  }
  return null;
}

// Salvar ou atualizar piloto no armazenamento resiliente
export function storeSavePilot(pilot: Partial<StoredPilot> & { email?: string; id?: string }): StoredPilot {
  const store = loadStore();
  const cleanEmail = pilot.email ? pilot.email.toLowerCase().trim() : '';
  const pilotId = pilot.id || (cleanEmail ? 'pilot_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_') : 'pilot_' + Date.now());

  // Buscar piloto existente por ID ou E-mail
  let existing = store.pilots[pilotId] || (cleanEmail ? store.pilots[cleanEmail] : null);
  if (!existing && cleanEmail) {
    for (const p of Object.values(store.pilots)) {
      if (p.email && p.email.toLowerCase().trim() === cleanEmail) {
        existing = p;
        break;
      }
    }
  }

  const now = new Date().toISOString();
  const merged: StoredPilot = {
    ...(existing || {}),
    ...pilot,
    id: existing?.id || pilotId,
    email: cleanEmail || existing?.email || '',
    name: pilot.name || existing?.name || 'Piloto MotoLegado',
    motorcycle: pilot.motorcycle !== undefined ? pilot.motorcycle : (existing?.motorcycle || ''),
    motorcycle_nickname: pilot.motorcycle_nickname !== undefined ? pilot.motorcycle_nickname : (existing?.motorcycle_nickname || ''),
    motorcycle_year: pilot.motorcycle_year !== undefined ? pilot.motorcycle_year : (existing?.motorcycle_year || '2023'),
    motorcycle_plate: pilot.motorcycle_plate !== undefined ? pilot.motorcycle_plate : (existing?.motorcycle_plate || ''),
    motorcycle_photos: pilot.motorcycle_photos !== undefined ? pilot.motorcycle_photos : (existing?.motorcycle_photos || []),
    bio: pilot.bio !== undefined ? pilot.bio : (existing?.bio || ''),
    avatar_url: pilot.avatar_url || existing?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(pilot.name || existing?.name || 'Piloto')}&background=ea580c&color=ffffff&bold=true`,
    personal_logo_url: pilot.personal_logo_url !== undefined ? pilot.personal_logo_url : existing?.personal_logo_url,
    city: pilot.city !== undefined ? pilot.city : (existing?.city || ''),
    state: pilot.state !== undefined ? pilot.state : (existing?.state || ''),
    cep: pilot.cep !== undefined ? pilot.cep : (existing?.cep || ''),
    street: pilot.street !== undefined ? pilot.street : (existing?.street || ''),
    street_number: pilot.street_number !== undefined ? pilot.street_number : (existing?.street_number || ''),
    neighborhood: pilot.neighborhood !== undefined ? pilot.neighborhood : (existing?.neighborhood || ''),
    default_start_point: pilot.default_start_point !== undefined ? pilot.default_start_point : (existing?.default_start_point ?? true),
    club_name: pilot.club_name !== undefined ? pilot.club_name : (existing?.club_name || ''),
    role: pilot.role || existing?.role || (cleanEmail === 'ciceroranieri@gmail.com' ? 'admin' : 'pilot'),
    plan: pilot.plan || existing?.plan || (cleanEmail === 'ciceroranieri@gmail.com' ? 'pago' : 'gratuito'),
    points: pilot.points !== undefined ? pilot.points : (existing?.points ?? (cleanEmail === 'ciceroranieri@gmail.com' ? 1000 : 0)),
    tier: pilot.tier || existing?.tier || (cleanEmail === 'ciceroranieri@gmail.com' ? 'Diamante' : 'Bronze'),
    created_at: existing?.created_at || now,
    updated_at: now
  };

  // Salvar referenciado por ID e por E-mail para busca instantânea O(1)
  store.pilots[merged.id] = merged;
  if (cleanEmail) {
    store.pilots[cleanEmail] = merged;
  }
  saveStore(store);

  return merged;
}

// Obter todos os pilotos cadastrados (para painel administrativo)
export function storeGetAllPilots(): StoredPilot[] {
  const store = loadStore();
  const seen = new Set<string>();
  const list: StoredPilot[] = [];
  for (const p of Object.values(store.pilots)) {
    if (p && p.id && !seen.has(p.id)) {
      seen.add(p.id);
      list.push(p);
    }
  }
  return list;
}

// Obter viagens com suporte a múltiplos aliases e admin
export function storeGetTrips(pilotId?: string): StoredTrip[] {
  const store = loadStore();
  if (!pilotId || pilotId === 'all' || pilotId === 'undefined' || pilotId === 'null') {
    return store.trips;
  }
  const clean = pilotId.trim().toLowerCase();

  // Se for admin, pode visualizar todas as viagens
  if (clean === 'admin_ciceroranieri' || clean === 'ciceroranieri@gmail.com' || clean.includes('admin')) {
    return store.trips;
  }

  // Obter possíveis identificadores do piloto (id, email, etc.)
  const candidateIds = new Set<string>([clean, 'pilot']);
  const pilot = store.pilots[clean] || store.pilots[pilotId];
  if (pilot) {
    if (pilot.id) candidateIds.add(pilot.id.toLowerCase());
    if (pilot.email) candidateIds.add(pilot.email.toLowerCase());
  }

  const matched = store.trips.filter(t => {
    if (!t.pilot_id) return true;
    const pid = t.pilot_id.toLowerCase();
    return candidateIds.has(pid);
  });

  // Se não encontrou nenhuma viagem específica mas existem viagens no sistema,
  // retorna as viagens gerais ou todas para não deixar a tela em branco
  return matched.length > 0 ? matched : store.trips;
}

// Sincronizar lote de viagens do MySQL no cache local
export function storeSyncTripsFromDb(trips: StoredTrip[]) {
  if (!Array.isArray(trips) || trips.length === 0) return;
  const store = loadStore();
  let changed = false;

  for (const t of trips) {
    const idx = store.trips.findIndex(st => st.id === t.id);
    if (idx >= 0) {
      // Mescla preservando campos não vazios
      store.trips[idx] = {
        ...store.trips[idx],
        ...t,
        checklist_data: t.checklist_data || store.trips[idx].checklist_data,
        photos: (t.photos && t.photos.length > 0) ? t.photos : store.trips[idx].photos,
        motorcycle_used: t.motorcycle_used || store.trips[idx].motorcycle_used,
        description: t.description || store.trips[idx].description
      };
      changed = true;
    } else {
      store.trips.push(t);
      changed = true;
    }
  }

  if (changed) {
    saveStore(store);
  }
}

// Excluir viagem
export function storeDeleteTrip(id: string): boolean {
  const store = loadStore();
  const initLen = store.trips.length;
  store.trips = store.trips.filter(t => t.id !== id);
  if (store.trips.length !== initLen) {
    saveStore(store);
    return true;
  }
  return false;
}

// Salvar viagem
export function storeSaveTrip(trip: StoredTrip): StoredTrip {
  const store = loadStore();
  const tripId = trip.id || 'trip_' + Date.now();
  const fullTrip: StoredTrip = {
    ...trip,
    id: tripId,
    created_at: trip.created_at || new Date().toISOString()
  };

  const existingIndex = store.trips.findIndex(t => t.id === tripId);
  if (existingIndex >= 0) {
    store.trips[existingIndex] = fullTrip;
  } else {
    store.trips.unshift(fullTrip);
  }

  saveStore(store);
  return fullTrip;
}

// Obter solicitações de pagamento
export function storeGetPaymentRequests(status?: string): StoredPaymentRequest[] {
  const store = loadStore();
  const list = store.pending_payments || [];
  if (!status) return list;
  return list.filter(p => p.status === status);
}

// Salvar / Registrar notificação de pagamento
export function storeSavePaymentRequest(req: Partial<StoredPaymentRequest>): StoredPaymentRequest {
  const store = loadStore();
  if (!store.pending_payments) store.pending_payments = [];

  const id = req.id || 'payreq_' + Date.now();
  const newReq: StoredPaymentRequest = {
    id,
    pilot_id: req.pilot_id || '',
    email: (req.email || '').toLowerCase().trim(),
    name: req.name || 'Piloto',
    amount: req.amount || 299.00,
    method: req.method || 'pix_direct',
    status: req.status || 'pending',
    created_at: req.created_at || new Date().toISOString()
  };

  const existingIdx = store.pending_payments.findIndex(p => p.id === id || (p.email === newReq.email && p.status === 'pending'));
  if (existingIdx >= 0) {
    store.pending_payments[existingIdx] = { ...store.pending_payments[existingIdx], ...newReq };
  } else {
    store.pending_payments.unshift(newReq);
  }

  saveStore(store);
  return newReq;
}

// Aprovar solicitação de pagamento e liberar o plano VIP Pro do piloto
export function storeApprovePaymentRequest(identifier: string, approverName = 'Cícero Ranieri'): { success: boolean; pilot?: StoredPilot } {
  const store = loadStore();
  if (!store.pending_payments) store.pending_payments = [];

  const clean = identifier.toLowerCase().trim();
  const req = store.pending_payments.find(p => p.id === identifier || p.pilot_id === identifier || p.email.toLowerCase() === clean);

  if (req) {
    req.status = 'approved';
    req.approved_at = new Date().toISOString();
    req.approved_by = approverName;
  }

  // Atualizar o piloto para VIP Pro ('pago')
  const pilot = storeGetPilotById(identifier) || storeGetPilotByEmail(clean);
  if (pilot) {
    const updated = storeSavePilot({
      ...pilot,
      plan: 'pago'
    });
    saveStore(store);
    return { success: true, pilot: updated };
  }

  saveStore(store);
  return { success: !!req };
}
