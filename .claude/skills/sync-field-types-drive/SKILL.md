---
name: sync-field-types-drive
description: Synchronise l'inventaire des field_types PsyTool vers Google Sheets via le MCP google-docs. Interroge la base Supabase, scanne le code, met à jour uniquement les cellules qui ont changé. Triggers — "sync field types", "synchronise l'inventaire", "mets à jour le fichier field_types", "rafraîchis l'inventaire des field_types".
---

# Sync Field Types → Google Sheets (MCP google-docs)

Ce skill synchronise l'inventaire des `field_type` PsyTool **directement dans le Google Sheet existant**, en mettant à jour uniquement les données qui ont changé — pas de recréation du fichier.

## Google Sheet cible

ID : `1gsaERM4jsOwHBmdW9QVKgOEMXZIZflDKh3_OsqDcotc`  
Onglet principal : `field_types_inventory` (premier onglet)

## MCP à utiliser

**`google-docs`** (MCP installé localement via `@a-bonus/google-docs-mcp`)

Outils Sheets disponibles :
- `readSpreadsheet` — lire une plage en notation A1
- `writeSpreadsheet` — écrire sur une plage
- `appendRows` — ajouter des lignes
- `clearRange` — vider une plage

## Étapes

### 1. Lire l'état actuel du Sheet

```
Tool: readSpreadsheet
spreadsheetId: 1gsaERM4jsOwHBmdW9QVKgOEMXZIZflDKh3_OsqDcotc
range: A1:G300
```

Construire un index `field_type → numéro de ligne` à partir des données lues.

### 2. Récupérer les field_types en base (Supabase)

```sql
-- Via mcp__supabase__execute_sql, project: phitpvzzhseucqprdtzh
SELECT field_type, COUNT(*) as utilisations
FROM module_content_fields
GROUP BY field_type
ORDER BY field_type;
```

### 3. Scanner le code

Fichiers clés pour détecter les `field_type` gérés côté code :

- `apps/web/src/components/features/ModuleRenderer/FieldRenderer.tsx`
- `apps/web/src/components/features/ModuleRenderer/fields/FieldText/FieldText.tsx` — CONFIG record
- `apps/web/src/components/features/ModuleRenderer/layouts/CardsLayout/renderCardBody.tsx` — FIELD_REGISTRY
- `apps/mobile/src/components/features/ModuleRenderer/FieldRenderer.tsx`

```bash
grep -rn "field_type\b" apps/web/src/components/features/ModuleRenderer/ apps/mobile/src/components/features/ModuleRenderer/ --include="*.tsx" --include="*.ts"
```

### 4. Comparer et construire le diff

Pour chaque `field_type` dans le résultat Supabase :

- **Nouveau** (absent du Sheet) → préparer une ligne à ajouter via `appendRows`
- **Existant** → comparer la colonne `Utilisations` (col F) et `Base` (col E)
  - Si la valeur a changé → préparer une mise à jour cellule par cellule via `writeSpreadsheet`

Pour chaque `field_type` dans le code mais **absent de la base** :
- Vérifier si la ligne existe dans le Sheet
- Marquer `Base = NON` si elle était `OUI`

### 4b. Supprimer les field_types morts (Base = NON)

> **Règle fondamentale** : la source de vérité est le couple **code + données Supabase**.  
> Un `field_type` absent de `module_content_fields` (Base = NON, Utilisations = 0) est du code mort.  
> Il doit être supprimé partout : code, tests, docs et Sheet.

Pour chaque `field_type` avec `Base = NON` :

1. **Code web** — supprimer dans :
   - `apps/web/src/components/features/ModuleRenderer/fields/FieldText/FieldText.tsx` (entrée CONFIG)
   - `apps/web/src/components/features/ModuleRenderer/FieldRenderer.tsx` (import + branch dispatch)
   - `apps/web/src/components/features/ModuleRenderer/layouts/` (layout entier si c'est un `preview_kind`)
   - `apps/web/src/components/features/ModuleRenderer/layouts/index.ts` (re-export)

2. **Code mobile** — supprimer dans :
   - `apps/mobile/src/components/features/ModuleRenderer/fields/FieldText/FieldText.tsx`
   - `apps/mobile/src/components/features/ModuleRenderer/FieldRenderer.tsx`
   - `apps/mobile/src/screens/modules/ModuleContentScreen.tsx` (`SELF_MANAGED_LAYOUTS` si applicable)

3. **Tests** — supprimer les blocs `describe` ou cas `it` correspondants dans :
   - `apps/web/src/components/features/ModuleRenderer/FieldRenderer.test.tsx`
   - `apps/web/src/components/features/ModuleRenderer/fields/FieldText/FieldText.test.tsx`
   - `apps/mobile/src/components/features/ModuleRenderer/FieldRenderer.test.tsx`
   - `apps/mobile/src/components/features/ModuleRenderer/fields/FieldText/FieldText.test.tsx`
   - Tout fichier `*.test.tsx` dédié au `field_type` supprimé → supprimer le fichier entier

4. **Documentation** — mettre à jour :
   - `docs/module-engine.md` (inventaire des field_types + section layout si applicable)
   - `apps/web/docs/components/module-renderer.md`

5. **Seed SQL** — vérifier et corriger si un module utilise encore l'ancien `preview_kind` :
   - `supabase/seed.sql`

6. **Sheet** — supprimer la ligne du Sheet (ou ignorer lors du write-back final)

### 5. Appliquer les mises à jour

**Mise à jour d'une cellule existante (ex. colonne Utilisations) :**
```
Tool: writeSpreadsheet
spreadsheetId: 1gsaERM4jsOwHBmdW9QVKgOEMXZIZflDKh3_OsqDcotc
range: F{numéro_de_ligne}
values: [["{nouveau_count}"]]
```

**Ajout de nouvelles lignes :**
```
Tool: appendRows
spreadsheetId: 1gsaERM4jsOwHBmdW9QVKgOEMXZIZflDKh3_OsqDcotc
sheetName: field_types_inventory (ou le nom de l'onglet actuel)
values: [["Purpose", "field_type_nouveau", "NON", "OUI", "OUI", "3", "Description à compléter"]]
```

### 6. Résumé à afficher

À la fin, afficher :
- Nombre total de `field_type` en base
- Nombre de lignes mises à jour (Utilisations changées)
- Nombre de nouvelles lignes ajoutées
- Nombre de `field_type` morts supprimés (Base = NON → code + tests + docs + Sheet nettoyés)

## Structure des colonnes

| Col | En-tête | Valeurs |
|---|---|---|
| A | Purpose | Générique / fields / steps / cards / etc. |
| B | field_type | Nom technique |
| C | Doc | OUI / NON |
| D | Code | OUI / NON |
| E | Base | OUI / NON |
| F | Utilisations | Nombre entier ou vide |
| G | Description | Texte libre |

## Table de purpose (mapping préfixe → catégorie)

| Préfixe | Purpose |
|---|---|
| `module_`, `coming_soon`, `footer_note`, `disclaimer_banner`, `tab` | Générique |
| `field_row` | fields |
| `step_`, `exercise_safety`, `crisis_` | steps |
| `card_` | cards |
| `scale_` | questionnaire |
| `exercise_` (hors `exercise_safety`) | guided_exercise |
| `rim_`, `ambient_` | patient_scenario |
| `column_` | column_form |
| `daily_` | daily_checkin |
| `sleep_journal_` | sleep_journal |
| `tree_` | tree_selector |
| `decision_grid_` | decision_grid |
| `exposure_tracker_` | exposure_tracker |
| `activity_log_` | activity_log |

## Règles importantes

**Ne jamais vider ni recréer la plage entière.** `clearRange` est **INTERDIT** — il détruit les descriptions (col G) et tout contenu manuel. Chaque appel `writeSpreadsheet` cible uniquement la cellule qui a changé (ex. `F12` pour Utilisations, `E12` pour Base). Ne jamais écrire la colonne G (Description) — elle appartient à l'utilisateur.

**Source de vérité = code + données Supabase.** La doc (Sheet + fichiers `.md`) se synchronise par rapport à ces deux sources, jamais l'inverse. Un `field_type` absent de `module_content_fields` est du code mort — le supprimer partout (étape 4b) sans demander confirmation.
