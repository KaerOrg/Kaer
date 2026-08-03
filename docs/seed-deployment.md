# Déploiement des seeds & audit anti-dérive

> Traite la **cause systémique** de la dérive silencieuse config seed ↔ base
> (ticket #203). Les fichiers seed sont la **source de vérité** de la config
> (couleurs, libellés, `field_props`, `module_content_fields`, catégories, tags,
> psyedu…). Pour que la base en production reflète réellement le dépôt, deux
> conditions **cumulées** doivent être remplies.

## Les deux conditions de l'idempotence réelle

1. **Écriture idempotente qui aligne la base sur le seed** : soit
   `ON CONFLICT … DO UPDATE` (jamais `DO NOTHING`), soit une **reconstruction**
   `DELETE … + INSERT` (idiome de `psyedu_seed.sql` / `guide_seed.sql`, qui gère en
   plus la suppression d'une ligne retirée du seed). Sinon, une valeur *modifiée* dans
   le seed (ex. une couleur neutralisée pour la conformité MDR) n'est jamais propagée
   sur une ligne déjà présente. Règle :
   [`.claude/rules/config-first.md`](../.claude/rules/config-first.md) § « Seeds de
   config : `ON CONFLICT … DO UPDATE`, jamais `DO NOTHING` ». Garde-fou automatique :
   [`apps/web/src/test/seedIdempotency.guard.test.ts`](../apps/web/src/test/seedIdempotency.guard.test.ts).

2. **Ré-exécution des seeds à chaque release.** Un `DO UPDATE` ne se déclenche que si
   le fichier est rejoué. Sans rejeu au déploiement, ni les valeurs modifiées ni les
   lignes nouvelles n'atteignent la base. C'est l'objet du runner ci-dessous.

## Le manifeste — une seule source de vérité pour l'ordre

[`supabase/SEED_MANIFEST.json`](../supabase/SEED_MANIFEST.json) liste, **dans l'ordre
de dépendances**, le schéma puis tous les seeds de config à appliquer. Contraintes
d'ordre notables :

- `schema.sql` en premier (les tables), puis `seed.sql` (cœur : catégories, modules,
  `module_content_fields`, `field_props`, `tag_dimensions`/`tags`).
- `seed/psyedu_themes_seed.sql` **avant** tout seed qui insère des `psyedu_topics`
  avec un `theme_id` (`chrono_seed.sql`, `psyedu_seed.sql`) — clé étrangère.
- `seed/psyedu_refonte_p1_seed.sql` **après** `seed/psyedu_seed.sql` (il le complète).

> **Tout nouveau seed de config doit être ajouté au manifeste.** Un seed absent du
> manifeste n'est jamais rejoué au déploiement (cause de l'incident
> « `motivational_balance` partiellement déployé » du ticket #203). Le garde-fou
> `seedIdempotency.guard.test.ts` échoue si un `seed/*.sql` présent sur disque manque
> du manifeste.

## 1. Rejouer les seeds — `apply-seeds`

Applique le schéma + tous les seeds du manifeste, dans l'ordre, via `psql`
(`ON_ERROR_STOP=1` : arrêt à la première erreur SQL).

**Prérequis** : `psql` dans le PATH ; une URL de connexion Postgres/Supabase (jamais
committée — fournie au lancement).

```bash
# Aperçu de l'ordre, sans rien exécuter :
node scripts/apply-seeds.mjs --dry-run

# Rejeu réel (⚠️ écrit dans la base ciblée) :
DATABASE_URL='postgres://…' node scripts/apply-seeds.mjs
# ou :
node scripts/apply-seeds.mjs --url 'postgres://…'
```

Raccourci npm : `npm run seed:apply` (transmet les mêmes arguments/env).

### Intégration au déploiement (à activer)

Le rejeu n'est **pas encore** branché en CI/CD — la seule pipeline de déploiement
(`deploy-web.yml`) publie l'app web sur GitHub Pages, sans étape base de données.
Pour automatiser, ajouter un job qui exécute `node scripts/apply-seeds.mjs` avec un
secret `DATABASE_URL` (chaîne de connexion `service_role`/Postgres) configuré dans les
**secrets GitHub du dépôt**. En attendant, lancer la commande manuellement à chaque
release constitue la **procédure documentée** qui remplit la condition 2.

## 2. Auditer la dérive — `audit-drift`

Vérifie que la base cible (prod) reflète bien les fichiers seed. Méthode robuste
(voulue par le ticket) : **c'est Postgres qui rejoue les fichiers**, on ne parse pas
les seeds au regex (fragile : `;`/parenthèses dans les références biblio).

**Workflow :**

```bash
# 1. Sur une base JETABLE (branche Supabase, base locale…), appliquer le manifeste :
DATABASE_URL="$SEED_DB_URL" node scripts/apply-seeds.mjs

# 2. Diffuser la base jetable (source de vérité) contre la cible (prod, lecture seule) :
SEED_DB_URL='postgres://…scratch' TARGET_DB_URL='postgres://…prod' \
  node scripts/audit-drift.mjs
```

Raccourci npm : `npm run seed:audit`.

Le rapport liste, par table :

- **manquant en cible** : ligne du seed jamais déployée ;
- **divergent** : même clé, contenu différent (la dérive silencieuse — cœur du ticket) ;
- **en trop en cible** : ligne présente en base, absente du seed (orpheline potentielle).

Le script sort en code **1** dès qu'une dérive existe (exploitable en test CI).

### Tables auditées et périmètre

L'audit compare les tables de config sur une **clé stable définie par le seed** (cf.
[`scripts/lib/configDiff.mjs`](../scripts/lib/configDiff.mjs) `CONFIG_TABLES`) :
`module_categories`, `modules`, `module_content_fields`, `field_props`,
`tag_dimensions`, `tags`, `psyedu_topics` (clé naturelle `module_key, topic_key`).

**Exclusions assumées** (pas de limite silencieuse) :

- `psyedu_blocks`, `module_sources` : `id` en `gen_random_uuid()` non systématiquement
  fixé par les seeds → pas de clé comparable d'une base à l'autre. Les auditer
  demanderait une clé naturelle dédiée (travail ultérieur).
- Jonctions pures (`module_tags`, `psyedu_topic_tags`, `module_topics`) : `DO NOTHING`
  légitime (toutes les colonnes sont dans la clé), non dup-prone.

## Fichiers

| Fichier | Rôle |
|---|---|
| [`supabase/SEED_MANIFEST.json`](../supabase/SEED_MANIFEST.json) | Ordre canonique schéma + seeds |
| [`scripts/apply-seeds.mjs`](../scripts/apply-seeds.mjs) | Runner de rejeu (condition 2) |
| [`scripts/audit-drift.mjs`](../scripts/audit-drift.mjs) | Audit anti-dérive (diff seed ↔ cible) |
| [`scripts/lib/seedManifest.mjs`](../scripts/lib/seedManifest.mjs) | Helpers purs du manifeste |
| [`scripts/lib/configDiff.mjs`](../scripts/lib/configDiff.mjs) | Cœur pur du diff + `CONFIG_TABLES` |
| `apps/web/src/test/seedIdempotency.guard.test.ts` | Garde-fou `DO NOTHING` + complétude manifeste |
| `apps/web/src/test/configDiff.test.ts` | Tests du diff pur |
