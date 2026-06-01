// Ambient declaration for expo-file-system/legacy subpath.
// expo-file-system v19 ships a legacy/ subpath without an `exports` field in package.json,
// which breaks moduleResolution:"bundler". This declaration satisfies TypeScript;
// Jest resolves the import via jest.mock() in tests and via Metro at runtime.
declare module 'expo-file-system/legacy' {
  export const documentDirectory: string | null
  export const cacheDirectory: string | null
  export const bundledAssets: string | null
  export const bundleDirectory: string | null

  export interface FileInfo {
    exists: boolean
    uri: string
    size?: number
    isDirectory?: boolean
    modificationTime?: number
    md5?: string
  }

  export interface InfoOptions {
    md5?: boolean
    size?: boolean
  }

  export interface DeletingOptions {
    idempotent?: boolean
  }

  export interface MakeDirectoryOptions {
    intermediates?: boolean
  }

  export interface RelocatingOptions {
    from: string
    to: string
  }

  export function getInfoAsync(fileUri: string, options?: InfoOptions): Promise<FileInfo>
  export function readAsStringAsync(fileUri: string, options?: { encoding?: string; position?: number; length?: number }): Promise<string>
  export function writeAsStringAsync(fileUri: string, contents: string, options?: { encoding?: string }): Promise<void>
  export function deleteAsync(fileUri: string, options?: DeletingOptions): Promise<void>
  export function moveAsync(options: RelocatingOptions): Promise<void>
  export function copyAsync(options: RelocatingOptions): Promise<void>
  export function makeDirectoryAsync(fileUri: string, options?: MakeDirectoryOptions): Promise<void>
  export function readDirectoryAsync(fileUri: string): Promise<string[]>
  export function downloadAsync(uri: string, fileUri: string, options?: object): Promise<{ uri: string; status: number; headers: Record<string, string>; md5?: string }>
  export function uploadAsync(url: string, fileUri: string, options?: object): Promise<{ status: number; headers: Record<string, string>; body: string }>
  export function createDownloadResumable(uri: string, fileUri: string, options?: object, callback?: (downloadProgress: object) => void, resumeData?: string): object
}
