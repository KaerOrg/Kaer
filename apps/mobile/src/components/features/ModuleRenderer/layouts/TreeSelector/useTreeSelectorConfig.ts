// Parse la config DB-driven du module (`module_content_fields`) en structure
// exploitable — sans traduction (le layout résout les libellés avec son `t`).

import { useMemo } from 'react'
import { collectIndexed } from '@kaer/shared'
import type { ContentField } from '@services/moduleService'
import type { McIcon } from '@ui/TreeSelector'
import { buildRawNodes, buildNodeMap, intensityValuesFor, parseIntOr } from './helpers'
import type { ParsedTreeConfig } from './types'

export function useTreeSelectorConfig(fields: ContentField[]): ParsedTreeConfig {
  return useMemo<ParsedTreeConfig>(() => {
    const configField = fields.find(f => f.field_type === 'tree_selector_config')
    const props = configField?.props ?? {}

    const intensityMin = parseIntOr(props['intensity_min'], 1)
    const intensityMax = parseIntOr(props['intensity_max'], 10)

    const codes = collectIndexed(props, 'context_opt')
    const icons = collectIndexed(props, 'context_icon')
    const rawContextOptions = codes.map((code, i) => ({
      code,
      icon: (icons[i] ?? 'tag-outline') as McIcon,
    }))

    const rawNodes = buildRawNodes(fields)

    return {
      props,
      rawNodes,
      nodeMap: buildNodeMap(rawNodes),
      enableIntensity: (props['enable_intensity'] ?? '0') === '1',
      enableNotes: (props['enable_notes'] ?? '0') === '1',
      enableContext: (props['enable_context'] ?? '0') === '1',
      enableEarlyValidate: (props['enable_early_validate'] ?? '0') === '1',
      intensityMin,
      intensityMax,
      midIntensity: Math.round((intensityMin + intensityMax) / 2),
      intensityValues: intensityValuesFor(intensityMin, intensityMax),
      rawContextOptions,
    }
  }, [fields])
}
