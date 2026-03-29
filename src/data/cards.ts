import type { Card } from '../types'
import cardsJson from '../../shared/cards.json'

export const CHANCE_CARDS: Omit<Card, 'type'>[] = cardsJson.chance
export const CHEST_CARDS: Omit<Card, 'type'>[] = cardsJson.chest

export function createCards(): Card[] {
  return [
    ...CHANCE_CARDS.map((c) => ({ ...c, type: 'chance' as const })),
    ...CHEST_CARDS.map((c) => ({ ...c, type: 'chest' as const })),
  ]
}
