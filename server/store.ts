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
  destination: string;
  distance_km?: number;
  start_date: string;
  end_date?: string;
  motorcycle_used?: string;
  checklist_data?: any;
  photos?: any;
  created_at?: string;
}

interface DataStore {
  pilots: Record<string, StoredPilot>;
  trips: StoredTrip[];
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

// Obter viagens
export function storeGetTrips(pilotId?: string): StoredTrip[] {
  const store = loadStore();
  if (!pilotId) return store.trips;
  const target = pilotId.toLowerCase();
  return store.trips.filter(t => t.pilot_id && t.pilot_id.toLowerCase() === target);
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
