import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DIST, WORK, args, formatId, ensureBuild, loadConfig, requireDisk } from '../../../tools/lib/common'
import { openCapture, renderPngFresh, type Session } from '../../../tools/lib/browser'
import { plan } from '../../../src/stops/earth/plan'

const cfg = loadConfig()
const a = args()
const count = Number(a.count ?? 12)
const tier = a.tier ?? 'draft'
const format = formatId(cfg, a.format)
const kind = a.kind === 'rise' ? 'rise' : 'dive'
const dir = a.out ?? join(WORK, 'earth', 'place', 'down')
const seg = kind === 'dive' ? plan.seg.dive! : plan.seg.rise
const mid = cfg.shutterFraction / 2
const height = (f: number): number => (kind === 'dive' ? plan.divePose((f + mid) / cfg.fps, 'orbit') : plan.risePose((f + mid) / cfg.fps, 'orbit')).position.length() - 1
const all: { frame: number; height: number }[] = []
for (let f = seg.firstFrame; f < seg.endFrame; f++) all.push({ frame: f, height: height(f) })
const high = Math.log(Math.max(all[0]!.height, all[all.length - 1]!.height))
const low = Math.log(Math.min(all[0]!.height, all[all.length - 1]!.height))
const picked: { frame: number; height: number }[] = []
for (let i = 0; i < count; i++) {
  const goal = high + ((low - high) * i) / (count - 1)
  let best = all[0]!
  for (const x of all) if (Math.abs(Math.log(x.height) - goal) < Math.abs(Math.log(best.height) - goal)) best = x
  if (!picked.includes(best)) picked.push(best)
}
picked.sort((x, y) => x.frame - y.frame)
requireDisk(cfg)
ensureBuild()
mkdirSync(dir, { recursive: true })
const held: { session?: Session } = {}
const side = String(a.side ?? 'down')
const view = a.diag ?? 'nograin'
const diag = view + (side === 'down' ? '/noplace' : '/side=' + side + (a.place === 'off' ? '/noplace' : ''))
const tag = side + (view === 'nograin' ? '' : '-' + view) + (side !== 'down' && a.place === 'off' ? '-bare' : '')
const list: { frame: number; height: number; file: string }[] = []
for (const p of picked) {
  const { png, seconds } = await renderPngFresh(() => openCapture({ dist: DIST, format, assets: 'full', diag, query: side === 'down' ? '&earthSide=down' : '' }), held, p.frame, tier)
  const file = join(dir, kind + '-' + tag + '-f' + String(p.frame).padStart(5, '0') + '.png')
  writeFileSync(file, png)
  list.push({ ...p, file })
  console.log(file + ' height ' + p.height.toFixed(4) + ' ' + seconds.toFixed(1) + 's')
}
await held.session?.close()
writeFileSync(join(dir, kind + '-' + tag + '.json'), JSON.stringify(list, null, 1))
