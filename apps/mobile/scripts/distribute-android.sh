#!/bin/bash
# Script de distribution Android via Firebase App Distribution
# Usage : bash scripts/distribute-android.sh [--groups "testers"] [--release-notes "v1.0.0"]

set -e

FIREBASE_APP_ID="1:243014828303:android:13b120c5865e5794283e7a"
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
RELEASE_NOTES="${RELEASE_NOTES:-Nouvelle version}"
# Groupe de testeurs par défaut. Le CLI Firebase tente l'étape de distribution même
# sans --groups et échoue alors en HTTP 404 : il faut toujours une cible explicite.
# Groupes disponibles : firebase appdistribution:group:list --project kaer-84ba7
GROUPS="${GROUPS:-kaer-test-group}"

# Récupérer les arguments optionnels
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --groups) GROUPS="$2"; shift ;;
    --release-notes) RELEASE_NOTES="$2"; shift ;;
  esac
  shift
done

echo "📦 Étape 1/2 — Build Android release..."
cd android && ./gradlew assembleRelease && cd ..

if [ ! -f "$APK_PATH" ]; then
  echo "❌ APK introuvable à $APK_PATH"
  exit 1
fi

echo "🚀 Étape 2/2 — Distribution Firebase App Distribution..."
DIST_ARGS=(--app "$FIREBASE_APP_ID" --release-notes "$RELEASE_NOTES")
[ -n "$GROUPS" ] && DIST_ARGS+=(--groups "$GROUPS")
firebase appdistribution:distribute "$APK_PATH" "${DIST_ARGS[@]}"

echo "✅ Distribution terminée !"
