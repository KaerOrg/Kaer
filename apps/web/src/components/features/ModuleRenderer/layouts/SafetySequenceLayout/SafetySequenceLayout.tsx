import { ShieldCheck, LifeBuoy, Heart } from 'lucide-react'
import { buildDisplayableSteps, formatProgress } from '@kaer/shared'
import type { ContentField } from '@services/moduleService'

// Aperçu praticien de la Séquence du plan de sécurité. La version patient (mobile)
// est une machine à états — accueil → étapes → « ce qui est disponible tout de
// suite » → clôture ; ici on la présente en storyboard statique, dans l'ordre, pour
// que le praticien puisse montrer le parcours en consultation.
//
// La numérotation et l'ordre des étapes viennent de la MÊME logique pure que le
// mobile (`@kaer/shared/services/safetySequence`) : une seule source, donc aucune
// dérive possible entre les deux plateformes.
//
// Conformité MDR 2017/745 : contenu d'exemple issu de la config, jamais le plan réel
// du patient, et rien de ce que le patient fait dans la Séquence n'est disponible ici
// — elle n'écrit rien, par construction.

interface Props {
  fields: ContentField[]
  t: (key: string) => string
  moduleId: string
}

export function SafetySequenceLayout({ fields, t, moduleId }: Props) {
  const lbl = (key: string): string => t(`modules.${moduleId}.${key}`)

  // Sections d'étapes portées par la config, dans l'ordre de `sort_order`.
  const stepTitles = new Map<string, ContentField>()
  for (const f of [...fields].sort((a, b) => a.sort_order - b.sort_order)) {
    if (f.section_id != null && f.field_type === 'step_title') stepTitles.set(f.section_id, f)
  }

  // L'aperçu montre le parcours complet : toutes les étapes configurées sont
  // réputées remplies. Chez le patient, une étape sans item est sautée et ne compte
  // pas dans la progression — c'est la même fonction qui le décide.
  const steps = buildDisplayableSteps([...stepTitles.keys()], new Set(stepTitles.keys()))

  if (steps.length === 0) return null

  return (
    <div className="sseq">
      <p className="sseq__caption">{lbl('sequence_preview_caption')}</p>

      <div className="sseq__rail">
        <article className="sseq__screen">
          <span className="sseq__badge"><ShieldCheck size={14} /></span>
          <h3 className="sseq__title">{lbl('sequence_home_title')}</h3>
        </article>

        {steps.map(step => {
          const titleField = stepTitles.get(step.sectionId)
          // Sous-titre porté par la config (`subtitle_code`), sur les seules étapes
          // que rien d'autre ne distingue. Même source que le mobile : le praticien
          // voit exactement l'écran que verra son patient (P-7).
          const subtitleCode = titleField?.props['subtitle_code']
          return (
            <article key={step.sectionId} className="sseq__screen">
              <span className="sseq__step">
                {lbl('step_label').replace('{{number}}', String(step.position))}
              </span>
              <h3 className="sseq__title">{titleField?.text_code ? t(titleField.text_code) : ''}</h3>
              {subtitleCode ? <p className="sseq__subtitle">{t(subtitleCode)}</p> : null}
              <span className="sseq__progress">{formatProgress(step.position - 1, steps.length)}</span>
            </article>
          )
        })}

        <article className="sseq__screen">
          <span className="sseq__badge"><LifeBuoy size={14} /></span>
          <h3 className="sseq__title">{lbl('sequence_resources_title')}</h3>
        </article>

        <article className="sseq__screen">
          <span className="sseq__badge"><Heart size={14} /></span>
          <h3 className="sseq__title">{lbl('sequence_closing_title')}</h3>
        </article>
      </div>

      <p className="sseq__note">{lbl('sequence_preview_note')}</p>
    </div>
  )
}
