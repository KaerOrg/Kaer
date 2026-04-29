# Flux d'invitation patient — App mobile patient

## Vue d'ensemble

L'app mobile est l'espace du patient après inscription. L'inscription se fait via un lien web (pas directement dans l'app pour l'instant).

```
Patient reçoit le lien → S'inscrit sur le web (/register?token=...)
                       → Télécharge l'app mobile
                       → Se connecte avec email + mot de passe
                       → Accède aux modules débloqués par le praticien
```

---

## État actuel

L'app mobile est scaffoldée (Expo + React Native + TypeScript) mais **l'authentification et la navigation ne sont pas encore implémentées**.

---

## À implémenter (par ordre de priorité)

### 1. Authentification (login uniquement)
Le patient ne peut pas s'inscrire depuis l'app — il utilise le lien web.

```
Écran de connexion → email + mot de passe → supabase.auth.signInWithPassword()
```

Variables d'environnement nécessaires dans `.env` :
```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

### 2. Chargement des modules
Après connexion, récupérer les modules actifs du patient :
```ts
supabase
  .from('patient_modules')
  .select('*')
  .eq('patient_id', user.id)
  .is('revoked_at', null)
```

### 3. Navigation
```
Stack principal :
  LoginScreen
  └── HomeScreen (liste des modules débloqués)
       └── ModuleScreen (un module spécifique)
```

---

## Deep links (évolution future)

Pour permettre au patient d'ouvrir le lien d'invitation directement dans l'app :

1. Configurer le scheme Expo dans `app.json` :
```json
{
  "expo": {
    "scheme": "psytool"
  }
}
```

2. Le lien devient : `psytool://register?token=<uuid>`

3. Intercepter le lien avec `expo-linking` :
```ts
import * as Linking from 'expo-linking'

const url = await Linking.getInitialURL()
// Extraire le token et afficher l'écran d'inscription
```

4. Écran d'inscription dans l'app :
   - Vérifier le token via Supabase
   - Formulaire email (pré-rempli) + mot de passe
   - `signUp` avec `{ role: 'patient', invitation_token: token }` dans les métadonnées

---

## Modules thérapeutiques prévus

| Clé | Nom | Statut |
|---|---|---|
| `sleep_diary` | Agenda du sommeil | MVP — à construire en premier |
| `beck_columns` | Colonnes de Beck | Prévu |
| `fear_thermometer` | Thermomètre de la peur | Prévu |
| `emotion_wheel` | Roue des émotions | Prévu |
| `crisis_plan` | Plan de crise | Prévu |
| `rim` | RIM — Imagerie mentale | Prévu |
| `cognitive_saturation` | Saturation cognitive | Prévu |

Les données des exercices sont stockées **en local** sur le téléphone (`expo-sqlite` / `MMKV`). Le patient peut choisir de les partager avec son praticien.
