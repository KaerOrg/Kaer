// Mémoire locale des écrans d'introduction vus une seule fois.
//
// Volontairement NON synchronisé : « cet écran a déjà été vu » est un état
// d'interface, pas une donnée clinique. Le répliquer côté serveur reviendrait à
// stocker une trace de navigation du patient sans aucune valeur de soin, ce que la
// minimisation RGPD nous demande d'éviter. C'est l'exception documentée prévue par
// `.claude/rules/sync-service.md` : pas de `syncUpsert` ici.
//
// Le stockage est local à l'appareil, donc au patient connecté (l'app mobile est
// mono-patient) : réinstaller l'app réaffiche l'écran, ce qui est le comportement
// souhaité, un nouvel appareil étant une première ouverture.

import { getModuleSetting, setModuleSetting } from '../lib/database'

const SEEN_KEY = 'onboarding_seen'

/** L'écran de première ouverture du module a-t-il déjà été vu sur cet appareil ? */
export async function hasSeenModuleOnboarding(moduleId: string): Promise<boolean> {
  return (await getModuleSetting(moduleId, SEEN_KEY)) === '1'
}

/**
 * Mémorise que l'écran a été vu. Appelé sur « J'ai compris », qui est un **accusé de
 * lecture**, pas un consentement : rien n'est journalisé, aucune version ni retrait
 * n'est géré, et l'utilisateur n'a rien à révoquer plus tard.
 */
export async function markModuleOnboardingSeen(moduleId: string): Promise<void> {
  await setModuleSetting(moduleId, SEEN_KEY, '1')
}
