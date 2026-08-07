import { SCALE_SCORING } from './scaleScoring'

// ─── Garde-fou : le PHQ-9 pose dix items et n'en cote que neuf (#410) ────────
//
// L'item 10 mesure le retentissement fonctionnel. Il fait partie du formulaire
// officiel, il est posé au patient comme les autres, et il n'entre PAS dans le total.
// Ce total reste la somme des items 1 à 9, sur 0 à 27.
//
// L'enjeu n'est pas cosmétique : c'est ce qui garde comparables les passations
// enregistrées avant l'arrivée de l'item 10. Faire passer `items_count` à 10 gonflerait
// tous les scores futurs et casserait la série de chaque patient, en silence.

describe('SCALE_SCORING.phq9 : nombre d\'items COTÉS', () => {
  it('cote neuf items, quel que soit le nombre d\'items posés', () => {
    expect(SCALE_SCORING.phq9.items_count).toBe(9)
  })

  it('plafonne à 27, la borne haute historique du PHQ-9', () => {
    const maxAnswers = Array(SCALE_SCORING.phq9.items_count).fill(3)
    expect(SCALE_SCORING.phq9.computeScore(maxAnswers)).toBe(27)
  })

  it('somme les réponses, en traitant une case vide comme un zéro', () => {
    expect(SCALE_SCORING.phq9.computeScore([1, 2, 3, null, 0, 0, 0, 0, 0])).toBe(6)
  })

  it('rend le même total pour une passation à 9 réponses, avant et après l\'item 10', () => {
    // La troncature aux items cotés est faite par l'appelant (`ScaleEntryScreen`), qui
    // ne transmet que les `items_count` premières réponses. Ce test vérifie le contrat
    // vu d'ici : sur neuf réponses, le total ne bouge pas.
    const nine = [2, 2, 2, 2, 2, 2, 1, 1, 0]
    expect(SCALE_SCORING.phq9.computeScore(nine)).toBe(14)
  })
})
