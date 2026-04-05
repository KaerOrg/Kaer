import * as ImagePicker from 'expo-image-picker'
import { supabase } from './supabase'

export type AvatarSource = 'library' | 'camera'

/** Demande la permission et ouvre le picker selon la source choisie.
 *  Retourne l'URI locale de l'image, ou null si l'utilisateur annule / refuse. */
export async function pickAvatarImage(source: AvatarSource): Promise<string | null> {
  if (source === 'camera') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') return null

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })
    return result.canceled ? null : result.assets[0].uri
  }

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (status !== 'granted') return null

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  })
  return result.canceled ? null : result.assets[0].uri
}

/** Upload l'image vers Supabase Storage et retourne l'URL publique. */
export async function uploadAvatar(userId: string, localUri: string): Promise<string> {
  // Lit le fichier en ArrayBuffer via fetch (compatible Expo)
  const response = await fetch(localUri)
  const arrayBuffer = await response.arrayBuffer()

  const path = `${userId}/avatar.jpg`

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, arrayBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  // Ajoute un cache-buster pour forcer le rechargement de l'image après mise à jour
  return `${data.publicUrl}?t=${Date.now()}`
}

/** Met à jour avatar_url dans la table patients. */
export async function saveAvatarUrl(userId: string, avatarUrl: string): Promise<void> {
  const { error } = await supabase
    .from('patients')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId)

  if (error) throw new Error(error.message)
}
