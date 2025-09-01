import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create client with anon key for general use
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create service role client for admin operations (when service key is available)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export interface User {
  puuid: string;
  game_name?: string;
  tag_line?: string;
  country?: string;
  email?: string;
  preferred_username?: string;
  player_locale?: string;
  email_verified: boolean;
  phone_number_verified: boolean;
  account_type: number;
  account_state: string;
  account_created_at?: string;
  country_at?: string;
  password_changed_at?: string;
  password_must_reset: boolean;
  is_banned: boolean;
  ban_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface UserLog {
  id: string;
  puuid: string;
  action: string;
  user_agent?: string;
  ip_address?: string;
  metadata?: any;
  created_at: string;
}

export interface MaintenanceStatus {
  id: string;
  enabled: boolean;
  message: string;
  created_at: string;
  updated_at: string;
}