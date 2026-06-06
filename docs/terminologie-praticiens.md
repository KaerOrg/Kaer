# Terminologie — Corps de métier praticiens

## Principe

Kær n'est pas réservé à un corps de métier spécifique. L'application s'adresse à l'ensemble des **consultants et thérapeutes en psychiatrie**, qu'ils exercent en libéral, en cabinet, en hôpital ou en CMP.

## Corps de métier ciblés

| Corps de métier | Abréviation courante |
|---|---|
| Infirmier·e Diplômé·e d'État | IDE |
| Infirmier·e en Pratique Avancée | IPA |
| Psychiatre | — |
| Pédopsychiatre | — |
| Addictologue | — |
| Médecin généraliste | — |
| Psychologue clinicien·ne | — |

## Termes à utiliser dans le code et la documentation

| Contexte | Terme à privilégier | À éviter |
|---|---|---|
| Désigner l'utilisateur de l'interface web | `praticien` / `thérapeute` | `IPA`, `infirmier`, tout titre spécifique |
| Désigner l'utilisateur dans les textes UI | "votre praticien" / "votre thérapeute" | "votre infirmier", "votre IPA" |
| Noms de variables / types TypeScript | `practitioner`, `therapist` | `nurse`, `ipa` |
| Noms de tables SQL | `practitioners` (existant, conservé) | — |
| Documentation CLAUDE.md et `.md` | "consultant ou thérapeute en psychiatrie" | Tout corps de métier unique |

## Règle de codage

Les clés de traduction (`i18n`) et les labels UI doivent utiliser des formulations neutres :

```
// ✅ Correct
"invitedBy": "Votre thérapeute vous a invité·e"
"moduleUnlocked": "Votre praticien a débloqué ce module"

// ❌ À éviter
"invitedBy": "Votre IPA vous a invité·e"
"moduleUnlocked": "Votre infirmier a débloqué ce module"
```

## Note sur les tables SQL existantes

La table `practitioners` est conservée telle quelle — renommer une table SQL en production est une opération risquée et le terme `practitioner` (anglais générique) convient à tous les corps de métier.
