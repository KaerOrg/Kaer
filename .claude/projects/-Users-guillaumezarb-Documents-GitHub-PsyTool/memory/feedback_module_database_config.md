---
name: Nouveau module = config en base, pas de code hardcodé
description: Tout nouveau module thérapeutique doit être créé via des entrées SQL dans les tables du moteur (modules, module_content_fields, field_props), jamais en dupliquant ou en hardcodant la logique dans le frontend.
type: feedback
---

Tout nouveau module passe exclusivement par la configuration en base de données. Ne jamais coder en dur un module dans le frontend.

**Why:** Le moteur de rendu (FieldRenderer web + mobile) lit les tables `modules`, `module_content_fields` et `field_props` pour construire dynamiquement chaque module. Coder un module directement dans le frontend court-circuite ce circuit, crée de la duplication, et rend la maintenance impossible à l'échelle.

**How to apply:**
1. Ajouter une ligne dans `modules` (module_type, category_key, preview_kind, step_count, active)
2. Ajouter les lignes dans `module_content_fields` (field_type, label, step_number, sort_order…)
3. Ajouter les lignes dans `field_props` (prop_key / prop_value pour chaque champ)
4. Appliquer via migration Supabase (MCP `apply_migration`)
5. Vérifier que `fetchModuleFields()` retourne l'arbre attendu
6. Le rendu web ET mobile se fait automatiquement via FieldRenderer — aucun composant spécifique au module à créer sauf cas d'interaction complexe (ex : grille 2×2 interactive, timer)
Circuit complet documenté dans `docs/module-engine.md`.
