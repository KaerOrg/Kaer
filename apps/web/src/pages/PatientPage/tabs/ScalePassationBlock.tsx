import { useTranslation } from 'react-i18next'
import { Play, Stethoscope, Eye } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Banner } from '../../../components/ui/Banner'
import './ScalePassationBlock.css'

type Props = {
  /** « Démarrer la passation » (remplie en séance) : câblage minimal en K-6. */
  onStart: () => void
  /** « Aperçu de l'échelle » : ouvre la vue patient. Absent → bouton masqué. */
  onPreview?: () => void
  /** Dernière passation (date déjà formatée) ou `null` si aucune. */
  lastPassationLabel: string | null
}

/**
 * Onglet **Passation** d'une échelle **hétéro** (K-6). Remplie en séance avec le patient :
 * rien n'est envoyé sur son application, **aucune programmation**. Wording neutre (MDR).
 */
export function ScalePassationBlock({ onStart, onPreview, lastPassationLabel }: Props) {
  const { t } = useTranslation()
  return (
    <div className="scale-passation">
      <Banner variant="info" icon={<Stethoscope size={16} />}>
        <p className="scale-passation__title">{t('scales.passation.title')}</p>
        <p className="scale-passation__desc">{t('scales.passation.desc')}</p>
        <Button icon={<Play size={15} />} fullWidth onClick={onStart}>
          {t('scales.passation.start')}
        </Button>
      </Banner>

      <div className="scale-passation__footer">
        <span className="scale-passation__last">
          {t('scales.passation.last', { value: lastPassationLabel ?? t('scales.passation.last_none') })}
        </span>
        {onPreview ? (
          <Button variant="outline" size="sm" icon={<Eye size={15} />} onClick={onPreview}>
            {t('scales.passation.preview')}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
