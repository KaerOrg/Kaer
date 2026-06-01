import React from 'react'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    functions: { invoke: vi.fn() },
  },
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    practitioner: { id: 'p-1', email: 'dr@test.fr', name: 'Dr Dupont', professional_title: 'IPA' },
  }),
}))

import { supabase } from '../../lib/supabase'
import { DashboardPage } from './DashboardPage'
import { ToastProvider } from '../../contexts/ToastProvider'
import { ToastContainer } from '../../components/ui/Toast/ToastContainer'

// ── Helpers ─────────────────────────────────────────────────────────────────

type QueryResult = { data: unknown; error: unknown }

/**
 * Crée un objet Proxy qui se comporte comme un Promise ET comme une chaîne
 * Supabase fluente (select → eq → is → gt → order → …).
 * Chaque méthode chaînable retourne le même proxy, qui peut être await-é.
 */
function makeQueryChain(result: QueryResult = { data: null, error: null }) {
  const chain = new Proxy({} as Record<string, unknown>, {
    get(target, prop: string) {
      if (prop === 'then') {
        return (resolve: (v: QueryResult) => unknown) => Promise.resolve(result).then(resolve)
      }
      if (prop === 'catch') {
        return (reject: (e: unknown) => unknown) => Promise.resolve(result).catch(reject)
      }
      if (prop === 'finally') {
        return (fn: () => void) => Promise.resolve(result).finally(fn)
      }
      if (!target[prop]) {
        target[prop] = vi.fn().mockReturnValue(chain)
      }
      return target[prop]
    },
  })
  return chain
}

function setupEmptyDB() {
  vi.mocked(supabase.from).mockImplementation(
    () => makeQueryChain({ data: [], error: null }) as ReturnType<typeof supabase.from>,
  )
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  setupEmptyDB()
  vi.mocked(supabase.functions.invoke).mockResolvedValue(
    { data: { success: true }, error: null } as never,
  )
})

/** Rend la page et ouvre le formulaire d'invitation (étape 1). */
async function openForm() {
  render(
    <ToastProvider>
      <DashboardPage />
      <ToastContainer />
    </ToastProvider>
  )
  await userEvent.click(screen.getByRole('button', { name: /inviter un patient/i }))
}

/** Remplit l'email et passe à l'étape 2 du formulaire. */
async function openFormStep2(email = 'p@test.fr') {
  await openForm()
  await userEvent.type(screen.getByLabelText(/email/i), email)
  await userEvent.click(screen.getByRole('button', { name: /suivant/i }))
}

// ── Présence des champs ──────────────────────────────────────────────────────

describe('DashboardPage — formulaire d\'invitation : présence des champs', () => {
  it('affiche le champ email', async () => {
    await openForm()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('affiche le champ prénom', async () => {
    await openForm()
    expect(screen.getByLabelText(/prénom/i)).toBeInTheDocument()
  })

  it('affiche le champ nom', async () => {
    await openForm()
    expect(screen.getByLabelText('Nom')).toBeInTheDocument()
  })

  it('affiche le champ date de naissance', async () => {
    await openForm()
    expect(screen.getByLabelText(/date de naissance/i)).toBeInTheDocument()
  })

  it('affiche le select sexe', async () => {
    await openForm()
    expect(screen.getByLabelText(/sexe/i)).toBeInTheDocument()
  })

  it('affiche les options Homme / Femme / Autre dans le select sexe', async () => {
    await openForm()
    expect(screen.getByRole('option', { name: 'Homme' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Femme' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /autre/i })).toBeInTheDocument()
  })

  it('affiche le toggle mode ado', async () => {
    await openForm()
    expect(screen.getByText('Mode ado')).toBeInTheDocument()
  })

  it('ne contient pas de champ alias', async () => {
    await openForm()
    expect(screen.queryByLabelText(/alias/i)).toBeNull()
    expect(screen.queryByLabelText(/pseudonyme/i)).toBeNull()
  })
})

// ── Toggle mode ado ──────────────────────────────────────────────────────────

describe('DashboardPage — formulaire d\'invitation : toggle mode ado', () => {
  it('le toggle est décoché par défaut', async () => {
    await openForm()
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('cocher le toggle active le mode ado', async () => {
    await openForm()
    await userEvent.click(screen.getByRole('checkbox'))
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('décocher le toggle désactive le mode ado', async () => {
    await openForm()
    const checkbox = screen.getByRole('checkbox')
    await userEvent.click(checkbox)
    await userEvent.click(checkbox)
    expect(checkbox).not.toBeChecked()
  })
})

// ── Validation email ─────────────────────────────────────────────────────────

describe('DashboardPage — formulaire d\'invitation : validation email', () => {
  it('ne montre pas d\'erreur si le champ email est vide', async () => {
    await openForm()
    expect(screen.queryByText('Adresse email invalide.')).toBeNull()
  })

  it('ne montre pas d\'erreur pendant la saisie', async () => {
    await openForm()
    await userEvent.type(screen.getByLabelText(/email/i), 'pas-un-email')
    expect(screen.queryByText('Adresse email invalide.')).toBeNull()
  })

  it('montre une erreur après blur si l\'email est mal formé', async () => {
    await openForm()
    const input = screen.getByLabelText(/email/i)
    await userEvent.type(input, 'pas-un-email')
    fireEvent.blur(input)
    expect(await screen.findByText('Adresse email invalide.')).toBeInTheDocument()
  })

  it('retire l\'erreur après blur si l\'email devient valide', async () => {
    await openForm()
    const input = screen.getByLabelText(/email/i)
    await userEvent.type(input, 'invalide')
    fireEvent.blur(input)
    expect(await screen.findByText('Adresse email invalide.')).toBeInTheDocument()
    await userEvent.clear(input)
    await userEvent.type(input, 'valide@test.fr')
    fireEvent.blur(input)
    await waitFor(() => {
      expect(screen.queryByText('Adresse email invalide.')).toBeNull()
    })
  })
})

// ── Validation date de naissance ─────────────────────────────────────────────

describe('DashboardPage — formulaire d\'invitation : validation date de naissance', () => {
  it('ne montre pas d\'erreur si la date est vide', async () => {
    await openForm()
    expect(screen.queryByText(/date trop ancienne/i)).toBeNull()
    expect(screen.queryByText(/ne peut pas être dans le futur/i)).toBeNull()
  })

  it('ne montre pas d\'erreur pendant la saisie', async () => {
    await openForm()
    fireEvent.change(screen.getByLabelText(/date de naissance/i), {
      target: { value: '2099-01-01' },
    })
    expect(screen.queryByText(/ne peut pas être dans le futur/i)).toBeNull()
  })

  it('montre une erreur pour une date dans le futur après blur', async () => {
    await openForm()
    const input = screen.getByLabelText(/date de naissance/i)
    fireEvent.change(input, { target: { value: '2099-01-01' } })
    fireEvent.blur(input)
    expect(await screen.findByText(/ne peut pas être dans le futur/i)).toBeInTheDocument()
  })

  it('montre une erreur pour une date trop ancienne après blur', async () => {
    await openForm()
    const input = screen.getByLabelText(/date de naissance/i)
    fireEvent.change(input, { target: { value: '1900-01-01' } })
    fireEvent.blur(input)
    expect(await screen.findByText(/date trop ancienne/i)).toBeInTheDocument()
  })

  it('le champ date a un attribut min (100 ans avant aujourd\'hui)', async () => {
    await openForm()
    const input = screen.getByLabelText(/date de naissance/i)
    const min = input.getAttribute('min') ?? ''
    const currentYear = new Date().getFullYear()
    expect(min).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(parseInt(min.slice(0, 4))).toBe(currentYear - 100)
  })

  it('le champ date a un attribut max (aujourd\'hui)', async () => {
    await openForm()
    const input = screen.getByLabelText(/date de naissance/i)
    const max = input.getAttribute('max') ?? ''
    const today = new Date().toISOString().split('T')[0]
    expect(max).toBe(today)
  })
})

// ── Soumission du formulaire ──────────────────────────────────────────────────

describe('DashboardPage — formulaire d\'invitation : soumission', () => {
  it('envoie tous les nouveaux champs à send-invitation', async () => {
    await openFormStep2('patient@test.fr')
    // retour en étape 1 pour remplir les champs optionnels
    await userEvent.click(screen.getByRole('button', { name: /retour/i }))
    await userEvent.type(screen.getByLabelText(/prénom/i), 'Marie')
    await userEvent.type(screen.getByLabelText('Nom'), 'Dupont')
    fireEvent.change(screen.getByLabelText(/date de naissance/i), {
      target: { value: '1990-06-15' },
    })
    await userEvent.selectOptions(screen.getByLabelText(/sexe/i), 'F')
    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.click(screen.getByRole('button', { name: /suivant/i }))
    await userEvent.click(screen.getByRole('button', { name: /envoyer l.invitation/i }))

    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledWith('send-invitation', {
        body: expect.objectContaining({
          patient_email: 'patient@test.fr',
          first_name: 'Marie',
          last_name: 'Dupont',
          birth_date: '1990-06-15',
          sex: 'F',
          teen_mode: true,
        }),
      })
    })
  })

  it('envoie teen_mode: false quand le toggle est inactif', async () => {
    await openFormStep2()
    await userEvent.click(screen.getByRole('button', { name: /envoyer l.invitation/i }))

    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledWith('send-invitation', {
        body: expect.objectContaining({ teen_mode: false }),
      })
    })
  })

  it('envoie null pour les champs optionnels laissés vides', async () => {
    await openFormStep2()
    await userEvent.click(screen.getByRole('button', { name: /envoyer l.invitation/i }))

    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledWith('send-invitation', {
        body: expect.objectContaining({
          first_name: null,
          last_name: null,
          birth_date: null,
          sex: null,
        }),
      })
    })
  })

  it('n\'envoie pas le formulaire si l\'email est invalide', async () => {
    await openForm()
    await userEvent.type(screen.getByLabelText(/email/i), 'pas-un-email')
    // "Suivant →" ne passe pas à l'étape 2 avec un email invalide
    await userEvent.click(screen.getByRole('button', { name: /suivant/i }))

    await waitFor(() => {
      expect(supabase.functions.invoke).not.toHaveBeenCalled()
    })
  })

  it('réinitialise les champs après succès', async () => {
    await openForm()
    await userEvent.type(screen.getByLabelText(/email/i), 'patient@test.fr')
    await userEvent.type(screen.getByLabelText(/prénom/i), 'Marie')
    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.click(screen.getByRole('button', { name: /suivant/i }))
    await userEvent.click(screen.getByRole('button', { name: /envoyer l.invitation/i }))

    // après succès, le formulaire se ferme — on le rouvre pour vérifier les champs vides
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /inviter un patient/i })).toBeInTheDocument()
    )
    await userEvent.click(screen.getByRole('button', { name: /inviter un patient/i }))

    expect(screen.getByLabelText(/email/i)).toHaveValue('')
    expect(screen.getByLabelText(/prénom/i)).toHaveValue('')
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('affiche le message d\'erreur retourné par l\'API', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { success: false, error: 'Cet email a déjà une invitation en cours.' },
      error: null,
    } as never)

    await openFormStep2('existant@test.fr')
    await userEvent.click(screen.getByRole('button', { name: /envoyer l.invitation/i }))

    await waitFor(() => {
      expect(screen.getByText('Cet email a déjà une invitation en cours.')).toBeInTheDocument()
    })
  })

  it('affiche le message traduit si le patient est déjà enregistré (409 patient_already_registered)', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: {
        context: { json: () => Promise.resolve({ error: 'patient_already_registered' }) },
      },
    } as never)

    await openFormStep2('existant@test.fr')
    await userEvent.click(screen.getByRole('button', { name: /envoyer l.invitation/i }))

    await waitFor(() => {
      expect(screen.getByText('Ce patient est déjà dans votre liste.')).toBeInTheDocument()
    })
  })

  it('affiche le message traduit si une invitation est déjà en attente (409 invitation_already_pending)', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: {
        context: { json: () => Promise.resolve({ error: 'invitation_already_pending' }) },
      },
    } as never)

    await openFormStep2('invite@test.fr')
    await userEvent.click(screen.getByRole('button', { name: /envoyer l.invitation/i }))

    await waitFor(() => {
      expect(screen.getByText('Une invitation est déjà en attente pour cet email.')).toBeInTheDocument()
    })
  })
})
