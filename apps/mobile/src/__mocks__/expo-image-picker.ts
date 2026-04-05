// Mock minimal d'expo-image-picker pour les tests Jest
export const requestMediaLibraryPermissionsAsync = jest.fn()
export const requestCameraPermissionsAsync = jest.fn()
export const launchImageLibraryAsync = jest.fn()
export const launchCameraAsync = jest.fn()

export type ImagePickerAsset = {
  uri: string
}
