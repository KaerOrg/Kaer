import { hasSetupFallback, resolveInitialPreviewKind } from './initialPreviewKind'

describe('initialPreviewKind — bascule config-first quand vide', () => {
  describe('hasSetupFallback', () => {
    it('vrai pour un layout de consultation à setup-fallback (safety_plan)', () => {
      expect(hasSetupFallback('safety_plan')).toBe(true)
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
    it('plan vide → bascule vers le paramétrage', () => {
      expect(resolveInitialPreviewKind('safety_plan', false)).toBe('editable_steps')
    })

    it('plan rempli → reste sur la consultation', () => {
      expect(resolveInitialPreviewKind('safety_plan', true)).toBe('safety_plan')
    })

    it('layout sans setup-fallback → inchangé, que les données existent ou non', () => {
      expect(resolveInitialPreviewKind('daily_checkin', false)).toBe('daily_checkin')
      expect(resolveInitialPreviewKind('daily_checkin', true)).toBe('daily_checkin')
    })
  })
})
