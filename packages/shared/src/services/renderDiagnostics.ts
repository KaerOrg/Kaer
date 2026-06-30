import { PREVIEW_KINDS } from '../index'
import type { ContentField, RenderMismatch } from '../index'

// #90 — Détecteur PUR de non-match du moteur de rendu (partagé web ≡ mobile).
//
// Principe : un non-match est une propriété pure de `(config DB) × (capacités du
// moteur)`. On le calcule UNE fois, à la frontière des données (au chargement d'un
// module via `moduleService.fetchModuleFields`), sans rien rendre et sans aucun hook.
// Le rendu n'a AUCUNE connaissance de l'observabilité.
//
// Périmètre du détecteur RUNTIME : uniquement les niveaux **parfaitement ancrés et
// sans énumération** — `preview_kind` (source unique `PREVIEW_KINDS`) et `widget_type`
// (`RENDERABLE_WIDGET_TYPES`). Les niveaux contextuels (`field_type`, `missing_text_code`)
// dépendent du layout courant et divergent web/mobile : les énumérer ici recréerait un
// registre parallèle fragile (faux positifs). Ils sont attrapés par la **garde CI
// statique** (un orphelin échoue le build en dev, jamais un email en prod).

// Widgets rendus par FieldWidget (parité web ≡ mobile). Seule source — voir FieldWidget.
export const RENDERABLE_WIDGET_TYPES: ReadonlySet<string> = new Set(['text', 'info'])

// preview_kinds routés vers un layout : exactement la source partagée PREVIEW_KINDS.
// Initialisation PARESSEUSE : `renderDiagnostics` et `index` sont en import circulaire
// (index ré-exporte ce module) ; construire le Set au module-load lirait PREVIEW_KINDS
// encore en TDZ (→ Set vide → faux orphelins). Au 1ᵉʳ APPEL, index est initialisé.
let _renderablePreviewKinds: ReadonlySet<string> | null = null
function renderablePreviewKinds(): ReadonlySet<string> {
  return (_renderablePreviewKinds ??= new Set(PREVIEW_KINDS))
}

// Partie « contexte » d'un non-match (sans platform/app_version, ajoutés par le service).
export type RenderMismatchDescriptor = Omit<RenderMismatch, 'platform' | 'app_version'>

// Parcours en profondeur (fields + children).
function walk(fields: ContentField[], visit: (f: ContentField) => void): void {
  for (const f of fields) {
    visit(f)
    if (f.children.length > 0) walk(f.children, visit)
  }
}

/**
 * Confronte la config d'un module aux capacités du moteur et retourne les non-match
 * **runtime** : preview_kind orphelin (écran vide mobile / FallbackLayout web) et
 * widget_type inconnu. Pur, sans effet de bord — à appeler une fois au chargement du
 * module, puis à transmettre au service de diagnostics (fire-and-forget).
 */
export function collectRenderMismatches(
  preview_kind: string,
  fields: ContentField[],
): RenderMismatchDescriptor[] {
  const out: RenderMismatchDescriptor[] = []
  const moduleId = fields[0]?.module_id ?? null

  if (!renderablePreviewKinds().has(preview_kind)) {
    out.push({
      level: 'preview_kind',
      module_id: moduleId,
      preview_kind,
      field_id: null,
      field_type: null,
      widget_type: null,
      reason: 'preview_kind inconnu du moteur de rendu',
    })
  }

  walk(fields, f => {
    const widgetType = f.props['widget_type']
    if (widgetType && !RENDERABLE_WIDGET_TYPES.has(widgetType)) {
      out.push({
        level: 'widget_type',
        module_id: f.module_id,
        preview_kind,
        field_id: f.id,
        field_type: f.field_type,
        widget_type: widgetType,
        reason: 'widget_type inconnu de FieldWidget',
      })
    }
  })

  return out
}
