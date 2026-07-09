---
date: 2026-07-09
branch: feat/crisis-plan-phase3-photo-carousel
pr_number: null
pr_url: null
ci_pass: true
merge_clean: true
violations:
  mdr: 0
  data_access: 0
  typescript: 0
  i18n: 0
  tests: 0
  docs: 0
  design_system: 0
  config_first: 0
  rls_schema: 0
  one_component_per_file: 0
  teen_mode: 0
warnings: 1
files_created: 3
files_modified: 11
rules_enriched: 0
---

# PR Review — feat/crisis-plan-phase3-photo-carousel
Date : 2026-07-09

## CI GitHub Actions
| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ (0 erreur) |
| test-web | `cd apps/web && npx vitest run` | ✅ (1075) |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ (1006, 130 suites) |

## Synchronisation avec main
- Merge `origin/main` : propre (branche déjà à jour)
- Conflits : aucun

## Fichiers analysés
- Créés : 3 (`PhotoCarousel.tsx` + `.test.tsx` + `index.ts`, mock `expo-image.tsx`)
- Modifiés : 11 (widget + test, i18n ×8, docs ×2, theme partagé, package.json)

## Résumé
| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 0 |
| ⚠️ Points d'attention | 1 |
| ✅ Conformes | reste sans remarque |

## 🚫 VETO MDR
Aucun. Visionneuse photo = affichage passif du contenu du patient, zéro interprétation.

## 🚫 Violations bloquantes
Aucune.

## ⚠️ Points d'attention

### `apps/mobile/src/components/ui/PhotoCarousel/PhotoCarousel.tsx`
**`renderItem` — `<View style={{ width, height }}>` inline** : objet de style recréé à
chaque rendu d'item. Valeurs **dynamiques** (issues de `useWindowDimensions`), donc
autorisé par la règle « style inline = calcul dynamique ponctuel » ; `renderItem` est
déjà un `useCallback([width, height, testID])`. Pourrait être hoisté en style mémoïsé
si la liste devenait très longue. Non bloquant.

## ✅ Points positifs
- **Création légitime d'un primitive** : aucun `Modal`/carousel n'existait au design system ;
  `PhotoCarousel` est ajouté dans `ui/`, **documenté** (section dédiée + table de props dans
  `apps/mobile/docs/design-system.md`) et **testé** (7 tests : rendu, navigation, bornes,
  fermeture, cas 1 photo, index initial). Comportement attendu.
- **Zéro métier dans le primitive** : URIs et libellés d'accessibilité reçus par props,
  aucun service/store/i18n en dur — réutilisable par n'importe quelle galerie.
- **Token plutôt que valeur en dur** : voile opaque ajouté comme `colors.overlayStrong`
  dans `@kaer/shared`, référencé au lieu d'un `rgba(...)` figé dans le StyleSheet.
- **expo-image** : utilisé dans le carrousel **et** migration des vignettes du widget
  (react-native `Image` → `expo-image`, `contentFit`), conforme au coding-standard.
- **Animations** : uniquement opacité (fondu de la modale) + translation (pagination
  native FlatList) — aucun `Animated` custom.
- **État cohérent** : `viewer: { open, index }` en un seul objet (états solidaires),
  `anchorUris` mémoïsé, callbacks `openViewer`/`closeViewer` en `useCallback`.
- **i18n** : `carousel_prev`/`carousel_next` en common + teen fr/en (+ de/es/it/pt),
  libellés d'accessibilité fournis au primitive par le parent ; zéro tiret long.
- **Couverture d'intégration** : le widget teste réellement « tap → diaporama ouvert »
  (le `PhotoCarousel` n'est pas mocké chez son consommateur).

## Checklist finale
- [x] Design system d'abord (nouveau primitive légitime, documenté + testé)
- [x] ui/ zéro métier (props only)
- [x] TypeScript strict (zéro any/as unknown/suppression)
- [x] Render — callbacks/valeurs mémoïsés ; styles dynamiques justifiés
- [x] RN — `Pressable`, `expo-image`, texte dans `<Text>`, animations transform/opacity
- [x] Design system mobile — StyleSheet + tokens (`overlayStrong` ajouté au thème)
- [x] i18n — zéro texte en dur + parité fr/en + teen
- [x] MDR — affichage passif
- [x] Tests directs + intégration ; doc créée et indexée (inventaire + section)
- [x] Parité web ≡ mobile — feature mobile-only (photos locales privées), rien à répliquer côté web

📚 lessons.md déjà à jour — aucune violation bloquante, aucun cas à ajouter.
