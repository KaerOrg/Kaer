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
// **Aucun pourcentage de complétion** : « 5 étapes remplies sur 6 » est un décompte. Ce
// composant reçoit la phrase déjà composée et ne calcule aucun rapport.
//
// Toutes les mentions arrivent **déjà traduites et déjà composées** : ce composant
// affiche, il n'assemble rien et ne connaît aucune clé i18n.

import { Button } from '@ui/Button'

interface Props {
  /** « Élaboré le 12 mars ». `null` quand le plan n'a jamais été daté. */
  createdWith: string | null
  /** « revu avec vous le 4 juin », ou la mention « pas encore revu ensemble ». */
  lastReviewed: string
  /** « 5 étapes remplies sur 6 ». Un décompte, jamais un taux. */
  filled: string
  labels: {
    title: string
    reviewToday: string
    readNotMeasured: string
  }
  reviewing: boolean
  onReviewToday: () => void
}

export function PlanStateHeader({
  createdWith, lastReviewed, filled, labels, reviewing, onReviewToday,
}: Props) {
  return (
    <header className="plan-editor__state">
      <div className="plan-editor__state-text">
        <p className="plan-editor__state-title">{labels.title}</p>
        <p className="plan-editor__state-line">
          {createdWith != null ? <span>{createdWith}</span> : null}
          <span>{lastReviewed}</span>
          <span>{filled}</span>
        </p>
        <p className="plan-editor__state-note">{labels.readNotMeasured}</p>
      </div>
      <Button variant="secondary" size="sm" loading={reviewing} onClick={onReviewToday}>
        {labels.reviewToday}
      </Button>
    </header>
  )
}
