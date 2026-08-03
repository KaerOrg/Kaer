import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { catalogQueries, moduleQueries } from '../../../hooks/queries'
import { PANEL_DIMENSIONS } from '../../../lib/moduleFilter'
import { ModuleTagChips } from '../ModuleTagChips'

// ─── Bloc « Indications » du panneau Sources (générique, tous modules) ────────
//
// Les indications ne sont PAS une liste rédigée ici : ce sont les tags de la
// dimension `indication` que le module porte dans le seed, exactement ceux que la
// carte affiche en puces. Une seule vérité : ajouter une indication, c'est
// attribuer un tag, et il apparaît du même coup dans les filtres du catalogue,
// sur la carte et ici.
//
// Sous les puces, la mention qui protège le module vient elle aussi de la base :
// c'est son champ `footer_note`, celui que le patient voit en pied d'écran. Pas de
// texte en dur, pas de liste par module dans le code (MDR : ce que le module n'est
// pas doit être dit au même endroit pour tous).

interface Props {
  readonly moduleId: string
}

export function ModuleIndicationsBlock({ moduleId }: Props) {
  const { t } = useTranslation()
  const taxonomyQuery = useQuery(catalogQueries.taxonomy())
  const fieldsQuery = useQuery(moduleQueries.fields(moduleId))

  const tagIds = taxonomyQuery.data?.tagsByModule.get(moduleId)

  const footerCode = useMemo(
    () => fieldsQuery.data?.fields.find(f => f.field_type === 'footer_note')?.text_code ?? null,
    [fieldsQuery.data],
  )

  // Un module sans tag n'affiche pas le bloc : rien à dire vaut mieux qu'un cadre vide.
  if (!tagIds || tagIds.size === 0) return null

  return (
    <section className="sources-panel__indications" data-testid="module-indications">
      <ModuleTagChips
        tagIds={tagIds}
        taxonomy={taxonomyQuery.data ?? { tagsByDimension: new Map() }}
        dimensions={PANEL_DIMENSIONS}
        showDimensionLabels
      />
      {footerCode != null ? (
        <p className="sources-panel__disclaimer">{t(footerCode)}</p>
      ) : null}
    </section>
  )
}
