import { supabase } from '../lib/supabase'
import type { PsyEduBlock, PsyEduTopic } from '@psytool/shared'

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
