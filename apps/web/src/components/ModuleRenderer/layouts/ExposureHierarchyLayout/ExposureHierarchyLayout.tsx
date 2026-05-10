import { useState } from 'react'
import { ChevronDown, ChevronRight, Layers, Trash2 } from 'lucide-react'

const MOCK_HIERARCHIES: ReadonlyArray<{
  id: string
  title: string
  items: ReadonlyArray<{ label: string; suds: number }>
}> = [
  {
    id: 'h1',
    title: 'Phobie sociale',
    items: [
      { label: 'Saluer un voisin', suds: 20 },
      { label: 'Demander une info à un inconnu', suds: 40 },
      { label: 'Prendre la parole en réunion', suds: 70 },
      { label: 'Prendre la parole devant 50 personnes', suds: 90 },
    ],
  },
  {
    id: 'h2',
    title: 'Agoraphobie',
    items: [
      { label: 'Sortir devant la porte 2 minutes', suds: 30 },
      { label: 'Marcher 200 m seul(e)', suds: 50 },
      { label: 'Prendre le métro 2 stations', suds: 75 },
    ],
  },
]

// Aperçu praticien du layout 'exposure_hierarchy' : liste de hiérarchies
// patient-créées + bouton "+ Nouvelle hiérarchie". Chaque hiérarchie ouvre
// une liste de situations classées par SUDs avec un graphique de
// désensibilisation par item. Le rendu réel vit côté mobile.
export function ExposureHierarchyLayout() {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="exposure-hierarchy">
      <ul className="exposure-hierarchy__list">
        {MOCK_HIERARCHIES.map(h => {
          const isOpen = openId === h.id
          return (
            <li key={h.id} className="exposure-hierarchy__item">
              <button
                type="button"
                className={`exposure-hierarchy__row${isOpen ? ' exposure-hierarchy__row--open' : ''}`}
                onClick={() => setOpenId(isOpen ? null : h.id)}
                aria-expanded={isOpen}
              >
                <div className="exposure-hierarchy__row-icon">
                  <Layers size={18} />
                </div>
                <div className="exposure-hierarchy__row-text">
                  <span className="exposure-hierarchy__row-title">{h.title}</span>
                  <span className="exposure-hierarchy__row-meta">
                    {h.items.length} situations · 0 séance
                  </span>
                </div>
                <Trash2 size={14} className="exposure-hierarchy__row-trash" />
                {isOpen ? (
                  <ChevronDown size={16} className="exposure-hierarchy__row-chevron" />
                ) : (
                  <ChevronRight size={16} className="exposure-hierarchy__row-chevron" />
                )}
              </button>
              {isOpen ? (
                <ul className="exposure-hierarchy__items">
                  {h.items.map((it, idx) => (
                    <li key={idx} className="exposure-hierarchy__sub-row">
                      <span className="exposure-hierarchy__suds">SUDs {it.suds}</span>
                      <span className="exposure-hierarchy__label">{it.label}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          )
        })}
      </ul>
      <button type="button" className="exposure-hierarchy__add" disabled>
        + Nouvelle hiérarchie
      </button>
    </div>
  )
}
