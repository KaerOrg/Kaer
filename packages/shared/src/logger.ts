// Point d'extension pour le reporting d'erreur en production (ex. Sentry).
// Remplacer les corps de méthode par les appels SDK appropriés.
export const logger = {
  log:   (...args: unknown[]) => console.log(...args),
  debug: (...args: unknown[]) => console.debug(...args),
  warn:  (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
}
