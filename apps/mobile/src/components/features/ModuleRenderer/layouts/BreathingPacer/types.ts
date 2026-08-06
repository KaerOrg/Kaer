// Types partagés du dossier BreathingPacer (breathing_techniques).

/**
 * Résout un libellé du module (`modules.<moduleId>.<key>`), déjà arbitré teen ↔ common
 * par le layout. Les enfants ne connaissent ni le `moduleId` ni le mode ado.
 */
export type LabelFn = (key: string, params?: Record<string, string | number>) => string
