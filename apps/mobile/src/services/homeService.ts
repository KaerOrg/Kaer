import { supabase } from '../lib/supabase'

export interface SideEffectsEvent {
  date: string  // ISO date string (YYYY-MM-DD)
  label: string
}

export async function fetchModuleEvents(
  patientId: string,
  moduleType: string,
): Promise<SideEffectsEvent[]> {
  const { data } = await supabase
    .from('patient_modules')
    .select('config')
    .eq('patient_id', patientId)
    .eq('module_type', moduleType)
    .maybeSingle()
  if (!data?.config) return []
  const cfg = data.config as Record<string, unknown>
  const events = cfg['events']
  if (!Array.isArray(events)) return []
  return events as SideEffectsEvent[]
}

export interface UnlockedModule {
  id: string
  module_type: string
  config: Record<string, unknown>
  unlocked_at: string
  module: {
    mobile_icon: string
    color: string
    preview_kind: string
  } | null
}

// Modules épinglés — toujours affichés en tête de liste quel que soit unlocked_at
const PINNED_FIRST: readonly string[] = ['crisis_plan']

export async function fetchUnlockedModules(patientId: string): Promise<UnlockedModule[]> {
  const { data } = await supabase
    .from('patient_modules')
    .select('*, module:modules(mobile_icon, color, preview_kind)')
    .eq('patient_id', patientId)
    .order('unlocked_at', { ascending: true })
  const rows = (data ?? []) as UnlockedModule[]
  return rows.sort((a, b) => {
    const pa = PINNED_FIRST.indexOf(a.module_type)
    const pb = PINNED_FIRST.indexOf(b.module_type)
    if (pa !== -1 && pb === -1) return -1
    if (pb !== -1 && pa === -1) return 1
    return 0
  })
}
