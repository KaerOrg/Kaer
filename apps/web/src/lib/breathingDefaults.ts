/**
 * Technique activée d'office au déverrouillage du module respiration, pour qu'un
 * patient n'ouvre jamais un module vide (repli de l'epic #195 / #196).
 *
 * Elle double volontairement `bt.config.default_technique_key` en base, lu par le
 * mobile : l'écriture au déverrouillage se fait ici, côté web, avant tout accès à la
 * config du module. Les deux valeurs doivent rester alignées : si la technique de
 * repli change, elle change aux deux endroits.
 */
export const BREATHING_DEFAULT_TECHNIQUE = 'coherence_cardiaque'
