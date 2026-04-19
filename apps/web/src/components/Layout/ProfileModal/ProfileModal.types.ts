export interface ProfileModalProps {
  initialName: string
  initialTitle: string
  onSave: (name: string, title: string) => Promise<string | null>
  onClose: () => void
}
