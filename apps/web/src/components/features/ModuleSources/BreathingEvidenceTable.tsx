import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { readBreathingTechniques } from '@kaer/shared'
import { moduleQueries } from '../../../hooks/queries'
import './BreathingEvidenceTable.css'

/**
 * Niveau de preuve par technique de respiration, en tête de l'onglet Sources (W4).
 *
 * Le praticien lit d'abord ce qui l'intéresse pour choisir quoi activer en séance :
 * quelle technique, quel grade, sur quelles références. Les revues transversales
 * restent en dessous, dans le panneau générique.
 *
 * Les grades viennent de la base (`field_props.evidence_grade`), les références de
 * l'i18n (`<clé>_evidence`) : ajouter une technique ou corriger un grade ne demande
 * pas de toucher au code.
 *
 * La teinte du badge distingue les grades établis (A, B) des accords d'experts (C).
 * Elle qualifie un **niveau de preuve scientifique**, jamais une donnée patient : la
 * règle MDR sur les couleurs de valence ne s'applique pas ici.
 */
export function BreathingEvidenceTable() {
  const { t } = useTranslation()
  const { data: moduleFields } = useQuery(moduleQueries.fields('breathing_techniques'))
  const techniques = useMemo(
    () => readBreathingTechniques(moduleFields?.fields ?? []),
    [moduleFields],
  )

  const graded = techniques.filter(technique => technique.evidenceGrade != null)
  if (graded.length === 0) return null

  return (
    <section className="breathing-evidence" data-testid="breathing-evidence-table">
      <h4 className="breathing-evidence__title">{t('patient.breathing_evidence_title')}</h4>
      <ul className="breathing-evidence__list">
        {graded.map(technique => (
          <li key={technique.key} className="breathing-evidence__row">
            <span
              className="breathing-evidence__dot"
              style={{ background: technique.color }}
              aria-hidden="true"
            />
            <span className="breathing-evidence__name">
              {t(`modules.breathing_techniques.${technique.key}_name`)}
            </span>
            <span
              className={`breathing-evidence__grade breathing-evidence__grade--${
                technique.evidenceGrade === 'C' ? 'consensus' : 'established'
              }`}
            >
              {technique.evidenceGrade}
              {technique.evidenceScopeCode != null && (
                <span className="breathing-evidence__scope"> {t(technique.evidenceScopeCode)}</span>
              )}
            </span>
            <span className="breathing-evidence__refs">
              {t(`modules.breathing_techniques.${technique.key}_evidence`)}
            </span>
          </li>
        ))}
      </ul>
      <p className="breathing-evidence__note">{t('patient.breathing_evidence_note')}</p>
    </section>
  )
}
