// ─── Service d'autorisations générique ──────────────────────────────────────
//
// Point d'entrée unique pour toutes les autorisations système du patient
// (notifications, contacts, photothèque, appareil photo). Chaque « kind » délègue
// au module Expo correspondant, mais l'API et le statut sont normalisés : les
// appelants (`notificationService`, `avatarService`, `crisisPlanService`,
// `contactsService`) partagent la même mécanique « vérifier puis demander » et le
// même mock de test, au lieu de réimplémenter le couple get/request module par module.
//
// Chaque autorisation exige aussi une chaîne d'explication iOS (`Info.plist`),
// déclarée dans `app.json` via les config plugins Expo : Apple rejette toute
// demande sans justification claire.
//
// Conformité MDR 2017/745 : on demande l'accès à une capacité de l'appareil,
// jamais d'interprétation des données.

import * as Notifications from 'expo-notifications'
import * as ImagePicker from 'expo-image-picker'
import * as Contacts from 'expo-contacts'

/** Autorisations système gérées par l'application patient. */
export type PermissionKind = 'notifications' | 'contacts' | 'mediaLibrary' | 'camera'

/** Statut normalisé, commun à tous les modules Expo. */
export type PermissionState = 'granted' | 'denied' | 'undetermined'

// Un module Expo expose deux appels asynchrones renvoyant un `{ status }`. On les
// enveloppe pour normaliser le retour vers `PermissionState`, sans exposer les
// enums propres à chaque module.
interface PermissionHandler {
  get: () => Promise<{ status: string }>
  request: () => Promise<{ status: string }>
}

const HANDLERS: Record<PermissionKind, PermissionHandler> = {
  notifications: {
    get: () => Notifications.getPermissionsAsync(),
    request: () => Notifications.requestPermissionsAsync(),
  },
  contacts: {
    get: () => Contacts.getPermissionsAsync(),
    request: () => Contacts.requestPermissionsAsync(),
  },
  mediaLibrary: {
    get: () => ImagePicker.getMediaLibraryPermissionsAsync(),
    request: () => ImagePicker.requestMediaLibraryPermissionsAsync(),
  },
  camera: {
    get: () => ImagePicker.getCameraPermissionsAsync(),
    request: () => ImagePicker.requestCameraPermissionsAsync(),
  },
}

function normalize(status: string): PermissionState {
  if (status === 'granted') return 'granted'
  if (status === 'undetermined') return 'undetermined'
  return 'denied'
}

/** Statut courant d'une autorisation, sans déclencher de prompt système. */
export async function checkPermission(kind: PermissionKind): Promise<PermissionState> {
  const { status } = await HANDLERS[kind].get()
  return normalize(status)
}

/**
 * Déclenche le prompt système (si l'OS l'autorise encore) et renvoie le nouveau
 * statut. À réserver aux cas où l'on veut demander explicitement ; préférer
 * `ensurePermission` pour la logique « vérifier d'abord ».
 */
export async function requestPermission(kind: PermissionKind): Promise<PermissionState> {
  const { status } = await HANDLERS[kind].request()
  return normalize(status)
}

/**
 * Vérifie puis demande si nécessaire, et renvoie `true` si la permission est
 * finalement accordée.
 *
 * - déjà `granted` → renvoie `true` sans redéclencher de prompt ;
 * - déjà `denied` → renvoie `false` sans rappeler `request()` (l'OS ne
 *   représente plus le prompt une fois refusé, insister ne sert à rien) ;
 * - `undetermined` → déclenche le prompt et renvoie le résultat.
 */
export async function ensurePermission(kind: PermissionKind): Promise<boolean> {
  const current = await checkPermission(kind)
  if (current === 'granted') return true
  if (current === 'denied') return false
  return (await requestPermission(kind)) === 'granted'
}
