import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { DIST } from '../../../tools/lib/common'
import { openCapture, renderPng } from '../../../tools/lib/browser'

const args = process.argv.slice(2)
const frames = (args[0] ?? '3866').split(',').map(Number)
const sessions = Number(args[1] ?? 2)
const runs = Number(args[2] ?? 3)
const offs = (args[3] ?? 'none').split('/')
const keep = args[4]
const diag = args[5]
for (const off of offs) {
  for (let s = 0; s < sessions; s++) {
    const session = await openCapture({ dist: DIST, format: '16x9', assets: 'full', diag })
    if (off !== 'none') await session.page.evaluate((o) => { (window as unknown as { satOff: Record<string, number> }).satOff = Object.fromEntries(o.split('+').map((k) => [k, 1])) }, off)
    const row: string[] = []
    const seen = new Map<number, Set<string>>()
    for (let r = 0; r < runs; r++) {
      for (const f of frames) {
        const { png } = await renderPng(session.page, f, 'draft')
        const h = createHash('sha256').update(png).digest('hex').slice(0, 8)
        row.push(f + ':' + h)
        if (!seen.has(f)) seen.set(f, new Set())
        seen.get(f)!.add(h)
        if (keep) writeFileSync(keep + '-' + f + '-' + s + '-' + r + '.png', png)
      }
    }
    console.log('off', off, 'session', s, [...seen].map(([f, set]) => f + ' distinct ' + set.size).join(', '), '|', row.join(' '))
    await session.close()
  }
}
console.log('DONE')
