import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileModal } from './ProfileModal'

const defaultProps = {
  initialName: 'Marie Dupont',
  initialTitle: 'IPA',
  onSave: vi.fn().mockResolvedValue(null),
  onClose: vi.fn(),
}

beforeEach(() => vi.clearAllMocks())

describe('ProfileModal', () => {
  it('affiche les valeurs initiales dans les champs', () => {
    render(<ProfileModal {...defaultProps} />)
    expect(screen.getByDisplayValue('Marie Dupont')).toBeInTheDocument()
    expect(screen.getByDisplayValue('IPA')).toBeInTheDocument()
  })

  it('appelle onClose en cliquant sur Annuler', async () => {
    render(<ProfileModal {...defaultProps} />)
    await userEvent.click(screen.getByText('Annuler'))
    expect(defaultProps.onClose).toHaveBeenCalledOnce()
  })

  it("appelle onClose en cliquant sur l'overlay", async () => {
    render(<ProfileModal {...defaultProps} />)
    await userEvent.click(document.querySelector('.profile-modal__overlay')!)
    expect(defaultProps.onClose).toHaveBeenCalledOnce()
  })

  it('appelle onSave avec les valeurs modifiées', async () => {
    render(<ProfileModal {...defaultProps} />)
    await userEvent.clear(screen.getByDisplayValue('Marie Dupont'))
    await userEvent.type(screen.getByLabelText('Nom complet'), 'Jean Martin')
    await userEvent.click(screen.getByText('Enregistrer'))
    await waitFor(() => expect(defaultProps.onSave).toHaveBeenCalledWith('Jean Martin', 'IPA'))
  })

  it("affiche le message d'erreur retourné par onSave", async () => {
    const onSave = vi.fn().mockResolvedValue('Erreur réseau')
    render(<ProfileModal {...defaultProps} onSave={onSave} />)
    await userEvent.click(screen.getByText('Enregistrer'))
    await waitFor(() => expect(screen.getByText('Erreur réseau')).toBeInTheDocument())
  })

  it('affiche le succès puis ferme après sauvegarde', async () => {
    vi.useFakeTimers()
    render(<ProfileModal {...defaultProps} />)
    await userEvent.click(screen.getByText('Enregistrer'))
    await waitFor(() => expect(screen.getByText('✓ Profil mis à jour')).toBeInTheDocument())
    vi.runAllTimers()
    await waitFor(() => expect(defaultProps.onClose).toHaveBeenCalled())
    vi.useRealTimers()
  })
})
