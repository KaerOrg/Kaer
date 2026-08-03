// Formulaire d'ajout d'un item, ancré sous le tableau de l'étape ouverte (PW-2, PW-3).
//
// **Le formulaire n'exige que le champ texte.** Le lien, le numéro et la note sont des
// précisions, pas des conditions : on ajoute un proche dont on n'a pas encore le numéro,
// et c'est une question à poser en séance, pas une erreur à corriger dans un formulaire.
//
// Les champs affichés suivent les colonnes de l'étape, elles-mêmes lues de la
// configuration : le formulaire ne connaît aucun numéro d'étape.
//
// Champs **non contrôlés** : leurs valeurs ne conditionnent rien dans l'UI, elles ne
// sont lues qu'à la validation. Le bouton « Ajouter » n'est jamais désactivé : un
// bouton grisé sans explication est une validation bloquante déguisée.

import { useCallback, useRef } from 'react'
import type { StepColumns } from '@kaer/shared'
import { Button } from '@ui/Button'
import { InputField } from '@ui/InputField'

/** Ce qu'un ajout produit. `kind` n'y figure pas : il se pose sur la ligne, en consultation. */
export interface NewPlanItem {
  text: string
  role: string | null
  phone: string | null
  note: string | null
}

/** Libellés du formulaire, déjà traduits : ce composant ne connaît aucune clé i18n. */
export interface AddPlanItemFormLabels {
  title: string
  text: string
  role: string
  phone: string
  note: string
  optional: string
  add: string
  cancel: string
  patientCanEdit: string
}

interface Props {
  columns: StepColumns
  labels: AddPlanItemFormLabels
  onAdd: (item: NewPlanItem) => void
}

export function AddPlanItemForm({ columns, labels, onAdd }: Props) {
  const textRef = useRef<HTMLInputElement>(null)
  const roleRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const noteRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    for (const ref of [textRef, roleRef, phoneRef, noteRef]) {
      if (ref.current) ref.current.value = ''
    }
  }, [])

  const handleAdd = useCallback(() => {
    const text = textRef.current?.value.trim() ?? ''
    if (text === '') {
      textRef.current?.focus()
      return
    }
    const read = (ref: typeof roleRef): string | null => {
      const value = ref.current?.value.trim() ?? ''
      return value === '' ? null : value
    }
    onAdd({ text, role: read(roleRef), phone: read(phoneRef), note: read(noteRef) })
    reset()
    textRef.current?.focus()
  }, [onAdd, reset])

  return (
    <div className="plan-editor__form">
      <p className="plan-editor__form-title">{labels.title}</p>
      <div className="plan-editor__form-fields">
        <InputField ref={textRef} label={labels.text} data-testid="plan-item-text" />
        {columns.role ? (
          <InputField ref={roleRef} label={`${labels.role} (${labels.optional})`} data-testid="plan-item-role" />
        ) : null}
        {columns.phone ? (
          <InputField ref={phoneRef} label={`${labels.phone} (${labels.optional})`} data-testid="plan-item-phone" />
        ) : null}
        {columns.note ? (
          <InputField ref={noteRef} label={`${labels.note} (${labels.optional})`} data-testid="plan-item-note" />
        ) : null}
      </div>
      <div className="plan-editor__form-actions">
        <Button variant="primary" size="sm" onClick={handleAdd}>{labels.add}</Button>
        <Button variant="ghost" size="sm" onClick={reset}>{labels.cancel}</Button>
        {/* Le plan est un document commun : le patient peut modifier et supprimer ce
            qu'on ajoute ici, depuis son téléphone. Le dire évite la surprise. */}
        <span className="plan-editor__form-hint">{labels.patientCanEdit}</span>
      </div>
    </div>
  )
}
