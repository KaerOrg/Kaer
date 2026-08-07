// ─── Ressources d'urgence (composant partagé) ────────────────────────────────
//
// Rangée ou pile de raccourcis vers les secours, construite à partir des fields
// `exercise_safety`. Centralisé ici pour être réutilisé par `SafetySequenceLayout`
// (bandeau permanent + écran des ressources), `SafetyPlanLayout` (vue consultation)
// et `EditableStepsLayout` (barre de config), au lieu d'être dupliqué.
//
// Deux densités, un seul composant (P-3) :
//   `compact` — pastilles côte à côte, bandeau permanent en tête d'écran ;
//   `full`    — cartes empilées avec leur sous-libellé, écran des ressources.
//
// Le NOMBRE d'entrées est libre : les coordonnées viendront d'une configuration
// serveur, et un jeu de deux ou de quatre entrées doit se rendre sans retouche.
// Ne jamais figer trois entrées dans le rendu.
//
// La couleur est portée par le COMPOSANT, jamais par la donnée : le field ne
// transmet qu'une `tone` sémantique (`primary` | `danger`), et le composant la
// traduit en variante du design system. Elle code la gravité de la situation, pas
// le public concerné — d'où le 114 en rouge, au même rang que le 15 : c'est le
// même secours, pour quelqu'un qui ne peut pas passer un appel vocal.
//
// Conformité MDR 2017/745 : raccourci fixe, jamais déclenché ni teinté par une
// donnée patient.

import { View, StyleSheet, Linking } from 'react-native'
import { spacing } from '@theme'
import { Button, type ButtonVariant } from '@ui/Button'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import type { ContentField } from '@services/moduleService'

/** Densité de rendu. `compact` = bandeau permanent, `full` = écran des ressources. */
export type EmergencyDensity = 'compact' | 'full'

// Une `tone` inconnue (ou absente) retombe sur `primary` : une ressource ajoutée en
// configuration sans intention explicite ne doit pas s'annoncer comme un danger vital.
const VARIANT_BY_TONE: Record<string, ButtonVariant> = {
  primary: 'secondary',
  danger: 'danger',
}
const SOLID_VARIANT_BY_TONE: Record<string, ButtonVariant> = {
  primary: 'primary',
  danger: 'dangerSolid',
}

export interface CrisisEmergencyCallsProps {
  /** Fields du module — les `exercise_safety` en sont extraits. */
  fields: ContentField[]
  /** Densité de rendu (défaut `compact`). */
  density?: EmergencyDensity
}

export function CrisisEmergencyCalls({ fields, density = 'compact' }: CrisisEmergencyCallsProps) {
  const t = useModuleTranslation()
  const callFields = [...fields]
    .filter(f => f.field_type === 'exercise_safety')
    .sort((a, b) => a.sort_order - b.sort_order)
  if (callFields.length === 0) return null

  const full = density === 'full'

  return (
    <View style={full ? styles.stack : styles.row}>
      {callFields.map(f => {
        const phone = f.props['phone'] ?? ''
        // `sms:` pour le 114 : un `tel:114` appellerait vocalement le service destiné
        // aux personnes sourdes ou malentendantes, donc inutilisable par son public.
        const scheme = f.props['action'] === 'sms' ? 'sms' : 'tel'
        const tone = f.props['tone'] ?? 'primary'
        const variant = (full ? SOLID_VARIANT_BY_TONE : VARIANT_BY_TONE)[tone] ?? (full ? 'primary' : 'secondary')

        // Le libellé plein porte le verbe (« Appeler le 15 », « Écrire au 114 ») ; le
        // compact ne porte que le numéro. Le verbe sert aussi de libellé d'accessibilité
        // dans les deux densités : « 3114 » seul ne dit pas ce qu'un appui déclenche.
        const actionCode = f.props['action_label_code']
        const actionLabel = actionCode != null ? t(actionCode) : t(f.text_code ?? '')
        const detailCode = full ? f.props['detail_label_code'] : f.props['label_code']

        return (
          <Button
            key={f.id}
            variant={variant}
            style={full ? undefined : styles.cell}
            label={full ? actionLabel : t(f.text_code ?? '')}
            sublabel={detailCode != null ? t(detailCode) : undefined}
            onPress={() => { if (phone) void Linking.openURL(`${scheme}:${phone}`) }}
            accessibilityLabel={actionLabel}
            testID={`emergency-${phone}`}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  // Pastilles : `flexWrap` pour qu'un jeu de quatre entrées passe à la ligne au lieu
  // de déborder latéralement, et `cell` en `flex: 1` pour qu'elles se partagent la
  // largeur sans jamais la dépasser (zéro défilement horizontal).
  row:   { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cell:  { flex: 1, minWidth: 90 },
  stack: { gap: spacing.sm },
})
