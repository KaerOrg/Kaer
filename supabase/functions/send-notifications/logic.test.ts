// #269 — L'invariant du rappel neutre, testé.
//
// Exécution : `deno test supabase/functions/` (job CI « Edge — Tests »).

import { assertEquals, assertFalse } from 'jsr:@std/assert@1'
import {
  buildPushMessage,
  effectiveTime,
  selectDueRoutines,
  NOTIFICATION_BODY,
  NOTIFICATION_TITLE,
  type DueRoutine,
} from './logic.ts'

function routine(over: Partial<DueRoutine> = {}): DueRoutine {
  return {
    id: 'r1',
    patient_id: 'p1',
    days_of_week: [1, 3, 5],
    time_of_day: '09:00',
    patient_time_override: null,
    ...over,
  }
}

Deno.test('deux patients, deux consignes differentes : MEME corps de notification', () => {
  // La consigne du praticien n'entre meme pas dans le type lu par l'envoi. On
  // simule ici deux routines de praticiens differents pour deux patients.
  const a = buildPushMessage(routine({ id: 'r1', patient_id: 'patient-a' }))
  const b = buildPushMessage(routine({ id: 'r2', patient_id: 'patient-b', time_of_day: '20:00' }))

  assertEquals(a.body, b.body)
  assertEquals(a.title, b.title)
  assertEquals(a.body, NOTIFICATION_BODY)
  assertEquals(a.title, NOTIFICATION_TITLE)
})

Deno.test('le corps ne contient aucun marqueur d interpolation', () => {
  // Un `{{ }}`, un `${` ou un `%s` signerait un texte destine a etre personnalise.
  assertFalse(/\{\{|\$\{|%s/.test(NOTIFICATION_BODY))
  assertFalse(/\{\{|\$\{|%s/.test(NOTIFICATION_TITLE))
})

Deno.test('le corps ne cite ni score, ni seuil, ni etat du patient', () => {
  const forbidden = /score|seuil|niveau|resultat|résultat|alerte|elev|élev|faible|grave/i
  assertFalse(forbidden.test(NOTIFICATION_BODY))
})

Deno.test('le decalage du patient prime sur l heure posee', () => {
  assertEquals(effectiveTime(routine({ time_of_day: '09:00', patient_time_override: '08:30' })), '08:30')
  assertEquals(effectiveTime(routine({ time_of_day: '09:00', patient_time_override: null })), '09:00')
})

Deno.test('selection des routines dues : jour ET heure effective', () => {
  const routines = [
    routine({ id: 'bon-jour-bonne-heure', days_of_week: [1], time_of_day: '09:00' }),
    routine({ id: 'mauvais-jour', days_of_week: [2], time_of_day: '09:00' }),
    routine({ id: 'mauvaise-heure', days_of_week: [1], time_of_day: '10:00' }),
    routine({ id: 'decale-par-le-patient', days_of_week: [1], time_of_day: '10:00', patient_time_override: '09:00' }),
  ]
  const due = selectDueRoutines(routines, 1, '09:00').map(r => r.id)
  assertEquals(due, ['bon-jour-bonne-heure', 'decale-par-le-patient'])
})

Deno.test('aucune routine due ne rend une liste vide, jamais une erreur', () => {
  assertEquals(selectDueRoutines([], 1, '09:00'), [])
  assertEquals(selectDueRoutines([routine({ days_of_week: [7] })], 1, '09:00'), [])
})
