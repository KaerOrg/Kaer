import type { InputHTMLAttributes } from 'react'

export interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}
