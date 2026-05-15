import { AlignLeft } from 'lucide-react'

interface Props { text?: string }

export function InfoWidget({ text }: Props) {
  return (
    <span className="fw-info">
      <AlignLeft size={10} />
      {text}
    </span>
  )
}
