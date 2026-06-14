// Données illustratives de l'aperçu praticien (medication_tracker). Aucune donnée
// réelle : le but est de montrer fidèlement ce que verra le patient. Les libellés
// proviennent des clés i18n du module (zéro texte en dur).

export interface PreviewMed {
  name: string
  poso: string
  kindLabel: string
  prn: boolean
}

export function buildExampleMeds(
  moduleId: string,
  t: (k: string) => string,
  lbl: (k: string) => string,
): PreviewMed[] {
  const m = `modules.${moduleId}`
  return [
    { name: t(`${m}.preview_med1_name`), poso: t(`${m}.preview_med1_poso`), kindLabel: lbl('med_kind_maintenance'), prn: false },
    { name: t(`${m}.preview_med2_name`), poso: t(`${m}.preview_med2_poso`), kindLabel: lbl('med_kind_maintenance'), prn: false },
    { name: t(`${m}.preview_med3_name`), poso: t(`${m}.preview_med3_poso`), kindLabel: lbl('med_kind_prn'), prn: true },
  ]
}

// Index de statut illustratif par jour passé du mois (0 = 1er statut « pris », etc.).
// Motif déterministe : majorité « pris », quelques « partiel », rares « non pris ».
export function buildCalendarStatusByDay(
  todayDate: number,
  statusCount: number,
): Record<number, number> {
  const out: Record<number, number> = {}
  if (statusCount === 0) return out
  for (let d = 1; d <= todayDate; d++) {
    const mod = (d * 3) % 11
    let idx = 0
    if (mod === 0) idx = Math.min(2, statusCount - 1)
    else if (mod === 4 || mod === 8) idx = Math.min(1, statusCount - 1)
    out[d] = idx
  }
  return out
}
