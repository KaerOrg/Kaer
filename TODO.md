# TODO — Dette technique à résorber

> Liste de travail vivante. Quand une ligne tombe à zéro, la cocher et passer la règle
> correspondante en `error` pour verrouiller le gain.

## 1. Callbacks inline dans le render (`react/jsx-no-bind`)

**Pourquoi.** Un `onClick={() => …}` / `onChange={e => …}` écrit directement dans le JSX
recrée une fonction à **chaque render** : casse `React.memo`, provoque des re-rendus
parasites et des boucles d'effets. Règle projet : `.claude/rules/coding-standards.md`
→ « Render — zéro déclaration inline ».

**État.** Règle `react/jsx-no-bind` active en **`warn`** dans `apps/web/eslint.config.js`
(désactivée dans les `*.test.tsx`). **164 warnings sur 41 fichiers** au 2026-06-03.

**Cible.** Résorber fichier par fichier, puis passer la règle en **`error`**.

**Comment corriger.**
- Callback passé à un enfant → `useCallback`.
- Per-item dans un `.map()` → extraire un **composant feuille mémoïsé** (`memo`) qui
  fige le closure via `useCallback` interne. Références : `CaseloadTable/WaitItem.tsx`,
  `ActionItem.tsx`, `CareTag.tsx`. Le parent passe un callback stable `(id) => void`.
- Objet/tableau en prop (`style={{}}`, `action={{}}`) → `useMemo` / variable pré-calculée.

**Suivi de progression** (`npx eslint --format json . | …`, voir compteur ci-dessus) :

- [ ] `src/pages/PatientPage/tabs/PatientModulesTab.tsx` — 25
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
- [ ] `src/components/features/CaseloadTable/ActionItem.tsx` — 2
- [ ] `src/components/features/CaseloadTable/CaseloadFilters.tsx` — 2
- [ ] `src/components/features/ModuleRenderer/fields/widgets/BooleanWidget/BooleanWidget.tsx` — 2
- [ ] `src/components/ui/Chart/LineChart/LineChart.tsx` — 2
- [ ] `src/pages/ModuleCatalogPage/ModuleCatalogPage.tsx` — 2
- [ ] Fichiers à 1 warning (≈ 20) : `ActivityFeedPanel`, `CaseloadTable/StatusCell`,
      `CaseloadTable/WaitItem`, `ModuleRenderer/FieldRenderer/LayoutDispatcher`, widgets
      `Checkbox`/`Slider`, layouts `Cards`/`ExposureHierarchy`/`PsyEdu`/`SliderDashboard`/`Tabs`,
      `ui/Accordion`, `ui/Modal`, `ui/SearchInput`, `ui/Tabs`, `ui/Toast`, `ui/Toggle`,
      `ModulePreviewPage`, `PatientPage/tabs/PatientEvolutionTab`, `PatientOverviewTab`.

## 2. `react-hooks/static-components` (préexistant)

- [ ] `src/components/ui/Chart/LineChart/LineChart.tsx:124` — `error` :
      « Cannot create components during render ». **Fait échouer `npm run lint`** (1 error).
      Présent sur `HEAD` avant la création du `Chip` — à corriger pour rendre le lint vert.
