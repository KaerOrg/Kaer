import type { ComponentType } from 'react'
import { Waves, Wind, Brain, Heart, Sun, Clock } from 'lucide-react'
import type { ContentField } from '../../../../../services/moduleService'
import { parseDurations } from './crisisLogic'

// Aperçu praticien (lecture seule) du compagnon de crise mobile. La version
// patient est une machine à états (accueil → catégorie → activité → minuteur →
// fin) ; ici on présente le même contenu en storyboard statique, pour que le
// praticien voie chaque catégorie, ses activités et les durées proposées.
// Conformité MDR : minuteur fixe, aucune interprétation.

interface Props {
  fields: ContentField[]
  t: (key: string) => string
  moduleId: string
}

type LucideIcon = ComponentType<{ size?: number; className?: string }>

const ICONS: Readonly<Record<string, LucideIcon>> = {
  Waves,
  Wind,
  Brain,
  Heart,
  Sun,
}

function resolveIcon(name: string): LucideIcon {
  return ICONS[name] ?? Waves
}

interface CategoryVM {
  key: string
  label: string
  icon: string
  color: string
  activities: string[]
}

export function CrisisCompanionLayout({ fields, t, moduleId }: Props) {
  const ui = (key: string): string => t(`modules.${moduleId}.now.${key}`)

  const intros = fields.filter(f => f.field_type === 'exercise_intro')
  const configField = fields.find(f => f.field_type === 'exercise_config')
  const durations = parseDurations(configField?.props['durations'])

  const sections = new Map<string, ContentField[]>()
  for (const f of fields) {
    if (!f.section_id) continue
    if (!sections.has(f.section_id)) sections.set(f.section_id, [])
    sections.get(f.section_id)!.push(f)
  }

  const categories: CategoryVM[] = []
  for (const [sectionId, secFields] of sections) {
    const header = secFields.find(f => f.field_type === 'crisis_category')
    if (!header) continue
    const activities = secFields
      .filter(f => f.field_type === 'crisis_activity')
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(f => (f.text_code ? t(f.text_code) : ''))
    categories.push({
      key: sectionId,
      label: header.text_code ? t(header.text_code) : '',
      icon: header.props['icon'] ?? 'Waves',
      color: header.props['color'] ?? 'var(--color-primary)',
      activities,
    })
  }

  if (categories.length === 0) return null

  return (
    <div className="cc">
      <div className="cc-hero">
        <span className="cc-hero__icon cc-hero__icon--wave">
          <Waves size={36} />
        </span>
        <h1 className="cc-hero__title">{ui('title')}</h1>
        <div className="cc-hero__intro">
          {intros.map(f => (
            <p key={f.id} className="cc-hero__text">{f.text_code ? t(f.text_code) : ''}</p>
          ))}
        </div>
      </div>

      <section className="cc-section">
        <span className="cc-section__title">{ui('pick_category')}</span>
        <div className="cc-cats">
          {categories.map(cat => {
            const Icon = resolveIcon(cat.icon)
            return (
              <div key={cat.key} className="cc-cat" style={{ borderLeftColor: cat.color }}>
                <div className="cc-cat__head">
                  <span className="cc-cat__icon" style={{ background: `${cat.color}1A`, color: cat.color }}>
                    <Icon size={18} />
                  </span>
                  <span className="cc-cat__label">{cat.label}</span>
                </div>
                <ul className="cc-cat__acts">
                  {cat.activities.map((act, i) => (
                    <li key={`${cat.key}-${i}`} className="cc-cat__act">{act}</li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      <section className="cc-timer">
        <span className="cc-timer__caption">
          <Clock size={14} />
          {ui('timer_caption')}
        </span>
        <div className="cc-durations">
          {durations.map(min => (
            <span key={min} className="cc-duration">{`${min} ${ui('minutes')}`}</span>
          ))}
        </div>
      </section>

      <div className="cc-done">
        <strong className="cc-done__title">{ui('done_title')}</strong>
        <p className="cc-done__text">{ui('done_text')}</p>
      </div>
    </div>
  )
}
