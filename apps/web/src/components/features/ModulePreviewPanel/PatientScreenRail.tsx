import { useCallback, type ReactNode } from 'react'
import { Eye } from 'lucide-react'
import { Banner } from '@ui/Banner'
import { Chip } from '@ui/Chip'
import { ScrollRail } from '@ui/ScrollRail'
import './PatientScreenRail.css'

// ─── Coquille commune des « vues patient » multi-écrans (aperçu praticien) ────
//
// Bandeau de lecture seule, puces de filtre par étape, rail horizontal des écrans
// numérotés et légendés, pied « n écrans · faire défiler ». Partagée par les modules
// dont l'aperçu montre un PARCOURS et pas un écran (défusion, nommer ce que je
// ressens) : sans elle, chaque module recopierait la même coquille.
//
// La navigation est un DÉFILEMENT, jamais un parcours rejouable : en séance, le
// praticien veut voir les écrans d'un coup d'oeil. Rien ici n'est actionnable côté
// patient, aucune donnée réelle, aucune interprétation (MDR).

/** Un écran du parcours, tel que composé par la vue d'un module. */
export interface PatientScreen<Stage extends string> {
  readonly id: string
  readonly stage: Stage
  readonly caption: string
  readonly body: ReactNode
}

export interface StageFilter<Stage extends string> {
  readonly value: Stage | 'all'
  readonly label: string
}

interface Props<Stage extends string> {
  readonly screens: readonly PatientScreen<Stage>[]
  readonly filters: readonly StageFilter<Stage>[]
  readonly activeFilter: Stage | 'all'
  readonly onFilterChange: (value: Stage | 'all') => void
  /** Bandeau d'en-tête, déjà traduit. */
  readonly bannerLabel: string
  /** Pied : « n écrans », déjà composé par l'appelant (il possède le pluriel). */
  readonly footerLabel: string
  /** Libellés accessibles des deux flèches, déjà traduits. */
  readonly previousLabel: string
  readonly nextLabel: string
}

export function PatientScreenRail<Stage extends string>({
  screens, filters, activeFilter, onFilterChange,
  bannerLabel, footerLabel, previousLabel, nextLabel,
}: Props<Stage>) {
  // La numérotation suit la position de l'écran dans le parcours COMPLET : filtrer
  // réduit le rail sans renuméroter, sinon l'écran 7 deviendrait l'écran 1 et le
  // praticien perdrait le repère qu'il partage avec le patient.
  const visible = activeFilter === 'all'
    ? screens.map((screen, index) => ({ screen, number: index + 1 }))
    : screens
        .map((screen, index) => ({ screen, number: index + 1 }))
        .filter(({ screen }) => screen.stage === activeFilter)

  return (
    <div className="preview-panel__inner">
      <Banner variant="info" icon={<Eye size={16} />}>{bannerLabel}</Banner>

      <div className="psr-filters">
        {filters.map(filter => (
          <StageChip
            key={filter.value}
            filter={filter}
            selected={activeFilter === filter.value}
            onSelect={onFilterChange}
          />
        ))}
      </div>

      <ScrollRail
        className="psr-rail-scope"
        itemCount={visible.length}
        previousLabel={previousLabel}
        nextLabel={nextLabel}
      >
        {visible.map(({ screen, number }) => (
          <article className="psr-screen" key={screen.id}>
            <div className="psr-screen__frame">{screen.body}</div>
            <div className="psr-screen__caption">{number} · {screen.caption}</div>
          </article>
        ))}
      </ScrollRail>

      <div className="psr-footer">
        <span>{footerLabel}</span>
      </div>
    </div>
  )
}

/** Puce de filtre : composant dédié pour garder un callback stable par puce. */
function StageChip<Stage extends string>({ filter, selected, onSelect }: {
  filter: StageFilter<Stage>
  selected: boolean
  onSelect: (value: Stage | 'all') => void
}) {
  const handleClick = useCallback(() => onSelect(filter.value), [onSelect, filter.value])
  return <Chip label={filter.label} selectable selected={selected} onClick={handleClick} />
}
