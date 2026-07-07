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
  | 'action_list'
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

// ─── Bibliothèque psychoéducation (refonte) ──────────────────────────────────
// Une fiche est découplée du module : elle appartient à un thème (psyedu_themes)
// et porte des tags (psyedu_topic_tags). La bibliothèque liste toutes les fiches
// rattachées à un thème, groupées par thème et filtrables par tag.

export interface PsyEduTheme {
  readonly id: string
  readonly icon_name: string
  readonly sort_order: number
}

export interface LibraryTopic {
  readonly id: string
  readonly module_key: string | null
  readonly theme_id: string
  readonly topic_key: string
  readonly icon_name: string
  readonly sort_order: number
  readonly titleKey: string
  readonly summaryKey: string
  readonly tags: readonly string[]
}

interface LibraryTopicRow {
  id: string
  module_key: string | null
  theme_id: string
  topic_key: string
  icon_name: string
  sort_order: number
}

export async function fetchThemes(): Promise<PsyEduTheme[]> {
  const { data, error } = await supabase
    .from('psyedu_themes')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as PsyEduTheme[]
}

/** Toutes les fiches rattachées à un thème (= la bibliothèque), avec leurs tags. */
export async function fetchLibraryTopics(): Promise<LibraryTopic[]> {
  const { data: topicsData, error: topicsError } = await supabase
    .from('psyedu_topics')
    .select('id, module_key, theme_id, topic_key, icon_name, sort_order')
    .not('theme_id', 'is', null)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (topicsError) throw topicsError
  const topics = (topicsData ?? []) as LibraryTopicRow[]

  const { data: tagsData, error: tagsError } = await supabase
    .from('psyedu_topic_tags')
    .select('topic_id, tag_id')
  if (tagsError) throw tagsError
  const tagRows = (tagsData ?? []) as { topic_id: string; tag_id: string }[]

  const tagsByTopic = new Map<string, string[]>()
  for (const row of tagRows) {
    const arr = tagsByTopic.get(row.topic_id)
    if (arr) arr.push(row.tag_id)
    else tagsByTopic.set(row.topic_id, [row.tag_id])
  }

  return topics.map(topic => ({
    id: topic.id,
    module_key: topic.module_key,
    theme_id: topic.theme_id,
    topic_key: topic.topic_key,
    icon_name: topic.icon_name,
    sort_order: topic.sort_order,
    titleKey: `${topic.module_key}.${topic.topic_key}.title`,
    summaryKey: `${topic.module_key}.${topic.topic_key}.summary`,
    tags: tagsByTopic.get(topic.id) ?? [],
  }))
}

// Pas de cache module-level : la déduplication et la péremption sont assurées par
// React Query (psyeduQueries), l'unique couche de cache côté web. Un cache local ici
// masquerait l'invalidation par jeton de version (#102) — la config resterait figée.
export async function fetchTopicsByModule(moduleKey: string): Promise<PsyEduTopic[]> {
  const { data, error } = await supabase
    .from('psyedu_topics')
    .select('*')
    .eq('module_key', moduleKey)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []) as PsyEduTopic[]
}

export async function fetchBlocksByTopic(topicId: string): Promise<PsyEduBlock[]> {
  const { data, error } = await supabase
    .from('psyedu_blocks')
    .select('*')
    .eq('topic_id', topicId)
    .order('section_key', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []) as PsyEduBlock[]
}
