import * as THREE from 'three'
import { readFileSync, writeFileSync } from 'node:fs'
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
const smooth = (x: number): number => { const t = Math.min(Math.max(x, 0), 1); return t * t * (3 - 2 * t) }
const fr = Number(process.argv[2])
const hold = (process.argv[3] ?? '1,1.45,1.6').split(',').map(Number) as [number, number, number]
const step = 2
const p = poseAt(fr / config.fps)
const px = (1080 / 2) / Math.tan(THREE.MathUtils.degToRad(p.vfov) / 2)
const skim = plan.skimPosition
const height = Math.abs(p.position.dot(n))
const close = 1 - smooth((Math.log(Math.max(height, 1e-3)) - Math.log(0.35)) / (Math.log(1.6) - Math.log(0.35)))
const away = p.position.distanceTo(skim)
const gate = 1 - smooth((away - 0.5) / 0.6)
const foot = skim.clone().addScaledVector(n, -skim.dot(n))
const ch = foot.clone().normalize()
const ph0 = new THREE.Vector3().crossVectors(n, ch).normalize()
const cs2 = foot.lengthSq() + (skim.dot(n) / polar) ** 2
const bq = 1.03
const w = 1920 / step, h = 1080 / step
const now = new Uint8Array(w * h), t1 = new Uint8Array(w * h)
const at = (P: THREE.Vector3): { inside: number; L: number[]; E: number } => {
  const c = new THREE.Vector4(P.x, P.y, P.z, 1).applyMatrix4(M)
  const u = c.x / c.w * 0.5 + 0.5, v = c.y / c.w * -0.5 + 0.5
  const e = Math.min(u, 1 - u, v, 1 - v)
  const inside = c.w > 1e-3 ? smooth(e / 0.04) : 0
  return inside > 0 ? { inside, L: tex(lay, u, v), E: tex1(even, u, v) } : { inside: 0, L: [0, 1, 0, 0], E: 1 }
}
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  const d = new THREE.Vector3((x * step + 1 - 960) / px, (540 - y * step - 1) / px, -1).applyQuaternion(p.quaternion)
  const t = -p.position.dot(n) / d.dot(n)
  const e = enter(p.position, d)
  if (!(t > 0)) { now[y * w + x] = e === Infinity ? 0 : 40; t1[y * w + x] = now[y * w + x]!; continue }
  if (t > e) { now[y * w + x] = 40; t1[y * w + x] = 40; continue }
  const P = p.position.clone().addScaledVector(d, t)
  const r = P.length()
  if (r > 2.4 || r < 1.0) { now[y * w + x] = 20; t1[y * w + x] = 20; continue }
  const a = at(P)
  let own = a.L[1]!, ev = a.E
  const rr = r * r
  const root = bq * bq + cs2 * rr - bq * (rr + cs2)
  const ut = bq - Math.sqrt(Math.max(root, 0))
  const uu = foot.dot(P)
  const ct = ut / (foot.length() * r)
  if (root > 0 && uu < ut && Math.abs(ct) < 1) {
    const side = Math.sign(P.dot(ph0)) || 1
    const src = ch.clone().multiplyScalar(ct).addScaledVector(ph0, side * Math.sqrt(1 - ct * ct)).multiplyScalar(r)
    const b = at(src)
    const fw = (1 - smooth((P.distanceTo(src) - 0.3) / 0.6)) * b.inside
    own = own * (1 - fw) + b.L[1]! * fw
    ev = ev * (1 - fw) + b.E * fw
  }
  const k = a.inside * close * a.L[2]!
  const g0 = ev * (1 - gate) + own * gate
  const hg = Math.max(gate, hold[0] * (1 - smooth((r - hold[1]) / (hold[2] - hold[1]))))
  const hw = hold[0] * (1 - smooth((r - hold[1]) / (hold[2] - hold[1])))
  let acc = 0, wsum = 0
  const span = Number(process.env.SPAN ?? 0.25), taps = Number(process.env.TAPS ?? 9)
  if (process.env.MODE === 'avg' && hw > 0) for (let i = 0; i < taps; i++) {
    const ang = span * (i / (taps - 1) * 2 - 1)
    const Q = P.clone().multiplyScalar(Math.cos(ang)).addScaledVector(new THREE.Vector3().crossVectors(n, P), Math.sin(ang))
    const es = enter(skim, Q.clone().sub(skim))
    if (es < 1) continue
    const q = at(Q)
    const wq = q.inside * q.L[2]!
    acc += Math.min(q.L[1]!, 1) * wq + 1 * (1 - wq) * 0
    wsum += wq
  }
  const avg = wsum > 0 ? acc / wsum : g0
  const g1 = process.env.MODE === 'avg' ? g0 * (1 - hw * Math.min(wsum / taps * 2, 1)) + Math.min(g0, avg) * hw * Math.min(wsum / taps * 2, 1) : process.env.MODE === 'min' ? g0 * (1 - hw) + Math.min(g0, own) * hw : ev * (1 - hg) + own * hg
  now[y * w + x] = Math.min(255, Math.round((1 - k + k * g0) * 200))
  t1[y * w + x] = Math.min(255, Math.round((1 - k + k * g1) * 200))
}
writeFileSync(`/tmp/gain-${fr}-now.pgm`, Buffer.concat([Buffer.from(`P5\n${w} ${h}\n255\n`), Buffer.from(now)]))
writeFileSync(`/tmp/gain-${fr}-${process.env.MODE ?? 't1'}.pgm`, Buffer.concat([Buffer.from(`P5\n${w} ${h}\n255\n`), Buffer.from(t1)]))
console.log('frame', fr, 'height', height.toFixed(3), 'close', close.toFixed(3), 'gate', gate.toFixed(3), 'away', away.toFixed(3))
