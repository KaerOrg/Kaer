import {
  getScaleDraft,
  saveScaleDraft as dbSave,
  deleteScaleDraft as dbDelete,
  deleteStaleScaleDrafts,
} from '../lib/database'

/**
 * Durée de vie d'un brouillon, en jours.
 *
 * Au delà, la fenêtre « 2 dernières semaines » de l'instrument a glissé : les réponses
 * déjà données ne portent plus sur la même période que celles qui restent à donner, et
 * les mélanger produirait une passation qui ne mesure rien. Le brouillon est alors
 * effacé et le module se rouvre à l'état neuf.
 */
export const DRAFT_MAX_AGE_DAYS = 7

export interface ScaleDraft {
  scaleId: string
  /** Une case par item posé. `null` = item sans réponse. */
  answers: (number | null)[]
  /** Rang de l'item où la saisie s'est arrêtée, à partir de 0. */
  position: number
  /** Début de la saisie, horodatage ISO. Sert à l'affichage et au vieillissement. */
  startedAt: string
}

function parseAnswers(raw: string): (number | null)[] {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(v => (typeof v === 'number' ? v : null))
  } catch {
    // Brouillon illisible (écriture interrompue, migration) : on repart à zéro plutôt
    // que de propager des réponses douteuses dans un instrument de mesure.
    return []
  }
}

/**
 * Brouillon en cours pour une échelle, ou `null` s'il n'y en a pas ou s'il est périmé.
 *
 * Un brouillon trop vieux est effacé au passage : la purge se fait à la lecture plutôt
 * que par une tâche de fond, parce que c'est le seul moment où elle a une conséquence
 * visible, et qu'un téléphone n'est pas un serveur.
 */
export async function loadDraft(scaleId: string): Promise<ScaleDraft | null> {
  const row = await getScaleDraft(scaleId)
  if (!row) return null

  const startedAt = row.created_at
  const ageMs = Date.now() - new Date(startedAt).getTime()
  if (Number.isNaN(ageMs) || ageMs > DRAFT_MAX_AGE_DAYS * 86_400_000) {
    await dbDelete(scaleId)
    return null
  }

  const answers = parseAnswers(row.answers)
  if (answers.length === 0) {
    await dbDelete(scaleId)
    return null
  }

  return { scaleId, answers, position: row.position, startedAt }
}

/**
 * Enregistre la progression d'une saisie en cours, LOCALEMENT et uniquement là.
 *
 * ⚠️ **Exception assumée à `.claude/rules/sync-service.md`, qui impose `syncUpsert`
 * pour toute écriture patient en SQLite. Elle ne s'applique pas ici, et c'est
 * volontaire : un brouillon n'est pas une passation.**
 *
 * Une saisie inachevée ne veut rien dire cliniquement. Un PHQ-9 rempli à six items sur
 * dix n'a pas de score, ne se compare à rien, et n'est pas ce que le patient a choisi
 * de transmettre. La synchroniser reviendrait à montrer au praticien un état que le
 * patient n'a pas validé, et à faire exister côté serveur une donnée de santé qu'il
 * n'a pas décidé d'envoyer. Le geste de transmettre reste un acte explicite (#416).
 *
 * Conséquences tenues :
 * - aucune valeur ajoutée à `EntryKind`,
 * - aucune écriture dans la `sync_outbox`,
 * - aucun appel réseau, vérifié par test.
 */
export async function saveDraft(
  scaleId: string,
  answers: (number | null)[],
  position: number
): Promise<void> {
  await dbSave(scaleId, JSON.stringify(answers), position)
}

/**
 * Efface le brouillon d'une échelle. Appelé à l'envoi de la passation, sur
 * « Recommencer », et lorsque le module n'est plus accessible au patient (révocation
 * par le praticien, mise en veille de l'échelle) : dans ce dernier cas la purge est
 * silencieuse, le patient n'a pas à connaître nos questions de périmètre.
 */
export function discardDraft(scaleId: string): Promise<void> {
  return dbDelete(scaleId)
}

/** Efface tous les brouillons trop vieux. Retourne le nombre effacé. */
export function purgeStaleDrafts(): Promise<number> {
  const cutoff = new Date(Date.now() - DRAFT_MAX_AGE_DAYS * 86_400_000).toISOString()
  return deleteStaleScaleDrafts(cutoff)
}
