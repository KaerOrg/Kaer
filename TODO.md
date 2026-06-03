# TODO — Dette technique à résorber

> Liste de travail vivante. Quand une ligne tombe à zéro, la cocher et passer la règle
> correspondante en `error` pour verrouiller le gain.

## 1. Callbacks inline dans le render (`react/jsx-no-bind`)

**Pourquoi.** Un `onClick={() => …}` / `onChange={e => …}` écrit directement dans le JSX
recrée une fonction à **chaque render** : casse `React.memo`, provoque des re-rendus
parasites et des boucles d'effets. Règle projet : `.claude/rules/coding-standards.md`
→ « Render — zéro déclaration inline ».

**État.** Règle `react/jsx-no-bind` active en **`warn`** dans `apps/web/eslint.config.js`
(désactivée dans les `*.test.tsx`). **147 warnings sur 33 fichiers** au 2026-06-03.

> ✅ **Les 17 warnings introduits par la branche `tableau-de-bord-outil-de-suivi` sont résorbés**
> (CaseloadTable `ActionItem`/`WaitItem`/`StatusCell`/`CaseloadFilters`, `Tabs`→`TabButton`,
> `LineChart`, `SliderDashboardLayout`, `PatientEvolutionTab`, `PatientModulesTab`→extraction
> `MedicationSideEffectsCard` + `SideEffectToggleRow`/`CustomEffectRow`). Le reste ci-dessous
> est de la dette préexistante, hors périmètre de la PR.

**Cible.** Résorber fichier par fichier, puis passer la règle en **`error`**.

**Comment corriger.**
- Callback passé à un enfant → `useCallback`.
- Per-item dans un `.map()` → extraire un **composant feuille mémoïsé** (`memo`) qui
  fige le closure via `useCallback` interne. Références : `CaseloadTable/WaitItem.tsx`,
  `ActionItem.tsx`, `CareTag.tsx`, `ui/Tabs/TabButton.tsx`. Parent passe un callback stable `(id) => void`.
- Variable `const x = (…) => …` dans le corps du composant passée en prop → la règle la
  flague aussi (elle résout la définition). La stabiliser via `useCallback`.
- Objet/tableau en prop (`style={{}}`, `action={{}}`) → `useMemo` / variable pré-calculée.

**Suivi de progression** (dette préexistante, `npx eslint --format json .`) :

- [ ] `src/pages/PatientPage/tabs/PatientModulesTab.tsx` — 19
- [ ] `src/pages/PatientPage/tabs/PatientNotesTab.tsx` — 19
- [ ] `src/components/features/CSSRSScreenPanel.tsx` — 17
- [ ] `src/pages/DashboardPage/DashboardPage.tsx` — 12
- [ ] `src/components/features/AppointmentModal/AppointmentModal.tsx` — 11
- [ ] `src/pages/LoginPage/LoginPage.tsx` — 8
- [ ] `src/components/features/NotificationRoutineModal/NotificationRoutineModal.tsx` — 6
- [ ] `src/pages/PatientPage/PatientPage.tsx` — 6
- [ ] `src/pages/ProfilePage/ProfilePage.tsx` — 6
- [ ] `src/pages/AgendaPage/AgendaPage.tsx` — 4
- [ ] `src/pages/PatientPage/tabs/PatientRdvTab.tsx` — 4
- [ ] `src/pages/PatientRegisterPage/PatientRegisterPage.tsx` — 4
- [ ] `src/components/features/AvailabilityEditor/AvailabilityEditor.tsx` — 3
- [ ] `src/components/features/Layout/ProfileDropdown/ProfileDropdown.tsx` — 3
- [ ] `src/components/features/ModuleRenderer/fields/widgets/StarsWidget/StarsWidget.tsx` — 3
- [ ] `src/components/features/WeekGrid/WeekGrid.tsx` — 3
- [ ] `src/components/features/ModuleRenderer/fields/widgets/BooleanWidget/BooleanWidget.tsx` — 2
- [ ] `src/pages/ModuleCatalogPage/ModuleCatalogPage.tsx` — 2
- [ ] Fichiers à 1 warning (15) : `ActivityFeedPanel`, `ModuleRenderer/FieldRenderer/LayoutDispatcher`,
      widgets `Checkbox`/`Slider`, layouts `Cards`/`ExposureHierarchy`/`PsyEdu`/`Tabs`,
      `ui/Accordion`, `ui/Modal`, `ui/SearchInput`, `ui/Toast`, `ui/Toggle`,
      `ModulePreviewPage`, `PatientPage/tabs/PatientOverviewTab`.

## 2. `react-hooks/static-components` (préexistant)

- [ ] `src/components/ui/Chart/LineChart/LineChart.tsx:134` — `error` :
      « Cannot create components during render » (`buildTooltipContent` crée un composant
      pendant le render). **Fait échouer `npm run lint`** (seule `error`). Hors périmètre PR.
