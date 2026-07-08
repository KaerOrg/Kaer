# Journal d'audit des accès — `access_audit_log`

Traçabilité des accès et modifications des données patient, exigée par le **RGPD
(art. 32)** et le **référentiel HDS**. Permet de répondre à : *« qui a accédé,
modifié ou supprimé telle donnée patient, et quand ? »*.

> Issu du ticket **#25** (`feat/audit-log-acces`). Voir l'épic conformité **#29**
> et le `Kaer_Guide_Conformite.pdf` §4 (« Journalisation des accès aux données »).

---

## 1. Principe

Une table unique **`public.access_audit_log`** centralise tous les événements. Elle
est alimentée par **deux mécanismes complémentaires** :

| Mécanisme | Couvre | Déclenchement |
|---|---|---|
| **Triggers PostgreSQL** (`fn_audit_write`) | écritures : `insert` / `update` / `delete` | automatique, côté base, sur chaque table sensible |
| **RPC applicatif** (`log_data_access`) | accès non observables : `read` / `export` / `erase` / `purge` | appel explicite depuis la couche service |

Les **écritures** sont donc tracées **sans dépendre du client** (robuste). Les
**lectures / exports / effacements** sont tracés par le code applicatif, car aucun
trigger ne peut observer un `SELECT`.

---

## 2. ⚠️ Conformité MDR (RÈGLE D'OR)

Le journal ne stocke **JAMAIS le contenu** des lignes : aucune valeur clinique,
aucun score, aucune note, aucune interprétation. **Uniquement des métadonnées
techniques** : acteur, action, table, identifiant de ligne, patient concerné,
horodatage.

- Le trigger `fn_audit_write` n'extrait que `id` et `patient_id` de la ligne —
  jamais `to_jsonb(new)` en entier.
- Le champ `metadata` (jsonb) est réservé à des informations techniques (portée
  d'une lecture, compteur de lignes purgées…). **Ne jamais y mettre de contenu
  clinique.** Cette discipline est rappelée dans le JSDoc de `auditService.ts`.

---

## 3. Schéma de la table

| Colonne | Type | Rôle |
|---|---|---|
| `id` | uuid PK | — |
| `occurred_at` | timestamptz | horodatage (défaut `now()`) |
| `actor_id` | uuid (nullable) | `auth.uid()` de l'acteur ; `null` si service_role / système |
| `actor_role` | text | `practitioner` / `patient` / `service` / `authenticated` |
| `action` | text | `insert` / `update` / `delete` / `read` / `export` / `erase` / `purge` (CHECK) |
| `target_table` | text | table concernée |
| `target_id` | uuid (nullable) | id de la ligne ; `null` pour une lecture de liste / opération de masse |
| `patient_id` | uuid (nullable) | patient concerné (filtrage) ; `null` si non rattachable |
| `metadata` | jsonb | métadonnées techniques uniquement (défaut `{}`) |

**Index** : `(patient_id, occurred_at desc)`, `(actor_id, occurred_at desc)`,
`(target_table, occurred_at desc)`.

---

## 4. Sécurité & RLS

- **RLS activée, AUCUNE policy client** — même modèle que `notification_logs`. La
  table n'est ni lisible ni modifiable par `anon`/`authenticated` via l'API REST.
  *(L'advisor Supabase `rls_enabled_no_policy` est attendu et bénin ici, comme pour
  `notification_logs`.)*
- **`actor_id` est toujours dérivé de `auth.uid()` côté base**, jamais d'un payload
  client → impossible à forger.
- Les fonctions sont `SECURITY DEFINER` (elles écrivent dans la table RLS en tant
  qu'owner). Leurs droits d'exécution sont **explicitement restreints** (les default
  privileges Supabase accordent `EXECUTE` à `anon`/`authenticated` par défaut, d'où
  la révocation explicite) :

  | Fonction | anon | authenticated | service_role |
  |---|:---:|:---:|:---:|
  | `fn_audit_write()` (trigger) | ❌ | ❌ | ✅ |
  | `fn_current_actor_role()` (helper interne) | ❌ | ❌ | ✅ |
  | `log_data_access(...)` (RPC) | ❌ | ✅ | ✅ |

- **Consultation du journal** (v1) : via le **dashboard Supabase** (`service_role`)
  ou en SQL. Aucune UI praticien/DPO — volontairement différé (cf. §8).

---

## 5. Tables couvertes par les triggers d'écriture

`fn_audit_write` est attaché (`AFTER INSERT OR UPDATE OR DELETE`) via une boucle
`DO` **idempotente et défensive** : chaque table n'est traitée que si elle existe
(`to_regclass`). Le même `schema.sql` fonctionne donc quel que soit l'état de la base.

```
patients · practitioner_patients · invitations · patient_modules ·
cssrs_screen_assessments · crisis_plan_configs ·
practitioner_patient_notes · patient_push_tokens · notification_routines ·
appointments · patient_entries ·
notification_events · caseload_entries · caseload_notes · caseload_waits · caseload_actions
```

> **Drift `main` ↔ base live** : `notification_events` et `caseload_*` existent sur
> la base live (branche tableau de bord déjà appliquée) mais **pas encore dans le
> `schema.sql` de `main`**. Grâce à la garde `to_regclass`, ces tables sont
> couvertes là où elles existent et ignorées ailleurs — aucun ajustement manuel à
> faire au merge. Pour auditer une **nouvelle** table : ajouter son nom à
> `v_sensitive` (`supabase/schema.sql`, section *access_audit_log*).
>
> Note : `caseload_notes/waits/actions` n'ont pas de colonne `patient_id` (elles
> dépendent de `caseload_entries`) → leur `patient_id` d'audit est `null`, mais
> l'acteur, l'action et la ligne restent tracés.

---

## 6. Utilisation côté application (web)

Service : `apps/web/src/services/auditService.ts`.

```ts
import { logDataAccess } from './auditService'

await logDataAccess({
  action: 'read',
  targetTable: 'patients',
  targetId: patientId,
  patientId,
  metadata: { scope: 'header' }, // métadonnées TECHNIQUES uniquement
})
```

- **Best-effort** : un échec de journalisation n'interrompt jamais l'opération
  métier (l'erreur est tracée en console, non propagée).
- L'appel se fait **depuis la couche service** (jamais depuis un composant — cf.
  `.claude/rules/coding-standards.md` § *Accès aux données*).

**Consommateur instrumenté en v1** : `patientService.fetchPatientHeader` (= « le
praticien a ouvert le dossier du patient X »). Les autres points de lecture seront
instrumentés incrémentalement avec le même helper.

---

## 7. Vérification manuelle (SQL)

Il n'existe pas de harness pgTAP dans le repo ; la couche TS est testée par Vitest
(`auditService.test.ts`, `patientService.test.ts`). Pour vérifier la base :

```sql
-- Triggers attachés (doit lister les 12 tables) :
select c.relname
from pg_trigger t join pg_class c on c.oid = t.tgrelid
where t.tgname = 'audit_write' and not t.tgisinternal
order by c.relname;

-- Smoke test du RPC (puis nettoyage) :
select public.log_data_access('read', 'smoke_test', null, null, '{"check":true}'::jsonb);
select * from public.access_audit_log where target_table = 'smoke_test';
delete from public.access_audit_log where target_table = 'smoke_test';

-- Droits d'exécution (anon doit être false partout) :
select p.proname,
       has_function_privilege('anon', p.oid, 'EXECUTE')          as anon,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('fn_audit_write','fn_current_actor_role','log_data_access');
```

---

## 8. Limites connues & évolutions

- **Lectures partiellement couvertes** : seule `fetchPatientHeader` est instrumentée
  en v1. Étendre `logDataAccess` aux autres lectures sensibles au fil de l'eau.
- **Volume lors de la purge** (ticket #28) : la suppression de masse déclenchera un
  `delete` audité **par ligne**. La purge devra écrire un **log de synthèse**
  (`action='purge'`) et l'on pourra, si le volume devient gênant, suspendre le
  trigger par-ligne durant la purge (flag de session).
- **Conservation du journal** : `access_audit_log` contient des métadonnées
  indirectement sensibles (qui consulte qui) → soumis à sa propre durée de
  conservation, à définir dans le ticket **#28**.
- **UI de consultation DPO/praticien** : différée (décision v1 = `service_role` only).

---

## 9. Fichiers

| Fichier | Rôle |
|---|---|
| `supabase/schema.sql` (section *access_audit_log*) | table, RLS, `fn_current_actor_role`, `fn_audit_write`, triggers, RPC `log_data_access`, droits |
| `apps/web/src/services/auditService.ts` | `logDataAccess()` (wrapper du RPC, best-effort) |
| `apps/web/src/services/auditService.test.ts` | tests du service |
| `apps/web/src/services/patientService.ts` | instrumente `fetchPatientHeader` |
| `apps/web/src/lib/database.types.ts` | type `Functions.log_data_access` |
