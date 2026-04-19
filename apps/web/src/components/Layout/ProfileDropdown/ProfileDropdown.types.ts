export interface ProfileDropdownProps {
  initials: string
  name: string
  email: string
  professionalTitle?: string
  onEditProfile: () => void
  onLogout: () => void
}
