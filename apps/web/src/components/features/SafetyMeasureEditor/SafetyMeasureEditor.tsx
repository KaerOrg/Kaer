// ─── Étape 6 du plan de sécurité, côté praticien (PW-4) ─────────────────────
//
// Parité de l'éditeur patient (P-13), avec une contrainte qui change la priorité
// d'usage : **la plupart des arrangements sont décidés en consultation**. C'est donc
// ici qu'ils seront saisis le plus souvent, plus que sur le téléphone.
//
// La phrase est composée AU RENDU par `composeMeasureSentence`, la même fonction que le
// mobile : une seule source, donc aucune dérive de formulation entre les deux écrans.
//
// ── Conformité MDR 2017/745 ─────────────────────────────────────────────────
//
// **L'interface ne nomme, ne liste, ne suggère et n'illustre jamais un moyen.** Les
// propositions portent sur le VERBE d'action ; aucun placeholder ne donne d'exemple
// d'objet dans le champ « Quoi ».
//
// **Aucun rappel, aucune alerte, aucune couleur à l'échéance.** La date est affichée,
// jamais surveillée, ni ici ni dans l'onglet Données (PW-8).
//
// Le jeu de propositions est **fixe** : il vient de la configuration, dans son ordre, et
// n'est jamais réordonné ni filtré selon ce qui a été saisi.

import { useCallback, useMemo, useState, type ChangeEvent } from 'react'
import { Button } from '@ui/Button'
import { InputField } from '@ui/InputField'
import { MeasureRow, type ExistingMeasure } from './MeasureRow'
import { MeasureVerbChip, type MeasureVerbOption } from './MeasureVerbChip'
import './SafetyMeasureEditor.css'

export type { ExistingMeasure, MeasureVerbOption }

export interface NewMeasure {
  verb: string
  what: string
  who: string | null
  until: string | null
}

interface Props {
  measures: readonly ExistingMeasure[]
  /** Propositions, dans l'ordre de la configuration. */
  verbs: readonly MeasureVerbOption[]
  /** Code de la proposition « Autre », qui ouvre la saisie libre du verbe. */
  otherVerbCode: string
  /** Libellés déjà traduits : le composant ne connaît aucune clé i18n. */
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
  onDelete: (id: string) => void
}

export function SafetyMeasureEditor({ measures, verbs, otherVerbCode, labels, onAdd, onDelete }: Props) {
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

  // Handlers stables : une lambda dans le JSX serait recréée à chaque frappe.
  const handleFreeVerb = useCallback((e: ChangeEvent<HTMLInputElement>) => setFreeVerb(e.target.value), [])
  const handleWhat = useCallback((e: ChangeEvent<HTMLInputElement>) => setWhat(e.target.value), [])
  const handleWho = useCallback((e: ChangeEvent<HTMLInputElement>) => setWho(e.target.value), [])
  const handleUntil = useCallback((e: ChangeEvent<HTMLInputElement>) => setUntil(e.target.value), [])

  const handleAdd = useCallback(() => {
    // « Qui s'en occupe » et « jusqu'à quand » sont facultatifs : s'éloigner n'implique
    // personne d'autre, et toute mesure n'a pas d'échéance.
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
    <div className="measure-editor">
      {/* Les accords déjà pris, en phrases : on les voit avant d'en ajouter un. */}
      <ul className="measure-editor__list">
        {measures.map(m => (
          <MeasureRow key={m.id} measure={m} deleteLabel={labels.delete} onDelete={onDelete} />
        ))}
      </ul>

      <div className="measure-editor__verbs">
        {verbs.map(option => (
          <MeasureVerbChip
            key={option.code}
            option={option}
            selected={selectedCode === option.code}
            onSelect={setSelectedCode}
          />
        ))}
      </div>

      {isOther ? (
        <InputField label={labels.what} value={freeVerb} onChange={handleFreeVerb} data-testid="measure-verb-free" />
      ) : null}

      {/* Aucun placeholder d'exemple : donner « la boîte de médicaments » en modèle
          reviendrait à nommer un moyen. */}
      <InputField label={labels.what} value={what} onChange={handleWhat} data-testid="measure-what" />
      <InputField
        label={`${labels.who} (${labels.whoOptional})`}
        value={who}
        onChange={handleWho}
        data-testid="measure-who"
      />
      {/* Une date OU un texte : un sélecteur de date seul forcerait une fausse précision
          là où « mon prochain rendez-vous » est la vraie réponse. */}
      <InputField label={labels.until} value={until} onChange={handleUntil} data-testid="measure-until" />

      <div className="measure-editor__actions">
        <Button variant="primary" size="sm" onClick={handleAdd}>{labels.add}</Button>
        <Button variant="ghost" size="sm" onClick={reset}>{labels.cancel}</Button>
      </div>

      <p className="measure-editor__note">{labels.temporaryNote}</p>
    </div>
  )
}
