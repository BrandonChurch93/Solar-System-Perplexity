import * as THREE from 'three'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import * as look from '../../../src/stops/uranus/look'
import j from '../../../src/stops/uranus/deck.json'

const d = new FilmDirector(plans)
const [first, last, step = 1, limit = 1.25] = process.argv.slice(2).map(Number)
const centre = new THREE.Vector3().fromArray(j.centre)
const up = new THREE.Vector3().fromArray(j.up)
const f0 = new THREE.Vector3().fromArray(j.f0)
const r0 = new THREE.Vector3().fromArray(j.r0)
const win = j.window
const size = j.imageSize.full
const far = j.farSize.full
const W = 1920, H = 1080, G = 6
const smooth = (a: number, b: number, x: number): number => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t) }

interface Hit { uv: [number, number]; far: [number, number]; w: number }
const hit = (o: THREE.Vector3, dir: THREE.Vector3): Hit | null => {
  const oc = o.clone().sub(centre)
  const b = oc.dot(dir)
  const disc = b * b - (oc.lengthSq() - j.radius * j.radius)
  if (disc < 0) return null
  const t = -b - Math.sqrt(disc)
  if (t <= 0) return null
  const p = o.clone().addScaledVector(dir, t)
  const n = p.clone().sub(centre).normalize()
  const z = Math.max(-p.z, 1e-4)
  const u = (p.x / z - win[0]!) / (win[2]! - win[0]!)
  const v = (p.y / z - win[1]!) / (win[3]! - win[1]!)
  const di = p.clone().normalize()
  const mu = -n.dot(di)
  const ex = Math.min(u, 1 - u), ey = Math.min(v, 1 - v)
  const w = (p.z < 0 ? 1 : 0) * smooth(0, look.deck.edge, ey) * smooth(look.deck.inset[0], look.deck.inset[1], Math.min(ex, v)) * smooth(look.deck.limb[0], look.deck.limb[1], mu)
  const c = n.dot(up)
  const tn = n.clone().addScaledVector(up, -c)
  const s = j.radius * Math.atan2(tn.length(), c)
  const psi = Math.atan2(tn.dot(r0), tn.dot(f0))
  return { uv: [u * size[0]!, v * size[1]!], far: [(psi / j.psiMax * 0.5 + 0.5) * far[0]!, Math.log(Math.max(s, 1e-4) / j.s0) / Math.log(j.s1 / j.s0) * far[1]!], w }
}
const rate = (a: [number, number], b: [number, number], c: [number, number], wrap: number): number => {
  const dx = [b[0] - a[0], b[1] - a[1]], dy = [c[0] - a[0], c[1] - a[1]]
  if (wrap > 0) { dx[0] = dx[0]! - wrap * Math.round(dx[0]! / wrap); dy[0] = dy[0]! - wrap * Math.round(dy[0]! / wrap) }
  return Math.sqrt(Math.max(dx[0]! * dx[0]! + dx[1]! * dx[1]!, dy[0]! * dy[0]! + dy[1]! * dy[1]!))
}
const box = [1, 1, 0, 0]
for (let f = first!; f <= last!; f += step) {
  const shot = d.shotAt(f, f / 30)
  const st = shot.sets.find((s) => s.id === 'uranus')!
  const inv = st.rotation.clone().invert()
  const cam = shot.camera.position.clone().sub(st.origin).applyQuaternion(inv)
  const cq = inv.clone().multiply(shot.camera.quaternion)
  const tan = Math.tan(THREE.MathUtils.degToRad(shot.camera.vfov / 2))
  const ray = (x: number, y: number): THREE.Vector3 => new THREE.Vector3(((x + 0.5) / W * 2 - 1) * tan * W / H, (1 - (y + 0.5) / H * 2) * tan, -1).normalize().applyQuaternion(cq)
  let counted = 0, soft = 0, low = 9, softFar = 0
  const fb = [1, 1, 0, 0]
  for (let y = 0; y < H; y += G) for (let x = 0; x < W; x += G) {
    const a = hit(cam, ray(x, y)), b = hit(cam, ray(x + 1, y)), c = hit(cam, ray(x, y + 1))
    if (!a || !b || !c) continue
    counted++
    const tp = rate(a.uv, b.uv, c.uv, 0)
    const tf = rate(a.far, b.far, c.far, far[0]!)
    const t = tf + (tp - tf) * a.w
    low = Math.min(low, t)
    if (t < 1) { soft++; if (a.w < 0.5) softFar++ }
    if (t < limit && a.w > 0.02) {
      const u = a.uv[0] / size[0]!, v = a.uv[1] / size[1]!
      fb[0] = Math.min(fb[0]!, u); fb[1] = Math.min(fb[1]!, v); fb[2] = Math.max(fb[2]!, u); fb[3] = Math.max(fb[3]!, v)
    }
  }
  for (let i = 0; i < 2; i++) { box[i] = Math.min(box[i]!, fb[i]!); box[i + 2] = Math.max(box[i + 2]!, fb[i + 2]!) }
  console.log(f, shot.segment.kind, 'view', st.view, 'vfov', shot.camera.vfov.toFixed(1), 'deck px', counted * G * G, 'soft', (100 * soft / Math.max(counted, 1)).toFixed(2) + '%', 'of it far', softFar, 'min texels', low.toFixed(3), 'uv box under ' + limit, fb.map((x) => x.toFixed(3)).join(' '))
}
console.log('uv box of all frames', box.map((x) => x.toFixed(4)).join(' '))
