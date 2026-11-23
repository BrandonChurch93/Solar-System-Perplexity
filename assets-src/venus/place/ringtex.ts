import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/venus/plan'
import placeJson from '../../../src/stops/venus/place.json'
import platesJson from '../../../src/stops/venus/plates.json'
import fit from '../../../src/stops/venus/fit.json'

// Texels per pixel of the cloud pictures of the globe side along a circle about the centre of the place plates, for given frames
// of the dive or the rise. For every picture two numbers per ground point: the count of G13 (the larger of the two steps of the
// picture coordinate between neighbouring pixels along the screen axes) and the smaller of the two principal steps (the strict
// count: under 1 the picture is enlarged in that direction).
//   npx tsx assets-src/venus/place/ringtex.ts --frames 1287,1586 --at 20,30,40,45,50 --plate 90:8192 [--plate 100:8192 ...]
// --at: arcs from the plate centre in degrees. --plate WIDTHDEG:SIZE: a gnomonic plate about the plate centre.
// Always printed: the globe's own map (wrap-color, equirectangular, --map WIDTH, default 8192) and the dive patch a (--patch 90:4096, about the spot).
;(globalThis as { __venusProbe?: object }).__venusProbe = { side: 'orbit', path: true }
const args = process.argv.slice(2)
const opt = (k: string, d: string): string => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1]! : d }
const all = (k: string): string[] => args.flatMap((a, i) => (a === '--' + k ? [args[i + 1]!] : []))
const frames = opt('frames', '1287,1586').split(',').map(Number)
const arcs = opt('at', '20,30,40,45,50').split(',').map(Number)
const plates = all('plate').map((s) => s.split(':').map(Number) as [number, number])
const mapWidth = Number(opt('map', '8192'))
const patch = opt('patch', '90:4096').split(':').map(Number) as [number, number]
const W = 1920
const H = 1080
const globe = new THREE.Quaternion().fromArray(fit.globe.quaternion)
const under = new THREE.Vector3().fromArray(placeJson.place.under.direction)
const head = new THREE.Vector3().fromArray(placeJson.place.heading)
const ahead = THREE.MathUtils.degToRad(platesJson.aheadDeg)
const centre = under.clone().multiplyScalar(Math.cos(ahead)).addScaledVector(head, Math.sin(ahead)).normalize()
const spot = plan.spot.clone().applyQuaternion(globe.clone().invert()).normalize()
const basis = (n: THREE.Vector3): [THREE.Vector3, THREE.Vector3, THREE.Vector3] => {
  const e = new THREE.Vector3(0, 1, 0).cross(n).normalize()
  return [n, e, n.clone().cross(e)]
}
const t = (f: number): number => (f + config.shutterFraction * 0.5) / config.fps
const pose = (f: number): { pos: THREE.Vector3; q: THREE.Quaternion; vfov: number } => {
  const time = t(f)
  const kind = f < plan.seg.terrain.start * config.fps ? 'dive' : 'rise'
  const p = kind === 'dive' ? plan.divePose(time, 'orbit') : plan.risePose(time, 'orbit')
  const back = globe.clone().invert().multiply(plan.turn(time).invert())
  return { pos: p.position.clone().applyQuaternion(back), q: back.clone().multiply(p.quaternion), vfov: p.vfov }
}
// the ground point a pixel sees, or null
const ground = (c: { pos: THREE.Vector3; q: THREE.Quaternion; vfov: number }, x: number, y: number): THREE.Vector3 | null => {
  const th = Math.tan(THREE.MathUtils.degToRad(c.vfov) / 2)
  const d = new THREE.Vector3(((x + 0.5) / W * 2 - 1) * th * W / H, (1 - (y + 0.5) / H * 2) * th, -1).normalize().applyQuaternion(c.q)
  const b = c.pos.dot(d)
  const disc = b * b - (c.pos.lengthSq() - 1)
  if (disc < 0 || b > 0) return null
  return c.pos.clone().addScaledVector(d, -b - Math.sqrt(disc)).normalize()
}
const project = (c: { pos: THREE.Vector3; q: THREE.Quaternion; vfov: number }, g: THREE.Vector3): [number, number] | null => {
  if (g.dot(c.pos) < 1) return null // behind the horizon
  const r = g.clone().sub(c.pos).applyQuaternion(c.q.clone().invert())
  if (r.z >= 0) return null
  const th = Math.tan(THREE.MathUtils.degToRad(c.vfov) / 2)
  const x = (r.x / -r.z / (th * W / H) * 0.5 + 0.5) * W - 0.5
  const y = (0.5 - r.y / -r.z / th * 0.5) * H - 0.5
  return x >= 0 && x <= W - 1 && y >= 0 && y <= H - 1 ? [x, y] : null
}
type Coord = (g: THREE.Vector3) => [number, number] | [number, number, number]
const gnomonic = (n: THREE.Vector3, widthDeg: number, size: number): Coord => {
  const [nn, e, u] = basis(n)
  const k = size / (2 * Math.tan(THREE.MathUtils.degToRad(widthDeg) / 2))
  return (g) => { const z = Math.max(g.dot(nn), 0.05); return [g.dot(e) / z * k, g.dot(u) / z * k] }
}
const sphere = (width: number): Coord => (g) => [g.x * width / (2 * Math.PI), g.y * width / (2 * Math.PI), g.z * width / (2 * Math.PI)]
// [count of G13, strict count] of a picture coordinate at pixel x, y
const counts = (c: { pos: THREE.Vector3; q: THREE.Quaternion; vfov: number }, x: number, y: number, f: Coord): [number, number] | null => {
  const g0 = ground(c, x, y)
  const gx = ground(c, x + 1, y)
  const gy = ground(c, x, y + 1)
  if (!g0 || !gx || !gy) return null
  const a = f(g0)
  const dx = f(gx).map((v, i) => v - a[i]!)
  const dy = f(gy).map((v, i) => v - a[i]!)
  const xx = dx.reduce((s, v) => s + v * v, 0)
  const yy = dy.reduce((s, v) => s + v * v, 0)
  const xy = dx.reduce((s, v, i) => s + v * dy[i]!, 0)
  const mid = (xx + yy) / 2
  const dev = Math.sqrt(Math.max(mid * mid - (xx * yy - xy * xy), 0))
  return [Math.sqrt(Math.max(xx, yy)), Math.sqrt(Math.max(mid - dev, 0))]
}
const pictures: [string, Coord][] = [['globe map ' + mapWidth, sphere(mapWidth)], ['patch a ' + patch[0] + ' deg ' + patch[1], gnomonic(spot, patch[0], patch[1])], ...plates.map(([w, s]): [string, Coord] => ['plate ' + w + ' deg ' + s, gnomonic(centre, w, s)])]
const fmt = (v: number[]): string => v.length ? [Math.min(...v), v.slice().sort((a, b) => a - b)[Math.floor(v.length / 2)]!, Math.max(...v)].map((x) => x.toFixed(2)).join(' / ') : 'none'
const [n, e, u] = basis(centre)
console.log('spot to plate centre', THREE.MathUtils.radToDeg(spot.angleTo(centre)).toFixed(2), 'deg')
for (const f of frames) {
  const c = pose(f)
  console.log('frame', f, 'height', (c.pos.length() - 1).toFixed(4), 'vfov', c.vfov.toFixed(2), 'point under the camera to the plate centre', THREE.MathUtils.radToDeg(c.pos.clone().normalize().angleTo(centre)).toFixed(2), 'deg, horizon at', THREE.MathUtils.radToDeg(Math.acos(1 / c.pos.length())).toFixed(2), 'deg from that point')
  for (const arc of arcs) {
    const a = THREE.MathUtils.degToRad(arc)
    const rows: Record<string, [number[], number[]]> = {}
    let seen = 0
    const steps = 720
    for (let i = 0; i < steps; i++) {
      const az = (i / steps) * 2 * Math.PI
      const g = n.clone().multiplyScalar(Math.cos(a)).addScaledVector(e, Math.sin(a) * Math.cos(az)).addScaledVector(u, Math.sin(a) * Math.sin(az))
      const px = project(c, g)
      if (!px) continue
      seen++
      for (const [name, fn] of pictures) {
        const k = counts(c, Math.min(px[0], W - 2), Math.min(px[1], H - 2), fn)
        if (!k) continue
        ;(rows[name] ??= [[], []])[0].push(k[0])
        rows[name]![1].push(k[1])
      }
    }
    console.log('  circle at', arc, 'deg: share in the frame', (seen / steps).toFixed(3))
    for (const [name] of pictures) if (rows[name]) console.log('    ' + name.padEnd(22), 'G13 count min / median / max', fmt(rows[name]![0]), '  strict', fmt(rows[name]![1]))
  }
}
