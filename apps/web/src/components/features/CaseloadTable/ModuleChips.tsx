import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Chip } from '../../ui/Chip'
import { Tooltip } from '../../ui/Tooltip'
import { LUCIDE_ICONS } from '../../../lib/lucideIcons'

type ModuleChipsBase = {
  moduleTypes: readonly string[]
  /** Map module_id → nom d'icône lucide (catalogue des modules). Sans entrée → pas d'icône. */
  iconByModule?: Record<string, string>
  /** Icône seule + titre en tooltip (colonne dense). Sinon icône + titre visible (drawer). */
  iconOnly?: boolean
  /** Empile les puces verticalement (une par ligne) au lieu du flux horizontal qui s'enroule. */
  column?: boolean
}

/**
 * `max` et `onOverflowClick` vont par paire : soit aucun (tout est affiché), soit les
 * deux (plafond + handler du « +N »). L'union interdit l'état « plafond sans handler ».
 */
export type ModuleChipsProps =
  | (ModuleChipsBase & { max?: undefined; onOverflowClick?: undefined })
  | (ModuleChipsBase & { max: number; onOverflowClick: () => void })

/**
 * Modules débloqués pour le patient lié (app), affichés en lecture seule, avec la vraie
 * icône de chaque module. Avec `max`, le surplus est replié derrière un « +N » qui appelle
 * `onOverflowClick` (ex. colonne dense → ouvre le drawer) ; sans `max`, tous sont listés.
 */
export function ModuleChips({ moduleTypes, iconByModule, iconOnly = false, column = false, max, onOverflowClick }: ModuleChipsProps) {
  const { t } = useTranslation()

  // Tri alphabétique par titre de module (le plafond « +N » s'applique après le tri).
  const sorted = useMemo(
    () =>
      [...moduleTypes].sort((a, b) =>
        t(`modules.${a}.label`).localeCompare(t(`modules.${b}.label`))
      ),
    [moduleTypes, t]
  )

  if (sorted.length === 0) return null

  const capped = max != null && sorted.length > max
  const visible = capped ? sorted.slice(0, max) : sorted
  const extraCount = sorted.length - visible.length

  return (
    <div className={`module-chips ${column ? 'module-chips--column' : ''}`} title={t('file_active.link.modules_hint')}>
      {visible.map(type => {
        const label = t(`modules.${type}.label`)
        const Icon = LUCIDE_ICONS[iconByModule?.[type] ?? '']
        const iconNode = Icon ? <Icon size={16} /> : undefined
        // Colonne dense → icône seule, titre via Tooltip rapide (le `title` natif est
        // neutralisé par `title=""` pour éviter le doublon lent). Drawer → icône + titre
        // visible. Repli sur le label seul si l'icône du module est inconnue.
        return iconOnly && iconNode ? (
          <Tooltip key={type} label={label}>
            <Chip tone="info" iconOnly icon={iconNode} label={label} title="" />
          </Tooltip>
        ) : (
          <Chip key={type} tone="info" icon={iconNode} label={label} />
        )
      })}
      {capped ? (
        <Tooltip label={t('file_active.link.modules_more', { count: extraCount })}>
          <Chip tone="info" label={`+${extraCount}`} onClick={onOverflowClick} title="" />
        </Tooltip>
      ) : null}
    </div>
  )
}
