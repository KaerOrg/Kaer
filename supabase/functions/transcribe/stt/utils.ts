export function mimeToExt(mimeType: string): string {
  if (mimeType === 'audio/mp4' || mimeType === 'audio/m4a') return 'm4a'
  if (mimeType === 'audio/mpeg' || mimeType === 'audio/mp3') return 'mp3'
  if (mimeType === 'audio/wav') return 'wav'
  return 'webm'
}

export const delay = (ms: number): Promise<void> =>
  new Promise(r => setTimeout(r, ms))
