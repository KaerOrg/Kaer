import { supabase } from '../lib/supabase'

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

export async function fetchUnlockedModules(patientId: string): Promise<UnlockedModule[]> {
  const { data } = await supabase
    .from('patient_modules')
    .select('*, module:modules(mobile_icon, color, preview_kind)')
    .eq('patient_id', patientId)
    .order('unlocked_at', { ascending: true })
  return (data ?? []) as UnlockedModule[]
}
