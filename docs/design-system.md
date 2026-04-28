# Design System — PsyTool

Tokens partagés entre web et mobile, définis dans `packages/shared/src/theme.ts` et importés via `@psytool/shared`.

## Tokens partagés

### Couleurs

| Token | Valeur | Usage |
|---|---|---|
| `colors.primary` | `#2563EB` | Boutons, icônes actives, bordures focus |
| `colors.primaryLight` | `#EFF6FF` | Fond des états actifs/sélectionnés |
| `colors.background` | `#F8F9FA` | Fond de page |
| `colors.card` | `#FFFFFF` | Surface des cartes et champs |
| `colors.text` | `#111827` | Texte principal |
| `colors.textMuted` | `#6B7280` | Texte secondaire, placeholders |
| `colors.border` | `#E5E7EB` | Bordures, séparateurs |
| `colors.success` | `#10B981` | États positifs |
| `colors.successLight` | `#F0FDF4` | Fond état positif |
| `colors.warning` | `#F59E0B` | États d'avertissement, étoiles |
| `colors.danger` | `#EF4444` | États d'erreur |
| `colors.dangerLight` | `#FEF2F2` | Fond état erreur |
| `colors.stars` | `#F59E0B` | Étoiles (StarsWidget) |
| `colors.white` | `#FFFFFF` | Texte sur fond coloré |

### Spacing

| Token | Valeur |
|---|---|
| `spacing.xs` | `4px` / `4` |
| `spacing.sm` | `8px` / `8` |
| `spacing.md` | `16px` / `16` |
| `spacing.lg` | `24px` / `24` |
| `spacing.xl` | `32px` / `32` |

### Radius

| Token | Valeur | Usage |
|---|---|---|
| `radius.sm` | `6` | Champs, inputs |
| `radius.md` | `10` | Cartes |
| `radius.lg` | `16` | Modales, panels |
| `radius.full` | `999` | Pills, badges |

### Taille de police

| Token | Valeur | Usage |
|---|---|---|
| `fontSize.caption` | `14` | Labels secondaires |
| `fontSize.body` | `16` | Corps de texte |
| `fontSize.h3` | `18` | Titre de section |
| `fontSize.h2` | `22` | Titre de carte |
| `fontSize.h1` | `28` | Titre de page |

## Import

```ts
// Web
import { colors, spacing, radius, fontSize } from '@psytool/shared'

// Mobile — via re-export du barrel local
import { colors, spacing, radius, fontSize } from '../../theme'
// (apps/mobile/src/theme/index.ts re-exporte @psytool/shared + ajoute typography et shadows)
```

## Règle d'or

Ne jamais hardcoder une couleur, une valeur de spacing ou un radius dans le code.  
Toujours utiliser les tokens — `colors.primary`, `spacing.md`, `radius.sm`, etc.

## Documentation spécifique par plateforme

- **Web** → `apps/web/DESIGN_SYSTEM.md` : CSS custom properties, classes de layout, widgets HTML
- **Mobile** → `apps/mobile/DESIGN_SYSTEM.md` : StyleSheet patterns, Teen mode, shadows React Native
