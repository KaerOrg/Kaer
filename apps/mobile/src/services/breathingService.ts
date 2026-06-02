import {
  saveBreathingSession as dbSave,
  type BreathingSession,
} from '../lib/database'
import { syncUpsert } from './syncHelpers'

export type { BreathingSession }

export async function saveBreathingSession(session: Omit<BreathingSession, 'created_at'>): Promise<void> {
  await syncUpsert(() => dbSave(session), {
    local_id: session.id,
    module_id: 'breathing_techniques',
    entry_kind: 'breathing_session',
    payload: {
      date: session.date,
      technique_key: session.technique_key,
      duration_seconds: session.duration_seconds,
    },
  })
}
