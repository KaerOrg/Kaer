// Accompagnement sonore d'une session de respiration.
//
// ⚠️ ÉTAT ACTUEL : les fichiers audio n'existent pas encore dans le projet. Ce module
// est donc branché de bout en bout (les réglages de M2 l'atteignent, l'écran de session
// l'appelle aux bons instants) mais **ne joue rien**. Il est isolé ici précisément pour
// que l'arrivée des assets ne demande qu'UNE chose : remplir `AMBIENT_ASSETS` /
// `BREATH_ASSETS` et implémenter les quatre méthodes, sans toucher à l'écran.
//
// Contrat visé quand les fichiers seront là :
//   - ambiance  : boucle sans couture, fondu en début et en fin de session, volume
//                 sous celui du souffle guidé ;
//   - souffle   : enregistrement de respiration déclenché à chaque changement de
//                 phase, calé sur sa durée. JAMAIS de voix parlée (aucune voix en v1).

import type { BreathingAmbientSound, PhaseType } from '@services/breathingService'

/** Ce que l'écran de session demande à l'accompagnement sonore. */
export interface SessionAudio {
  /** Démarre la boucle d'ambiance avec un fondu entrant. */
  startAmbient: (key: BreathingAmbientSound) => void
  /** Coupe l'ambiance avec un fondu sortant. */
  stopAmbient: () => void
  /** Joue le souffle correspondant à une phase, calé sur sa durée. */
  playBreath: (phase: PhaseType, phaseSeconds: number) => void
  /** Coupe tout immédiatement (sortie de l'écran, bouton muet). */
  stopAll: () => void
}

/**
 * Implémentation silencieuse, active tant que les assets manquent. Elle n'échoue
 * jamais et ne bloque rien : une session se déroule normalement, sans son.
 */
export const SILENT_AUDIO: SessionAudio = {
  startAmbient: () => {},
  stopAmbient: () => {},
  playBreath: () => {},
  stopAll: () => {},
}

/**
 * Accompagnement sonore courant. Renvoie `SILENT_AUDIO` tant qu'aucun fichier n'est
 * fourni. Le jour où les assets arrivent, c'est ici que l'implémentation réelle se
 * branche : l'écran de session, lui, ne change pas.
 */
export function getSessionAudio(): SessionAudio {
  return SILENT_AUDIO
}

/** Le son est-il réellement disponible ? Pilote l'affichage du bouton muet. */
export function hasAudioAssets(): boolean {
  return false
}
