// ─── CallableContact : un contact du plan, en lecture seule ──────────────────
//
// Affiche un contact ou un lieu du plan de sécurité (étapes 3, 4, 5, 6) et les
// gestes possibles pour le joindre. Utilisé par la vue de consultation
// (`SafetyPlanLayout`) et par la Séquence.
//
// Trois règles portent tout le composant (P-8) :
//
//  1. **Le numéro n'est jamais affiché.** Le libellé du bouton est un VERBE. Un plan
//     de sécurité s'ouvre dans un train, dans une salle d'attente ; un numéro en clair
//     l'expose à un tiers qui regarde par-dessus l'épaule.
//  2. **Règle constante** : un numéro existe, les boutons existent ; pas de numéro,
//     ni numéro ni bouton. Un item sans action ne doit JAMAIS se lire comme un défaut,
//     donc aucun bouton grisé, aucun texte de remplacement.
//  3. **Un lieu n'est pas un contact.** L'étape 3 accepte des personnes ET des lieux ;
//     un lieu porte sa note à la place des boutons (« à 8 minutes à pied »).
//
// Le SMS n'est pas un confort : chez un adolescent, l'appel vocal est souvent une
// barrière plus haute que la divulgation elle-même. Il est donc proposé pour un proche,
// jamais pour un professionnel — un CMP ne se joint pas par SMS.
//
// Conformité MDR 2017/745 : raccourci vers le contact choisi par le patient, zéro
// interprétation, aucun classement.

import { View, Text, StyleSheet, Linking } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors, spacing, fontSize } from '@theme'
import { Button } from '@ui/Button'

/** Nature de l'item : une personne qu'on joint, ou un lieu où l'on va. */
export type ContactKind = 'person' | 'place'

export interface CallableContactProps {
  /** Nom du contact ou du lieu, tel que le patient l'a écrit. */
  name: string
  /** Numéro de téléphone, ou null/'' si l'item n'en porte pas. */
  phone: string | null
  /** Nature de l'item (défaut `person`). Un lieu ne se joint pas, on s'y rend. */
  kind?: ContactKind
  /** Lien au patient ou fonction (« ma sœur », « CMP »), tel qu'il l'a écrit. */
  role?: string | null
  /** « Ce que je peux lui dire », ou pour un lieu, ce qui le rend praticable. Facultatif. */
  note?: string | null
  /** Un professionnel ne reçoit pas de SMS. */
  professional?: boolean
  /** Couleur d'accent de l'étape (puce et boutons). */
  accentColor: string
  /** Libellé du bouton d'appel (verbe, i18n, fourni par le parent). */
  callLabel: string
  /** Libellé du bouton de message (verbe, i18n). Requis dès qu'un SMS est possible. */
  messageLabel?: string
  testID?: string
}

export function CallableContact({
  name, phone, kind = 'person', role, note, professional,
  accentColor, callLabel, messageLabel, testID,
}: CallableContactProps) {
  // Un lieu ne se joint pas : même s'il portait un numéro, on n'y appelle pas.
  const reachable = kind === 'person' && phone != null && phone !== ''
  const canMessage = reachable && professional !== true && messageLabel != null

  return (
    <View style={styles.row} testID={testID}>
      <View style={styles.head}>
        <MaterialCommunityIcons
          name={kind === 'place' ? 'map-marker-outline' : 'circle-small'}
          size={20}
          color={accentColor}
        />
        <View style={styles.identity}>
          <Text style={styles.name}>{name}</Text>
          {role != null && role !== '' ? <Text style={styles.role}>{role}</Text> : null}
        </View>
      </View>

      {note != null && note !== '' ? <Text style={styles.note}>{note}</Text> : null}

      {reachable ? (
        <View style={styles.actions}>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<MaterialCommunityIcons name="phone" size={16} color={accentColor} />}
            label={callLabel}
            onPress={() => { void Linking.openURL(`tel:${phone}`) }}
            accessibilityLabel={`${callLabel} : ${name}`}
            testID={testID != null ? `${testID}-call` : undefined}
          />
          {canMessage ? (
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<MaterialCommunityIcons name="message-outline" size={16} color={accentColor} />}
              label={messageLabel}
              onPress={() => { void Linking.openURL(`sms:${phone}`) }}
              accessibilityLabel={`${messageLabel} : ${name}`}
              testID={testID != null ? `${testID}-message` : undefined}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  // Colonne : le nom, puis la note, puis les gestes. Une rangée unique déborderait
  // latéralement dès qu'un nom est long ou la police agrandie.
  row:      { gap: spacing.xs, paddingVertical: spacing.xs },
  head:     { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  identity: { flex: 1, flexShrink: 1 },
  name:     { fontSize: fontSize.label, color: colors.text, lineHeight: 22, flexShrink: 1 },
  role:     { fontSize: fontSize.sm, color: colors.textMuted, flexShrink: 1 },
  note:     { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 20, flexShrink: 1, paddingLeft: spacing.md },
  actions:  { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingLeft: spacing.md },
})
