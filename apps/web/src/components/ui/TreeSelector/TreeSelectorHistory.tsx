// Mode « historique » (web) : intro, bouton démarrer, libellé de section, état
// vide et note de pied. L'aperçu praticien ne liste pas d'entrées (read-only).

import { Info, Plus } from 'lucide-react'
import { Button } from '@ui/Button'
import type { TreeSelectorTexts } from './types'

interface TreeSelectorHistoryProps {
  texts: TreeSelectorTexts
  /** Note de bas de page (sources) — déjà traduite, optionnelle. */
  footerText?: string | null
  onStartNew: () => void
}

export function TreeSelectorHistory({ texts, footerText, onStartNew }: TreeSelectorHistoryProps) {
  return (
    <div className="ts">
      {texts.intro && <p className="ts-intro">{texts.intro}</p>}
      {texts.newBtn && (
        <Button variant="primary" size="sm" type="button" className="ts-new-btn" icon={<Plus size={16} />} onClick={onStartNew}>
          {texts.newBtn}
        </Button>
      )}
      {texts.historyLabel && (
        <section className="ts-section">
          <span className="ts-section__title">{texts.historyLabel}</span>
          {(texts.emptyTitle || texts.emptyText) && (
            <div className="ts-history-empty">
              {texts.emptyTitle && <span className="ts-history-empty__title">{texts.emptyTitle}</span>}
              {texts.emptyText && <span className="ts-history-empty__text">{texts.emptyText}</span>}
            </div>
          )}
        </section>
      )}
      {footerText && (
        <p className="ts-footer"><Info size={13} /><span>{footerText}</span></p>
      )}
    </div>
  )
}
