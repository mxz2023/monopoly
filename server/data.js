import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

export const MAP_DATA = JSON.parse(readFileSync(join(root, 'shared/map.json'), 'utf8'))
const cardsFile = JSON.parse(readFileSync(join(root, 'shared/cards.json'), 'utf8'))
export const CHANCE_CARDS = cardsFile.chance
export const CHEST_CARDS = cardsFile.chest

export const TOTAL_CELLS = MAP_DATA.length
/** 与 shared/map.json 中格子 id 一致 */
export const JAIL_POS = 26
export const GO_TO_JAIL_POS = 39

export const PLAYER_AVATARS = ['🤵', '👩', '🧑', '👴', '👸', '🦸']
