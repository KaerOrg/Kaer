import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''

// expo-secure-store n'accepte que des clés alphanum + tirets de ≤255 chars
// Supabase peut passer des clés avec des caractères spéciaux → on les encode
const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(encodeURIComponent(key)),
  setItem: (key: string, value: string) =>
    SecureStore.setItemAsync(encodeURIComponent(key), value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(encodeURIComponent(key)),
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: secureStorage,
  },
})
