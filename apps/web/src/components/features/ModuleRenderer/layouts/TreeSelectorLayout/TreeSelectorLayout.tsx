import { ChevronRight, Heart, Palette, Plus, Smile, Trash2 } from 'lucide-react'
import type { ContentField } from '../../../../../services/moduleService'

interface Props {
  fields: ContentField[]
  t: (key: string) => string
}

// Aperçu fidèle au mobile : reproduit le module emotion_wheel (preview_kind
// 'tree_selector') — intro, bouton "Identifier", grille des nœuds racines L1
// (8 émotions Plutchik colorées), section historique avec carte mock.
// Source mobile : TreeSelectorLayout (FieldRenderer.tsx).
export function TreeSelectorLayout({ fields, t }: Props) {
  const ft = (type: string): string => {
    const f = fields.find(field => field.field_type === type)
    return f?.text_code ? t(f.text_code) : ''
  }

  const intro = ft('tree_selector_intro')
  const newBtn = ft('tree_selector_new_btn')
  const step1Title = ft('tree_selector_step_1_title')
  const step1Hint = ft('tree_selector_step_1_hint')
  const historyLabel = ft('tree_selector_history_label')
  const emptyTitle = ft('tree_selector_empty_title')
  const emptyText = ft('tree_selector_empty_text')

  const rootNodes = fields
    .filter(f => f.field_type === 'tree_node' && !f.parent_field_id)
    .sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="ts">
      {intro && <p className="ts-intro">{intro}</p>}

      {newBtn && (
        <div className="ts-new-btn">
          <Plus size={18} />
          <span>{newBtn}</span>
        </div>
      )}

      {step1Title && (
        <section className="ts-section">
          <span className="ts-step-title">{step1Title}</span>
          {step1Hint && <span className="ts-step-hint">{step1Hint}</span>}
          <div className="ts-grid">
            {rootNodes.map(node => {
              const color = node.props['color'] ?? '#6366F1'
              const label = node.text_code ? t(node.text_code) : ''
              return (
                <div
                  key={node.id}
                  className="ts-node"
                  style={{ borderColor: color, color }}
                >
                  <Palette size={16} style={{ color }} />
                  <span className="ts-node__label">{label}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {historyLabel && (
        <section className="ts-section">
          <span className="ts-section__title">{historyLabel}</span>
          {/* Carte mock d'une émotion identifiée */}
          <article className="ts-history-card">
            <span className="ts-history-card__icon" style={{ background: '#F59E0B' }}>
              <Smile size={18} color="white" />
            </span>
            <div className="ts-history-card__info">
              <span className="ts-history-card__title">Joie › Sérénité</span>
              <span className="ts-history-card__sub">Aujourd'hui · 14:30</span>
            </div>
            <span className="ts-history-card__intensity">
              <Heart size={11} fill="currentColor" />
              7/10
            </span>
            <Trash2 size={14} className="ts-history-card__delete" />
            <ChevronRight size={14} className="ts-history-card__chevron" />
          </article>
          {(emptyTitle || emptyText) && (
            <div className="ts-history-empty">
              {emptyTitle && <span className="ts-history-empty__title">{emptyTitle}</span>}
              {emptyText && <span className="ts-history-empty__text">{emptyText}</span>}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
