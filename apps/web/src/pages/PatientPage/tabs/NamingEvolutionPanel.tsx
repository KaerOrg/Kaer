// Corps de la section « Nommer ce que je ressens » dans l'onglet Évolution (#266).
//
// Ce module ne produit pas de série numérique : ni courbe, ni score, ni tendance.
// Ce qu'on met sous les yeux du praticien, c'est le croisement contexte × famille
// (déjà écrit pour l'onglet Données, réutilisé tel quel) et deux bandes de comptages
// bruts sur la fenêtre choisie.
//
// Conformité MDR 2017/745 : effectifs et dénominateurs lus en base, aucune moyenne,
// aucune comparaison d'une fenêtre à l'autre, aucun objectif de couverture.

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { EmotionNamingCrossTable } from '../../../components/features/EmotionNamingCrossTable'
import {
  depthCounts, repertoire,
  type EmotionNamingEntry, type NamingTaxonomy,
} from '../../../lib/emotionNamingData'
import './NamingEvolutionPanel.css'

interface Props {
  /** Saisies déjà restreintes à la fenêtre de la page. */
  readonly entries: EmotionNamingEntry[]
  readonly taxonomy: NamingTaxonomy
  readonly contextCodes: string[]
  readonly rangeDays: number
}

export function NamingEvolutionPanel({ entries, taxonomy, contextCodes, rangeDays }: Props) {
  const { t } = useTranslation()
  const depths = useMemo(() => depthCounts(entries), [entries])
  const rep = useMemo(() => repertoire(entries, taxonomy), [entries, taxonomy])

  return (
    <div className="nep">
      <EmotionNamingCrossTable
        entries={entries}
        contextCodes={contextCodes}
        familyCodes={taxonomy.families}
        rangeDays={rangeDays}
      />

      <p className="nep__band" data-testid="naming-depth-band">
        <span className="nep__band-label">{t('evolution.naming_depth_label')}</span>
        <span className="nep__band-item">{t('evolution.naming_depth_none')} {depths.none}</span>
        <span className="nep__band-item">{t('evolution.naming_depth_family')} {depths.family}</span>
        <span className="nep__band-item">{t('evolution.naming_depth_nuance')} {depths.nuance}</span>
        <span className="nep__band-item">{t('evolution.naming_depth_word')} {depths.word}</span>
      </p>

      <p className="nep__band" data-testid="naming-repertoire-band">
        <span className="nep__band-label">{t('evolution.naming_repertoire_label')}</span>
        <span className="nep__band-item">
          {t('evolution.naming_repertoire_families', { used: rep.familiesUsed, total: rep.familiesTotal })}
        </span>
        <span className="nep__band-item">
          {t('evolution.naming_repertoire_nuances', { used: rep.nuancesUsed, total: rep.nuancesTotal })}
        </span>
        <span className="nep__band-item">
          {t('evolution.naming_repertoire_words', { used: rep.wordsUsed, total: rep.wordsTotal })}
        </span>
      </p>

      <p className="evolution-card__mention">{t('evolution.naming_note')}</p>
    </div>
  )
}
