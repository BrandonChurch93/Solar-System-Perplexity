import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import { grainsAt, type Grain } from './grains'

const [first, last, w, h, pick] = process.argv.slice(2).map(Number)
const d = new FilmDirector(plans)
const fmt = config.formats[config.formatKeys.master]!
const mid = (f: number) => d.shotAt(f, (f + 0.5 * config.shutterFraction) / config.fps)
const frames: number[] = []
for (let f = first!; f <= last!; f++) frames.push(f)
const sets = frames.map((f) => new Map(grainsAt(f).map((g) => [g.i, g])))
const centre = Math.floor(frames.length / 2)
const a = mid(frames[centre]!)
const ta = Math.tan((a.camera.vfov * Math.PI) / 360)
const track = (x: number, y: number): number[][] => {
  const dir = new THREE.Vector3(((x / fmt.width) * 2 - 1) * ta * (fmt.width / fmt.height), (1 - (y / fmt.height) * 2) * ta, -1).normalize().applyQuaternion(a.camera.quaternion)
  return frames.map((f) => {
    const s = mid(f)
    const t = Math.tan((s.camera.vfov * Math.PI) / 360)
    const v = dir.clone().applyQuaternion(s.camera.quaternion.clone().invert())
    return [((v.x / -v.z / (t * fmt.width / fmt.height)) * 0.5 + 0.5) * fmt.width, (0.5 - (v.y / -v.z / t) * 0.5) * fmt.height]
  })
}
const rows: { i: number; low: number; inside: number; path: number[][]; win: number[][] }[] = []
for (const g of sets[centre]!.values()) {
  const all = sets.map((s) => s.get(g.i))
  if (all.some((x) => !x)) continue
  const low = Math.min(...all.map((x) => (x as Grain).peak))
  if (low < 2.5) continue
  const win = track(g.x, g.y)
  if (win.some(([x, y]) => x! < w! / 2 || x! > fmt.width - w! / 2 || y! < h! / 2 || y! > fmt.height - h! / 2)) continue
  let inside = 0
  for (const o of sets[centre]!.values()) {
    const every = sets.every((s, k) => { const q = s.get(o.i); return !!q && q.peak >= 1 && Math.abs(q.x - win[k]![0]!) < w! / 2 - 6 && Math.abs(q.y - win[k]![1]!) < h! / 2 - 6 })
    if (every) inside++
  }
  rows.push({ i: g.i, low, inside, path: all.map((x) => [(x as Grain).x, (x as Grain).y, (x as Grain).peak, (x as Grain).len]), win })
}
rows.sort((p, q) => q.inside - p.inside || q.low - p.low)
if (pick === undefined) for (const r of rows.slice(0, 12)) console.log(r.i, 'lowest nominal peak', r.low.toFixed(1), 'grains that stay in the window', r.inside, 'window start', r.win[0]!.map((v) => v.toFixed(0)).join(','), 'end', r.win[r.win.length - 1]!.map((v) => v.toFixed(0)).join(','), 'drift px', Math.hypot(r.path[r.path.length - 1]![0]! - r.path[0]![0]! - (r.win[r.win.length - 1]![0]! - r.win[0]![0]!), r.path[r.path.length - 1]![1]! - r.path[0]![1]! - (r.win[r.win.length - 1]![1]! - r.win[0]![1]!)).toFixed(1))
else { const r = rows.find((x) => x.i === pick)!; console.log(JSON.stringify({ frames, win: r.win, path: r.path })) }
