// The judged reader's pattern number on a folder of capture frames that clip.ts drew: tools/img/smooth.py pictures()
// itself, with the poses and the values of config/showcase.json as tools/smooth.ts hands them over. The window is
// the folder, so the pop, which reads a neighbourhood of frames, is not the same as in a whole run; the pattern is.
//   npx tsx assets-src/sun/lab/reader.ts --dir out/work/sun/lab/clip [--sheet OUT.png: first against last, carried]
import { execFileSync } from 'node:child_process'
import { readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, args, loadConfig } from '../../../tools/lib/common'
import { FilmDirector } from '../../../src/director/film'
import { setCapture, spanMid } from '../../../src/core/clock'
import { plans } from '../../../src/director/plans'
import { carriedCamera } from '../../../tools/smooth/camera'

const cfg = loadConfig()
const a = args()
const dir = a.dir ?? 'out/work/sun/lab/clip'
const r = 2
const P = cfg.raw.smooth.pictures as { flowScale: number; popWindow: number; popFloor: number; grid: number[]; changeFrames: number; changeBlurPx: number; patternPx: number; patternFloor: number; maxPattern: number | null }
const plan = plans.find((p) => p.id === 'sun')!
const film = new FilmDirector(plans)
setCapture(r)
const files = readdirSync(dir).filter((f) => /^k\d+\.png$/.test(f)).sort()
const ks = files.map((f) => Number(f.slice(1, 5)))
const hold = a.hold === undefined ? undefined : Number(a.hold)
const poses = ks.map((kk) => {
  const k = hold ?? kk
  const pose = carriedCamera(film, plan, 'sun', k / r, (k / r + spanMid()) / cfg.fps).pose
  return { p: pose.position.toArray(), q: pose.quaternion.toArray(), vfov: pose.vfov }
})
const job = { op: 'pictures', paths: files.map((f) => join(dir, f)), poses, scale: P.flowScale, window: P.popWindow * r, floor: P.popFloor, grid: P.grid, changeFrames: P.changeFrames * r, changeBlur: P.changeBlurPx, patternPx: P.patternPx, patternFloor: P.patternFloor }
if (a.sheet) {
  const sheet = { op: 'changes', output: a.sheet, scale: P.flowScale, gain: 6, changeBlur: P.changeBlurPx, patternPx: P.patternPx, patternFloor: P.patternFloor, limit: 4000, chains: [{ label: files[0] + ' to ' + files[files.length - 1], paths: files.map((f) => join(dir, f)), poses: [poses[0], poses[poses.length - 1]] }] }
  if (a.job) writeFileSync(a.job, JSON.stringify(sheet))
  execFileSync('python3', [join(ROOT, 'tools/img/smooth.py')], { input: JSON.stringify(sheet), encoding: 'utf8', stdio: ['pipe', 'pipe', 'inherit'], maxBuffer: 1 << 28 })
}
const reply = execFileSync('python3', [join(ROOT, 'tools/img/smooth.py')], { input: JSON.stringify(job), encoding: 'utf8', stdio: ['pipe', 'pipe', 'inherit'], maxBuffer: 1 << 28 })
const n = JSON.parse(reply) as { pattern: (number | null)[]; patternAt: (number[] | null)[]; patternShare: (number | null)[]; change: (number | null)[]; pop: (number | null)[] }
let most = -1
let at = -1
let sum = 0
let count = 0
n.pattern.forEach((v, i) => {
  if (v === null || v === undefined) return
  sum += v
  count++
  if (v > most) {
    most = v
    at = i
  }
})
console.log('pictures ' + files.length + ', capture frames ' + ks[0] + ' to ' + ks[ks.length - 1] + ', pairs read ' + count)
console.log('pattern over ' + P.changeFrames + ' film frames: largest ' + most.toFixed(3) + ' at ' + (at >= 0 ? files[at] + ' at the place ' + JSON.stringify(n.patternAt[at]) + ' (share read ' + JSON.stringify(n.patternShare[at]) + ')' : 'none') + ', mean ' + (count ? (sum / count).toFixed(3) : 'none') + ', limit ' + P.maxPattern)
console.log('rows: ' + n.pattern.map((v, i) => (v === null || v === undefined ? null : ks[i] + ':' + v.toFixed(3))).filter(Boolean).join(' '))
