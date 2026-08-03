// ─── En-tête « état du plan » (PW-2) et bouton de revue (PW-5) ──────────────
//
// « Élaboré le 12 mars · revu avec vous le 4 juin · 5 étapes remplies sur 6 », plus un
// appui pour dater la revue du jour.
//
// ── Trois notions que cet en-tête sépare, et ne confondra jamais ────────────
//
//   • « revu avec vous » : un GESTE PRATICIEN, daté par le bouton ci-dessous ;
//   • « modifié » : l'`updated_at` d'un item, affiché à côté de l'étape ouverte ;
//   • « lu par le patient » : **n'est pas mesuré et ne le sera pas**. La phrase sous
//     l'en-tête le dit à voix haute, pour qu'on ne la cherche pas.
//
// ── Conformité MDR 2017/745 ────────────────────────────────────────────────
//
// **Aucune date n'est comparée à aujourd'hui.** Pas d'alerte d'ancienneté, pas de
// relance, pas de badge « à revoir », pas de couleur qui change quand la revue date. La
// date est affichée, jamais surveillée : un plan de six mois s'affiche exactement comme
// un plan d'hier.
//
// **Aucun pourcentage de complétion** : « 5 étapes remplies sur 6 » est un décompte.
// D'où deux nombres bruts en props, et jamais leur rapport.

import { Button } from '@ui/Button'

interface Props {
  /** Jour de la première élaboration conjointe, déjà formaté. `null` si jamais daté. */
  createdWith: string | null
  /** Jour de la dernière revue en consultation, déjà formaté. `null` si jamais revu. */
  lastReviewed: string | null
  filledSteps: number
  totalSteps: number
  /** Libellés déjà traduits : ce composant ne connaît aucune clé i18n. */
  labels: {
    title: string
    createdWith: (date: string) => string
    reviewedWith: (date: string) => string
    neverReviewed: string
    filled: (filled: number, total: number) => string
    reviewToday: string
    readNotMeasured: string
  }
  reviewing: boolean
  onReviewToday: () => void
}

export function PlanStateHeader({
  createdWith, lastReviewed, filledSteps, totalSteps, labels, reviewing, onReviewToday,
}: Props) {
  return (
    <header className="plan-editor__state">
      <div className="plan-editor__state-text">
        <p className="plan-editor__state-title">{labels.title}</p>
        <p className="plan-editor__state-line">
          {createdWith != null ? <span>{labels.createdWith(createdWith)}</span> : null}
          <span>
            {lastReviewed != null ? labels.reviewedWith(lastReviewed) : labels.neverReviewed}
          </span>
          <span>{labels.filled(filledSteps, totalSteps)}</span>
        </p>
        <p className="plan-editor__state-note">{labels.readNotMeasured}</p>
      </div>
      <Button variant="secondary" size="sm" loading={reviewing} onClick={onReviewToday}>
        {labels.reviewToday}
      </Button>
    </header>
  )
}
