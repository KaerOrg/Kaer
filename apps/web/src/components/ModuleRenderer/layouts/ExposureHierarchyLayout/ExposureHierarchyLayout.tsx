import { ChevronRight, Layers, Trash2 } from 'lucide-react'

const MOCK_HIERARCHIES: ReadonlyArray<{ id: string; title: string; itemCount: number }> = [
  { id: 'h1', title: 'Phobie sociale', itemCount: 7 },
  { id: 'h2', title: 'Agoraphobie', itemCount: 4 },
]

// Aperçu praticien du layout 'exposure_hierarchy' : liste de hiérarchies
// patient-créées + bouton "+ Nouvelle hiérarchie". Chaque hiérarchie ouvre
// une liste de situations classées par SUDs avec un graphique de
// désensibilisation par item. Le rendu réel vit côté mobile.
export function ExposureHierarchyLayout() {
  return (
    <div className="exposure-hierarchy">
      <ul className="exposure-hierarchy__list">
        {MOCK_HIERARCHIES.map(h => (
          <li key={h.id} className="exposure-hierarchy__row">
            <div className="exposure-hierarchy__row-icon">
              <Layers size={18} />
            </div>
            <div className="exposure-hierarchy__row-text">
              <span className="exposure-hierarchy__row-title">{h.title}</span>
              <span className="exposure-hierarchy__row-meta">
                {h.itemCount} situations · 0 séance
              </span>
            </div>
            <Trash2 size={14} className="exposure-hierarchy__row-trash" />
            <ChevronRight size={16} className="exposure-hierarchy__row-chevron" />
          </li>
        ))}
      </ul>
      <button type="button" className="exposure-hierarchy__add" disabled>
        + Nouvelle hiérarchie
      </button>
    </div>
  )
}
