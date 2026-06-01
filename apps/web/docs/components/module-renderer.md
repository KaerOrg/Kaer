# ModuleRenderer — Web

> Architecture complète (DB → service → moteur → composants) : **`MODULE_ENGINE.md`** à la racine.  
> Design system web (classes CSS, widgets) : **`apps/web/DESIGN_SYSTEM.md`**.

Ce fichier documente uniquement les détails spécifiques à l'implémentation web.

---

## Table de config `FieldText` (web)

`FieldText` dispatche par `field.field_type` dans une table statique `CONFIG` :

| `field_type` | Tag HTML | Wrapper | Classe CSS | Note |
|---|---|---|---|---|
| `card_heading` | `h2`/`h3`/`h4` | — | — | Prop `level` : `'2'` (défaut), `'3'`, `'4'` |
| `card_paragraph` | `p` | — | — | Props `bold='true'` → `<strong>` / `italic='true'` → `<em>` |
| `card_callout` | `p` | — | — | `style` inline via `props['color']` |
| `footer_note` | `p` | — | `preview-panel__footer` | Filtré en amont, affiché séparément |
| `step_title` | `div` | — | `preview-step__title` | Couleur via `props['color']` |
| `step_hint` | `div` | — | `preview-step__hint` | Guillemets ajoutés |
| `card_title` | `span` | — | `preview-card__title` | — |
| `card_summary` | `span` | — | `preview-card__summary` | — |

---

## Ajouter un `field_type` textuel

1. Ajouter une ligne dans `CONFIG` de `FieldText/FieldText.tsx`
2. Écrire le test dans `FieldText/FieldText.test.tsx`

## Ajouter un `field_type` structuré (HTML distinct)

1. Créer `fields/MonComposant/MonComposant.tsx` + `MonComposant.test.tsx` + `index.ts`
2. Exporter dans `fields/index.ts`
3. Enregistrer dans `FIELD_REGISTRY` de `layouts/CardsLayout/renderCardBody.tsx`

## Layout `daily_checkin`

Aperçu passif du module mobile « 1 statut par jour » (ex. `medication_adherence`).
Le layout consomme les `field_type` suivants :

| `field_type` | Rôle |
|---|---|
| `daily_checkin_config` | Config principale — tous les libellés sont des **props** sur ce champ |
| `daily_status_option` (×N) | Pastilles de statut, triées par `sort_order`, couleurs depuis `props.color` / `props.bg_color` |

Props lues sur `daily_checkin_config` : `tab_today_label`, `tab_history_label`,
`today_label`, `already_saved_label`, `question`, `notes_label`, `notes_placeholder`,
`save_label`, `update_label`, `history_empty_text`, `status_missing_title`,
`status_missing_msg`, `delete_title`, `saved_message`.

Aucun rendu interactif : tabs, boutons et zone de notes sont des `<span>` /
`<div>` stylés, en lecture seule.

## Structure du dossier `FieldRenderer/`

Le moteur de rendu est éclaté en fichiers à **responsabilité unique** — un fichier =
un composant (ou un helper). `FieldRenderer/` ne contient **aucune** logique de layout :
chaque layout vit dans `layouts/*`.

| Fichier | Responsabilité unique |
|---|---|
| `FieldRenderer.tsx` | Point d'entrée — extrait un `disclaimer_banner`, délègue à `LayoutDispatcher` |
| `LayoutDispatcher.tsx` | Route un `preview_kind` vers son layout `layouts/*` |
| `DisclaimerBanner.tsx` | Rend le bandeau d'avertissement MDR |
| `partitionBySection.ts` | Helper pur — répartit les fields par `section_id` |
| `types.ts` | Type `FieldRendererProps` |
| `index.ts` | Re-exports publics |

> **Règle :** ne jamais ajouter de logique de layout, de groupement de fields ou de
> rendu de widget dans `FieldRenderer.tsx` ou `LayoutDispatcher.tsx`. Le dispatcher
> reste une simple table de routage `preview_kind → layout`.

## Ajouter un `preview_kind`

1. Créer le layout dans `layouts/MonLayout/MonLayout.tsx` (+ `index.ts` + test), l'exporter dans `layouts/index.ts`
2. Ajouter le cas de routage dans `FieldRenderer/LayoutDispatcher.tsx`
3. Ajouter les classes CSS dans `ModulePreviewPanel.css`
4. Mettre à jour `docs/module-engine.md`
