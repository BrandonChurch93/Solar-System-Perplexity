// Where the plates have to lie: the texel count of the globe's patch chain per frame, by code, no render.
// npx tsx assets-src/neptune/place/cover.ts dive|rise [--from F --to F] [--set "4:16:1.5,-2.5:3520;3:26:0,0:3392"] [--step 12] [--map]
// It follows planet.ts (layerAt and weights): gnomonic coordinates about the spot, a level counts where its weight is at least a half.
// The close layer of the globe side is not in it, so near T the share here is an upper bound. Compare with the texels view before trusting a number.
import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/neptune/plan'
import patches from '../../../src/stops/neptune/patches.json'
import closeup from '../../../src/stops/neptune/closeup.json'
import place from '../../../src/stops/neptune/place.json'

const argv = process.argv.slice(2)
const kind = (argv[0] ?? 'dive') as 'dive' | 'rise'
const opt = (name: string): string | undefined => {
  const i = argv.indexOf('--' + name)
  return i < 0 ? undefined : argv[i + 1] ?? ''
}
const seg = kind === 'dive' ? plan.seg.dive! : plan.seg.rise
const fps = config.fps
const from = Number(opt('from') ?? seg.firstFrame)
const to = Number(opt('to') ?? seg.endFrame - 1)
const step = Number(opt('step') ?? 12)
const ring = opt('alpha') !== undefined ? Number(opt('alpha') || 11.25) : 0
const W = 1920
const H = 1080
const MAP = 8192
const BASE = 4096

interface Level { widthDeg: number; off: [number, number]; texels: number }
const levels: Level[] = patches.levels.map((l) => ({ widthDeg: l.widthDeg, off: [l.offsetDeg[0]!, l.offsetDeg[1]!], texels: (l as { texels?: number }).texels ?? BASE }))
for (const part of (opt('set') ?? '').split(';').filter(Boolean)) {
  const [i, w, o, n] = part.split(':')
  const [e, nn] = o!.split(',').map(Number)
  levels[Number(i)] = { widthDeg: Number(w), off: [e!, nn!], texels: Number(n) }
}
const shownFrom = patches.place.shownFrom
const feather = patches.feather
const fade = patches.fade as [number, number]
const rad = THREE.MathUtils.degToRad
// The spot, its east and its north in the world at spin zero: the eye of place.json and the spin axis of the plan (planet.ts builds the same frame in the body).
const spot = new THREE.Vector3().fromArray(place.storm.atSpinZero).normalize()
const axis = (plan as unknown as { axis: THREE.Vector3 }).axis.clone().normalize()
const east = axis.clone().cross(spot).normalize()
const north = spot.clone().cross(east)
if (Math.abs(THREE.MathUtils.radToDeg(Math.asin(spot.dot(axis))) - patches.spot.lat) > 0.01) throw new Error('the eye of place.json is not the spot of patches.json')
const smooth = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const lay = (closeup as unknown as { lay: { dive: [number, number]; rise: [number, number] } }).lay

function shownAt(f: number): number {
  const u = (f - seg.firstFrame) / (seg.endFrame - seg.firstFrame)
  return kind === 'dive' ? smooth(lay.dive[0], lay.dive[1], u) : 1 - smooth(lay.rise[0], lay.rise[1], u)
}

function frame(f: number): { counted: number; soft: number; rows: string[]; under: [number, number]; softBox: number[] } {
  const t = f / fps
  const p = kind === 'dive' ? plan.divePose(t, 'orbit') : plan.risePose(t, 'orbit')
  const back = plan.turn(t).invert()
  const th = Math.tan(rad(p.vfov) / 2)
  const pos = p.position.clone()
  const hit = (x: number, y: number): THREE.Vector3 | null => {
    const d = new THREE.Vector3(((x + 0.5) / W * 2 - 1) * th * W / H, (1 - (y + 0.5) / H * 2) * th, -1).normalize().applyQuaternion(p.quaternion)
    const b = pos.dot(d)
    const c = pos.lengthSq() - 1
    const disc = b * b - c
    if (disc < 0) return null
    const s = -b - Math.sqrt(disc)
    if (s < 0) return null
    return pos.clone().addScaledVector(d, s).normalize().applyQuaternion(back)
  }
  const gOf = (dd: THREE.Vector3): [number, number, number] => {
    const dn = dd.dot(spot)
    return [dd.dot(east) / Math.max(dn, 0.05), dd.dot(north) / Math.max(dn, 0.05), dn]
  }
  const shown = shownAt(f)
  let counted = 0
  let soft = 0
  const rows: string[] = []
  const softBox = [1e9, 1e9, -1e9, -1e9]
  for (let y = step / 2; y < H; y += step) {
    let row = ''
    for (let x = step / 2; x < W; x += step) {
      const a = hit(x, y)
      const bx = hit(x + 1, y)
      const by = hit(x, y + 1)
      if (!a || !bx || !by) { row += ' '; continue }
      counted++
      const g = gOf(a)
      const g1 = gOf(bx)
      const g2 = gOf(by)
      const gd = Math.sqrt(Math.max((g1[0] - g[0]) ** 2 + (g1[1] - g[1]) ** 2, (g2[0] - g[0]) ** 2 + (g2[1] - g[1]) ** 2))
      let texels = Math.sqrt(Math.max(bx.distanceToSquared(a), by.distanceToSquared(a))) * MAP / (2 * Math.PI)
      let parent = texels
      let finest = -1
      const front = g[2] >= 0.3 ? 1 : 0
      for (let i = 0; i < levels.length; i++) {
        const l = levels[i]!
        const scale = 1 / (2 * Math.tan(rad(l.widthDeg) / 2))
        const shownLevel = i >= shownFrom
        const qx = (g[0] - (shownLevel ? Math.tan(rad(l.off[0])) : 0)) * scale
        const qy = (g[1] - (shownLevel ? Math.tan(rad(l.off[1])) : 0)) * scale
        const inside = 1 - smooth(0.5 - feather, 0.5, Math.max(Math.abs(qx), Math.abs(qy)))
        const gate = i === shownFrom ? 1 : 1 - smooth(fade[0], fade[1], parent)
        // --alpha: a shown plate counts only where it is drawn at more than half, inside the ring where its alpha ends (shown.py RING, 10 to 12.5 degrees from the spot).
        const drawn = shownLevel && ring ? (THREE.MathUtils.radToDeg(Math.atan(Math.hypot(g[0], g[1]))) < ring ? 1 : 0) : 1
        const w = (shownLevel ? shown : 1) * front * inside * gate * drawn
        parent = gd * scale * l.texels
        if (w >= 0.5) { texels = parent; finest = i }
      }
      const isSoft = texels < config.raw.detail.minTexelsPerPixel
      if (isSoft) {
        soft++
        const e = THREE.MathUtils.radToDeg(Math.atan(g[0]))
        const n = THREE.MathUtils.radToDeg(Math.atan(g[1]))
        softBox[0] = Math.min(softBox[0]!, e); softBox[1] = Math.min(softBox[1]!, n); softBox[2] = Math.max(softBox[2]!, e); softBox[3] = Math.max(softBox[3]!, n)
      }
      row += isSoft ? '#' : finest < 0 ? '.' : String(finest)
    }
    rows.push(row)
  }
  const u = gOf(pos.clone().normalize().applyQuaternion(back))
  return { counted, soft, rows, under: [THREE.MathUtils.radToDeg(Math.atan(u[0])), THREE.MathUtils.radToDeg(Math.atan(u[1]))], softBox }
}

let worst = 0
let worstFrame = 0
let over = 0
const lines: string[] = []
for (let f = from; f <= to; f++) {
  const r = frame(f)
  const share = r.counted ? r.soft / r.counted : 0
  if (share > worst) { worst = share; worstFrame = f }
  if (share > config.raw.detail.maxSoftPixelFraction) over++
  if (share > 0 || opt('all') !== undefined) lines.push(f + '\tsoft ' + (100 * share).toFixed(2) + ' %\tunder the camera east ' + r.under[0].toFixed(2) + ' north ' + r.under[1].toFixed(2) + (r.soft ? '\tsoft ground east ' + r.softBox[0]!.toFixed(1) + ' to ' + r.softBox[2]!.toFixed(1) + ', north ' + r.softBox[1]!.toFixed(1) + ' to ' + r.softBox[3]!.toFixed(1) : ''))
  if (opt('map') !== undefined && f === Number(opt('map'))) console.log(r.rows.join('\n'))
}
console.log(lines.join('\n'))
console.log(kind + ' ' + from + ' to ' + to + ': worst ' + (100 * worst).toFixed(2) + ' % in frame ' + worstFrame + ', frames over the limit ' + over + '; levels ' + levels.map((l) => l.widthDeg + '@' + l.off.join(',') + 'x' + l.texels).join(' '))
