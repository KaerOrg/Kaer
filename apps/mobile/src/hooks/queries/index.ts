// Point d'import unique des factories de query mobile.
// Chaque domaine = un fichier `<domaine>Queries.ts` exportant un objet
// `<domaine>Queries` de factories `queryOptions`. Les composants importent d'ici.
export { homeQueries } from './homeQueries'
export { appointmentQueries, useCancelAppointment } from './appointmentQueries'
export { moduleQueries } from './moduleQueries'
