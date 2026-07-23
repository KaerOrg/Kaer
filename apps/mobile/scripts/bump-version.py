#!/usr/bin/env python3
"""Incrémente la version de l'app mobile avant une distribution.

Source de vérité DURABLE : app.json (expo.version + expo.android.versionCode). C'est le
seul fichier de version suivi par git — le dossier android/ est gitignoré et régénéré par
`expo prebuild`, donc android/app/build.gradle ne persiste pas. On met quand même à jour le
build.gradle LOCAL pour que le build Gradle immédiat (./gradlew assembleRelease) embarque la
nouvelle version.

Par défaut : bump du numéro MINEUR (1.0.0 -> 1.1.0) et versionCode +1 (obligatoire pour
qu'Android accepte l'upload et que la release soit distincte dans App Distribution).

Usage : python3 scripts/bump-version.py [major|minor|patch]   (défaut : minor)
Affiche sur stdout la nouvelle version « X.Y.Z (code) ».
"""
import json
import re
import sys
from pathlib import Path

PART = sys.argv[1] if len(sys.argv) > 1 else "minor"
if PART not in ("major", "minor", "patch"):
    sys.exit(f"Partie de version inconnue : {PART!r} (attendu : major|minor|patch)")

ROOT = Path(__file__).resolve().parent.parent
APP_JSON = ROOT / "app.json"
GRADLE = ROOT / "android" / "app" / "build.gradle"

app_config = json.loads(APP_JSON.read_text())
expo = app_config["expo"]
android = expo.setdefault("android", {})

name_match = re.match(r"^(\d+)\.(\d+)\.(\d+)$", str(expo.get("version", "")))
if not name_match:
    sys.exit(f"expo.version invalide dans app.json : {expo.get('version')!r}")
major, minor, patch = (int(name_match.group(i)) for i in (1, 2, 3))

# versionCode durable = app.json ; à défaut (première exécution), on récupère celui du
# build.gradle local s'il existe, sinon 0.
if isinstance(android.get("versionCode"), int):
    current_code = android["versionCode"]
elif GRADLE.exists():
    gradle_code = re.search(r"versionCode\s+(\d+)", GRADLE.read_text())
    current_code = int(gradle_code.group(1)) if gradle_code else 0
else:
    current_code = 0

if PART == "major":
    major, minor, patch = major + 1, 0, 0
elif PART == "minor":
    minor, patch = minor + 1, 0
else:
    patch += 1

new_name = f"{major}.{minor}.{patch}"
new_code = current_code + 1

# 1. app.json — source de vérité durable (suivie par git)
expo["version"] = new_name
android["versionCode"] = new_code
APP_JSON.write_text(json.dumps(app_config, indent=2, ensure_ascii=False) + "\n")

# 2. build.gradle local — pour le build Gradle immédiat (non suivi par git)
if GRADLE.exists():
    gradle_src = GRADLE.read_text()
    gradle_src = re.sub(r'versionName\s+"\d+\.\d+\.\d+"', f'versionName "{new_name}"', gradle_src, count=1)
    gradle_src = re.sub(r"versionCode\s+\d+", f"versionCode {new_code}", gradle_src, count=1)
    GRADLE.write_text(gradle_src)

print(f"{new_name} ({new_code})")
