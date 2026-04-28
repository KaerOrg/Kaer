---
name: card_inline — variantes, pas types séparés
description: card_inline_bold et card_inline_text sont des variantes du même type card_inline, pas deux field_types indépendants. Le composant CardInline gère les deux via field_type discrimination.
type: feedback
---

`card_inline_bold` et `card_inline_text` sont des variantes du type conceptuel `card_inline`, pas des types distincts. Les documenter et les traiter comme deux types séparés est incorrect.

**Why:** Décision de conception explicite — le composant `CardInline` gère les deux cas via `field.field_type === 'card_inline_bold'` (→ `<strong>`) et fallback (→ `<span>`). C'est intentionnellement une seule abstraction avec deux modes de rendu.

**How to apply:** Quand le code contient plusieurs valeurs de `field_type` qui mappent vers le même composant React avec une discrimination interne, les documenter comme variantes d'un type, pas comme types indépendants. Toujours demander avant de créer une nouvelle entrée dans la table des field_types si une variation d'un type existant suffit.
