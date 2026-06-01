import { DisclaimerBanner } from './DisclaimerBanner'
import { LayoutDispatcher } from './LayoutDispatcher'
import type { FieldRendererProps } from './types'

/**
 * Point d'entrée du moteur de rendu de module (web praticien).
 *
 * Seule responsabilité : extraire un éventuel field `disclaimer_banner`,
 * puis déléguer le rendu du contenu à `LayoutDispatcher`.
 * Toute logique de layout vit dans `layouts/*` ; ne jamais l'ajouter ici.
 */
export function FieldRenderer(props: FieldRendererProps) {
  const disclaimerField = props.fields.find(f => f.field_type === 'disclaimer_banner')
  const contentFields = disclaimerField
    ? props.fields.filter(f => f.field_type !== 'disclaimer_banner')
    : props.fields

  const core = (
    <LayoutDispatcher
      preview_kind={props.preview_kind}
      fields={contentFields}
      expandedCard={props.expandedCard}
      onToggleCard={props.onToggleCard}
      moduleId={props.moduleId}
    />
  )

  if (!disclaimerField) return core

  return (
    <div className="preview-disclaimer-wrapper">
      <DisclaimerBanner field={disclaimerField} moduleId={props.moduleId} />
      {core}
    </div>
  )
}
