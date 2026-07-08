import { positionRatio, valueFromRatio, ratioFromValue, stepValue } from './sliderMath'

describe('sliderMath — positionRatio', () => {
  it('mappe une position sur [0,1] et borne aux extrémités', () => {
    expect(positionRatio(0, 200)).toBe(0)
    expect(positionRatio(100, 200)).toBe(0.5)
    expect(positionRatio(200, 200)).toBe(1)
    expect(positionRatio(-20, 200)).toBe(0) // avant la piste
    expect(positionRatio(260, 200)).toBe(1) // au-delà de la piste
  })

  it('retourne 0 si la largeur est nulle ou négative (piste pas encore mesurée)', () => {
    expect(positionRatio(50, 0)).toBe(0)
    expect(positionRatio(50, -5)).toBe(0)
  })
})

describe('sliderMath — valueFromRatio', () => {
  it('aligne sur le pas et borne à [min,max]', () => {
    expect(valueFromRatio(0, 0, 100, 10)).toBe(0)
    expect(valueFromRatio(1, 0, 100, 10)).toBe(100)
    expect(valueFromRatio(0.47, 0, 100, 10)).toBe(50) // 47 → arrondi au pas 10
    expect(valueFromRatio(0.44, 0, 100, 10)).toBe(40)
  })

  it('continu (step=1) : renvoie la valeur entière la plus proche', () => {
    expect(valueFromRatio(0.47, 0, 100, 1)).toBe(47)
    expect(valueFromRatio(0.475, 0, 100, 1)).toBe(48)
  })

  it('borne un ratio hors [0,1]', () => {
    expect(valueFromRatio(-0.5, 0, 100, 1)).toBe(0)
    expect(valueFromRatio(1.5, 0, 100, 1)).toBe(100)
  })

  it('gère une plage non nulle décalée (min>0)', () => {
    expect(valueFromRatio(0.5, 20, 40, 1)).toBe(30)
  })
})

describe('sliderMath — ratioFromValue', () => {
  it('convertit une valeur en ratio [0,1]', () => {
    expect(ratioFromValue(0, 0, 100)).toBe(0)
    expect(ratioFromValue(50, 0, 100)).toBe(0.5)
    expect(ratioFromValue(100, 0, 100)).toBe(1)
  })

  it('retourne 0 si la plage est dégénérée (max<=min)', () => {
    expect(ratioFromValue(5, 10, 10)).toBe(0)
  })

  it('borne une valeur hors plage', () => {
    expect(ratioFromValue(-10, 0, 100)).toBe(0)
    expect(ratioFromValue(200, 0, 100)).toBe(1)
  })
})

describe('sliderMath — stepValue', () => {
  it('incrémente / décrémente d’un pas', () => {
    expect(stepValue(50, 1, 0, 100, 10)).toBe(60)
    expect(stepValue(50, -1, 0, 100, 10)).toBe(40)
  })

  it('part de min quand rien n’est encore saisi', () => {
    expect(stepValue(null, 1, 0, 100, 10)).toBe(10)
    expect(stepValue(null, -1, 0, 100, 10)).toBe(0) // borné à min
  })

  it('borne aux extrémités', () => {
    expect(stepValue(100, 1, 0, 100, 10)).toBe(100)
    expect(stepValue(0, -1, 0, 100, 10)).toBe(0)
  })

  it('utilise un pas de 1 si step<=0', () => {
    expect(stepValue(50, 1, 0, 100, 0)).toBe(51)
  })
})
