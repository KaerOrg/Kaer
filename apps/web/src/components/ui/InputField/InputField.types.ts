import type { InputHTMLAttributes, Ref, TextareaHTMLAttributes } from 'react'

interface InputFieldBaseProps {
  /**
   * Libellé visible au-dessus du champ. Optionnel : sans `label`, aucun `<label>`
   * n'est rendu — fournir alors un `aria-label` (ou `aria-labelledby`) pour
   * l'accessibilité.
   */
  label?: string
  error?: string
}

/** Champ sur une ligne (`<input>`) — variante par défaut. */
export interface InputFieldSingleProps
  extends InputFieldBaseProps,
    InputHTMLAttributes<HTMLInputElement> {
  multiline?: false
  /** Ref transmise au `<input>` sous-jacent (usages non contrôlés). */
  ref?: Ref<HTMLInputElement>
}

/** Champ multiligne (`<textarea>`) — activé par `multiline`. */
export interface InputFieldMultilineProps
  extends InputFieldBaseProps,
    TextareaHTMLAttributes<HTMLTextAreaElement> {
  multiline: true
  /** Ref transmise au `<textarea>` sous-jacent (usages non contrôlés). */
  ref?: Ref<HTMLTextAreaElement>
}

export type InputFieldProps = InputFieldSingleProps | InputFieldMultilineProps
