// Point d'import unique des factories de query web.
// Chaque domaine = un fichier `<domaine>Queries.ts` exportant un objet
// `<domaine>Queries` de factories `queryOptions` (+ les hooks de mutation associés).
export { dashboardQueries, useSendInvitation } from './dashboardQueries'
export { adminQueries } from './adminQueries'
export { referenceQueries } from './referenceQueries'
export { catalogQueries, useSaveEnabledModules } from './catalogQueries'
export { patientQueries, useSetTeenMode, useSaveGeneralNote } from './patientQueries'
export { agendaQueries } from './agendaQueries'
export { engagementQueries } from './engagementQueries'
export type { ChartKind, ModuleDataResult } from './engagementQueries'
