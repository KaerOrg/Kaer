import {
  parseActivityLogConfig,
  collectDomains,
  collectSuggestions,
  groupSuggestionsByDomain,
} from './activityLogConfig'
import type { ContentField } from '@services/moduleService'

const FALLBACKS = { successColor: '#0F0', primaryColor: '#00F' }

function makeField(overrides: Partial<ContentField>): ContentField {
  return {
    id: 'f',
    module_id: 'behavioral_activation',
    section_id: null,
    parent_field_id: null,
    field_type: 'activity_log_config',
    text_code: null,
    sort_order: 0,
    props: {},
    children: [],
    ...overrides,
  }
}

const t = (code: string) => `t:${code}`

describe('parseActivityLogConfig', () => {
  it('construit les steps depuis min/max/step et lit les couleurs', () => {
    const cfg = parseActivityLogConfig(makeField({
      props: {
        pleasure_min: '0', pleasure_max: '4', pleasure_step: '2',
        mastery_min: '1', mastery_max: '3', mastery_step: '1',
        pleasure_color: '#111', mastery_color: '#222',
        dot_done_color: '#333', dot_planned_color: '#444', locale: 'en-GB',
      },
    }), FALLBACKS)
    expect(cfg.pleasureSteps).toEqual([0, 2, 4])
    expect(cfg.masterySteps).toEqual([1, 2, 3])
    expect(cfg.pleasureColor).toBe('#111')
    expect(cfg.dotDoneColor).toBe('#333')
    expect(cfg.locale).toBe('en-GB')
  })

  it('applique les défauts (0-10, couleurs de thème) si field absent ou props vides', () => {
    const cfg = parseActivityLogConfig(undefined, FALLBACKS)
    expect(cfg.pleasureSteps).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(cfg.dotDoneColor).toBe('#0F0')
    expect(cfg.dotPlannedColor).toBe('#00F')
    expect(cfg.locale).toBe('fr-FR')
  })
})

describe('collectDomains / collectSuggestions', () => {
  const fields: ContentField[] = [
    makeField({ id: 'al.dom_social', field_type: 'activity_log_domain', text_code: 'k.social', sort_order: 11 }),
    makeField({ id: 'al.dom_body', field_type: 'activity_log_domain', text_code: 'k.body', sort_order: 10 }),
    makeField({ id: 'al.sug_walk', field_type: 'activity_log_suggestion', text_code: 'k.walk', sort_order: 100, props: { domain: 'al.dom_body' } }),
    makeField({ id: 'al.sug_cafe', field_type: 'activity_log_suggestion', text_code: 'k.cafe', sort_order: 101, props: { domain: 'al.dom_social' } }),
    makeField({ id: 'al.sug_orphan', field_type: 'activity_log_suggestion', text_code: 'k.orphan', sort_order: 102 }),
  ]

  it('collectDomains trie par sort_order et résout les libellés', () => {
    expect(collectDomains(fields, t)).toEqual([
      { id: 'al.dom_body', label: 't:k.body' },
      { id: 'al.dom_social', label: 't:k.social' },
    ])
  })

  it('collectSuggestions lit le domaine depuis le prop atomique `domain`', () => {
    const suggestions = collectSuggestions(fields, t)
    expect(suggestions).toEqual([
      { id: 'al.sug_walk', text: 't:k.walk', domainId: 'al.dom_body' },
      { id: 'al.sug_cafe', text: 't:k.cafe', domainId: 'al.dom_social' },
      { id: 'al.sug_orphan', text: 't:k.orphan', domainId: null },
    ])
  })

  it('groupSuggestionsByDomain suit l\'ordre des domaines et met les orphelines en dernier', () => {
    const domains = collectDomains(fields, t)
    const groups = groupSuggestionsByDomain(collectSuggestions(fields, t), domains)
    expect(groups.map(g => g.domain?.id ?? 'none')).toEqual(['al.dom_body', 'al.dom_social', 'none'])
    expect(groups[0].items.map(i => i.id)).toEqual(['al.sug_walk'])
    expect(groups[2].items.map(i => i.id)).toEqual(['al.sug_orphan'])
  })

  it('groupSuggestionsByDomain omet les domaines sans suggestion', () => {
    const domains = [{ id: 'al.dom_empty', label: 'Vide' }]
    expect(groupSuggestionsByDomain([], domains)).toEqual([])
  })
})
