import { supabase } from '../lib/supabase'

export interface PsyEduTopic {
  readonly id: string
  readonly module_key: string
  readonly topic_key: string
  readonly icon_name: string
  readonly sort_order: number
  readonly is_active: boolean
}

export type PsyEduBlockType =
  | 'heading'
  | 'paragraph'
  | 'bullet_list'
  | 'tip'
  | 'blockquote'
  | 'source_link'

export type PsyEduSectionKey = 'why' | 'how' | 'sources'

export interface PsyEduBlock {
  readonly id: string
  readonly topic_id: string
  readonly section_key: PsyEduSectionKey
  readonly block_type: PsyEduBlockType
  readonly text_code: string | null
  readonly items_codes: string[] | null
  readonly href: string | null
  readonly sort_order: number
}

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

  const topics = (data ?? []) as PsyEduTopic[]
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

  const blocks = (data ?? []) as PsyEduBlock[]
  blocksCache.set(topicId, blocks)
  return blocks
}

export function clearPsyEduCache(): void {
  topicsCache.clear()
  blocksCache.clear()
}
