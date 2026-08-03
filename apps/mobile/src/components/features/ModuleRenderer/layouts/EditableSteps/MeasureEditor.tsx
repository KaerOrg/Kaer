// ─── Étape 6 : éditeur de mesures, « un arrangement par carte » (P-13) ───────
//
// Maquette 5b retenue. L'option 5a, la « phrase à trous », est écartée : la grammaire
// française y résiste (« ma mère GARDE » mais « je M'ÉLOIGNE »), et chaque langue aurait
// exigé sa propre mécanique d'accord.
//
// L'ordre de l'écran n'est pas décoratif. **Les mesures déjà décidées sont AU-DESSUS du
// formulaire** : on voit l'accord existant avant d'en ajouter un autre. Puis les
// propositions, puis les trois champs, puis les actions ancrées hors du flux défilant.
//
// ── Conformité MDR 2017/745 ─────────────────────────────────────────────────
//
// **L'interface ne nomme, ne liste, ne suggère et n'illustre jamais un moyen.** Les
// propositions portent sur le VERBE d'action, jamais sur l'objet ; aucun placeholder ne
// donne d'exemple d'objet ; aucune icône, aucune puce illustrative.
//
// **Aucune date n'est comparée à aujourd'hui.** L'échéance est saisie et affichée, un
// point. Faire dire à l'app « cette mesure a expiré, revoyez-la » serait du contenu
// piloté par une donnée patient : c'est le soignant qui la revoit en consultation.

import React, { useCallback, useMemo, useState } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { Button } from '@ui/Button'
import { InputField } from '@ui/InputField'
import type { PlanItem } from '@services/planItemService'
import { MeasureCard } from './MeasureCard'
import { MeasureVerbChip, type MeasureVerbOption } from './MeasureVerbChip'
import { styles } from './measureStyles'

export type { MeasureVerbOption }

/** Ce qu'une mesure vaut au moment de l'ajout, avant composition de la phrase. */
export interface NewMeasure {
  verb: string
  what: string
  who: string | null
  until: string | null
}

export interface MeasureEditorProps {
  /** Mesures déjà décidées, rendues en phrases au-dessus du formulaire. */
  measures: readonly PlanItem[]
  /** Propositions de verbe, dans l'ordre de la config. */
  verbs: readonly MeasureVerbOption[]
  /** Code de la proposition « Autre », qui ouvre la saisie libre du verbe. */
  otherVerbCode: string
  /** Libellés déjà traduits, fournis par le layout : aucune clé i18n en dur ici. */
  labels: {
    what: string
    who: string
    whoOptional: string
    until: string
    add: string
    cancel: string
    temporaryNote: string
    delete: string
  }
  onAdd: (measure: NewMeasure) => void
  onDelete: (item: PlanItem) => void
}

export function MeasureEditor({ measures, verbs, otherVerbCode, labels, onAdd, onDelete }: MeasureEditorProps) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [freeVerb, setFreeVerb] = useState('')
  const [what, setWhat] = useState('')
  const [who, setWho] = useState('')
  const [until, setUntil] = useState('')

  const isOther = selectedCode === otherVerbCode
  const selectedLabel = useMemo(
    () => verbs.find(v => v.code === selectedCode)?.label ?? '',
    [verbs, selectedCode],
  )
  const verb = isOther ? freeVerb : selectedLabel

  const reset = useCallback(() => {
    setSelectedCode(null)
    setFreeVerb('')
    setWhat('')
    setWho('')
    setUntil('')
  }, [])

  const handleAdd = useCallback(() => {
    // « Qui s'en occupe » et « jusqu'à quand » sont facultatifs : s'éloigner n'implique
    // personne d'autre, et toute mesure n'a pas d'échéance. Seuls le verbe et le quoi
    // sont nécessaires pour que la phrase ait un sens.
    if (verb.trim() === '' || what.trim() === '') return
    onAdd({
      verb: verb.trim(),
      what: what.trim(),
      who: who.trim() === '' ? null : who.trim(),
      until: until.trim() === '' ? null : until.trim(),
    })
    reset()
  }, [verb, what, who, until, onAdd, reset])

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {measures.map(item => (
          <MeasureCard key={item.id} item={item} deleteLabel={labels.delete} onDelete={onDelete} />
        ))}

        <View style={styles.verbRow}>
          {verbs.map(option => (
            <MeasureVerbChip
              key={option.code}
              option={option}
              selected={selectedCode === option.code}
              onSelect={setSelectedCode}
            />
          ))}
        </View>

        {isOther ? (
          <InputField label={labels.what} value={freeVerb} onChangeText={setFreeVerb} testID="measure-verb-free" />
        ) : null}

        {/* Aucun placeholder d'exemple : donner « la boîte de médicaments » en modèle
            reviendrait à nommer un moyen. */}
        <InputField label={labels.what} value={what} onChangeText={setWhat} testID="measure-what" />
        <InputField label={`${labels.who} (${labels.whoOptional})`} value={who} onChangeText={setWho} testID="measure-who" />
        {/* Une date OU un texte : un sélecteur de date seul forcerait une fausse
            précision là où « mon prochain rendez-vous » est la vraie réponse. */}
        <InputField label={labels.until} value={until} onChangeText={setUntil} testID="measure-until" />
      </ScrollView>

      {/* Actions ancrées hors du flux défilant, clavier ouvert compris. */}
      <View style={styles.actions}>
        <Button variant="primary" label={labels.add} onPress={handleAdd} testID="measure-add" />
        <Button variant="ghost" label={labels.cancel} onPress={reset} testID="measure-cancel" />
        <Text style={styles.temporaryNote}>{labels.temporaryNote}</Text>
      </View>
    </View>
  )
}
