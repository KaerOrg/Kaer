import { hasSetupFallback, resolveInitialPreviewKind } from './initialPreviewKind'

// Le mécanisme est conservé alors que plus aucun layout ne l'utilise (P-1, #316) : il
// est déclaratif, testé, et resservira au premier module qui aura une vraie
// configuration initiale à faire en séance. Ces tests le gardent vivant.
describe('initialPreviewKind — bascule config-first quand vide', () => {
  describe('hasSetupFallback', () => {
    // Le plan de sécurité a QUITTÉ la bascule : un plan vide ne doit plus jamais
    // ouvrir l'Édition. Le praticien écrit désormais directement dans le plan depuis
    // le web (PW-1), et le patient qui ouvre « Mon plan » veut relire, pas remplir un
    // formulaire.
    it('faux pour safety_plan : un plan vide n\'ouvre plus l\'Édition', () => {
      expect(hasSetupFallback('safety_plan')).toBe(false)
    })

    it('faux pour le layout de paramétrage lui-même (editable_steps)', () => {
      expect(hasSetupFallback('editable_steps')).toBe(false)
    })

    it('faux pour un layout sans setup-fallback', () => {
      expect(hasSetupFallback('daily_checkin')).toBe(false)
      expect(hasSetupFallback('questionnaire')).toBe(false)
    })
  })

  describe('resolveInitialPreviewKind', () => {
    it('safety_plan reste la consultation, plan vide ou non', () => {
      expect(resolveInitialPreviewKind('safety_plan', false)).toBe('safety_plan')
      expect(resolveInitialPreviewKind('safety_plan', true)).toBe('safety_plan')
    })

    it('layout sans setup-fallback → inchangé, que les données existent ou non', () => {
      expect(resolveInitialPreviewKind('daily_checkin', false)).toBe('daily_checkin')
      expect(resolveInitialPreviewKind('daily_checkin', true)).toBe('daily_checkin')
    })

    it('aucun layout ne bascule aujourd\'hui : la map est vide, pas cassée', () => {
      const kinds = ['safety_plan', 'editable_steps', 'daily_checkin', 'questionnaire'] as const
      for (const kind of kinds) {
        expect(resolveInitialPreviewKind(kind, false)).toBe(kind)
      }
    })
  })
})
