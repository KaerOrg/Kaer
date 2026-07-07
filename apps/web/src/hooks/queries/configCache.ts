// Options React Query communes à toutes les lectures de config quasi-statique
// (échelles, module_content_fields, field_props, psyedu, référentiels catalogue).
//
// Ces données ne changent qu'au re-seed / déploiement — jamais pendant une session.
// D'où :
//   - staleTime Infinity : zéro re-fetch tant que l'app est ouverte (déduplication
//     parfaite entre écrans qui partagent la donnée) ;
//   - gcTime Infinity : le cache d'une query inactive n'est jamais purgé → rouvrir
//     un écran déjà consulté = 0 appel ;
//   - meta.configScoped : marqueur lu par `useConfigCacheSync` (#102) pour invalider
//     EN BLOC toutes les queries de config quand le jeton de version change — ce qui
//     rend un re-seed visible SANS rechargement de page, tout en gardant staleTime
//     Infinity. Voir docs/services.md § « config quasi-statique ».
export const CONFIG_QUERY_OPTIONS = {
  staleTime: Infinity,
  gcTime: Infinity,
  meta: { configScoped: true },
}
