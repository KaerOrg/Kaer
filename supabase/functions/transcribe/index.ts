import { createClient } from 'jsr:@supabase/supabase-js@2'

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

  // Valider le JWT du praticien
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  let body: { audio_base64?: string; mime_type?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ error: 'Corps JSON invalide' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const { audio_base64, mime_type = 'audio/webm' } = body

  if (!audio_base64 || typeof audio_base64 !== 'string') {
    return new Response(
      JSON.stringify({ error: 'audio_base64 manquant' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  if (!mime_type.startsWith(ALLOWED_MIME_PREFIX)) {
    return new Response(
      JSON.stringify({ error: 'Format audio non supporté' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  // Décoder le base64 en bytes
  const binaryStr = atob(audio_base64)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }

  if (bytes.byteLength > MAX_BYTES) {
    return new Response(
      JSON.stringify({ error: 'Fichier trop volumineux (max 25 Mo)' }),
      { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  // Choisir l'extension selon le MIME type
  const ext = mime_type === 'audio/mp4' || mime_type === 'audio/m4a' ? 'm4a'
    : mime_type === 'audio/mpeg' || mime_type === 'audio/mp3' ? 'mp3'
    : mime_type === 'audio/wav' ? 'wav'
    : 'webm'

  const audioFile = new File([bytes], `recording.${ext}`, { type: mime_type })

  const formData = new FormData()
  formData.append('file', audioFile)
  formData.append('model', 'gpt-4o-transcribe')
  formData.append('response_format', 'json')

  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiKey) {
    console.error('OPENAI_API_KEY non configurée')
    return new Response(
      JSON.stringify({ error: 'Configuration serveur manquante' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const openaiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${openaiKey}` },
    body: formData,
  })

  if (!openaiRes.ok) {
    const detail = await openaiRes.text()
    console.error('Erreur OpenAI:', detail)
    return new Response(
      JSON.stringify({ error: 'Erreur de transcription' }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const { text } = await openaiRes.json() as { text: string }

  return new Response(
    JSON.stringify({ text }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
