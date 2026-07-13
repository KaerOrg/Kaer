import { Footprints, Moon, Sun, Sunrise, Utensils } from 'lucide-react-native'
import { CHRONO_ANCHORS } from '@kaer/shared'
import { resolveChronoIcon } from './chronoIcons'

describe('resolveChronoIcon', () => {
  it('résout chaque iconName de CHRONO_ANCHORS vers un composant lucide défini', () => {
    for (const a of CHRONO_ANCHORS) {
      expect(resolveChronoIcon(a.iconName)).toBeDefined()
    }
  })

  it('mappe les noms attendus vers les bons composants', () => {
    expect(resolveChronoIcon('sunrise')).toBe(Sunrise)
    expect(resolveChronoIcon('utensils')).toBe(Utensils)
    expect(resolveChronoIcon('footprints')).toBe(Footprints)
    expect(resolveChronoIcon('sun')).toBe(Sun)
    expect(resolveChronoIcon('moon')).toBe(Moon)
  })

  it('retombe sur une icône par défaut pour un nom inconnu', () => {
    expect(resolveChronoIcon('unknown-icon')).toBe(Sunrise)
  })
})
