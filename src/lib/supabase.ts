// MotoLegado foi totalmente migrado para o backend Hostinger (MySQL + Armazenamento Local).
// O Supabase não é mais utilizado no sistema.
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase permanentemente desativado: sistema roda 100% no provedor Hostinger
export const isSupabaseConfigured = false;

// Cliente mock resiliente para evitar runtime crashes caso algum módulo legado chame supabase
export const supabase: SupabaseClient = createClient(
  'https://disabled.hostinger-only.local',
  'disabled-key-hostinger-only',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    }
  }
);
