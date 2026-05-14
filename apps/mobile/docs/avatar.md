# Photo de profil patient

## Vue d'ensemble

Le patient peut ajouter ou modifier sa photo de profil depuis l'écran **Mon profil** de l'app mobile. La photo est stockée dans Supabase Storage (bucket `avatars`) et l'URL publique est sauvegardée dans la colonne `patients.avatar_url`.

---

## Flux utilisateur

```
Patient appuie sur le cercle avatar
  → Alert : "Galerie photo" | "Appareil photo" | "Annuler"
  → Demande de permission (si non accordée)
  → Sélection / capture (recadrage carré imposé)
  → Upload vers Supabase Storage : avatars/{user_id}/avatar.jpg
  → Mise à jour de patients.avatar_url
  → Affichage immédiat dans l'écran
```

---

## Architecture technique

| Fichier | Rôle |
|---|---|
| `apps/mobile/src/lib/avatar.ts` | Pick, upload, sauvegarde BDD |
| `apps/mobile/src/store/authStore.ts` | Champ `avatar_url` dans `Patient`, action `updateAvatar()` |
| `apps/mobile/src/screens/ProfileScreen.tsx` | Composant `AvatarSection` |
| `supabase/schema.sql` | Colonne `avatar_url`, bucket `avatars`, RLS Storage |

### Bucket Supabase Storage

- **Nom** : `avatars`
- **Accès** : public (lecture sans authentification)
- **Structure des chemins** : `avatars/{user_id}/avatar.jpg`
- **Upload** : `upsert: true` — écrase l'ancienne photo
- **Cache-buster** : `?t={timestamp}` ajouté à l'URL pour forcer le rechargement

### RLS Storage

| Opération | Règle |
|---|---|
| INSERT | Authentifié + premier segment du chemin = `auth.uid()` |
| UPDATE | Idem |
| DELETE | Idem |
| SELECT | Public (pas de restriction) |

---

## Setup initial (première mise en production)

Le bucket `avatars` est créé automatiquement par la migration `add_patient_avatar`. Si le schéma est réappliqué depuis zéro, le bucket sera recréé via `INSERT INTO storage.buckets ... ON CONFLICT DO NOTHING`.

Vérification dans le dashboard Supabase : **Storage → avatars → Public bucket ✓**

---

## Permissions natives requises

### iOS — `app.json` / `app.config.js`

```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "PsyTool accède à vos photos pour personnaliser votre profil.",
          "cameraPermission": "PsyTool accède à votre appareil photo pour prendre une photo de profil."
        }
      ]
    ]
  }
}
```

### Android

Les permissions `READ_MEDIA_IMAGES` et `CAMERA` sont ajoutées automatiquement par le plugin Expo.

> **Note** : Expo Go (SDK 50+) supporte `expo-image-picker` sans rebuild natif. Pour une build EAS, lancer `npx expo prebuild` après ajout du plugin.

---

## Tests

```bash
cd apps/mobile
npx jest src/lib/avatar.test.ts
```

9 cas couverts : permission accordée/refusée, annulation, upload réussi/échoué, erreur BDD.
