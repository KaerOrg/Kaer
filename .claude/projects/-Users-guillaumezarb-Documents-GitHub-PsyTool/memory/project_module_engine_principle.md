---
name: Architecture modules — DB first, rendu automatique
description: Décision architecturale fondamentale : tout nouveau module thérapeutique est défini en base de données (tables modules/module_content_fields/field_props), le rendu web+mobile est automatique via FieldRenderer.
type: project
---

Tout nouveau module thérapeutique passe exclusivement par la configuration en base de données. Le FieldRenderer (web et mobile) rend automatiquement n'importe quel module correctement configuré — aucun composant frontend spécifique à créer sauf interaction complexe.

**Why:** Décision prise le 2026-04-28 pour garantir la scalabilité du catalogue (22 modules actuels, des dizaines prévus). Coder un module en dur dans le frontend crée de la duplication non maintenable.

**How to apply:**
1. Nouvelle ligne dans `modules` (id, category_id, preview_kind, sort_order, is_invite_excluded)
2. Lignes dans `module_content_fields` (field_type, section_id, text_code, sort_order)
3. Lignes dans `field_props` (widget_type, icon, color, detail_code…)
4. Appliquer via MCP Supabase apply_migration
5. Vérifier fetchModuleFields() → rendu automatique web + mobile
6. Écran dédié UNIQUEMENT si interaction complexe impossible en champs (timer, animation, flux multi-écrans)
Checklist complète dans `docs/module-engine.md` section 7.
