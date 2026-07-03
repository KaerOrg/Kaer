import { supabase } from '../lib/supabase'
import type { ModuleSource } from '@kaer/shared'

// Pas de cache module-level : React Query (moduleSourcesQueries) est l'unique couche
// de cache côté web. Un cache local masquerait l'invalidation par jeton de version (#102).
export async function fetchSourcesByModule(moduleId: string): Promise<ModuleSource[]> {
  const { data, error } = await supabase
    .from('module_sources')
    .select('*')
    .eq('module_id', moduleId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []) as ModuleSource[]
}
