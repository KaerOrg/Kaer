# Memory Index

- [React version split mobile/web](project_react_versions.md) — Mobile figé à react@19.1 (react-native-renderer), web@19.2 ; 3 invariants à ne pas casser dans package.json/vite.config
- [Nouveau module = config en base](feedback_module_database_config.md) — Tout module passe par SQL (modules/module_content_fields/field_props), jamais de code hardcodé frontend
- [Architecture modules DB first (projet)](project_module_engine_principle.md) — Décision architecturale 2026-04-28 : FieldRenderer rend automatiquement, écran dédié seulement si interaction complexe
- [card_inline — variantes pas types séparés](feedback_card_inline_variants.md) — card_inline_bold/text sont variantes d'un seul type card_inline ; ne pas les traiter comme types indépendants
