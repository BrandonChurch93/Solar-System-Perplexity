import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector, LOOKBACK } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import * as look from '../../src/stops/neptune/look'

for (const kv of (process.env.LB ?? '').split(',').filter(Boolean)) {
  const [k, v] = kv.split('=')
  const path = k!.split('.')
  let o: any = LOOKBACK
  for (const q of path.slice(0, -1)) o = o[q]
  o[path[path.length - 1]!] = Number(v)
}
const frames = process.argv.slice(2).map(Number)
const d = new FilmDirector(plans)
const fmt = config.formats[config.formatKeys.master]!
const DEG = 180 / Math.PI
const tilt = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3().fromArray(look.ring.normal).normalize())

const view = (f: number, o: number) => {
  const s = d.shotAt(f, (f + o) / config.fps)
  const st = s.sets[s.sets.length - 1]!
  const inv = s.camera.quaternion.clone().invert()
  const t = Math.tan(s.camera.vfov / DEG / 2)
  const put = (w: THREE.Vector3): { x: number; y: number; seen: boolean } => {
    const rel = w.clone().sub(s.camera.position)
    const c = rel.clone().applyQuaternion(inv)
    const x = (c.x / -c.z / (t * fmt.width / fmt.height) * 0.5 + 0.5) * fmt.width
    const y = (0.5 - c.y / -c.z / t * 0.5) * fmt.height
    const toCentre = st.origin.clone().sub(s.camera.position)
    const along = toCentre.dot(rel.clone().normalize())
    const miss = Math.sqrt(Math.max(toCentre.lengthSq() - along * along, 0))
    const hidden = miss < 1 && rel.length() > along
    return { x, y, seen: c.z < 0 && x >= 0 && x <= fmt.width && y >= 0 && y <= fmt.height && !hidden }
  }
  return { s, st, put, far: (dir: THREE.Vector3) => put(s.camera.position.clone().addScaledVector(dir, 1e9)) }
}
for (const f of frames) {
  const a = view(f, 0)
  const b = view(f, config.shutterFraction)
  const moves: number[] = []
  let worst = { m: 0, x: 0, y: 0, dx: 0, dy: 0, r: 0 }
  for (const r of [look.ring.inner, (look.ring.inner + look.ring.outer) / 2, look.ring.outer]) {
    for (let i = 0; i < 72; i++) {
      const p = new THREE.Vector3(r * Math.cos(i / 72 * Math.PI * 2), r * Math.sin(i / 72 * Math.PI * 2), 0).applyQuaternion(tilt)
      const pa = a.put(p.clone().applyQuaternion(a.st.rotation).add(a.st.origin))
      const pb = b.put(p.clone().applyQuaternion(b.st.rotation).add(b.st.origin))
      if (!pa.seen) continue
      const m = Math.hypot(pb.x - pa.x, pb.y - pa.y)
      moves.push(m)
      if (m > worst.m) worst = { m, x: pa.x, y: pa.y, dx: pb.x - pa.x, dy: pb.y - pa.y, r }
    }
  }
  moves.sort((p, q) => p - q)
  const ca = a.put(a.st.origin), cb = b.put(b.st.origin)
  const dq = b.s.camera.quaternion.clone().multiply(a.s.camera.quaternion.clone().invert())
  const turn = 2 * Math.atan2(Math.hypot(dq.x, dq.y, dq.z), Math.abs(dq.w)) * DEG
  const k = (fmt.height / 2) / Math.tan(a.s.camera.vfov / DEG / 2)
  const x = (v: number): string => v.toFixed(1)
  console.log(f + ': ring points in frame ' + moves.length + ', move across the shutter px min ' + x(moves[0] ?? 0) + ' median ' + x(moves[moves.length >> 1] ?? 0) + ' max ' + x(worst.m) + ' (at ' + x(worst.x) + ', ' + x(worst.y) + ' by ' + x(worst.dx) + ', ' + x(worst.dy) + ', radius ' + worst.r + '); Neptune centre ' + x(ca.x) + ', ' + x(ca.y) + ' moves ' + x(cb.x - ca.x) + ', ' + x(cb.y - ca.y) + '; camera turn across the shutter ' + turn.toFixed(3) + ' deg = ' + x(turn / DEG * k) + ' px for a star at the frame centre')
}
