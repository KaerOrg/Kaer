// Stub for expo-file-system/legacy — tests override via jest.mock() factory.
export const documentDirectory = 'file:///app/'
export const cacheDirectory = 'file:///cache/'
export const bundledAssets = null
export const bundleDirectory = null

export const getInfoAsync = jest.fn().mockResolvedValue({ exists: false })
export const readAsStringAsync = jest.fn().mockResolvedValue('')
export const writeAsStringAsync = jest.fn().mockResolvedValue(undefined)
export const deleteAsync = jest.fn().mockResolvedValue(undefined)
export const moveAsync = jest.fn().mockResolvedValue(undefined)
export const copyAsync = jest.fn().mockResolvedValue(undefined)
export const makeDirectoryAsync = jest.fn().mockResolvedValue(undefined)
export const readDirectoryAsync = jest.fn().mockResolvedValue([])
export const downloadAsync = jest.fn().mockResolvedValue({ uri: '', status: 200, headers: {} })
export const uploadAsync = jest.fn().mockResolvedValue({ status: 200, headers: {}, body: '' })
export const createDownloadResumable = jest.fn()
