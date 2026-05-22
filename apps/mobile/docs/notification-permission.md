# Écran de permission notifications

Écran d'onboarding présenté une seule fois après la connexion du patient. Il explique
pourquoi l'app utilise les notifications, puis déclenche la demande de permission système.

## Rôle

Avant cette feature, la permission notifications était demandée en silence au login
(`registerPushToken` appelé depuis `authStore`). Deux problèmes :

- Aucun contexte donné au patient — la pop-up système surgissait sans explication.
- Dans **Expo Go** (SDK 53+), `getExpoPushTokenAsync()` est bloqué : `registerPushToken`
  retourne `null` *avant* de demander la permission. L'app ne réclamait donc jamais rien.

L'écran dédié corrige le premier point et rend la demande explicite et compréhensible.

## Flux

```
App boot → loadSession() → patient connecté
  └─ navigation/index.tsx : shouldShowNotificationOnboarding()
       permission === 'undetermined' ET drapeau AsyncStorage absent
         ↓ OUI                              ↓ NON
   NotificationPermissionScreen          AppStack
   ├─ « Activer les rappels »            (si permission déjà accordée,
   │    → requestNotificationPermission   registerPushTokenIfGranted
   │    → registerPushToken (si accordé)  rafraîchit le token en silence)
   │    → markOnboardingSeen → AppStack
   └─ « Plus tard »
        → markOnboardingSeen → AppStack
```

L'écran ne réapparaît jamais une fois le drapeau `notif_onboarding_shown` posé dans
AsyncStorage — quel que soit le bouton choisi. Le patient pourra toujours activer les
notifications plus tard depuis les réglages de son téléphone.

## Fichiers

| Fichier | Rôle |
|---|---|
| `src/screens/NotificationPermissionScreen.tsx` | Écran — props `{ onDone }`, rendu hors React Navigation |
| `src/navigation/index.tsx` | Décide d'afficher l'écran via l'état `notifGate` |
| `src/services/notificationService.ts` | `shouldShowNotificationOnboarding`, `markNotificationOnboardingSeen`, `registerPushTokenIfGranted` |
| `src/store/authStore.ts` | Au login : `registerPushTokenIfGranted` (ne re-demande jamais la permission) |
| `i18n/locales/{fr,en}/common.json` | Clés `notifications.onboarding.*` |

## Service — fonctions associées

- **`shouldShowNotificationOnboarding()`** — `true` si permission `undetermined` ET écran
  jamais présenté. Tolère une erreur AsyncStorage en retournant `false` (jamais bloquant).
- **`markNotificationOnboardingSeen()`** — pose le drapeau `notif_onboarding_shown`.
- **`registerPushTokenIfGranted(patientId)`** — enregistre le token *uniquement* si la
  permission est déjà accordée. Utilisé au login pour rafraîchir le token sans redéclencher
  de pop-up système (la demande initiale appartient à l'écran d'onboarding).

## Expo Go vs development build

L'écran s'affiche et fonctionne dans les deux cas. Mais en **Expo Go**, `registerPushToken`
retourne `null` (pas de token Expo possible) : aucune ligne n'est créée dans
`patient_push_tokens`, donc aucune notification push ne peut être reçue. Pour un test
réel de bout en bout, installer un **development build** (`eas build --profile development`).

## Conformité MDR 2017/745

Les rappels sont des notifications d'horaire fixe, programmées à l'avance par le praticien
(table `notification_routines`). Ils ne sont **jamais** déclenchés par les données saisies
par le patient. Le texte `notifications.onboarding.privacy_note` rappelle ce point au
patient. Voir l'edge function `supabase/functions/send-notifications`.

## i18n

Clés sous `notifications.onboarding.*` dans `common.json` (fr + en). Cet écran n'est pas
un module thérapeutique — aucune variante `teen.json` requise (la règle teen ne couvre
que les clés `modules.<id>.*`).
