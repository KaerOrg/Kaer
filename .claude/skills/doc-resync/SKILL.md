---
name: doc-resync
description: Resynchronise toute la documentation Kær avec la réalité du code et des données. Confronte chaque doc à sa source de vérité (fichiers sources, seeds SQL, composants, services), détecte les écarts, et applique les mises à jour. Triggers — "resync la doc", "mets à jour la doc", "la doc est en retard", "doc-resync", "synchronise la documentation", "vérifie que la doc est à jour".
---

# Doc Resync — Kær

Tu es un **archiviste technique**. Ta mission : confronter chaque document de référence Kær à la réalité observable du code et des données, détecter les écarts, et les corriger directement dans les fichiers. Tu ne te fies à aucun document existant — tu lis les sources primaires et tu écris ce que tu observes.

---

## Principe

> **Source de vérité = le code, les seeds SQL et les fichiers de types TypeScript.**  
> Les documents `.md` sont des reflets — ils peuvent dériver. Ce skill remet les reflets en phase avec la réalité.

Ne pas corriger une doc d'après une autre doc. Toujours remonter à la source primaire (fichier `.ts`, `.tsx`, `.sql`).

---

## Étape 0 — Inventaire des sources primaires

Lire ces fichiers en premier. Ils fournissent la vérité pour toutes les étapes suivantes.

```bash
# Modules déclarés côté web (source de vérité des ModuleType)
grep -n "ModuleType\|MODULE_LABELS\|MODULE_DESCRIPTIONS" \
  apps/web/src/lib/database.types.ts | head -80

# Modules câblés côté mobile (navigation + icônes)
grep -n "module_id\|case '" apps/mobile/src/screens/HomeScreen.tsx | head -60

# Échelles génériques déclarées
grep -n "GENERIC_SCALE_TYPES\|SCALE_SCORING" \
  apps/mobile/src/screens/HomeScreen.tsx \
  apps/mobile/src/lib/scaleScoring.ts 2>/dev/null | head -40

# Services existants web
ls apps/web/src/services/

# Services existants mobile
ls apps/mobile/src/services/

# Composants UI web
ls apps/web/src/components/ui/

# Composants UI mobile
ls apps/mobile/src/components/ui/

# Composants features web
ls apps/web/src/components/features/

# Tables SQL déclarées dans schema.sql
grep -n "^create table\|^CREATE TABLE" supabase/schema.sql

# preview_kind utilisés dans les seeds
grep -n "preview_kind" supabase/seed.sql supabase/seed/*.sql 2>/dev/null | grep -v "^--"

# Fichiers de doc modules individuels existants
ls docs/modules/
```

Construire mentalement :
- **Liste A** : tous les `ModuleType` déclarés dans `database.types.ts`
- **Liste B** : tous les modules câblés dans `HomeScreen.tsx` (mobile)
- **Liste C** : tous les services existants (web + mobile)
- **Liste D** : tous les composants UI et features (web + mobile)
- **Liste E** : toutes les tables SQL dans `schema.sql`
- **Liste F** : tous les `preview_kind` utilisés dans les seeds

---

## Étape 1 — Resync `docs/modules.md`

**Source primaire** : Listes A, B, F + écrans dans `apps/mobile/src/screens/modules/` + tables SQLite dans `apps/mobile/src/lib/database.ts`.

```bash
# Écrans de modules mobiles existants
ls apps/mobile/src/screens/modules/

# Tables SQLite par module
grep -n "CREATE TABLE\|createTable\|create table" apps/mobile/src/lib/database.ts | head -60

# preview_kind par module dans les seeds
grep -A2 "module_id.*=\|'module_id'" supabase/seed.sql 2>/dev/null | head -80
```

**Vérifications à faire :**

| Question | Source |
|---|---|
| Tous les modules de la Liste A sont-ils dans `docs/modules.md` ? | `database.types.ts` |
| Les `preview_kind` sont-ils corrects ? | seeds SQL |
| Les tables SQLite sont-elles exactes ? | `database.ts` |
| Les statuts (Implémenté / Prévu) sont-ils à jour ? | écrans existants + `HomeScreen.tsx` |
| Les liens `[doc](modules/<id>.md)` pointent-ils vers des fichiers réels ? | `ls docs/modules/` |

**Action** : mettre à jour `docs/modules.md` pour refléter exactement l'état observé.

---

## Étape 2 — Resync `CLAUDE.md` (état d'avancement)

**Source primaire** : Liste A, List B, git log récent.

```bash
git log --oneline -30
```

**Vérifications :**
- La liste compacte des modules implémentés dans `CLAUDE.md` correspond-elle à la Liste A ?
- Les features transverses citées (RGPD, MFA, RDV, File active) ont-elles leurs liens corrects ?
- Les items "Reste à faire" sont-ils encore vrais ?

**Action** : corriger les écarts dans `CLAUDE.md`. Ne pas ré-introduire de détails inline — garder le format sommaire avec pointeurs vers les docs.

---

## Étape 3 — Resync `docs/services.md`

**Source primaire** : Liste C (services existants).

```bash
# Lire docs/services.md
# Puis confronter avec la liste réelle
ls apps/web/src/services/
ls apps/mobile/src/services/
```

Pour chaque service existant dans le code :
- Est-il listé dans `docs/services.md` ?
- Sa description correspond-elle à ce que fait réellement le fichier ?

```bash
# Pour chaque service non documenté ou suspect, lire les exports
grep -n "^export" apps/web/src/services/<service>.ts
grep -n "^export" apps/mobile/src/services/<service>.ts
```

**Action** : ajouter les services manquants, corriger les descriptions erronées.

---

## Étape 4 — Resync design system web (`apps/web/docs/design-system.md`)

**Source primaire** : Liste D (composants réels).

```bash
ls apps/web/src/components/ui/
ls apps/web/src/components/features/
```

Pour chaque dossier de composant dans `components/ui/` et `components/features/` :
- Le composant a-t-il une section dans `apps/web/docs/design-system.md` ?
- Si oui, les props listées correspondent-elles au fichier source ?

```bash
# Lire les props d'un composant suspect
grep -n "interface.*Props\|type.*Props" apps/web/src/components/ui/<Nom>/<Nom>.tsx
```

**Action** : ajouter les composants manquants, corriger les props obsolètes. Chaque entrée doit avoir : chemin, description, props, exemple d'usage.

---

## Étape 5 — Resync design system mobile (`apps/mobile/docs/design-system.md`)

Même procédure que l'Étape 4 pour le mobile.

```bash
ls apps/mobile/src/components/ui/
ls apps/mobile/src/components/features/

grep -n "interface.*Props\|type.*Props" apps/mobile/src/components/ui/<Nom>/<Nom>.tsx
```

**Action** : même traitement — ajouter les manquants, corriger les obsolètes.

---

## Étape 6 — Resync `docs/module-engine.md` (inventaire field_types)

**Source primaire** : seeds SQL (`supabase/seed.sql`, `supabase/seed/*.sql`).

```bash
# Tous les field_type utilisés dans les seeds
grep -h "field_type" supabase/seed.sql supabase/seed/*.sql 2>/dev/null \
  | grep -oP "'[a-z_]+'" | sort -u

# Tous les preview_kind utilisés
grep -h "preview_kind" supabase/seed.sql supabase/seed/*.sql 2>/dev/null \
  | grep -oP "'[a-z_]+'" | sort -u
```

Confronter avec l'inventaire dans `docs/module-engine.md` :
- Tous les `field_type` observés sont-ils dans l'inventaire ?
- Tous les `preview_kind` observés ont-ils leur section de layout ?
- Des entrées de l'inventaire n'existent-elles plus dans les seeds ?

**Action** : ajouter les entrées manquantes, supprimer les entrées obsolètes.

---

## Étape 7 — Resync `docs/README.md` (index général)

```bash
# Tous les fichiers .md dans docs/
find docs/ -name "*.md" | sort
```

Confronter avec l'index dans `docs/README.md` :
- Chaque fichier `.md` existant est-il référencé dans l'index ?
- Des liens dans l'index pointent-ils vers des fichiers qui n'existent plus ?

**Action** : mettre à jour l'index. Ne pas modifier les docs listées — juste l'index.

---

## Étape 8 — Resync `docs/database.md`

**Source primaire** : `supabase/schema.sql`.

```bash
# Tables, colonnes clés, triggers, fonctions
grep -n "^create table\|^CREATE TABLE\|^create function\|^CREATE FUNCTION\|^create trigger" \
  supabase/schema.sql
```

Confronter avec `docs/database.md` :
- Toutes les tables sont-elles documentées ?
- Des colonnes ont-elles été ajoutées/supprimées depuis la dernière mise à jour de la doc ?
- Les triggers et fonctions clés sont-ils décrits ?

**Action** : corriger les écarts. Pas besoin de documenter chaque colonne — se concentrer sur les tables et les colonnes à fort enjeu métier (RLS, relations, flags comme `share_consent`, `teen_mode`, `mfa_reminder_dismissed`).

---

## Étape 9 — Vérification de cohérence transversale

Quelques vérifications rapides de cohérence entre docs :

```bash
# Les modules listés dans docs/modules.md ont-ils tous un fichier individuel dans docs/modules/ ?
# (les modules sans doc individuelle sont OK — juste signaler)
diff <(grep -oP '`[a-z_]+`' docs/modules.md | tr -d '`' | sort -u) \
     <(ls docs/modules/ | sed 's/\.md//' | sort)

# Les services référencés dans docs/services.md existent-ils vraiment ?
grep -oP 'apps/[a-z/]+Service\.ts' docs/services.md | while read f; do
  [ -f "$f" ] || echo "MANQUANT : $f"
done
```

---

## Format du rapport

À la fin, produire un rapport structuré :

```
# Doc Resync — <date>

## Sources primaires consultées
- database.types.ts : <N> ModuleType trouvés
- HomeScreen.tsx : <N> modules câblés
- services/ : <N> services web, <N> services mobile
- components/ : <N> UI + <N> features web, <N> UI + <N> features mobile
- schema.sql : <N> tables

## Modifications apportées

### docs/modules.md
- [+] Modules ajoutés : <liste>
- [~] Statuts corrigés : <liste>
- [-] Entrées supprimées : <liste>

### CLAUDE.md
- [~] <description des corrections>

### docs/services.md
- [+] Services ajoutés : <liste>
- [~] Descriptions corrigées : <liste>

### apps/web/docs/design-system.md
- [+] Composants ajoutés : <liste>
- [~] Props corrigées : <liste>

### apps/mobile/docs/design-system.md
- [+] Composants ajoutés : <liste>

### docs/module-engine.md
- [+] field_types ajoutés : <liste>
- [+] preview_kinds ajoutés : <liste>

### docs/README.md
- [+] Fichiers indexés : <liste>
- [-] Liens morts supprimés : <liste>

### docs/database.md
- [~] <description des corrections>

## Aucune modification nécessaire
- <liste des docs déjà à jour>

## Écarts signalés (sans correction automatique)
> Ces écarts nécessitent une décision humaine.
- <description + quel fichier + quelle décision>
```

---

## Règles de conduite

- **Ne jamais inventer** de contenu. Si une information n'est pas observable dans le code, signaler l'écart sans le combler.
- **Ne jamais alléger une doc** qui est correcte. Le resync ajoute et corrige, il ne supprime que ce qui est avéré faux ou mort.
- **Conserver le format existant** de chaque doc — ne pas reformater ni restructurer ce qui n'est pas en cause.
- **Écarts ambigus** (une chose a changé de nom, un module a été refactorisé) → signaler dans "Écarts signalés" et demander confirmation avant de corriger.
- **MDR** : ne jamais introduire de contenu interprétatif dans les docs techniques. Les docs décrivent ce que le code fait, jamais ce que les données signifient cliniquement.
