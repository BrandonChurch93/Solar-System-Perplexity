import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/sun/plan'
import place from '../../../src/stops/sun/place.json'
// Where the globe's first level about the place is in, by frame (asked by the lab, 19:58 UTC). The globe lays a level by
// the texels of the map a 1080th of the frame height (globe.ts: parent = diagTexelsDir * uFormat; the level's weight
// is 1 - smoothstep(fade[0], fade[1], parent), place.json plates.fade). Here the same number is taken on the
// rise's own poses: for a grid of the frame, the ray of each point and of its neighbours a 1080th away, their points
// on the unit ball, and the larger of the two changes of direction times the map's width over a turn.
const WIDTH = 8192
const [from, to] = place.plates.fade as [number, number]
const half = Math.tan(THREE.MathUtils.degToRad(20))
const timeOf = (f: number): number => (f + 0.5 * config.shutterFraction) / config.fps
const smooth = (a: number, b: number, x: number): number => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t) }
const frames = process.argv.slice(2).map(Number)
for (const f of frames.length ? frames : [199, 204, 209, 213, 217, 221, 225, 229, 233, 237, 241, 245, 248, 252, 256, 262, 269]) {
  const t = timeOf(f)
  const p = plan.risePose(t, 'orbit')
  const spin = plan.turn(t)
  const spot = new THREE.Vector3().fromArray(place.globe.mapSpot).normalize().applyQuaternion(spin)
  const east = new THREE.Vector3(0, 1, 0).applyQuaternion(spin).cross(spot).normalize()
  const up = spot.clone().cross(east)
  const tanV = Math.tan(THREE.MathUtils.degToRad(p.vfov) / 2)
  const hit = (x: number, y: number): THREE.Vector3 | null => {
    const d = new THREE.Vector3(x * tanV * 16 / 9, y * tanV, -1).normalize().applyQuaternion(p.quaternion)
    const b = p.position.dot(d)
    const c = p.position.lengthSq() - 1
    const disc = b * b - c
    if (disc <= 0 || b >= 0) return null
    return p.position.clone().addScaledVector(d, -b - Math.sqrt(disc)).normalize()
  }
  const step = 2 / 1080
  const at = (x: number, y: number): { parent: number; inLevel: boolean; far: number } | null => {
    const a = hit(x, y); const bx = hit(x + step * 9 / 16, y); const by = hit(x, y + step)
    if (!a || !bx || !by) return null
    const parent = Math.max(a.distanceTo(bx), a.distanceTo(by)) * WIDTH / (2 * Math.PI)
    const n = a.dot(spot)
    const q = n > 0.3 ? Math.max(Math.abs(a.dot(east) / n), Math.abs(a.dot(up) / n)) / (2 * half) : 9
    return { parent, inLevel: q < 0.5 - place.plates.feather, far: a.distanceTo(p.position) }
  }
  let ground = 0, inSquare = 0, full = 0, some = 0, farFull = 0
  for (let j = 0; j < 90; j++) for (let i = 0; i < 160; i++) {
    const s = at((i + 0.5) / 80 - 1, (j + 0.5) / 45 - 1)
    if (!s) continue
    ground++
    if (!s.inLevel) continue
    inSquare++
    const w = 1 - smooth(from, to, s.parent)
    if (w >= 1) { full++; farFull = Math.max(farFull, s.far) }
    if (w > 0) some++
  }
  const sv = spot.clone().sub(p.position)
  const cam = sv.clone().applyQuaternion(p.quaternion.clone().invert())
  const ax = cam.x / -cam.z / (tanV * 16 / 9), ay = cam.y / -cam.z / tanV
  const a = Math.abs(ax) < 1 && Math.abs(ay) < 1 && cam.z < 0 ? at(ax, ay) : null
  const c = at(0, 0)
  console.log('frame', f, 'height', (p.position.length() - 1).toFixed(3), '| eye to the anchor', sv.length().toFixed(3), '| at the anchor', a ? `${a.parent.toFixed(2)} texels, weight ${(1 - smooth(from, to, a.parent)).toFixed(2)}` : 'out of frame', '| frame centre', c ? `${c.parent.toFixed(2)} texels, weight ${(1 - smooth(from, to, c.parent)).toFixed(2)}` : 'sky', '| of the ground in frame inside the level\'s square', inSquare && ground ? (inSquare / ground).toFixed(2) : '0', 'level whole on', inSquare ? (full / inSquare).toFixed(2) : '-', 'partly or whole on', inSquare ? (some / inSquare).toFixed(2) : '-', '| farthest whole point', farFull.toFixed(2), 'radii from the eye')
}
