// Mock minimal d'expo-contacts pour les tests Jest.
// Par défaut : permission indéterminée, picker qui renvoie null (annulation).
// Les tests surchargent ces mocks selon le scénario.
export const getPermissionsAsync = jest.fn().mockResolvedValue({ status: 'undetermined' })
export const requestPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' })
export const presentContactPickerAsync = jest.fn().mockResolvedValue(null)

export enum PermissionStatus {
  GRANTED = 'granted',
  DENIED = 'denied',
  UNDETERMINED = 'undetermined',
}

// Sous-ensemble des types expo-contacts utilisés par le code applicatif.
export interface PhoneNumber {
  number?: string
}

export interface Contact {
  id?: string
  name?: string
  phoneNumbers?: PhoneNumber[]
}
