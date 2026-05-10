# ModuleRenderer — Web

> Architecture complète (DB → service → moteur → composants) : **`MODULE_ENGINE.md`** à la racine.  
> Design system web (classes CSS, widgets) : **`apps/web/DESIGN_SYSTEM.md`**.

Ce fichier documente uniquement les détails spécifiques à l'implémentation web.

---

## Table de config `FieldText` (web)

`FieldText` dispatche par `field.field_type` dans une table statique `CONFIG` :

| `field_type` | Tag HTML | Wrapper | Classe CSS | Note |
|---|---|---|---|---|
| `card_heading_2` | `h2` | — | — | — |
| `card_heading_3` | `h3` | — | — | — |
| `card_heading_4` | `h4` | — | — | — |
| `card_paragraph` | `p` | — | — | — |
| `card_paragraph_bold` | `p` | `<strong>` | — | — |
| `card_italic_note` | `p` | `<em>` | — | — |
| `card_callout` | `p` | — | — | `style` inline via `props['color']` |
| `footer_note` | `p` | — | `preview-panel__footer` | Filtré en amont, affiché séparément |
| `step_title` | `div` | — | `preview-step__title` | Couleur via `props['color']` |
| `step_hint` | `div` | — | `preview-step__hint` | Guillemets ajoutés |
| `quadrant_title` | `div` | — | `preview-quadrant__title` | Couleur via `props['color']` |
| `quadrant_subtitle` | `div` | — | `preview-quadrant__subtitle` | — |
| `card_title` | `span` | — | `preview-card__title` | — |
| `card_summary` | `span` | — | `preview-card__summary` | — |

---

## Ajouter un `field_type` textuel

1. Ajouter une ligne dans `CONFIG` de `FieldText/FieldText.tsx`
2. Écrire le test dans `FieldText/FieldText.test.tsx`

## Ajouter un `field_type` structuré (HTML distinct)

1. Créer `fields/MonComposant/MonComposant.tsx` + `MonComposant.test.tsx` + `index.ts`
2. Exporter dans `fields/index.ts`
3. Enregistrer dans `FIELD_REGISTRY` de `FieldRenderer.tsx`

## Layout `daily_checkin`

Aperçu passif du module mobile « 1 statut par jour » (ex. `medication_adherence`).
Le layout consomme les `field_type` suivants (résolus par `field_type`, pas par
`section_id`) :

| `field_type` | Rôle |
|---|---|
| `daily_checkin_config` | Marqueur (props `engagement_event_type`) |
| `daily_tab_today_label` / `daily_tab_history_label` | Onglets simulés |
| `daily_today_label` | Bandeau date du jour |
| `daily_question` | Question posée au patient |
| `daily_status_option` (×N) | Pastilles de statut, triées par `sort_order`, couleurs depuis `props.color` / `props.bg_color` |
| `daily_notes_label` / `daily_notes_placeholder` | Bloc notes inactif |
| `daily_save_label` | Libellé du bouton sauvegarder |
| `daily_history_empty_text` | État vide de l'onglet historique |

Aucun rendu interactif : tabs, boutons et zone de notes sont des `<span>` /
`<div>` stylés, en lecture seule.

## Ajouter un `preview_kind`

1. Créer le layout (fonction dans `FieldRenderer.tsx`)
2. Ajouter le cas dans le dispatch `FieldRenderer`
3. Ajouter les classes CSS dans `ModulePreviewPanel.css`
4. Mettre à jour `MODULE_ENGINE.md`
