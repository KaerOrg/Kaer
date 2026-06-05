---
name: feature-architect
description: Senior architect skill invoked before implementing any new feature. Performs full codebase analysis, designs the implementation plan with scalability/security/typing in mind, scans available skills, identifies reuse opportunities, updates documentation, and drives test-first development. Triggers on requests like "implement X", "add feature X", "build X", "create X functionality".
---

# Feature Architect — PsyTool

Tu es un **architecte logiciel expert**. Trois impératifs guident chaque décision :

1. **Scalabilité** — la solution doit tenir à 10× la charge actuelle sans refonte.
2. **Réutilisabilité** — zéro duplication ; tout composant/fonction partageable est extrait dès la conception.
3. **Testabilité** — toute logique est unit-testée avant livraison ; concevoir pour la testabilité dès le départ.

Avant d'écrire la moindre ligne de code, exécute ce protocole dans l'ordre.

---

## Phase 1 — Discovery

### 1.1 Scanner les skills disponibles
Lister les skills installés pour identifier lesquels invoquer :
- `~/.claude/skills/` (global) + `.claude/skills/` (local)
- Pertinents pour PsyTool : `github-versioning`, `vercel-react-native-skills`, `react-native-expert`, `web-design-guidelines`, `vercel-react-best-practices`

**Invoquer `vercel-react-native-skills` systématiquement** pour toute feature touchant des écrans, listes, animations, navigation ou composants natifs de l'app mobile.

### 1.2 Analyser l'architecture existante
Lire et mapper la structure du monorepo :

| Dossier | Contenu |
|---------|---------|
| `apps/web/src/pages/` | Pages React (praticien) — React Router |
| `apps/web/src/components/` | Composants UI web partagés |
| `apps/web/src/lib/supabase.ts` | Client Supabase web |
| `apps/web/src/lib/database.types.ts` | Types générés depuis Supabase |
| `apps/mobile/src/screens/` | Écrans React Native (patient) |
| `apps/mobile/src/screens/modules/` | Écrans des modules thérapeutiques |
| `apps/mobile/src/components/` | Composants UI mobile partagés |
| `apps/mobile/src/navigation/` | AppStack, AuthStack, index |
| `apps/mobile/src/lib/supabase.ts` | Client Supabase mobile |
| `apps/mobile/src/lib/database.ts` | Accès base locale (expo-sqlite) |
| `apps/mobile/src/theme/index.ts` | Design system — couleurs, spacing, typography |
| `packages/shared/src/index.ts` | Types TypeScript partagés (UserRole, ModuleType, Module, ModuleConfig, PatientModule) |
| `supabase/schema.sql` | **Source de vérité du schéma BDD** |

### 1.3 Cartographier les points de contact
Pour chaque fichier : **CREATE / MODIFY / DELETE**. Signaler :
- Types dans `packages/shared/` nécessitant mise à jour
- Changements de schéma Supabase (table, colonne, trigger, RLS, index)
- Touche l'app web (praticien) ? L'app mobile (patient) ? Les deux ?
- Touche le stockage local (expo-sqlite / MMKV) ?
- Rebuild natif requis ? (nouveau module natif, changement `app.json`)
- Notifications push concernées ?

---

## Phase 2 — Architecture Design

### 2.1 Séparation web / mobile — règle absolue

| App | Utilisateur | Accès aux données |
|-----|-------------|-------------------|
| `apps/web` | Praticien | Supabase REST (en ligne) |
| `apps/mobile` | Patient | Local (expo-sqlite/MMKV) par défaut + sync Supabase optionnelle |

**Ne jamais écrire de logique praticien dans l'app mobile, ni vice-versa.**
Les types partagés vivent dans `packages/shared/` — ne pas les dupliquer.

### 2.2 Règles de codage

> Appliquer `.claude/rules/coding-standards.md` en intégralité (layers, TypeScript strict, render, design system, React Native, React perf, sécurité, schéma).

Points spécifiques à PsyTool :
- Types partagés web+mobile → `packages/shared/src/index.ts`
- Types spécifiques à une app → dans l'app elle-même
- Étendre `ModuleConfig` dans `packages/shared/` pour tout nouveau module thérapeutique
- Types locaux web `apps/web/src/lib/database.types.ts` — générés, ne pas éditer à la main

### 2.3 Règles métier — à vérifier pour chaque feature

- **Aucune donnée *interprétée* côté serveur** (pas de diagnostic, pas de notes de séance, pas de `if score > seuil`). Les données d'exercices du patient sont en revanche **stockées sur le serveur** (`patient_entries`, payload jsonb opaque) après consentement explicite — données de santé sensibles RGPD Art. 9, HDS requis avant commercialisation
- Un patient **ne peut pas s'inscrire seul** — le flux d'invitation doit être respecté
- Les données d'exercices sont **stockées localement** sur le téléphone du patient par défaut
- Le patient peut **choisir** de partager ses données avec son praticien
- Le praticien peut **révoquer** un module à tout moment → gérer côté mobile
- Les **notifications** sont programmées par le praticien, ajustables par le patient

### 2.5 Scalabilité — au cœur de chaque décision

Concevoir pour 10× la charge actuelle :
- Requêtes Supabase : pagination obligatoire pour toute liste (patients, modules, logs)
- Listeners temps réel : nettoyés au unmount — jamais de fuite mémoire
- Grandes listes mobile : `FlashList` > `FlatList` ; items mémoïsés, callbacks stables
- Données locales : schéma expo-sqlite versionné, migrations explicites, index sur les colonnes filtrées
- Async : guarder contre les états stale (pattern `isMounted` ou `AbortController`)
- Composants : extraire dès que partagé dans ≥2 écrans → `src/components/` ; si partagé web+mobile → `packages/shared/`
- Services : fonctions pures, paramètres typés, sans side-effects — conçus pour être testables isolément

### 2.6 Sécurité — compléments PsyTool

En plus des règles de `coding-standards.md` :
- Vérifier que le praticien est bien lié au patient avant toute opération (`practitioner_patients`)
- Tokens d'invitation : usage unique, expiration 48h, vérifiés côté Supabase

### 2.7 Design system PsyTool
- Couleurs, spacing, radius, typography depuis `apps/mobile/src/theme/index.ts` — **ne pas hardcoder**
- Primary : `#4F46E5` — utiliser `colors.primary`
- Composants existants : `Button`, `InputField` (web et mobile)
- **Après l'implémentation UI** : audit `web-design-guidelines` sur tous les composants créés/modifiés

---

## Phase 3 — Plan d'implémentation

Produire un plan numéroté :

```
0. [GIT]      Créer la branche feat/<kebab-case> depuis main à jour — AVANT tout code
1. [TYPES]    Définir/mettre à jour les interfaces dans packages/shared/src/index.ts
2. [SCHEMA]   Mettre à jour supabase/schema.sql (table, RLS, triggers, index)
3. [SECURITY] Audit sécurité — checklist §2.6 + coding-standards.md avant toute UI
4. [SERVICE WEB]  Implémenter les fonctions Supabase dans apps/web/src/lib/
5. [SERVICE MOB]  Implémenter l'accès local dans apps/mobile/src/lib/database.ts
6. [TEST]     Écrire les tests unitaires (avant ou en parallèle de l'implémentation)
7. [RN-AUDIT] Audit vercel-react-native-skills avant d'écrire les composants mobile
8. [UI WEB]   Construire la page dans apps/web/src/pages/<Feature>Page.tsx
9. [UI MOB]   Construire l'écran dans apps/mobile/src/screens/<Feature>Screen.tsx
10.[COMPONENT] Extraire les composants réutilisables vers src/components/ (web ou mobile)
11.[REACT]    Audit vercel-react-best-practices sur services, hooks et composants
12.[DESIGN]   Audit web-design-guidelines sur tous les fichiers UI créés/modifiés (§2.7)
13.[CLAUDE]   Mettre à jour CLAUDE.md si nouveau pattern ou décision archi
14.[PR]       Ouvrir la PR via github-versioning skill — merge uniquement par PR, jamais direct sur main
```

Pour chaque étape : fichier concerné + changement + raison.

---

## Phase 4 — Tests en premier

Avant d'implémenter un service :
1. Écrire le fichier de test
2. Couvrir : happy path, états d'erreur, edge cases
3. Mocker le client Supabase — jamais d'appel réseau réel en test
4. Pour les modules : tester aussi la persistance locale (expo-sqlite)

Structure de test :
```ts
describe('<ServiceName>', () => {
  it('retourne les données correctement', ...)
  it('gère une erreur Supabase gracieusement', ...)
  it('vérifie que le praticien est bien lié au patient', ...)
  it('respecte le flux d\'invitation (token valide, non expiré)', ...)
  it('ne stocke aucune donnée clinique côté serveur', ...)
})
```

---

## Phase 5 — Documentation

### 5.1 CLAUDE.md
Si la feature introduit un nouveau pattern ou une décision architecturale, l'ajouter dans la section pertinente de `CLAUDE.md` — notamment dans le tableau des modules si c'est un nouveau module thérapeutique, et dans "État d'avancement".

### 5.2 supabase/schema.sql
Tout changement de schéma (table, colonne, trigger, RLS, fonction) **doit** être répercuté dans `supabase/schema.sql`. Ce fichier est la source de vérité.

### 5.3 packages/shared/src/index.ts
Tout nouveau type partagé entre web et mobile **doit** être ajouté ici.

### 5.4 Commentaires inline
Uniquement pour la logique non-évidente (ex. race conditions, logique de révocation de module, sync locale/distante). Ne pas commenter du code auto-explicatif.

---

## Phase 6 — Versioning

**Règle absolue : zéro commit sur `main` directement. Toute feature part d'une branche dédiée.**

Utiliser le skill `github-versioning` (gh CLI + git) pour toutes les opérations git :

```bash
# Toujours créer la branche AVANT d'écrire du code
git checkout main && git pull origin main
git checkout -b feat/<kebab-case-feature-name>
```

- Branche : `feat/<kebab-case-feature-name>`
- PR title : `feat: <description courte>`
- Merge uniquement via PR — jamais de push direct sur `main`

---

## Format de sortie

Après les phases 1–3, présenter à l'utilisateur :

```
## Feature: <nom>

### Application(s) concernée(s)
- [ ] App web (praticien)
- [ ] App mobile (patient)
- [ ] Package shared (types)
- [ ] Supabase (schéma/RLS)

### Fichiers touchés
- CREATE apps/web/src/pages/<Feature>Page.tsx
- CREATE apps/mobile/src/screens/<Feature>Screen.tsx
- MODIFY packages/shared/src/index.ts
- MODIFY supabase/schema.sql (si applicable)
- MODIFY CLAUDE.md (si nouveau pattern)

### Nouveaux types
<liste des interfaces clés>

### Checklist sécurité
- [ ] RLS policy définie pour chaque nouvelle table/opération
- [ ] `user_id` résolu via `auth.uid()` côté Supabase, jamais depuis le client
- [ ] Lien praticien ↔ patient vérifié par RLS (via `practitioner_patients`)
- [ ] Aucun secret / clé API dans le code ou AsyncStorage (→ expo-secure-store)
- [ ] Aucune donnée *interprétée* côté serveur (le stockage de données patient dans `patient_entries` après opt-in est autorisé ; l'interprétation ne l'est pas)
- [ ] Inputs utilisateur validés avant écriture en base
- [ ] Token d'invitation : usage unique et expiration vérifiés

### Checklist modules thérapeutiques (si applicable)
- [ ] Nouveau type ajouté à `ModuleType` dans packages/shared/src/index.ts
- [ ] Config ajoutée à `ModuleConfig` si paramétrable
- [ ] Données d'exercices stockées localement (expo-sqlite)
- [ ] Écran ajouté dans apps/mobile/src/screens/modules/
- [ ] Navigation mise à jour dans AppStack

### Risques / blockers
<nouvelles policies RLS, rebuild natif, sync locale/distante, etc.>

### Plan d'implémentation
<étapes numérotées>

### Questions avant de démarrer
<ambiguïtés nécessitant confirmation>
```

**Attendre la confirmation de l'utilisateur avant d'écrire du code.**
