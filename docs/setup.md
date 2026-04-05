# Guide d'installation

## Prérequis

- **Node.js** v18 ou supérieur — [nodejs.org](https://nodejs.org)
- **npm** v9 ou supérieur (inclus avec Node.js)
- **Expo Go** sur votre téléphone — App Store ou Google Play
- Un compte **Supabase** — [supabase.com](https://supabase.com)

## 1. Installer les dépendances

```bash
# Cloner le projet (si pas déjà fait)
git clone <url-du-repo> PsyTool
cd PsyTool

# Installer toutes les dépendances (web + mobile + shared)
npm install
```

## 2. Configurer Supabase

### Créer le projet Supabase

1. Connectez-vous sur [supabase.com](https://supabase.com)
2. Cliquez "New project"
3. Choisissez un nom (ex: "psytool") et un mot de passe fort
4. Sélectionnez la région la plus proche (ex: "West EU")
5. Attendez la création (~2 minutes)

### Appliquer le schéma de base de données

1. Dans votre projet Supabase, allez dans **SQL Editor**
2. Copiez-collez tout le contenu du fichier `supabase/schema.sql`
3. Cliquez **Run**

Si tout se passe bien, vous verrez les 5 tables créées dans **Table Editor**.

### Récupérer les clés API

Dans votre projet Supabase: **Settings → API**

Vous avez besoin de deux valeurs:
- **Project URL** — ressemble à `https://abcdefghij.supabase.co`
- **anon public key** — longue chaîne commençant par `eyJ...`

## 3. Configurer les variables d'environnement

### App web (praticien)

Créez le fichier `apps/web/.env` :

```env
VITE_SUPABASE_URL=https://VOTRE_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJVOTRE_CLE_ANON
```

### App mobile (patient)

Créez le fichier `apps/mobile/.env` :

```env
EXPO_PUBLIC_SUPABASE_URL=https://VOTRE_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJVOTRE_CLE_ANON
```

**Important**: les mêmes valeurs dans les deux fichiers.

## 4. Lancer les applications

### App web praticien

```bash
npm run web
```

Ouvrez votre navigateur sur `http://localhost:5173`

### App mobile patient

```bash
npm run mobile
```

Un QR code s'affiche dans le terminal. Scannez-le avec:
- **iOS**: l'app Appareil photo (puis "Ouvrir dans Expo Go")
- **Android**: l'app Expo Go directement

## 5. Créer votre premier compte praticien

1. Ouvrez `http://localhost:5173`
2. Cliquez "Créer un compte"
3. Renseignez: email, mot de passe, votre nom, titre professionnel (ex: "IPA en psychiatrie")
4. Validez l'email reçu (vérifiez vos spams)
5. Reconnectez-vous

## 6. Inviter un premier patient

1. Dans le dashboard, cliquez "Inviter un patient"
2. Saisissez l'email du patient
3. Copiez le lien généré
4. Envoyez-le au patient

Le patient peut s'inscrire via ce lien dans un navigateur, ou via l'app mobile si `psytool://` est configuré.

---

## Problèmes courants

### "Invalid API key"
Vérifiez que les clés dans `.env` correspondent bien à votre projet Supabase (pas d'espaces, pas de guillemets supplémentaires).

### L'email de confirmation n'arrive pas
Supabase envoie 2 emails par heure maximum en mode gratuit. Attendez quelques minutes ou vérifiez les spams.

### Le lien d'invitation ne fonctionne pas
- Vérifiez que le token n'a pas expiré (48h)
- Vérifiez que l'app web tourne sur `http://localhost:5173`
- Si vous testez depuis un autre appareil, remplacez `localhost` par l'IP de votre machine

### Expo Go ne trouve pas l'app
Assurez-vous que votre téléphone et votre ordinateur sont sur le même réseau Wi-Fi.
