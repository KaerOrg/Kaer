import { AlertTriangle, Plus, ShieldCheck, Star, ThumbsDown, ThumbsUp, type LucideIcon } from 'lucide-react'
import type { ContentField } from '../../../../../services/moduleService'

interface Props {
  fields: ContentField[]
  t: (key: string) => string
}

const ICON_MAP: Record<string, LucideIcon> = {
  'thumb-up-outline':      ThumbsUp,
  'thumb-down-outline':    ThumbsDown,
  'shield-check-outline':  ShieldCheck,
  'alert-outline':         AlertTriangle,
}

// Aperçu fidèle au mobile : reproduit le module decisional_balance avec
// label cible, grille 2×2 de quadrants (chaque quadrant : icône, titre,
// sous-titre, items avec étoiles 1-5, bouton Ajouter), jauge motivation
// horizontale, bouton Sauvegarder. Source mobile : DecisionGridLayout.tsx.
export function DecisionGridLayout({ fields, t }: Props) {
  const configField = fields.find(f => f.field_type === 'decision_grid_config')
  const lbl = (key: string): string => {
    const code = configField?.props[key]
    return code ? t(code) : ''
  }

  const targetLabel = lbl('target_label')
  const targetPlaceholder = lbl('target_placeholder')
  const addLabel = lbl('add_label')
  const argPlaceholder = lbl('arg_placeholder')
  const gaugeTitle = lbl('gauge_title')
  const gaugeChange = lbl('gauge_change_label')
  const gaugeStatus = lbl('gauge_status_label')
  const saveLabel = lbl('save_label')

  const gaugeFill = configField?.props['gauge_fill_color'] ?? '#EC4899'

  const quadrants = fields
    .filter(f => f.field_type === 'column_header')
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, 4)

  // Items mock par quadrant pour montrer l'apparence des cartes remplies
  const mockItems: Record<string, { label: string; weight: number }[]> = {
    pros_change: [
      { label: 'Plus d\'énergie au quotidien', weight: 4 },
      { label: 'Meilleur sommeil', weight: 5 },
    ],
    cons_change: [
      { label: 'Effort initial difficile', weight: 3 },
    ],
    pros_status_quo: [
      { label: 'Confort de la routine', weight: 2 },
    ],
    cons_status_quo: [
      { label: 'Symptômes qui persistent', weight: 4 },
      { label: 'Risque pour la santé', weight: 5 },
    ],
  }

  return (
    <div className="dg">
      {targetLabel && (
        <section className="dg-section">
          <span className="dg-section__title">{targetLabel}</span>
          <div className="dg-target-input" data-placeholder={targetPlaceholder} />
        </section>
      )}

      <div className="dg-grid">
        {quadrants.map(q => {
          const color = q.props['color'] ?? '#6366F1'
          const bgColor = q.props['bg_color'] ?? '#F3F4F6'
          const iconName = q.props['icon'] ?? ''
          const Icon = ICON_MAP[iconName]
          const subtitleCode = q.props['subtitle_code']
          const sectionId = q.section_id ?? ''
          const items = mockItems[sectionId] ?? []
          return (
            <div key={q.id} className="dg-quadrant" style={{ borderTopColor: color }}>
              <div className="dg-quadrant__head" style={{ background: bgColor }}>
                {Icon && (
                  <span className="dg-quadrant__icon" style={{ color }}>
                    <Icon size={16} />
                  </span>
                )}
                <div className="dg-quadrant__titles">
                  <span className="dg-quadrant__title" style={{ color }}>
                    {q.text_code ? t(q.text_code) : ''}
                  </span>
                  {subtitleCode && (
                    <span className="dg-quadrant__subtitle">{t(subtitleCode)}</span>
                  )}
                </div>
                <span className="dg-quadrant__count" style={{ background: color }}>
                  {items.length}
                </span>
              </div>
              <ul className="dg-quadrant__items">
                {items.map((item, i) => (
                  <li key={i} className="dg-quadrant__item">
                    <span className="dg-quadrant__item-label">{item.label}</span>
                    <span className="dg-quadrant__stars">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star
                          key={n}
                          size={11}
                          className={n <= item.weight ? 'dg-star dg-star--on' : 'dg-star dg-star--off'}
                          fill={n <= item.weight ? 'currentColor' : 'none'}
                        />
                      ))}
                    </span>
                  </li>
                ))}
                {addLabel && (
                  <li className="dg-quadrant__add" style={{ color }}>
                    <Plus size={12} />
                    <span>{addLabel}</span>
                  </li>
                )}
              </ul>
            </div>
          )
        })}
      </div>

      {gaugeTitle && (
        <section className="dg-gauge">
          <span className="dg-gauge__title">{gaugeTitle}</span>
          <div className="dg-gauge__bar">
            <div className="dg-gauge__fill" style={{ width: '64%', background: gaugeFill }} />
            <div className="dg-gauge__mid" />
          </div>
          <div className="dg-gauge__labels">
            {gaugeStatus && (
              <span className="dg-gauge__label">
                <span className="dg-gauge__label-text">{gaugeStatus}</span>
                <span className="dg-gauge__label-score">7</span>
              </span>
            )}
            {gaugeChange && (
              <span className="dg-gauge__label dg-gauge__label--right">
                <span className="dg-gauge__label-text">{gaugeChange}</span>
                <span className="dg-gauge__label-score" style={{ color: gaugeFill }}>9</span>
              </span>
            )}
          </div>
        </section>
      )}

      {saveLabel && (
        <button type="button" className="dg-save-btn" disabled>
          {saveLabel}
        </button>
      )}

      {/* Référence inutilisée pour éviter le warning de variable non utilisée */}
      <span hidden>{argPlaceholder}</span>
    </div>
  )
}
