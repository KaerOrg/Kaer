# Notification Routines

## Résumé

Système permettant aux praticiens de programmer des rappels push par module patient. Le patient peut décaler l'heure et mettre un rappel en pause depuis l'écran du module concerné.

## Règles métier

- Le praticien définit : jours de la semaine (ISO 1–7), heure, note optionnelle, actif/inactif.
- Le patient peut : décaler l'heure (`patient_time_override`), mettre en pause (`patient_paused`).
- La mise en pause génère un événement `NOTIFICATION_PAUSED` dans `patient_engagement_logs`, visible par le praticien via l'icône cloche de l'en-tête web.
- **Conformité MDR** : les rappels sont à horaire fixe, jamais déclenchés par une donnée clinique.
- Un patient peut avoir plusieurs routines actives pour un même module (ex. lun/mer/ven + mar/jeu).

## Schéma de données

| Table | Rôle |
|---|---|
| `notification_routines` | Calendrier par patient_module — praticien CRUD, patient update (pause + time_override) |
| `patient_push_tokens` | Token Expo par device patient — upsert au login |
| `notification_logs` | Audit des envois — service_role uniquement |
| `patient_engagement_logs` | Événement `NOTIFICATION_PAUSED` — feed praticien |

## Flux

```
1. Praticien ouvre la modale cloche sur un module débloqué
2. Praticien sélectionne jours + heure (+ note optionnelle)
3. → createRoutine() → notification_routines INSERT
4. Au login mobile : registerPushToken() → patient_push_tokens UPSERT
5. pg_cron toutes les minutes → send-notifications Edge Function
6. Edge Function : filtre routines actives + heure courante → Expo Push API → notification_logs INSERT
7. Patient reçoit la notification push sur son device
8. Patient met en pause depuis l'écran du module → pauseRoutine() → patient_paused=true + NOTIFICATION_PAUSED log
9. Praticien voit le badge cloche dans le header web → feed d'activité
```

## Services

| Fichier | Fonctions clés |
|---|---|
| `apps/web/src/services/notificationRoutineService.ts` | `getRoutinesForPatientModule`, `createRoutine`, `updateRoutine`, `deleteRoutine`, `getActivityFeed` |
| `apps/mobile/src/services/notificationService.ts` | `registerPushToken`, `getRoutinesForModule`, `pauseRoutine`, `resumeRoutine`, `updateTimeOverride` |

## Composants

| Fichier | Rôle |
|---|---|
| `apps/web/src/components/features/NotificationRoutinePanel/` | Panneau praticien — CRUD des routines par module. Monté dans l'onglet **Notifications** de la modale d'actions du module (`ModuleActionsModal`), plus voir `apps/web/docs/module-actions-modal.md`. |
| `apps/web/src/components/ActivityFeedPanel/` | Icône cloche header + panel événements pause |
| `apps/mobile/src/components/NotificationRoutinePanel.tsx` | Section dans écran module — patient voit/ajuste ses rappels |

## Edge Function

`supabase/functions/send-notifications/index.ts` — appelée par pg_cron toutes les minutes.

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
