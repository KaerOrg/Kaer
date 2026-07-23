#!/bin/bash
# Script de distribution Android via Firebase App Distribution
# Usage : bash scripts/distribute-android.sh [--groups "testers"] [--release-notes "v1.0.0"]

set -e

FIREBASE_APP_ID="1:243014828303:android:13b120c5865e5794283e7a"
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
RELEASE_NOTES=""
# Partie de version incrémentée à chaque distribution (major|minor|patch).
BUMP_PART="${BUMP_PART:-minor}"
# Groupe de testeurs par défaut.
# NE PAS renommer en GROUPS : c'est une variable spéciale en lecture seule de bash
# (liste des groupes Unix de l'utilisateur). Toute assignation y est ignoree, et le
# script enverrait alors "--groups <gid>" -> Firebase repond HTTP 404.
# Groupes disponibles : firebase appdistribution:group:list --project kaer-84ba7
TESTER_GROUPS="${TESTER_GROUPS:-kaer-test-group}"

# Récupérer les arguments optionnels
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --groups) TESTER_GROUPS="$2"; shift ;;
    --release-notes) RELEASE_NOTES="$2"; shift ;;
    --bump) BUMP_PART="$2"; shift ;;
  esac
  shift
done

echo "🔢 Étape 1/3 — Bump de version ($BUMP_PART)..."
NEW_VERSION="$(python3 scripts/bump-version.py "$BUMP_PART")"
echo "   → version $NEW_VERSION"
# Si aucune note n'est fournie, utiliser la version comme note par défaut.
RELEASE_NOTES="${RELEASE_NOTES:-Version $NEW_VERSION}"

echo "📦 Étape 2/3 — Build Android release..."
cd android && ./gradlew assembleRelease && cd ..

if [ ! -f "$APK_PATH" ]; then
  echo "❌ APK introuvable à $APK_PATH"
  exit 1
fi

echo "🚀 Étape 3/3 — Distribution Firebase App Distribution..."
DIST_ARGS=(--app "$FIREBASE_APP_ID" --release-notes "$RELEASE_NOTES")
[ -n "$TESTER_GROUPS" ] && DIST_ARGS+=(--groups "$TESTER_GROUPS")
firebase appdistribution:distribute "$APK_PATH" "${DIST_ARGS[@]}"

echo "✅ Distribution terminée !"
