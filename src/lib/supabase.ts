import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://yxdfihqubtdwwxvxkpst.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4ZGZpaHF1YnRkd3d4dnhrcHN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyODc2NDcsImV4cCI6MjEwMzg2MzY0N30.8F__6te-HYpeZFwu8FbRrHH0dCQZT6f6hFRlN6Db50s';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

// Checa se as variáveis de ambiente do Supabase estão configuradas com valores reais
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-id') && 
  !supabaseUrl.includes('seu-projeto-id') &&
  !supabaseAnonKey.includes('your-supabase-anon')
);

// Cria o cliente se as credenciais existirem, ou um cliente seguro que não quebra o app
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  }
);
