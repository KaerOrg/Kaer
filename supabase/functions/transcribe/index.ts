import { createClient } from 'jsr:@supabase/supabase-js@2'
import { getProvider } from './stt/factory.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_BYTES = 25 * 1024 * 1024
const ALLOWED_MIME_PREFIX = 'audio/'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // ── Auth ────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return json({ error: 'Unauthorized' }, 401)

  // ── Body ─────────────────────────────────────────────────────────────────
  let body: { audio_base64?: string; mime_type?: string; language?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Corps JSON invalide' }, 400)
  }

  const { audio_base64, mime_type = 'audio/webm', language } = body

  if (!audio_base64 || typeof audio_base64 !== 'string') {
    return json({ error: 'audio_base64 manquant' }, 400)
  }
  if (!mime_type.startsWith(ALLOWED_MIME_PREFIX)) {
    return json({ error: 'Format audio non supporté' }, 400)
  }

  const binaryStr = atob(audio_base64)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)

  if (bytes.byteLength > MAX_BYTES) {
    return json({ error: 'Fichier trop volumineux (max 25 Mo)' }, 413)
  }

  // ── Transcription ────────────────────────────────────────────────────────
  let provider
  try {
    provider = getProvider()
  } catch (err) {
    console.error('Provider config error:', err instanceof Error ? err.message : err)
    return json({ error: 'Configuration serveur manquante' }, 500)
  }

  try {
    const text = await provider.transcribe(bytes, mime_type, { language })
    return json({ text }, 200)
  } catch (err) {
    console.error(`[${provider.name}] transcription error:`, err instanceof Error ? err.message : err)
    return json({ error: 'Erreur de transcription' }, 502)
  }
})

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
