/** 校验 shared 地图与卡牌 JSON。运行: node scripts/validate-shared.mjs */
import fs from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const map = JSON.parse(fs.readFileSync(join(root, 'shared/map.json'), 'utf8'))
const cards = JSON.parse(fs.readFileSync(join(root, 'shared/cards.json'), 'utf8'))

if (!Array.isArray(map) || map.length !== 52) {
  throw new Error(`shared/map.json: expected 52 cells, got ${map?.length}`)
}
if (!cards.chance?.length || !cards.chest?.length) {
  throw new Error('shared/cards.json: missing chance or chest arrays')
}
console.log('shared data OK:', map.length, 'cells,', cards.chance.length, 'chance,', cards.chest.length, 'chest')
