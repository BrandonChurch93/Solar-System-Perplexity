import * as THREE from 'three'
import { readFileSync } from 'node:fs'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/saturn/plan'
import layoutJson from '../../../src/stops/saturn/layout.json'
const poseAt = (time: number): any => {
  const seg = plan.seg
  if (time >= seg.terrain.start && time < seg.terrain.end) return plan.skimAt(time)
  if (time >= seg.rise.end) return plan.after(time)
  const shot: any = seg.dive && time >= seg.dive.start && time < seg.dive.end ? plan.dive(time) : time >= seg.rise.start && time < seg.rise.end ? plan.rise(time) : { pose: plan.hold(time - seg.hold.start), view: 'orbit' }
  return shot.view === 'terrain' ? { position: shot.pose.position.clone().applyQuaternion(plan.terrainFrame).add(plan.spot), quaternion: plan.terrainFrame.clone().multiply(shot.pose.quaternion), vfov: shot.pose.vfov } : shot.pose
}
const n = plan.ringNormal.clone().normalize()
const polar = plan.fit.globe.scale[1]! / plan.fit.globe.scale[0]!
const kk = 1 / polar - 1
const sq = (q: THREE.Vector3): THREE.Vector3 => q.clone().addScaledVector(n, q.dot(n) * kk)
const enter = (o: THREE.Vector3, d: THREE.Vector3): number => {
  const a = sq(o), b = sq(d)
  const A = b.dot(b), B = a.dot(b), C = a.dot(a) - 1
  const D = B * B - A * C
  return D < 0 ? Infinity : (-B - Math.sqrt(D)) / A
}
const W = layoutJson.width, H = layoutJson.height
const lay = new Float32Array(readFileSync('public/assets/saturn/full/layout.bin').buffer.slice(0))
const tone = new Float32Array(readFileSync('public/assets/saturn/full/layout-tone.bin').buffer.slice(0))
const even = new Float32Array(readFileSync('public/assets/saturn/full/layout-even.bin').buffer.slice(0))
const tex1 = (data: Float32Array, u: number, v: number): number => {
  const fx = Math.min(Math.max(u * W - 0.5, 0), W - 1), fy = Math.min(Math.max(v * H - 0.5, 0), H - 1)
  const x0 = Math.floor(fx), y0 = Math.floor(fy), x1 = Math.min(x0 + 1, W - 1), y1 = Math.min(y0 + 1, H - 1)
  const wx = fx - x0, wy = fy - y0
  return (data[y0 * W + x0]! * (1 - wx) + data[y0 * W + x1]! * wx) * (1 - wy) + (data[y1 * W + x0]! * (1 - wx) + data[y1 * W + x1]! * wx) * wy
}
const cam = new THREE.PerspectiveCamera(layoutJson.vfovDeg, W / H, 0.01, 100)
cam.position.copy(plan.skimPosition).addScaledVector(plan.skimForward, -layoutJson.back)
cam.quaternion.copy(plan.skimQuaternion)
cam.updateMatrixWorld(true)
cam.updateProjectionMatrix()
const M = new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse)
const tex = (data: Float32Array, u: number, v: number): number[] => {
  const fx = Math.min(Math.max(u * W - 0.5, 0), W - 1), fy = Math.min(Math.max(v * H - 0.5, 0), H - 1)
  const x0 = Math.floor(fx), y0 = Math.floor(fy), x1 = Math.min(x0 + 1, W - 1), y1 = Math.min(y0 + 1, H - 1)
  const wx = fx - x0, wy = fy - y0
  return [0, 1, 2, 3].map((c) => (data[(y0 * W + x0) * 4 + c]! * (1 - wx) + data[(y0 * W + x1) * 4 + c]! * wx) * (1 - wy) + (data[(y1 * W + x0) * 4 + c]! * (1 - wx) + data[(y1 * W + x1) * 4 + c]! * wx) * wy)
}
const fr = Number(process.argv[2])
const p = poseAt(fr / config.fps)
const px = (1080 / 2) / Math.tan(THREE.MathUtils.degToRad(p.vfov) / 2)
const skim = plan.skimPosition
console.log('frame', fr, 'height', p.position.dot(n).toFixed(3), 'polar', polar.toFixed(4))
for (const s of process.argv.slice(3)) {
  const [x, y] = s.split(',').map(Number) as [number, number]
  const d = new THREE.Vector3((x + 0.5 - 960) / px, (540 - y - 0.5) / px, -1).applyQuaternion(p.quaternion)
  const t = -p.position.dot(n) / d.dot(n)
  if (!(t > 0)) { console.log(s, 'no ring plane'); continue }
  const P = p.position.clone().addScaledVector(d, t)
  const e = enter(p.position, d)
  const film = e === Infinity ? 'clear' : t < e ? 'front' : 'behind'
  const ds = P.clone().sub(skim)
  const es = enter(skim, ds)
  const sk = es === Infinity ? 'clear' : es > 1 ? 'front' : 'behind'
  const c = new THREE.Vector4(P.x, P.y, P.z, 1).applyMatrix4(M)
  const u = c.x / c.w * 0.5 + 0.5, v = c.y / c.w * -0.5 + 0.5
  const inside = c.w > 1e-3 && u > 0 && u < 1 && v > 0 && v < 1
  const L = inside ? tex(lay, u, v) : [NaN, NaN, NaN, NaN]
  const T = inside ? tex(tone, u, v) : [NaN, NaN, NaN, NaN]
  const foot = skim.clone().addScaledVector(n, -skim.dot(n))
  const cs = new THREE.Vector3(foot.x, 0, 0).set(foot.length(), skim.dot(n) / polar, 0)
  const cc = cs.lengthSq(), rr = P.lengthSq(), bq = 1 - Number(process.env.MARGIN ?? -0.03)
  const root = bq * bq + cc * rr - bq * (rr + cc)
  const ut = bq - Math.sqrt(Math.max(root, 0))
  const uu = foot.dot(P)
  const ct = ut / (foot.length() * Math.sqrt(rr))
  const chord = root > 0 && uu < ut && Math.abs(ct) < 1 ? Math.sqrt(rr) * 2 * Math.sin((Math.acos(Math.max(-1, Math.min(1, uu / (foot.length() * Math.sqrt(rr))))) - Math.acos(ct)) / 2) : 0
  console.log(s, 'chord', chord.toFixed(3), 'r', P.length().toFixed(4), 'film', film, 'skim', sk, 'uv', u.toFixed(3), v.toFixed(3), 'dr', L[0]!.toFixed(4), 'gain', L[1]!.toFixed(3), 'even', (inside ? tex1(even, u, v) : NaN).toFixed(3), 'k', L[2]!.toFixed(2), 'sd', L[3]!.toFixed(0), 'tone', T.slice(0, 3).map((q) => q.toFixed(2)).join(' '))
}
