# Politique de conservation & purge automatique (RGPD art. 5.1.e)

Mise en œuvre du principe de **limitation de la conservation** : les données ne sont
pas gardées indéfiniment. Chaque type de donnée a une durée définie, appliquée
automatiquement par une purge programmée.

> **Issue de référence :** [#28](https://github.com/KaerOrg/Kaer/issues/28) — épic conformité RGPD/HDS.

---

## 1. Principe

| Étape | Mécanisme |
|---|---|
| **Définir** les durées | Table `retention_config` (une ligne par table cible) |
| **Appliquer** | Edge Function `purge-retention` (orchestrateur) + fonctions SQL + `pg_cron` (quotidien) |
| **Tracer** | RPC `log_data_access` (action `purge`) → `access_audit_log` |

Toutes les durées (conservation **et** fenêtre d'inactivité) sont **paramétrables en
base** — pas de magic number dans le code. Le DPO ajuste une valeur par un simple
`UPDATE`, sans redéploiement.

---

## ⚠️ Conformité MDR (RÈGLE D'OR)

La purge repose **uniquement sur des dates** : ancienneté de la donnée + inactivité du
patient. Elle n'est **jamais** conditionnée au contenu clinique — aucun `if (score > X)`,
aucune valeur de saisie n'entre dans le critère de sélection. Règle de calendrier pure.

---

## 2. Protection des patients actifs — gating par inactivité

Le risque d'une purge naïve par âge : **un patient encore suivi perdrait son historique
ancien**. Pour l'éviter, les données de santé rattachées à un patient ne sont purgées
**que si le patient est inactif**.

> **Patient inactif** = remplit **les deux** conditions :
> 1. ne s'est **pas connecté** depuis `inactivity_days` jours (`auth.users.last_sign_in_at`), **et**
> 2. n'a **aucun rendez-vous** dont la date (`appointments.starts_at`) tombe dans les `inactivity_days` derniers jours.

Une donnée n'est donc supprimée que si **les deux** conditions sont réunies :

```
ancienneté de la donnée  >  retention_days
        ET
patient inactif (pas de connexion ET pas de RDV depuis inactivity_days)
```

Conséquence : un patient avec une connexion récente **ou** un rendez-vous récent/à venir
conserve **l'intégralité** de son historique, quel que soit l'âge des données.

La détermination des patients inactifs est centralisée dans la fonction SQL
`fn_inactive_patient_ids(p_cutoff)`.

---

## 3. Tableau des durées de conservation

> ⚠️ **Valeurs par défaut conservatrices — à valider par le DPO** (item non-code de l'épic).
> Côté code, tout est configurable ; ces valeurs sont des points de départ.

| Table | Colonne date | Conservation | Gating inactivité | Inactivité | Justification |
|---|---|---|---|---|---|
| `notification_logs` | `sent_at` | 365 j | non | — | Logs techniques push |
| `notification_events` | `occurred_at` | 365 j | non | — | Événements notifications |
| `invitations` | `expires_at` | 30 j | non | — | Invitations expirées |
| `appointments` | `ends_at` | 1825 j (5 ans) | **oui** | 365 j | Données de santé — patient inactif uniquement |
| `patient_entries` | `client_created_at` | 1825 j (5 ans) | **oui** | 365 j | Saisies patient (art. 9) — patient inactif uniquement |
| `practitioner_patient_notes` | `updated_at` | 1825 j (5 ans) | **oui** | 365 j | Notes praticien — patient inactif uniquement |
| `access_audit_log` | `occurred_at` | 3650 j (10 ans) | non | — | Journal d'audit — conservation longue HDS |

Les logs techniques, invitations et journal d'audit ne sont **pas** gatés : ils ne
constituent pas l'historique de soin du patient et se purgent par simple ancienneté.

**Modifier une durée de conservation :**

```sql
update public.retention_config
set retention_days = 1095, updated_at = now()
where table_name = 'patient_entries';
```

**Modifier la fenêtre d'inactivité :**

```sql
update public.retention_config
set inactivity_days = 730, updated_at = now()
where table_name = 'patient_entries';
```

**Désactiver une règle** sans la supprimer (ex. pendant un audit) :

```sql
update public.retention_config set is_enabled = false where table_name = 'appointments';
```

---

## 4. Schéma de données

### Table `retention_config`

```sql
create table if not exists public.retention_config (
  table_name          text        primary key,
  date_column         text        not null default 'created_at',
  retention_days      int         not null check (retention_days >= 1),
  gate_on_inactivity  boolean     not null default false,
  inactivity_days     int         not null default 365 check (inactivity_days >= 1),
  is_enabled          boolean     not null default true,
  description         text,
  updated_at          timestamptz not null default now()
);
```

RLS activée, **aucune policy client** : lecture/écriture réservées au `service_role`.

### Fonctions SQL (source de vérité de la sélection)

| Fonction | Rôle |
|---|---|
| `fn_inactive_patient_ids(p_cutoff timestamptz)` | Renvoie les patients sans connexion **ni** RDV depuis la coupure. `SECURITY DEFINER` (lit `auth.users`). |
| `purge_retention_table(table, date_column, retention_days, gate_inactivity, inactivity_days)` | Supprime les lignes éligibles d'une table (avec gating si demandé). Renvoie le nombre supprimé. `SECURITY DEFINER`. |

Identifiants (table, colonne) injectés via `format(%I)` depuis `retention_config`
(table service_role only) — jamais de saisie utilisateur. Valeurs en paramètres liés.

Source de vérité : `supabase/schema.sql`. Valeurs initiales : `supabase/seed.sql`.

---

## 5. Flux de purge

```
pg_cron (quotidien, 02:00 UTC)
   │  net.http_post → Edge Function purge-retention (Bearer service_role)
   ▼
purge-retention/index.ts   (ORCHESTRATEUR)
   ├── garde : Authorization == service_role (sinon 403)
   ├── lit retention_config WHERE is_enabled = true
   └── pour chaque règle :
        ├── rpc purge_retention_table(...)   ← sélection + delete ensembliste en SQL
        │     ├── cutoff conservation = now() - retention_days
        │     └── si gate_on_inactivity : AND patient_id IN fn_inactive_patient_ids(now() - inactivity_days)
        └── rpc log_data_access('purge', table, metadata={deleted_count, retention_days, …})
   ▼
access_audit_log  ← une entrée 'purge' par table et par exécution
```

### Sécurité

- **service_role uniquement** : seul moyen de purger des données patient (la RLS bloque
  la suppression de masse). La garde compare l'en-tête `Authorization` à la clé
  service_role — un patient/praticien authentifié ne peut pas déclencher la purge.
- **Idempotent** : relançable sans dommage. Une 2ᵉ exécution le même jour ne re-supprime
  rien (les lignes éligibles ont déjà disparu).
- **RLS inchangée** sur les tables purgées. Les fonctions `SECURITY DEFINER` sont
  révoquées pour `anon`/`authenticated`.

### Traçabilité

Chaque table purgée génère **une entrée d'audit** (`action = 'purge'`), y compris à
0 ligne supprimée — preuve que la règle s'est exécutée. Métadonnées **techniques
uniquement** (`deleted_count`, `retention_days`, `inactivity_days`) — jamais de contenu
clinique. Voir [`audit-log.md`](audit-log.md).

---

## 6. Cas limites

| Cas | Comportement |
|---|---|
| `retention_config` vide / toutes désactivées | Aucune purge, `{ ok: true, purged: [] }` |
| Patient encore actif (connexion **ou** RDV récent) | Données **conservées** intégralement, même > 5 ans |
| Patient jamais connecté (`last_sign_in_at` null) | Considéré inactif côté connexion (condition RDV s'applique aussi) |
| Ligne exactement à la date de coupure | **Conservée** (comparaison stricte `<`) |
| Purge à 0 ligne | Tracée quand même dans l'audit log |
| Erreur sur une table | Loggée, n'interrompt pas les autres (boucle `continue`) |
| Appel sans clé service_role | `403 forbidden` |

---

## 7. Déploiement

1. **Schéma + seed** : exécuter `schema.sql` puis `seed.sql` (idempotents).
2. **Edge Function** : `supabase functions deploy purge-retention`.
3. **pg_cron** : activer l'extension (Dashboard > Database > Extensions > pg_cron),
   puis exécuter le `cron.schedule('purge-retention-cron', '0 2 * * *', …)` documenté
   en commentaire dans `schema.sql` (remplacer `<PROJECT_REF>` et `<SERVICE_ROLE_KEY>`).

### Test à blanc (avant d'activer le cron)

Le principe : remplacer le `DELETE` par un `COUNT` — **mêmes conditions, zéro suppression**.

**Option A — une fois le schéma déployé** (utilise `fn_inactive_patient_ids`), exemple `patient_entries` :

```sql
select count(*)
from public.patient_entries e
where e.client_created_at < now() - interval '1825 days'
  and e.patient_id in (select public.fn_inactive_patient_ids(now() - interval '365 days'));
```

**Option B — requête autonome** (ne dépend pas du schéma déployé : la logique
d'inactivité est inlinée). À coller dans le SQL Editor — **100 % lecture, ne supprime rien**.
La colonne `a_purger` = ce que la vraie purge effacerait aujourd'hui.

```sql
-- Patients inactifs : pas de connexion NI de RDV depuis 365 jours
with inactive as (
  select p.id from public.patients p
  where not exists (
          select 1 from auth.users u
          where u.id = p.id and u.last_sign_in_at >= now() - interval '365 days')
    and not exists (
          select 1 from public.appointments a
          where a.patient_id = p.id and a.starts_at >= now() - interval '365 days')
)
-- Tables gatées (purge seulement si patient inactif)
select 'patient_entries' as table_name,
       count(*) filter (where client_created_at < now() - interval '1825 days'
                          and patient_id in (select id from inactive)) as a_purger,
       count(*) as total
from public.patient_entries
union all
select 'practitioner_patient_notes',
       count(*) filter (where updated_at < now() - interval '1825 days'
                          and patient_id in (select id from inactive)),
       count(*)
from public.practitioner_patient_notes
union all
select 'appointments',
       count(*) filter (where ends_at < now() - interval '1825 days'
                          and patient_id in (select id from inactive)),
       count(*)
from public.appointments
-- Tables non gatées (purge par simple ancienneté)
union all
select 'notification_logs',
       count(*) filter (where sent_at < now() - interval '365 days'), count(*)
from public.notification_logs
union all
select 'invitations',
       count(*) filter (where expires_at < now() - interval '30 days'), count(*)
from public.invitations
union all
select 'access_audit_log',
       count(*) filter (where occurred_at < now() - interval '3650 days'), count(*)
from public.access_audit_log
order by table_name;
```

**Isoler un patient** (vérifier qu'il est bien protégé / éligible) :

```sql
select id from public.patients p
where p.id = '<patient_id>'
  and not exists (select 1 from auth.users u where u.id = p.id and u.last_sign_in_at >= now() - interval '365 days')
  and not exists (select 1 from public.appointments a where a.patient_id = p.id and a.starts_at >= now() - interval '365 days');
-- Ressort → inactif (purgeable). Ne ressort pas → actif (protégé).
```

---

## 8. Fichiers

| Fichier | Rôle |
|---|---|
| `supabase/schema.sql` | Table `retention_config`, RLS, `fn_inactive_patient_ids`, `purge_retention_table`, commentaire pg_cron |
| `supabase/seed.sql` | Durées + gating initiaux (7 règles) |
| `supabase/functions/purge-retention/retention.ts` | Orchestration pure (garde d'autorisation, mapping RPC, boucle de purge) — accès données injecté via `RetentionStore` |
| `supabase/functions/purge-retention/index.ts` | Enveloppe Deno : garde service_role, montage du store Supabase, réponse HTTP |
| `supabase/functions/purge-retention/retention.test.ts` | Tests Deno de l'orchestration (13 cas) |

### Couverture de test

Deux niveaux, séparés par ce qu'un test peut atteindre sans Postgres vivant :

1. **Orchestration (testée, automatisée).** `retention.ts` isole la part testable :
   garde d'autorisation (`isAuthorized`), mapping config → arguments RPC
   (`buildPurgeArgs` / `buildAuditArgs`), et la boucle `runPurge`. L'accès données est
   injecté via l'interface `RetentionStore`, donc les tests passent un faux store et
   couvrent : refus d'un appelant non service_role, échec de lecture config (→ 500),
   purge + audit par table, **purge à 0 ligne tracée** (preuve d'exécution), isolation
   d'erreur par table, et échec d'audit non bloquant. Exécution :
   `deno test supabase/functions/` — job CI **« Edge — Tests »** (`denoland/setup-deno`).

2. **Sélection ensembliste SQL (vérifiée manuellement).** Le critère de purge lui-même
   (coupures temporelles + jointure d'inactivité) vit dans `purge_retention_table` /
   `fn_inactive_patient_ids`, par nécessité de passage à l'échelle. Le valider exige un
   Postgres réel (schéma `auth.users`, extensions `pg_cron`/`pg_net`) absent du harnais
   Node/Deno du dépôt. La vérification se fait via la **requête de comptage à blanc**
   ci-dessus (même condition, `COUNT` au lieu de `DELETE`) avant activation du cron.

> ⚠️ MDR : aucun test ne réintroduit de logique de seuil clinique — l'orchestration ne
> voit que des règles de date issues de `retention_config`.

---

## Checklist épic (critères d'acceptation #28)

- [x] Tableau des durées de conservation documenté (à valider DPO).
- [x] Protection des patients actifs (gating par inactivité connexion + RDV).
- [x] Job de purge programmé (Edge Function + SQL + pg_cron) fonctionnel et idempotent.
- [x] Purge tracée (nb lignes, paramètres) dans l'audit log.
- [x] Schéma à jour, doc à jour.
- [x] Couverture de test automatisée de l'orchestration (garde, mapping RPC, boucle de purge, traçage) — `retention.test.ts`, job CI « Edge — Tests ». La sélection SQL ensembliste reste vérifiée par la requête à blanc (voir « Couverture de test »).
- [ ] **Durées + fenêtre d'inactivité validées par le DPO** (item non-code, hors périmètre dev).
- [ ] Activation du `pg_cron` en prod (item non-code, ops).
