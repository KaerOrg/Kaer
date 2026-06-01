import { Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ContentField } from '../../../../services/moduleService'

interface DisclaimerBannerProps {
  /** The `disclaimer_banner` field to render. */
  field: ContentField
  /** Fallback module key when the field carries no `module_key` prop. */
  moduleId?: string
}

/**
 * Bandeau d'avertissement MDR affiché en tête d'un module.
 * Résout sa clé i18n depuis le field `disclaimer_banner` et la rend.
 */
export function DisclaimerBanner({ field, moduleId }: DisclaimerBannerProps) {
  const { t } = useTranslation()

  const moduleKey = field.props['module_key'] || moduleId || ''
  // text_code prop overrides the default modules.{key}.disclaimer key
  const textCode = (field.props['text_code'] as string) || (moduleKey ? `modules.${moduleKey}.disclaimer` : '')
  const text = textCode ? t(textCode) : ''
  // tone prop: 'info' (default) | 'danger'
  const tone = (field.props['tone'] as string) || 'info'

  return (
    <div className={`preview-disclaimer preview-disclaimer--${tone}`}>
      <Info size={14} className="preview-disclaimer__icon" />
      <span className="preview-disclaimer__text">{text}</span>
    </div>
  )
}
