import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchPatientsWithModules } from '@services/patientService'
import {
  fetchPendingInvitations,
  sendInvitation,
  type InvitationDraft,
  type SendInvitationResult,
} from '@services/invitationService'
import { fetchInviteCategories } from '@services/moduleCatalogService'

// Factories `queryOptions` du tableau de bord praticien.
// Déclaration unique par lecture ; les composants font `useQuery(dashboardQueries.x(id))`
// et la mutation réutilise `dashboardQueries.pendingInvitations(id).queryKey` pour
// invalider exactement la liste affichée. Chaque queryFn appelle un service.
export const dashboardQueries = {
  patients: (practitionerId: string | undefined) =>
    queryOptions({
      queryKey: ['dashboard', 'patients', practitionerId ?? ''],
      queryFn: () => fetchPatientsWithModules(practitionerId!),
      enabled: practitionerId != null,
    }),

  pendingInvitations: (practitionerId: string | undefined) =>
    queryOptions({
      queryKey: ['dashboard', 'pendingInvitations', practitionerId ?? ''],
      queryFn: () => fetchPendingInvitations(practitionerId!),
      enabled: practitionerId != null,
    }),

  inviteCategories: () =>
    queryOptions({
      queryKey: ['dashboard', 'inviteCategories'],
      queryFn: fetchInviteCategories,
    }),
}

// Envoi d'une invitation. En cas de succès, invalide la liste des invitations en
// attente du praticien concerné (recharge automatique).
export function useSendInvitation() {
  const queryClient = useQueryClient()
  return useMutation<SendInvitationResult, Error, InvitationDraft>({
    mutationFn: sendInvitation,
    onSuccess: (result, variables) => {
      if (result.ok) {
        queryClient.invalidateQueries({
          queryKey: dashboardQueries.pendingInvitations(variables.practitionerId).queryKey,
        })
      }
    },
  })
}
