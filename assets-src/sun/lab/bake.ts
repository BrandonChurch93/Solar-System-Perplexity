// The far twin of the lab's ground for the globe (FAR-TWIN.md of the Sun's builder): the ground where its cells are
// no things, from straight above every point, with the cells as they stand at the film frame far.level.frame, as a square picture laid gnomonic about the spot.
// The page draws it with the film's own shader (LabGround.bake) and this script fetches the bytes.
//   npx tsx assets-src/sun/lab/bake.ts && python3 assets-src/sun/lab/level.py
import { mkdirSync, writeFileSync } from 'node:fs'
import { DIST, args, ensureBuild, formatId, loadConfig } from '../../../tools/lib/common'
import { openCapture, renderPng } from '../../../tools/lib/browser'
import lab from '../../../src/stops/sun/lab/lab.json'

interface Bake { deg: number; size: number; data?: Uint8Array; axes?: number[] }
const cfg = loadConfig()
const a = args()
const out = a.out ?? 'out/work/sun/lab/level'
const size = lab.far.level.size * lab.far.level.over
ensureBuild()
mkdirSync(out, { recursive: true })
const session = await openCapture({ dist: DIST, format: formatId(cfg, a.format), assets: 'full', diag: 'beauty' })
await session.page.evaluate((b) => { (globalThis as { labBake?: Bake }).labBake = b }, { deg: lab.far.level.deg, size })
await renderPng(session.page, lab.far.level.frame, 'draft')
const axes = await session.page.evaluate(() => (globalThis as { labBake?: Bake }).labBake?.axes)
if (!axes) throw new Error('the page baked nothing')
const bytes = Buffer.alloc(size * size * 4)
const step = 1 << 21
for (let at = 0; at < bytes.length; at += step) {
  const part = await session.page.evaluate(([from, to]) => {
    const d = (globalThis as { labBake?: Bake }).labBake!.data!.subarray(from, to)
    let s = ''
    for (let i = 0; i < d.length; i += 32768) s += String.fromCharCode(...d.subarray(i, i + 32768))
    return btoa(s)
  }, [at, Math.min(at + step, bytes.length)] as const)
  Buffer.from(part, 'base64').copy(bytes, at)
}
await session.close()
writeFileSync(out + '/place-far-0.rgba', bytes)
writeFileSync(out + '/place-far-0.json', JSON.stringify({ deg: lab.far.level.deg, drawn: size, size: lab.far.level.size, spot: axes.slice(0, 3), east: axes.slice(3, 6), north: axes.slice(6, 9) }, null, 1) + '\n')
console.log(out + '/place-far-0.rgba ' + size + ' spot ' + axes.slice(0, 3).map((x) => x.toFixed(8)).join(' ') + ' east ' + axes.slice(3, 6).map((x) => x.toFixed(8)).join(' ') + ' north ' + axes.slice(6, 9).map((x) => x.toFixed(8)).join(' '))
