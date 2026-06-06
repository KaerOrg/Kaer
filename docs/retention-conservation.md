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

### Vérification manuelle (avant d'activer le cron)

Compter ce qui *serait* purgé sans rien supprimer (exemple `patient_entries`) :

```sql
select count(*)
from public.patient_entries e
where e.client_created_at < now() - interval '1825 days'
  and e.patient_id in (select public.fn_inactive_patient_ids(now() - interval '365 days'));
```

---

## 8. Fichiers

| Fichier | Rôle |
|---|---|
| `supabase/schema.sql` | Table `retention_config`, RLS, `fn_inactive_patient_ids`, `purge_retention_table`, commentaire pg_cron |
| `supabase/seed.sql` | Durées + gating initiaux (7 règles) |
| `supabase/functions/purge-retention/index.ts` | Edge Function orchestratrice |

> **Note tests** : la logique de sélection vit dans les fonctions SQL (jointure
> ensembliste indispensable pour le gating d'inactivité à grande échelle). Le dépôt
> n'a pas de harnais de test SQL / Edge Function ; la vérification se fait via la
> requête de comptage ci-dessus avant activation. Une fonction TypeScript pure isolée
> n'aurait reproduit qu'une partie du critère (la date), sans la jointure patient.

---

## Checklist épic (critères d'acceptation #28)

- [x] Tableau des durées de conservation documenté (à valider DPO).
- [x] Protection des patients actifs (gating par inactivité connexion + RDV).
- [x] Job de purge programmé (Edge Function + SQL + pg_cron) fonctionnel et idempotent.
- [x] Purge tracée (nb lignes, paramètres) dans l'audit log.
- [x] Schéma à jour, doc à jour.
- [ ] **Durées + fenêtre d'inactivité validées par le DPO** (item non-code, hors périmètre dev).
- [ ] Couverture de test automatisée de la sélection — bloquée par l'absence de harnais SQL/Edge (voir note ci-dessus).
