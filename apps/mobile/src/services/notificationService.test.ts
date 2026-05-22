import {
  requestNotificationPermission,
  registerPushToken,
  registerPushTokenIfGranted,
  shouldShowNotificationOnboarding,
  markNotificationOnboardingSeen,
  getRoutinesForModule,
  pauseRoutine,
  resumeRoutine,
  updateTimeOverride,
  scheduleSleepDiaryReminder,
  cancelSleepDiaryReminder,
  getSleepDiaryReminderTime,
} from './notificationService'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Mocks définis dans apps/mobile/src/__mocks__/
jest.mock('expo-notifications')
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}))

import { supabase } from '../lib/supabase'
import * as Notifications from 'expo-notifications'

function makeChain(result: { data: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {}
  const proxy = new Proxy(chain, {
    get(_target, prop: string) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
      }
      chain[prop] = jest.fn().mockReturnValue(proxy)
      return chain[prop]
    },
  })
  return proxy
}

const ROUTINE = {
  id: 'r-1',
  patient_module_id: 'pm-1',
  practitioner_id: 'prac-1',
  patient_id: 'pat-1',
  days_of_week: [1, 3],
  time_of_day: '09:00',
  patient_time_override: null,
  practitioner_note: null,
  is_active: true,
  patient_paused: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

beforeEach(() => jest.clearAllMocks())

// ── Permissions ─────────────────────────────────────────────────────────────

describe('requestNotificationPermission', () => {
  it('retourne true si déjà accordé', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'granted' } as never)
    const result = await requestNotificationPermission()
    expect(result).toBe(true)
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled()
  })

  it('demande la permission si non accordée et retourne true si accordée', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'undetermined' } as never)
    jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValue({ status: 'granted' } as never)
    const result = await requestNotificationPermission()
    expect(result).toBe(true)
  })

  it('retourne false si permission refusée', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'undetermined' } as never)
    jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValue({ status: 'denied' } as never)
    const result = await requestNotificationPermission()
    expect(result).toBe(false)
  })
})

// ── registerPushToken ────────────────────────────────────────────────────────

describe('registerPushToken', () => {
  it('retourne null si permission refusée', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'denied' } as never)
    jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValue({ status: 'denied' } as never)
    const result = await registerPushToken('pat-1')
    expect(result).toBeNull()
  })

  it('retourne null si getExpoPushTokenAsync échoue (Expo Go)', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'granted' } as never)
    jest.mocked(Notifications.getExpoPushTokenAsync).mockRejectedValue(new Error('not in dev build'))
    const result = await registerPushToken('pat-1')
    expect(result).toBeNull()
  })

  it('enregistre le token en base et le retourne', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'granted' } as never)
    jest.mocked(Notifications.getExpoPushTokenAsync).mockResolvedValue({ data: 'ExponentPushToken[abc]' } as never)
    const upsert = jest.fn().mockResolvedValue({ error: null })
    jest.mocked(supabase.from).mockReturnValue({ upsert } as never)

    const result = await registerPushToken('pat-1')
    expect(result).toBe('ExponentPushToken[abc]')
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ patient_id: 'pat-1', expo_push_token: 'ExponentPushToken[abc]' }),
      expect.any(Object)
    )
  })

  it('retourne null si l\'upsert Supabase échoue', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'granted' } as never)
    jest.mocked(Notifications.getExpoPushTokenAsync).mockResolvedValue({ data: 'ExponentPushToken[abc]' } as never)
    const upsert = jest.fn().mockResolvedValue({ error: { message: 'RLS denied' } })
    jest.mocked(supabase.from).mockReturnValue({ upsert } as never)

    const result = await registerPushToken('pat-1')
    expect(result).toBeNull()
  })
})

// ── registerPushTokenIfGranted ──────────────────────────────────────────────

describe('registerPushTokenIfGranted', () => {
  it('retourne null sans rien enregistrer si la permission n\'est pas accordée', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'undetermined' } as never)
    const result = await registerPushTokenIfGranted('pat-1')
    expect(result).toBeNull()
    expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled()
  })

  it('enregistre le token si la permission est déjà accordée', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'granted' } as never)
    jest.mocked(Notifications.getExpoPushTokenAsync).mockResolvedValue({ data: 'ExponentPushToken[xyz]' } as never)
    const upsert = jest.fn().mockResolvedValue({ error: null })
    jest.mocked(supabase.from).mockReturnValue({ upsert } as never)

    const result = await registerPushTokenIfGranted('pat-1')
    expect(result).toBe('ExponentPushToken[xyz]')
  })
})

// ── Onboarding notifications ─────────────────────────────────────────────────

describe('shouldShowNotificationOnboarding', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
  })

  it('retourne true si permission indéterminée et écran jamais présenté', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'undetermined' } as never)
    expect(await shouldShowNotificationOnboarding()).toBe(true)
  })

  it('retourne false si l\'écran a déjà été présenté', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'undetermined' } as never)
    await markNotificationOnboardingSeen()
    expect(await shouldShowNotificationOnboarding()).toBe(false)
  })

  it('retourne false si la permission est déjà accordée', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'granted' } as never)
    expect(await shouldShowNotificationOnboarding()).toBe(false)
  })

  it('retourne false si la permission a été refusée', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'denied' } as never)
    expect(await shouldShowNotificationOnboarding()).toBe(false)
  })
})

describe('markNotificationOnboardingSeen', () => {
  it('persiste le drapeau dans AsyncStorage', async () => {
    await AsyncStorage.clear()
    await markNotificationOnboardingSeen()
    expect(await AsyncStorage.getItem('notif_onboarding_shown')).toBe('1')
  })
})

// ── getRoutinesForModule ────────────────────────────────────────────────────

describe('getRoutinesForModule', () => {
  it('retourne les routines du module', async () => {
    jest.mocked(supabase.from).mockReturnValue(makeChain({ data: [ROUTINE], error: null }) as never)
    const result = await getRoutinesForModule('pm-1')
    expect(result).toEqual([ROUTINE])
  })

  it('retourne [] si aucune routine', async () => {
    jest.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: null }) as never)
    const result = await getRoutinesForModule('pm-1')
    expect(result).toEqual([])
  })

  it('retourne [] en cas d\'erreur Supabase (non-bloquant)', async () => {
    jest.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: { message: 'network' } }) as never)
    const result = await getRoutinesForModule('pm-1')
    expect(result).toEqual([])
  })
})

// ── pauseRoutine ────────────────────────────────────────────────────────────

describe('pauseRoutine', () => {
  it('retourne true et insère l\'événement d\'engagement', async () => {
    const insert = jest.fn().mockResolvedValue({ error: null })
    jest.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'notification_routines') return makeChain({ data: null, error: null }) as never
      return { insert } as never
    })
    const result = await pauseRoutine('r-1', 'pat-1', 'phq9')
    expect(result).toBe(true)
  })

  it('retourne false si la mise à jour échoue', async () => {
    jest.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: { message: 'RLS' } }) as never)
    const result = await pauseRoutine('r-1', 'pat-1', 'phq9')
    expect(result).toBe(false)
  })
})

// ── resumeRoutine ───────────────────────────────────────────────────────────

describe('resumeRoutine', () => {
  it('retourne true si succès', async () => {
    jest.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: null }) as never)
    const result = await resumeRoutine('r-1', 'pat-1')
    expect(result).toBe(true)
  })

  it('retourne false si erreur', async () => {
    jest.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: { message: 'error' } }) as never)
    const result = await resumeRoutine('r-1', 'pat-1')
    expect(result).toBe(false)
  })
})

// ── updateTimeOverride ──────────────────────────────────────────────────────

describe('updateTimeOverride', () => {
  it('retourne true si succès', async () => {
    jest.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: null }) as never)
    const result = await updateTimeOverride('r-1', 'pat-1', '10:30')
    expect(result).toBe(true)
  })

  it('accepte null pour réinitialiser l\'heure', async () => {
    jest.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: null }) as never)
    const result = await updateTimeOverride('r-1', 'pat-1', null)
    expect(result).toBe(true)
  })
})

// ── Stubs legacy ────────────────────────────────────────────────────────────

describe('scheduleSleepDiaryReminder (stub)', () => {
  it('retourne une chaîne vide', async () => {
    expect(await scheduleSleepDiaryReminder(8, 0)).toBe('')
  })
})

describe('cancelSleepDiaryReminder (stub)', () => {
  it('ne lance pas d\'erreur', async () => {
    await expect(cancelSleepDiaryReminder()).resolves.toBeUndefined()
  })
})

describe('getSleepDiaryReminderTime (stub)', () => {
  it('retourne null', async () => {
    expect(await getSleepDiaryReminderTime()).toBeNull()
  })
})
