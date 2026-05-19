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
    category_id: string | null
  } | null
}

export async function fetchUnlockedModules(patientId: string): Promise<UnlockedModule[]> {
  const { data } = await supabase
    .from('patient_modules')
    .select('*, module:modules(mobile_icon, color, preview_kind, category_id)')
    .eq('patient_id', patientId)
    .order('unlocked_at', { ascending: true })
  return (data ?? []) as UnlockedModule[]
}

// ── Today's schedule ────────────────────────────────────────────────────────

export interface TodayRoutine {
  id: string
  patient_module_id: string
  time_of_day: string
  patient_time_override: string | null
  effective_time: string
  module_type: string
  mobile_icon: string
  preview_kind: string
}

// JS getDay() 0=Sun → ISO 1=Mon…7=Sun
function toISODayOfWeek(date: Date): number {
  const jsDay = date.getDay()
  return jsDay === 0 ? 7 : jsDay
}

// PostgREST returns many-to-one FK embeds as objects at runtime, but
// postgrest-js (without generated DB types) infers them as arrays.
// This helper handles both safely.
function getOneEmbed<T>(val: T | T[] | null | undefined): T | null {
  if (val == null) return null
  return Array.isArray(val) ? (val[0] ?? null) : val
}

export async function fetchTodayRoutines(patientId: string): Promise<TodayRoutine[]> {
  const isoDay = toISODayOfWeek(new Date())

  // prettier-ignore
  const { data } = await supabase
    .from('notification_routines')
    .select('id, patient_module_id, time_of_day, patient_time_override, patient_module:patient_modules(module_type, module:modules(mobile_icon, preview_kind))')
    .eq('patient_id', patientId)
    .eq('is_active', true)
    .eq('patient_paused', false)
    .contains('days_of_week', [isoDay])

  if (!data) return []

  return data
    .map(r => {
      const pm = getOneEmbed(r.patient_module)
      if (pm?.module_type == null) return null
      const mod = getOneEmbed(pm.module)
      return {
        id: r.id as string,
        patient_module_id: r.patient_module_id as string,
        time_of_day: r.time_of_day as string,
        patient_time_override: r.patient_time_override as string | null,
        effective_time: (r.patient_time_override ?? r.time_of_day) as string,
        module_type: pm.module_type as string,
        mobile_icon: (mod?.mobile_icon ?? 'help-circle-outline') as string,
        preview_kind: (mod?.preview_kind ?? '') as string,
      }
    })
    .filter((r): r is TodayRoutine => r !== null)
    .sort((a, b) => a.effective_time.localeCompare(b.effective_time))
}
