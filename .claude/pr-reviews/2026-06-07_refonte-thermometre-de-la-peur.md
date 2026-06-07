# PR Review — refonte-thermometre-de-la-peur

**Date :** 2026-06-07  
**PR :** #39 — Exposition graduée — parcours d'exposition unifié (mobile + aperçu web) + retrait exposure_hierarchy  
**Reviewer :** Claude Sonnet 4.6 (skill `pr-review`)  
**Commentaire GitHub :** https://github.com/KaerOrg/Kaer/pull/39#issuecomment-4644173709

---

## Résumé

Refonte du module `fear_thermometer` : layout `exposure_tracker` unifié (4 modes : ladder → steps → detail → exposure), retrait du module `exposure_hierarchy`, aperçu web praticien complet.

CI : 5 jobs ✅, 734 tests.

## Violations bloquantes

### V1 · `ExposureTrackerLayout.tsx:30` (web) — layout hardcode le module_id
```ts
// ❌
const lbl = useMemo(() => (key: string) => t(`modules.fear_thermometer.${key}`), [t])
// ✅
const moduleId = useMemo(() => fields[0]?.module_id ?? 'fear_thermometer', [fields])
const lbl = useCallback((key: string) => t(`modules.${moduleId}.${key}`), [t, moduleId])
```
Règle : un layout générique ne hardcode pas le module_id — il le dérive depuis `fields[0]?.module_id`.

### V2 · `ModuleContentScreen.tsx:162` (mobile) — couleur en dur
```ts
// ❌
retryBtnText: { color: '#fff', fontWeight: '600' },
// ✅
retryBtnText: { color: colors.white, fontWeight: '600' },
```
`colors.white = '#FFFFFF'` existe dans `@psytool/shared`. `colors` est importé ligne 18.

## Points d'attention

- `SessionCard.tsx:62` — `key={i}` sur labels de stratégie sans id stable
- `ExposureStepDetailView.tsx:40` — `key={i}` sur mock data (faible impact)
- `styles.ts:84,318` — `shadowColor: '#000'` inline au lieu de `...shadows.md`
- `ModulePreviewPanel.css:1801,3522,3546` — `color: white` (named color hors tokens)
- `PatientEvolutionTab.tsx` — pas de chart `fear_thermometer` (hors périmètre, pré-existant)

## Points conformes notables

- `syncUpsert`/`syncDelete` : 4 cas couverts, `EntryKind` déclarés avant le service
- MDR 2017/745 : zéro interprétation, zéro seuil — mentions JSDoc explicites
- i18n : parité fr/en 79 clés, teen.json complet pour les nouvelles clés exposition
- Seed idempotent DELETE+INSERT, config-first pour toutes les stratégies
- Architecture couches : composants présentationnels corrects (props + callbacks)
- Tests : logique pure + parcours intégration complets
