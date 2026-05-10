import { supabase } from '../lib/supabase'

export interface CSSRSAssessment {
  id: string
  ideation_answers: Array<{ value: number; description: string }>
  intensite_ideation: {
    frequence: number | null
    duree: number | null
    maitrise: number | null
    dissuasifs: number | null
    causes: number | null
  } | null
  behavior_answers: Array<{ value: number; description: string }>
  nssi: number | null
  nb_tentatives_averees: number | null
  nb_tentatives_interrompues: number | null
  nb_tentatives_avortees: number | null
  comportement_observe: number | null
  suicide_reussi: number | null
  date_tentative_plus_letale: string | null
  letalite_observee: number | null
  letalite_potentielle: number | null
  ideation_level: number
  behavior_count: number
  assessed_at: string
}

export interface CSSRSAssessmentDraft {
  patientId: string
  practitionerId: string
  ideation_answers: CSSRSAssessment['ideation_answers']
  intensite_ideation: CSSRSAssessment['intensite_ideation']
  behavior_answers: CSSRSAssessment['behavior_answers']
  nssi: number | null
  nb_tentatives_averees: number | null
  nb_tentatives_interrompues: number | null
  nb_tentatives_avortees: number | null
  comportement_observe: number | null
  suicide_reussi: number | null
  date_tentative_plus_letale: string | null
  letalite_observee: number | null
  letalite_potentielle: number | null
  ideation_level: number
  behavior_count: number
}

export async function fetchCSSRSAssessments(
  patientId: string,
  practitionerId: string
): Promise<CSSRSAssessment[]> {
  const { data } = await supabase
    .from('cssrs_screen_assessments')
    .select('*')
    .eq('patient_id', patientId)
    .eq('practitioner_id', practitionerId)
    .order('assessed_at', { ascending: false })
  return (data ?? []) as CSSRSAssessment[]
}

export async function saveCSSRSAssessment(
  draft: CSSRSAssessmentDraft
): Promise<{ ok: boolean; message: string | null }> {
  const { error } = await supabase.from('cssrs_screen_assessments').insert({
    patient_id: draft.patientId,
    practitioner_id: draft.practitionerId,
    ideation_answers: draft.ideation_answers,
    intensite_ideation: draft.intensite_ideation,
    behavior_answers: draft.behavior_answers,
    nssi: draft.nssi,
    nb_tentatives_averees: draft.nb_tentatives_averees,
    nb_tentatives_interrompues: draft.nb_tentatives_interrompues,
    nb_tentatives_avortees: draft.nb_tentatives_avortees,
    comportement_observe: draft.comportement_observe,
    suicide_reussi: draft.suicide_reussi,
    date_tentative_plus_letale: draft.date_tentative_plus_letale,
    letalite_observee: draft.letalite_observee,
    letalite_potentielle: draft.letalite_potentielle,
    ideation_level: draft.ideation_level,
    behavior_count: draft.behavior_count,
  })
  return { ok: !error, message: error?.message ?? null }
}

export async function deleteCSSRSAssessment(id: string): Promise<void> {
  await supabase.from('cssrs_screen_assessments').delete().eq('id', id)
}
