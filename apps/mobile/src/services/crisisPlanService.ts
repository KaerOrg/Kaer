import * as FileSystem from 'expo-file-system/legacy'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../lib/supabase'
import {
  getCrisisAnchors,
  saveCrisisAnchor,
  deleteCrisisAnchor,
  getModuleSetting,
  setModuleSetting,
  type CrisisAnchor,
} from '../lib/database'
import { syncUpsert, syncDelete } from './syncHelpers'

export type { CrisisAnchor }

// ─── Config praticien (Supabase) ─────────────────────────────────────────────

export interface CrisisPlanPractitionerConfig {
  practitionerMessage: string
}

export async function fetchPractitionerConfig(
  patientId: string
): Promise<CrisisPlanPractitionerConfig> {
  const { data } = await supabase
    .from('crisis_plan_configs')
    .select('practitioner_message')
    .eq('patient_id', patientId)
    .maybeSingle()

  return {
    practitionerMessage: data?.practitioner_message ?? '',
  }
}

// ─── Photos d'ancrage (local FileSystem + SQLite) ────────────────────────────

const ANCHORS_DIR = `${FileSystem.documentDirectory}crisis_anchors/`
const MAX_ANCHORS = 3

async function ensureAnchorsDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(ANCHORS_DIR)
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(ANCHORS_DIR, { intermediates: true })
  }
}

export async function getAnchors(): Promise<CrisisAnchor[]> {
  return getCrisisAnchors()
}

export async function pickAndSaveAnchorPhoto(
  existingCount: number
): Promise<CrisisAnchor | null> {
  if (existingCount >= MAX_ANCHORS) return null

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!permission.granted) return null

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  })

  if (result.canceled || result.assets.length === 0) return null

  await ensureAnchorsDir()
  const id = `anchor_${Date.now()}`
  const destUri = `${ANCHORS_DIR}${id}.jpg`
  await FileSystem.copyAsync({ from: result.assets[0].uri, to: destUri })

  const anchor: CrisisAnchor = {
    id,
    uri: destUri,
    sort_order: existingCount,
    created_at: new Date().toISOString(),
  }
  await syncUpsert(() => saveCrisisAnchor(anchor), {
    local_id: anchor.id,
    module_id: 'crisis_plan',
    entry_kind: 'crisis_anchor',
    payload: { uri: anchor.uri, sort_order: anchor.sort_order },
  })
  return anchor
}

export async function removeAnchorPhoto(anchor: CrisisAnchor): Promise<void> {
  const info = await FileSystem.getInfoAsync(anchor.uri)
  if (info.exists) {
    await FileSystem.deleteAsync(anchor.uri, { idempotent: true })
  }
  await syncDelete(() => deleteCrisisAnchor(anchor.id), anchor.id, 'crisis_plan', 'crisis_anchor')
}

// ─── Phrase d'ancrage (SQLite module_settings) ───────────────────────────────

const ANCHOR_PHRASE_KEY = 'anchor_phrase'

export async function getAnchorPhrase(): Promise<string> {
  return (await getModuleSetting('crisis_plan', ANCHOR_PHRASE_KEY)) ?? ''
}

export async function saveAnchorPhrase(phrase: string): Promise<void> {
  await syncUpsert(() => setModuleSetting('crisis_plan', ANCHOR_PHRASE_KEY, phrase), {
    local_id: `crisis_plan:${ANCHOR_PHRASE_KEY}`,
    module_id: 'crisis_plan',
    entry_kind: 'module_setting',
    payload: { key: ANCHOR_PHRASE_KEY, value: phrase },
  })
}
