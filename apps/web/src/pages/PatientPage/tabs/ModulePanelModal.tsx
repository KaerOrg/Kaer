import { useTranslation } from 'react-i18next'
import { Eye, LineChart } from 'lucide-react'
import { Modal } from '@ui/Modal'
import { ModulePreviewPanel } from '../../../components/features/ModulePreviewPanel'
import type { ModuleType } from '../../../lib/database.types'
import { ModuleDataPanel } from './ModuleDataPanel'

/**
 * Panneau praticien ouvert au-dessus de la grille. `preview` restitue la vue
 * patient (avec ses onglets aperçu/sources internes, portés par ModulePreviewPanel),
 * `data` restitue les vraies données synchronisées. Un seul panneau ouvert à la fois :
 * l'exclusivité vit dans le state `activePanel` du parent.
 */
export type ModulePanel = { kind: 'preview' | 'data'; module: ModuleType }

interface Props {
  panel: ModulePanel
  patientId: string
  /** Couleur d'accent du module (catalogue) — transmise à l'aperçu. */
  color?: string
  onClose: () => void
}

/**
 * Modale d'affichage d'un panneau de module (aperçu ou données). Réutilise le
 * primitive `ui/Modal` — aucune modale ad hoc. Le titre est le libellé du module,
 * le sous-titre distingue aperçu vs données. Le contenu peut être large (graphiques,
 * fiches) : le corps de la modale scrolle (max-height géré par `ui/Modal`).
 */
export function ModulePanelModal({ panel, patientId, color, onClose }: Props) {
  const { t } = useTranslation()
  const isPreview = panel.kind === 'preview'

  return (
    <Modal
      title={t(`modules.${panel.module}.label`)}
      subtitle={isPreview ? t('patient.preview_button') : t('patient.data_button')}
      icon={isPreview ? <Eye size={20} /> : <LineChart size={20} />}
      onClose={onClose}
      maxWidth={920}
    >
      {isPreview ? (
        <ModulePreviewPanel moduleType={panel.module} color={color} />
      ) : (
        <ModuleDataPanel patientId={patientId} moduleType={panel.module} />
      )}
    </Modal>
  )
}
