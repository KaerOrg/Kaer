// Point d'import unique des factories de query web.
// Chaque domaine = un fichier `<domaine>Queries.ts` exportant un objet
// `<domaine>Queries` de factories `queryOptions` (+ les hooks de mutation associés).
export { dashboardQueries, useSendInvitation } from './dashboardQueries'
export { adminQueries } from './adminQueries'
export { referenceQueries } from './referenceQueries'
export { configVersionQueries } from './configVersionQueries'
export { moduleQueries } from './moduleQueries'
export { scaleQueries } from './scaleQueries'
export { moduleSourcesQueries } from './moduleSourcesQueries'
export { CONFIG_QUERY_OPTIONS } from './configCache'
export { catalogQueries, useSaveEnabledModules } from './catalogQueries'
export { psyeduQueries } from './psyeduQueries'
export { patientQueries, useSetTeenMode, useSaveGeneralNote } from './patientQueries'
export { agendaQueries } from './agendaQueries'
export { engagementQueries } from './engagementQueries'
export type { ChartKind, ModuleDataResult } from './engagementQueries'
