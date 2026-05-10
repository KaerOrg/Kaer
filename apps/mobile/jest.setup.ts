// Variables d'environnement pour les tests Jest.
// Le client Supabase valide l'URL au moment de createClient() — sans ces
// valeurs, tout test qui importe transitivement `lib/supabase.ts` échoue.
process.env.EXPO_PUBLIC_SUPABASE_URL ??= 'https://test.supabase.co'
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key'
