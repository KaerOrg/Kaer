import { supabase } from '../lib/supabase'
import type { ModuleSource } from '@kaer/shared'

const cache = new Map<string, ModuleSource[]>()

export async function fetchSourcesByModule(moduleId: string): Promise<ModuleSource[]> {
  if (cache.has(moduleId)) return cache.get(moduleId)!

  const { data, error } = await supabase
    .from('module_sources')
    .select('*')
    .eq('module_id', moduleId)
    .order('sort_order', { ascending: true })

  if (error) throw error

  const sources = (data ?? []) as ModuleSource[]
  cache.set(moduleId, sources)
  return sources
}

export function clearModuleSourcesCache(): void {
  cache.clear()
}
