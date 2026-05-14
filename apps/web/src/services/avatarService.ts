import { supabase } from '../lib/supabase'

/** Upload un fichier image vers Supabase Storage et retourne l'URL publique. */
export async function uploadPractitionerAvatar(userId: string, file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const path = `${userId}/avatar.jpg`

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, arrayBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  // Cache-buster pour forcer le rechargement après mise à jour.
  return `${data.publicUrl}?t=${Date.now()}`
}

/** Met à jour avatar_url dans la table practitioners. */
export async function savePractitionerAvatarUrl(userId: string, avatarUrl: string): Promise<void> {
  const { error } = await supabase
    .from('practitioners')
    .update({ avatar_url: avatarUrl } as never)
    .eq('id', userId)

  if (error) throw new Error(error.message)
}
