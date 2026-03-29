import type { Property } from '../types'
import mapJson from '../../shared/map.json'

export const JAIL_POS = 26
export const GO_TO_JAIL_POS = 39
export const BOARD_SIZE = 14
export const TOTAL_CELLS = mapJson.length

export const MAP_DATA = mapJson as Omit<Property, 'ownerId' | 'mortgage' | 'houses' | 'hotel'>[]

export function createInitialProperties(): Property[] {
  return MAP_DATA.map((p) => ({
    ...p,
    ownerId: null,
    mortgage: false,
    houses: 0,
    hotel: false,
  }))
}
