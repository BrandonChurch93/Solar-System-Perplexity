import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector, LOOKBACK } from '../../src/director/film'
import { plans } from '../../src/director/plans'

const frames = process.argv.slice(2).filter((a) => /^\d+$/.test(a)).map(Number)
const every = process.argv.includes('--rates')
for (const kv of (process.env.LB ?? '').split(',').filter(Boolean)) { const [k, v] = kv.split('='); (LOOKBACK as any)[k!] = Number(v) }
const d = new FilmDirector(plans)
const fmt = config.formats[config.formatKeys.master]!
const DEG = 180 / Math.PI
const MID = config.shutterFraction * 0.5
const STARS: [string, number[]][] = JSON.parse(process.env.STARS ?? '[]')

const project = (c: THREE.Vector3, vfov: number): [number, number] => {
  const t = Math.tan(vfov / DEG / 2)
  const z = Math.max(-c.z, 1e-9)
  return [(c.x / z / (t * fmt.width / fmt.height) * 0.5 + 0.5) * fmt.width, (0.5 - c.y / z / t * 0.5) * fmt.height]
}
const unproject = (x: number, y: number, vfov: number): THREE.Vector3 => {
  const t = Math.tan(vfov / DEG / 2)
  return new THREE.Vector3((x / fmt.width - 0.5) * 2 * t * fmt.width / fmt.height, (0.5 - y / fmt.height) * 2 * t, -1).normalize()
}
const at = (f: number, o = MID): { sun: [number, number]; limb: [number, number]; centre: [number, number]; r: number; stars: [number, number][] } => {
  const s = d.shotAt(f, (f + o) / config.fps)
  const st = s.sets[s.sets.length - 1]!
  const inv = s.camera.quaternion.clone().invert()
  const n = st.origin.clone().sub(s.camera.position)
  const dist = n.length()
  n.normalize()
  const e = s.sun.dir.clone().addScaledVector(n, -s.sun.dir.dot(n)).normalize()
  const a = Math.asin(1 / dist)
  const limb = n.clone().multiplyScalar(Math.cos(a)).addScaledVector(e, Math.sin(a))
  const k = (fmt.height / 2) / Math.tan(s.camera.vfov / DEG / 2)
  return { sun: project(s.sun.dir.clone().applyQuaternion(inv), s.camera.vfov), limb: project(limb.applyQuaternion(inv), s.camera.vfov), centre: project(n.clone().applyQuaternion(inv), s.camera.vfov), r: k / Math.sqrt(dist * dist - 1), stars: STARS.map(([, v]) => project(new THREE.Vector3().fromArray(v).applyQuaternion(inv), s.camera.vfov)) }
}
const x = (v: number, k = 1): string => v.toFixed(k)
const pt = (p: [number, number]): string => x(p[0]) + ', ' + x(p[1])
if (process.argv.includes('--pick')) {
  const s = d.shotAt(5235, (5235 + MID) / config.fps)
  const out = [['upper left', [300, 200]], ['mid right', [1500, 560]]].map(([name, p]) => [name, unproject((p as number[])[0]!, (p as number[])[1]!, s.camera.vfov).applyQuaternion(s.camera.quaternion).toArray().map((v) => Number(v.toFixed(7)))])
  console.log(JSON.stringify(out))
  process.exit(0)
}
if (every) {
  let prev = at(frames[0]! - 1)
  for (let f = frames[0]!; f <= frames[1]!; f++) {
    const c = at(f)
    const dv = (p: [number, number], q: [number, number]): string => x(p[0] - q[0], 3) + ', ' + x(p[1] - q[1], 3)
    if ((f - frames[0]!) % (frames[2] ?? 1) === 0) console.log(f + ' sun ' + pt(c.sun) + ' d ' + dv(c.sun, prev.sun) + ' | limb ' + pt(c.limb) + ' d ' + dv(c.limb, prev.limb) + ' | r ' + x(c.r))
    prev = c
  }
} else {
  console.log('| frame | ' + STARS.map(([n]) => 'star ' + n).join(' | ') + ' | Sun | limb, outermost lit point | Neptune centre | r |')
  console.log('| --- | ' + STARS.map(() => '---').join(' | ') + ' | --- | --- | --- | --- |')
  for (const f of frames) {
    const c = at(f)
    console.log('| ' + f + ' | ' + c.stars.map(pt).join(' | ') + ' | ' + pt(c.sun) + ' | ' + pt(c.limb) + ' | ' + pt(c.centre) + ' | ' + x(c.r) + ' |')
  }
}
