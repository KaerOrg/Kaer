import * as FileSystem from 'expo-file-system/legacy'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../lib/supabase'
import {
  getCrisisAnchors,
  saveCrisisAnchor,
  deleteCrisisAnchor,
  getModuleSetting,
  setModuleSetting,
  getAllPlanItemsForModule,
  type CrisisAnchor,
  type PlanItem,
} from '../lib/database'
import type { CrisisPlanCopingCard } from '@psytool/shared'

export type { CrisisAnchor }

// ─── Config praticien (Supabase) ─────────────────────────────────────────────

export interface CrisisPlanPractitionerConfig {
  practitionerMessage: string
  copingCards: CrisisPlanCopingCard[]
  commitmentPhrase: string
}

export async function fetchPractitionerConfig(
  patientId: string
): Promise<CrisisPlanPractitionerConfig> {
  const { data } = await supabase
    .from('patient_modules')
    .select('config')
    .eq('patient_id', patientId)
    .eq('module_type', 'crisis_plan')
    .is('revoked_at', null)
    .maybeSingle()

  const cfg = (data?.config as Record<string, unknown> | null)?.crisisPlan as
    | Partial<CrisisPlanPractitionerConfig>
    | undefined

  return {
    practitionerMessage: cfg?.practitionerMessage ?? '',
    copingCards: cfg?.copingCards ?? [],
    commitmentPhrase: cfg?.commitmentPhrase ?? '',
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
  await saveCrisisAnchor(anchor)
  return anchor
}

export async function removeAnchorPhoto(anchor: CrisisAnchor): Promise<void> {
  const info = await FileSystem.getInfoAsync(anchor.uri)
  if (info.exists) {
    await FileSystem.deleteAsync(anchor.uri, { idempotent: true })
  }
  await deleteCrisisAnchor(anchor.id)
}

// ─── Phrase d'ancrage (SQLite module_settings) ───────────────────────────────

const ANCHOR_PHRASE_KEY = 'anchor_phrase'

export async function getAnchorPhrase(): Promise<string> {
  return (await getModuleSetting('crisis_plan', ANCHOR_PHRASE_KEY)) ?? ''
}

export async function saveAnchorPhrase(phrase: string): Promise<void> {
  await setModuleSetting('crisis_plan', ANCHOR_PHRASE_KEY, phrase)
}

// ─── Engagement thérapeutique (SQLite module_settings) ───────────────────────

const COMMITMENT_KEY = 'commitment'

export interface CrisisCommitment {
  name: string
  date: string
}

export async function getCommitment(): Promise<CrisisCommitment | null> {
  const raw = await getModuleSetting('crisis_plan', COMMITMENT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as CrisisCommitment
  } catch {
    return null
  }
}

export async function saveCommitment(name: string): Promise<void> {
  const commitment: CrisisCommitment = {
    name: name.trim(),
    date: new Date().toISOString(),
  }
  await setModuleSetting('crisis_plan', COMMITMENT_KEY, JSON.stringify(commitment))
}

// ─── Items des étapes 4 et 5 (mode urgence) ──────────────────────────────────

export async function getUrgencyItems(): Promise<{ step4: PlanItem[]; step5: PlanItem[] }> {
  const all = await getAllPlanItemsForModule('crisis_plan')
  return {
    step4: all.filter(i => i.section_id === 'step_4'),
    step5: all.filter(i => i.section_id === 'step_5'),
  }
}
