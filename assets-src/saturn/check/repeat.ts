import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { DIST } from '../../../tools/lib/common'
import { openCapture, renderPng } from '../../../tools/lib/browser'

const args = process.argv.slice(2)
const frames = (args[0] ?? '3866').split(',').map(Number)
const sessions = Number(args[1] ?? 2)
const runs = Number(args[2] ?? 3)
const keep = args[3] && args[3] !== 'none' ? args[3] : undefined
const diag = args[4]
const tier = (args[5] ?? 'draft') as 'draft' | 'review' | 'final'
const all = new Map<number, Set<string>>()
for (let s = 0; s < sessions; s++) {
  const session = await openCapture({ dist: DIST, format: '16x9', assets: 'full', diag })
  const row: string[] = []
  for (let r = 0; r < runs; r++) {
    for (const f of frames) {
      const { png } = await renderPng(session.page, f, tier)
      const h = createHash('sha256').update(png).digest('hex').slice(0, 8)
      row.push(f + ':' + h)
      if (!all.has(f)) all.set(f, new Set())
      all.get(f)!.add(h)
      if (keep) writeFileSync(keep + '-' + f + '-' + s + '-' + r + '.png', png)
    }
  }
  console.log('session', s, '|', row.join(' '))
  await session.close()
}
const loose = [...all].filter(([, set]) => set.size > 1).map(([f]) => f)
console.log('frames', all.size, 'renders of each', sessions * runs, 'not repeatable', loose.length, loose.join(' '))
console.log('DONE')
