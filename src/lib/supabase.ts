import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fallbacks
const DEFAULT_URL = 'https://ngkpxpjjcjinltyxeomg.supabase.co';
const DEFAULT_KEY = 'sb_publishable_fpbr8oyt2xAQy_3n0vx3eA_Mh7au0UX';

const isValidUrl = (url: string | undefined): url is string => {
  if (!url || url === 'undefined' || url === 'null' || url === '') return false;
  try {
    const parsed = new URL(url);
    // Be more permissive: allow localhost and other valid URLs
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:');
  } catch {
    return false;
  }
};

let supabaseUrl = rawUrl;
let supabaseAnonKey = rawKey;

// Logging for debugging (without exposing full key)
console.log('Initializing Supabase with URL:', rawUrl ? 'Provided' : 'Missing');

// If URL is invalid or looks like a key, use fallback or swap
if (!isValidUrl(supabaseUrl)) {
  const urlStr = String(rawUrl);
  if (urlStr.startsWith('sb_') && isValidUrl(rawKey)) {
    console.warn('Supabase URL and Key appear to be swapped. Swapping them back.');
    supabaseUrl = rawKey;
    supabaseAnonKey = rawUrl;
  } else {
    console.warn('Invalid or missing Supabase URL. Using fallback.');
    supabaseUrl = DEFAULT_URL;
  }
}

if (!supabaseAnonKey || supabaseAnonKey === 'undefined' || supabaseAnonKey === 'null' || supabaseAnonKey === '') {
  console.warn('Missing Supabase Anon Key. Using fallback.');
  supabaseAnonKey = DEFAULT_KEY;
}

// Final validation
if (!isValidUrl(supabaseUrl)) {
  console.error('CRITICAL: Invalid Supabase URL after resolution:', supabaseUrl);
  // We don't throw here to avoid crashing the whole app immediately, 
  // but subsequent calls will fail.
}

export { supabaseUrl, supabaseAnonKey };

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'lis-compass-auth-token',

    lock: async (_name: string, _acquireTimeout: number, acquire: () => Promise<any>) => {
      return await acquire();
    },
  },
});