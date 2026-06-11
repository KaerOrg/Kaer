import { supabase } from '../lib/supabase'
import type { PsyEduBlock, PsyEduTopic, PsyEduTheme } from '@psytool/shared'

// In-memory cache for the session — content is static and rarely changes
const topicsCache = new Map<string, PsyEduTopic[]>()
const blocksCache = new Map<string, PsyEduBlock[]>()

export async function fetchTopicsByModule(moduleKey: string): Promise<PsyEduTopic[]> {
  if (topicsCache.has(moduleKey)) return topicsCache.get(moduleKey)!

  const { data, error } = await supabase
    .from('psyedu_topics')
    .select('*')
    .eq('module_key', moduleKey)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw error

  const topics = data as PsyEduTopic[]
  topicsCache.set(moduleKey, topics)
  return topics
}

export async function fetchBlocksByTopic(topicId: string): Promise<PsyEduBlock[]> {
  if (blocksCache.has(topicId)) return blocksCache.get(topicId)!

  const { data, error } = await supabase
    .from('psyedu_blocks')
    .select('*')
    .eq('topic_id', topicId)
    .order('section_key', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) throw error

  const blocks = data as PsyEduBlock[]
  blocksCache.set(topicId, blocks)
  return blocks
}

export function clearPsyEduCache(): void {
  topicsCache.clear()
  blocksCache.clear()
}

// ─── Bibliothèque patient (fiches débloquées, multi-modules) ──────────────────

export async function fetchThemes(): Promise<PsyEduTheme[]> {
  const { data, error } = await supabase
    .from('psyedu_themes')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as PsyEduTheme[]
}

/** Fiches débloquées pour un patient, identifiées par leurs ids (multi-module_key). */
export async function fetchTopicsByIds(ids: readonly string[]): Promise<PsyEduTopic[]> {
  if (ids.length === 0) return []
  const { data, error } = await supabase
    .from('psyedu_topics')
    .select('*')
    .in('id', ids as string[])
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as PsyEduTopic[]
}

interface UnlockedTopicEntry {
  topic_id: string
  is_read: boolean
  unlocked_at: string
}

/**
 * Marque une fiche comme lue dans patient_modules.config.unlocked_topics.
 * Écriture Supabase directe (RLS modules_patient_update) — pas de stockage SQLite,
 * donc hors périmètre syncHelpers.
 */
export async function markTopicRead(patientId: string, topicId: string): Promise<void> {
  const { data } = await supabase
    .from('patient_modules')
    .select('id, config')
    .eq('patient_id', patientId)
    .eq('module_type', 'psychoeducation')
    .is('revoked_at', null)
    .maybeSingle()
  if (!data) return

  const row = data as { id: string; config: { unlocked_topics?: UnlockedTopicEntry[] } | null }
  const topics = row.config?.unlocked_topics ?? []
  const next = topics.map(tpc =>
    tpc.topic_id === topicId ? { ...tpc, is_read: true } : tpc
  )
  await supabase
    .from('patient_modules')
    .update({ config: { ...(row.config ?? {}), unlocked_topics: next } })
    .eq('id', row.id)
}
