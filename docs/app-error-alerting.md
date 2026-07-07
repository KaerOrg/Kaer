# Alerte email sur erreur applicative (issue #96)

> **Objectif : ne plus découvrir un crash ou une panne serveur par un patient qui
> se plaint.** Quand une exception de rendu, une promise rejection non gérée ou
> une opération réseau/serveur échoue, l'équipe est **alertée** (email + journal
> persisté) au lieu de laisser l'incident invisible.

Généralisation directe du pattern render-mismatch ([`docs/render-diagnostics.md`](render-diagnostics.md),
issue #90) à deux catégories d'erreur plus larges : `crash` et `failed_operation`.
Le pipeline anti-flood (signature, cooldown, coupe-circuit) est **strictement
identique** dans sa forme, mais son **état est indépendant** de celui du
render-mismatch (table et variables d'environnement séparées).

## Principe de conception : deux points de capture, un chokepoint réseau

Contrairement au render-mismatch (un détecteur pur unique), une erreur
applicative a plusieurs points d'entrée naturels :

```
┌─ crash (rendu) ──────────────┐   ┌─ crash (hors rendu) ─────────┐   ┌─ opération échouée ──────────┐
│ ErrorBoundary                │   │ unhandledrejection (web)     │   │ wrapper fetch du client       │
│ (componentDidCatch)          │   │ ErrorUtils (mobile)          │   │ Supabase (global.fetch)       │
└──────────────┬────────────────┘   └──────────────┬───────────────┘   └──────────────┬────────────────┘
               │                                    │                                  │
               ▼                                    ▼                                  ▼
                         errorReportingService.reportAppError(descriptor)
                            │ ajoute platform + app_version
                            │ mobile : persiste dans app_error_outbox (SQLite) puis flush au retour réseau
                            ▼
                  Edge Function report-app-error
                            │ validatePayload → computeSignature → dédup + cooldown + coupe-circuit
                            ▼
                            ├── app_error_log (Supabase)         ← source de vérité + historique
                            └── email Resend                     ← 1ʳᵉ occurrence d'une signature
```

Le rendu (`ErrorBoundary` mis à part, qui EST le point de capture) n'a aucune
connaissance de la télémétrie ailleurs dans l'app.

## Décision d'architecture : chokepoint réseau restreint aux 5xx + échecs réseau

Le wrapper `global.fetch` du client Supabase (`lib/supabase.ts`, web ET mobile)
voit **chaque appel réseau** du client (REST + edge functions), sans modifier un
seul fichier de service existant. Il n'alerte automatiquement QUE sur :

- un statut **5xx** (erreur serveur) ;
- un **échec réseau** (le `fetch` lève une exception).

**Jamais sur un 4xx** : un 4xx recouvre autant un vrai bug qu'un flux utilisateur
parfaitement attendu (mot de passe faux, token d'invitation invalide, conflit de
validation…). Alerter automatiquement dessus créerait un bruit d'alerte massif
dès le premier échec de connexion en prod.

Un service qui juge malgré tout qu'un 4xx précis est anormal peut le signaler
explicitement via `reportFailedOperation(route, message, reason)` (exportée par
`errorReportingService.ts`), **cette fonction n'est câblée dans aucun service à
ce jour** : c'est le point d'extension recommandé, volontairement laissé hors du
périmètre de cette PR (câbler un service précis nécessiterait une décision au cas
par cas, pas un chokepoint générique).

**Garde anti-boucle** : le chokepoint ne se re-signale jamais lui-même. Sans
cette garde, une panne de l'edge function `report-app-error` déclencherait une
boucle de rapports (chaque tentative d'alerte échoue à son tour en 5xx, ce qui
déclenche une nouvelle tentative d'alerte) qui épuiserait le coupe-circuit
partagé au moment précis où les vraies alertes en ont le plus besoin.

**Normalisation de route (web)** : `errorReportingService.ts` neutralise les
segments UUID d'un pathname (`normalizeRoute`) avant de l'utiliser dans le
descriptor. Sans cela, un crash systémique sur une route paramétrée
(`/patient/:ref`) générerait une signature de déduplication distincte par
patient visité, épuisant le coupe-circuit au lieu de dédupliquer sur un
problème unique.

## Conformité MDR / RGPD

Le rapport ne contient **aucune donnée patient** : uniquement `platform`,
`app_version`, `kind`, `message`, `route`, `stack` (tronquée à 2000 caractères),
`reason`, horodatages. Télémétrie technique, hors périmètre « donnée de santé ».
La file mobile ne passe donc PAS par `syncHelpers`/`patient_entries` ni par la
gate de consentement (exception légitime documentée dans `sync-service.md`,
identique à `render_mismatch_outbox`).

## Stratégie anti-flood (dans l'edge function) : état indépendant du render-mismatch

1. **Déduplication par signature** : `platform + kind + route + message`
   (volontairement sans `stack`, qui varie sans changer la nature du problème).
   1ʳᵉ occurrence → insert + email ; suivantes → `occurrence_count++` +
   `last_seen_at`, pas d'email.
2. **Cooldown** par signature (défaut 24 h, `APP_ERROR_COOLDOWN_MS`).
3. **Coupe-circuit global** (défaut ~20 emails/h, `APP_ERROR_CIRCUIT_MAX` /
   `APP_ERROR_CIRCUIT_WINDOW_MS`) : au-delà, l'email est suspendu mais la table
   continue de tout enregistrer.

## Table `app_error_log`

Source de vérité (`supabase/schema.sql`). Colonnes clés : `signature` (UNIQUE,
pilote l'upsert), `occurrence_count`, `occurred_at` / `last_seen_at`,
`email_sent_at` (pilote le cooldown), `kind` (`crash` | `failed_operation`),
`stack` (tronquée). **RLS** : insert/update réservés à l'edge function
(service_role) ; `select` réservé aux praticiens admin (`fn_is_admin()`).

## Limitations connues

- **Web** : les crashs de rendu (`ErrorBoundary`) et les promise rejections non
  gérées (`unhandledrejection`) sont couverts. Une exception synchrone dans un
  gestionnaire d'événement React (`onClick`, etc.) qui ne relève ni de l'un ni de
  l'autre n'est pas captée automatiquement.
- **Mobile** : `ErrorUtils.setGlobalHandler` capture les exceptions JS non
  gérées, y compris la plupart des promise rejections non gérées remontées par
  Hermes. La route/écran courant n'est PAS résolue pour les crashs hors-rendu
  (`route: null`), contrairement au web où `window.location.pathname` est
  toujours disponible pour un crash.
- Le chokepoint réseau ne couvre que le client Supabase (REST + edge functions).
  Un appel réseau fait en dehors de ce client (rare dans ce projet, cf. règle
  « zéro SQL/réseau hors service ») ne serait pas intercepté.
- **`route` d'une opération échouée = l'endpoint en échec, pas l'écran/la page**
  (web et mobile). Query string retirée avant usage : la query PostgREST porte
  souvent un identifiant dynamique (`?id=eq.<uuid>`), qui ferait sinon exploser
  le nombre de signatures (une par ligne distincte au lieu d'une par endpoint
  cassé). Si `route` valait la page courante côté web, deux endpoints
  différents cassés sur la même page collapseraient sur une seule signature.

## Dette technique connue (assumée, hors périmètre de cette PR)

La logique anti-flood (`logic.ts` : validation, signature, dédup/cooldown/
coupe-circuit) et le pipeline offline mobile (`errorReportingService.ts` +
outbox SQLite) sont des **quasi-doublons structurels** du pattern
render-mismatch (#90). C'est un choix délibéré : généraliser #90 en un module
`_shared/alertEngine` réutilisable par les deux edge functions toucherait le
code de #90 (déjà mergé, hors ticket #96), explicitement exclu du périmètre
de cette PR pour éviter le scope creep. Un ticket de suivi dédié à
l'extraction d'un moteur d'alerte générique (dédup + cooldown + coupe-circuit
+ outbox SQLite paramétrés) serait la suite naturelle si un troisième cas
d'usage se présente.

## Fichiers

| Rôle | Fichier |
|---|---|
| Types partagés | `packages/shared/src/index.ts` (`AppError`, `AppErrorDescriptor`, `AppErrorKind`) |
| Table + RLS | `supabase/schema.sql` (`app_error_log`) |
| Edge function (logique pure + handler) | `supabase/functions/report-app-error/{logic,index}.ts` |
| Chokepoint réseau (5xx + échecs réseau) | `apps/{web,mobile}/src/lib/supabase.ts` (`reportingFetch`) |
| Service émetteur web | `apps/web/src/services/errorReportingService.ts` |
| Service émetteur mobile (+ outbox offline) | `apps/mobile/src/services/errorReportingService.ts` + `apps/mobile/src/lib/appErrorOutbox.ts` |
| Error boundary web | `apps/web/src/components/features/ErrorBoundary/` (montée dans `main.tsx`) |
| Error boundary mobile | `apps/mobile/src/components/features/ErrorBoundary/` (montée dans `App.tsx`) |
| Handler global promise rejection (web) | `installGlobalErrorHandlers` (`errorReportingService.ts`, appelé dans `main.tsx`) |
| Handler global RN (mobile) | `installGlobalErrorHandlers` via `ErrorUtils.setGlobalHandler` (`errorReportingService.ts`, appelé dans `App.tsx`) |
| Drain de la file mobile au retour foreground | `apps/mobile/src/hooks/useSyncOnForeground/useSyncOnForeground.ts` |

## Variables d'environnement (edge function)

| Variable | Défaut | Rôle |
|---|---|---|
| `APP_ERROR_EMAIL` (ou `DEV_EMAIL`) | `guillaume.zarb@gmail.com` | Destinataire(s) des alertes |
| `RESEND_API_KEY` | - | Clé Resend (sans elle : log en table, pas d'email) |
| `APP_ERROR_COOLDOWN_MS` | `86400000` (24 h) | Fenêtre de silence par signature |
| `APP_ERROR_CIRCUIT_MAX` | `20` | Plafond d'emails par fenêtre |
| `APP_ERROR_CIRCUIT_WINDOW_MS` | `3600000` (1 h) | Fenêtre du coupe-circuit |

> ⚠️ Resend exige un **domaine vérifié** pour envoyer à une adresse arbitraire ; le
> domaine de test n'envoie qu'au propriétaire du compte Resend. À vérifier au branchement.
