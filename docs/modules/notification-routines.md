# Notification Routines

## Résumé

Système permettant aux praticiens de programmer des rappels push par module patient. Le patient peut décaler l'heure et mettre un rappel en pause depuis l'écran du module concerné.

## Règles métier

- Le praticien définit : jours de la semaine (ISO 1–7), heure, note optionnelle, actif/inactif.
- Le patient peut : décaler l'heure (`patient_time_override`), mettre en pause (`patient_paused`).
- La mise en pause génère un événement `NOTIFICATION_PAUSED` dans `notification_events`, visible par le praticien via l'icône cloche de l'en-tête web.
- **Conformité MDR** : les rappels sont à horaire fixe, jamais déclenchés par une donnée clinique.
- Un patient peut avoir plusieurs routines actives pour un même module (ex. lun/mer/ven + mar/jeu).

## Schéma de données

| Table | Rôle |
|---|---|
| `notification_routines` | Calendrier par patient_module — praticien CRUD, patient update (pause + time_override) |
| `patient_push_tokens` | Token push par device patient — upsert au login. `token_type` = `'expo'` (Expo Push, iOS/fallback) ou `'fcm'` (FCM natif Android). `platform` = `'ios'`/`'android'`. Unicité sur `expo_push_token` |
| `notification_logs` | Audit des envois — service_role uniquement |
| `notification_events` | Événement `NOTIFICATION_PAUSED` — feed praticien (icône cloche header web) |

## Flux

```
1. Praticien ouvre la modale cloche sur un module débloqué
2. Praticien sélectionne jours + heure (+ note optionnelle)
3. → createRoutine() → notification_routines INSERT
4. Au login mobile : registerPushToken() → patient_push_tokens UPSERT
5. pg_cron toutes les minutes → send-notifications Edge Function
6. Edge Function : filtre routines actives + heure courante (UTC), lit patient_push_tokens,
   route par token_type → FCM HTTP v1 (projet kaer-84ba7) OU Expo Push API → notification_logs INSERT
7. Patient reçoit la notification push sur son device (bannière affichée même app ouverte, cf. handler foreground)
8. Patient met en pause depuis l'écran du module → pauseRoutine() → patient_paused=true + NOTIFICATION_PAUSED event
9. Praticien voit le badge cloche dans le header web → feed d'activité
```

## Réception côté app (foreground / interception)

- **Foreground = Toast in-app, pas de bannière OS.** `configureForegroundNotifications()` (`notificationService.ts`) pose `Notifications.setNotificationHandler` avec `shouldShowBanner: false` (+ `shouldShowList: true`, `shouldPlaySound: true`). Monté une fois au boot dans `apps/mobile/src/navigation/index.tsx`. En arrière-plan / écran verrouillé, l'OS affiche la bannière normalement.
- **Interception foreground → Toast** (branché) : le hook `useForegroundNotificationToast` (`apps/mobile/src/hooks/useForegroundNotificationToast/`) écoute `Notifications.addNotificationReceivedListener` — qui ne se déclenche **qu'app ouverte** — et présente la notif via `useToast().showToast(body ?? title, 'info')`. Monté dans le composant `Navigation` (sous `ToastProvider`), abonnement retiré au démontage.
- **Tap utilisateur (non branché à ce jour)** : pour router au tap (foreground + background), ajouter `Notifications.addNotificationResponseReceivedListener(cb)` avec un `data.module_type` dans le payload FCM/Expo → deep-link vers l'écran du module.

## Services

| Fichier | Fonctions clés |
|---|---|
| `apps/web/src/services/notificationRoutineService.ts` | `getRoutinesForPatientModule`, `createRoutine`, `updateRoutine`, `deleteRoutine`, `getActivityFeed` |
| `apps/mobile/src/services/notificationService.ts` | `registerPushToken` (FCM natif Android / Expo Push iOS), `registerPushTokenIfGranted`, `configureForegroundNotifications`, `setupAndroidChannel`, `getRoutinesForModule`, `pauseRoutine`, `resumeRoutine`, `updateTimeOverride` |

## Composants

| Fichier | Rôle |
|---|---|
| `apps/web/src/components/features/NotificationRoutinePanel/` | Panneau praticien — CRUD des routines par module. Monté dans l'onglet **Notifications** de la modale d'actions du module (`ModuleActionsModal`), plus voir `apps/web/docs/module-actions-modal.md`. |
| `apps/web/src/components/features/ActivityFeedPanel/` | Icône cloche header + panel événements pause |
| `apps/mobile/src/components/NotificationRoutinePanel.tsx` | Section dans écran module — patient voit/ajuste ses rappels |

## Edge Function

`supabase/functions/send-notifications/index.ts` — appelée par pg_cron toutes les minutes. Tourne en `service_role`.

Pour chaque routine due (jour ISO courant + heure UTC = `patient_time_override ?? time_of_day`), elle lit les tokens du patient et route selon `token_type` :

- **`token_type = 'fcm'`** → FCM HTTP v1 sur le projet `kaer-84ba7`. L'access token OAuth est signé (RS256 JWT) à partir du secret **`FCM_SERVICE_ACCOUNT_JSON`** (compte de service Firebase). Canal Android : `psytool-reminders`. Si le secret n'est pas configuré, les tokens FCM sont ignorés (log `warn`), les tokens Expo restent envoyés.
- **`token_type = 'expo'`** → Expo Push API (`https://exp.host/--/api/v2/push/send`), par lots de 100.

Titre = `Kær` ; corps = `practitioner_note` de la routine, sinon message par défaut. Chaque routine due est journalisée dans `notification_logs` (`status: 'sent'`).

### Secret requis
`FCM_SERVICE_ACCOUNT_JSON` — JSON du compte de service Firebase (projet `kaer-84ba7`), configuré via `supabase secrets set` / Dashboard > Edge Functions > Secrets. Indispensable aux notifications Android (tokens FCM).

### Activer pg_cron (Supabase Dashboard)
1. Database > Extensions > pg_cron : activer
2. SQL Editor, exécuter une seule fois :
```sql
select cron.schedule(
  'send-notifications-cron',
  '* * * * *',
  $$
    select net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-notifications',
      headers := '{"Content-Type":"application/json","Authorization":"Bearer <SERVICE_ROLE_KEY>"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);
```

## Cas limites

- Token push non disponible dans Expo Go SDK 53+ — `registerPushToken` retourne `null` silencieusement, sans bloquer le flux.
- Patient sans token push : la routine existe mais aucune notification n'est envoyée.
- Heure de la routine en UTC dans la BDD — la conversion fuseau horaire est à la charge du praticien (MVP).
- Un module révoqué → `patient_modules` delete CASCADE → `notification_routines` delete CASCADE automatiquement.
