---
date: 2026-07-30
branch: refonte/nommer-premiere-ouverture-k2
pr_number: null
pr_url: null
ci_pass: true
merge_clean: true
violations:
  mdr: 0
  data_access: 0
  typescript: 0
  i18n: 0
  tests: 0
  docs: 0
  design_system: 0
  config_first: 0
  rls_schema: 0
  one_component_per_file: 0
  teen_mode: 0
warnings: 2
files_created: 4
files_modified: 9
rules_enriched: 0
---

# PR Review : refonte/nommer-premiere-ouverture-k2
Date : 2026-07-30 · Ticket #250 (K-2) · Base : branche de #280 (K-8)

## CI GitHub Actions

| Job | Statut |
|---|---|
| typecheck-web | ✅ |
| lint-web | ✅ (aucun fichier web touché) |
| test-web | ✅ 198 fichiers, 1253 tests |
| typecheck-mobile | ✅ |
| test-mobile | ✅ **190 suites, 1350 tests** |
| SQL (deno) | ⚠️ non exécutable localement (`deno` absent) |

## Résumé

| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 0 |
| ⚠️ Points d'attention | 2 |
| ✅ Conformes | 13 fichiers |

---

## 🚫 VETO MDR / RGPD

Aucun, et deux décisions vont dans le bon sens.

1. **Pas d'objet de consentement.** Le ticket l'exigeait, et la raison tient : créer un
   consentement pour un accusé de lecture obligerait ensuite à le versionner, permettre
   son retrait et tracer sa révocation. On aurait fabriqué une obligation réglementaire
   là où il n'y a qu'une information. Rien n'est journalisé.
2. **Pas de synchronisation de l'état « déjà vu ».** C'est le point le plus facile à
   rater : `sync-service.md` impose `syncUpsert` pour toute écriture SQLite patient, et
   il aurait été « conforme » de l'appliquer mécaniquement. Ce serait une erreur :
   « cet écran a été vu » est un **état d'interface**, pas une donnée de soin, et le
   répliquer produirait une trace de navigation sans valeur clinique. La minimisation
   RGPD demande l'inverse. L'exception est justifiée en JSDoc, comme la règle l'exige.

## 🚫 Violations bloquantes

Aucune.

---

## ⚠️ Points d'attention

### 1. L'écran réapparaît après réinstallation ou changement d'appareil

Conséquence directe du stockage local. C'est le comportement souhaité (un nouvel
appareil **est** une première ouverture), mais il mérite d'être connu : un patient qui
change de téléphone reverra l'écran. L'alternative, synchroniser, a été écartée pour la
raison ci-dessus. Documenté dans `docs/modules/emotion_wheel.md`.

### 2. Effet de bord positif à surveiller : le service est générique

`moduleOnboardingService` n'est pas spécifique à ce module. Tout module qui posera une
prop `welcome_title` gagnera le même écran, sans une ligne de code. C'est voulu, mais
cela signifie qu'**ajouter cette prop à un autre module a un effet visible immédiat** :
à ne pas faire par inadvertance dans un seed.

---

## ✅ Points positifs

- **Le passage par un service est respecté** alors que la tentation était forte : le
  layout aurait pu appeler `getModuleSetting` directement (deux lignes). Il passe par
  `moduleOnboardingService`, ce qui rend l'état testable et mockable, et laisse un seul
  endroit où la décision « ne pas synchroniser » est écrite et expliquée.
- **Le troisième état est traité.** `welcomeSeen` est `boolean | null` : tant qu'on ne
  sait pas, ni l'écran ni le module ne s'affichent. Sans ce `null`, l'écran d'intro
  apparaîtrait puis disparaîtrait chez un patient qui l'a déjà vu.
- **La panne n'impose pas l'écran** : un échec de lecture ouvre le module. Un outil de
  soin ne se barre pas pour une erreur SQLite. Testé.
- **Aucune lecture inutile** : un module sans prop `welcome_title` ne consulte même pas
  l'état, ce qu'un test vérifie explicitement.
- **Config-first jusqu'aux puces** : les deux points forts sont des clés indexées
  (`welcome_point_N`) lues par `collectIndexed`, donc en ajouter un troisième est un
  INSERT.
- **Registre teen conforme** : tutoiement professionnel sur les points et le rappel de
  crise, aucune familiarité, et pas de surcharge inutile là où le texte est identique.

---

## Checklist finale

- [x] Affiché au premier accès, jamais aux suivants
- [x] Contenu intégralement retrouvable dans la fiche ⓘ
- [x] i18n fr/en + teen
- [x] Accès données via un service, jamais `lib/database` dans un composant
- [x] Exception `sync-service.md` justifiée en JSDoc
- [x] Config-first, seed et migration miroirs et idempotents
- [x] Un fichier = un composant
- [x] Ponctuation : aucun tiret long ajouté (2 corrigés en review)
- [x] TypeScript strict, zéro suppression
- [x] Documentation : `docs/modules/emotion_wheel.md` **et** `docs/services.md` (nouveau service)

## 📚 Enrichissement des règles

`sync-service.md` prévoit déjà l'exception « service qui ne stocke pas de données
patient » et exige sa justification en JSDoc, ce qui est fait. Rien à ajouter.
