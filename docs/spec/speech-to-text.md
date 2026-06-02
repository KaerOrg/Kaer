# Speech-to-Text — Dictée de notes praticien

## Résumé

Permet au praticien de dicter oralement une note de consultation. Le texte transcrit s'ajoute à la fin du champ de saisie de note dans l'onglet **Notes** de la fiche patient.

## Architecture

```
Browser MediaRecorder (WebM/MP4/OGG)
  → Blob → base64 JSON
  → supabase.functions.invoke('transcribe')
  → Supabase Edge Function (Deno)
  → POST api.openai.com/v1/audio/transcriptions  { model: gpt-4o-transcribe }
  → { text: string }
  → SpeechToTextButton.onTranscription(text)
  → newNoteRef.current.value += '\n' + text
  → flux noteService existant (inchangé)
```

## Règles métier

- La transcription est une **dictée brute** — aucun traitement sémantique, aucune interprétation clinique (conformité MDR 2017/745).
- Le texte transcrit **s'ajoute** (append) à la fin du textarea, sans remplacer l'éventuel texte déjà tapé.
- L'utilisateur **démarre et stoppe** manuellement l'enregistrement — pas de détection automatique de silence, pas de timeout.
- La clé OpenAI est un **secret Supabase** (`OPENAI_API_KEY`) : elle n'est jamais exposée côté client.
- L'edge function valide le **JWT praticien** avant tout appel OpenAI.

## Fichiers

| Fichier | Rôle |
|---|---|
| `supabase/functions/transcribe/index.ts` | Edge function Deno — proxy OpenAI sécurisé |
| `apps/web/src/services/transcriptionService.ts` | Service client — encode blob, appelle edge fn |
| `apps/web/src/services/transcriptionService.test.ts` | 6 tests unitaires |
| `apps/web/src/components/SpeechToTextButton/` | Composant UI réutilisable |
| `apps/web/src/pages/PatientPage.tsx` | Intégration (handleTranscription + bouton) |

## Schéma de données

Aucune table SQL créée — la transcription est éphémère. Le texte résultant suit le flux `noteService` → `practitioner_patient_notes` (inchangé).

## États du composant `SpeechToTextButton`

| État | Icône | Description |
|---|---|---|
| `idle` | `Mic` | Prêt à enregistrer |
| `recording` | `MicOff` + point rouge clignotant | Enregistrement en cours |
| `processing` | `Loader` (spinner) | Transcription en cours |
| `error` | `Mic` + message d'erreur inline | Erreur (permission, réseau, serveur) |

## Types d'erreur

| Code | Cause |
|---|---|
| `NOT_SUPPORTED` | `MediaRecorder` absent du navigateur |
| `PERMISSION_DENIED` | Accès micro refusé par l'utilisateur |
| `TOO_LARGE` | Blob > 25 Mo (limite OpenAI) |
| `NETWORK` | Exception réseau lors de l'appel edge function |
| `SERVER_ERROR` | Edge function / OpenAI retourne une erreur |

## Formats audio supportés

`audio/webm` (Chrome/Firefox), `audio/mp4` (Safari), `audio/ogg` — détectés automatiquement via `MediaRecorder.isTypeSupported`.

## Provisionnement de la clé OpenAI

```bash
supabase secrets set OPENAI_API_KEY=sk-proj-...
```

## Cas limites

- **Safari** : produit `audio/mp4` (M4A) — supporté par OpenAI et l'edge function.
- **Micro non disponible** : erreur `NOT_SUPPORTED` ou `PERMISSION_DENIED` affichée inline, sans crash.
- **Enregistrement très long** : OpenAI accepte jusqu'à 25 Mo (~3-4h en WebM 8kbps). Un bloc de notes standard (< 5 min) représente ~2 Mo.
