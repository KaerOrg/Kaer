// Mock minimal d'expo-image-picker pour les tests Jest
export const requestMediaLibraryPermissionsAsync = jest.fn()
export const requestCameraPermissionsAsync = jest.fn()
// Lecture du statut (sans prompt) — utilisée par le permissionsService générique.
export const getMediaLibraryPermissionsAsync = jest.fn().mockResolvedValue({ status: 'undetermined' })
export const getCameraPermissionsAsync = jest.fn().mockResolvedValue({ status: 'undetermined' })
export const launchImageLibraryAsync = jest.fn()
export const launchCameraAsync = jest.fn()

export enum PermissionStatus {
  GRANTED = 'granted',
  DENIED = 'denied',
  UNDETERMINED = 'undetermined',
}

export type ImagePickerAsset = {
  uri: string
}
