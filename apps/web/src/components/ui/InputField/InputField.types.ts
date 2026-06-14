import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface InputFieldBaseProps {
  label: string
  error?: string
}

/** Champ sur une ligne (`<input>`) — variante par défaut. */
export interface InputFieldSingleProps
  extends InputFieldBaseProps,
    InputHTMLAttributes<HTMLInputElement> {
  multiline?: false
}

/** Champ multiligne (`<textarea>`) — activé par `multiline`. */
export interface InputFieldMultilineProps
  extends InputFieldBaseProps,
    TextareaHTMLAttributes<HTMLTextAreaElement> {
  multiline: true
}

export type InputFieldProps = InputFieldSingleProps | InputFieldMultilineProps
