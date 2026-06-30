/// <reference types="vitest" />
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // En déploiement GitHub Pages : VITE_BASE='/Kaer/' (injecté par le workflow)
  // Avec custom domain : VITE_BASE='/' ou laisser vide
  base: process.env.VITE_BASE ?? '/',
  server: {
    host: true,
    port: 3000,
    allowedHosts: true,
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@ui': fileURLToPath(new URL('./src/components/ui', import.meta.url)),
      '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-i18n': ['i18next', 'react-i18next'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Valeurs factices : les services sont mockés au niveau de leur frontière,
    // donc ce client n'émet jamais de requête réelle. Ces variables empêchent
    // seulement supabase.ts de throw à l'import quand un barrel (hooks/queries)
    // tire transitivement un service non mocké. Le throw reste actif en dev/prod.
    env: {
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
})
