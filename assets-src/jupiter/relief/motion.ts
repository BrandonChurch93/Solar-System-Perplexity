import * as THREE from 'three'
import { readFileSync } from 'node:fs'
import { config } from '../../../src/config'
import { deck } from '../../../src/stops/jupiter/look'
import { plan } from '../../../src/stops/jupiter/plan'

const meta = JSON.parse(readFileSync('src/stops/jupiter/relief.json', 'utf8'))
const tiers = JSON.parse(readFileSync('assets-src/jupiter/relief/tiers.json', 'utf8'))
const buf = readFileSync('public/assets/jupiter/full/deck-dist.bin')
const dist = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4)
const [gw, gh] = meta.grid
const [ox, oy] = meta.origin
const [iw, ih] = meta.image
const nadir = new THREE.Vector3().fromArray(meta.nadir)
const centre = nadir.clone().multiplyScalar(meta.radius + 1)
const smooth = THREE.MathUtils.smoothstep
const ray = (x: number, y: number) => new THREE.Vector3(x - iw / 2, -(y - ih / 2), -meta.focalPx).normalize()
const hit = (d: THREE.Vector3): number => {
  const b = d.dot(centre)
  const disc = b * b - (centre.lengthSq() - meta.radius * meta.radius)
  return disc > 0 ? b - Math.sqrt(disc) : meta.tangent
}
const anchor = deck.vortices[0]!.px
const sRay = ray(anchor[0], anchor[1])
const s = sRay.clone().multiplyScalar(hit(sRay))
const en = s.clone().sub(centre).normalize()
const ey = sRay.clone().addScaledVector(en, -sRay.dot(en)).normalize()
const ex = new THREE.Vector3().crossVectors(ey, en)
const ground = (x: number, y: number): [number, number] => {
  const d = ray(x, y)
  const p = d.multiplyScalar(hit(d)).sub(s)
  return [p.dot(ex), p.dot(ey)]
}
const toPx = (g: [number, number]): [number, number] => {
  const p = s.clone().addScaledVector(ex, g[0]).addScaledVector(ey, g[1]).addScaledVector(en, -(g[0] * g[0] + g[1] * g[1]) / (2 * meta.radius))
  return [(meta.focalPx * p.x) / -p.z, (-meta.focalPx * p.y) / -p.z]
}
const centres = deck.vortices.map((v) => ground(v.px[0], v.px[1]))
const swirl = (g: [number, number], dt: number): [number, number] => {
  const calm = dt / Math.sqrt(1 + (dt / deck.settle) * (dt / deck.settle))
  let dx = 0
  let dy = 0
  deck.vortices.forEach((v, i) => {
    const qx = (g[0] - centres[i]![0]) / v.axes[0]
    const qy = (g[1] - centres[i]![1]) / v.axes[1]
    const r2 = qx * qx + qy * qy
    const wide = r2 / (deck.collar[2] * deck.collar[2])
    const a = -THREE.MathUtils.degToRad(v.degPerSecond) * calm * (1 / (1 + r2 * r2) + (i === 0 ? deck.collar[0] : 0) / (1 + wide * wide))
    dx += (Math.cos(a) * qx - Math.sin(a) * qy - qx) * v.axes[0]
    dy += (Math.sin(a) * qx + Math.cos(a) * qy - qy) * v.axes[1]
  })
  return [g[0] + dx, g[1] + dy]
}
const vertex = (i: number, j: number): THREE.Vector3 => {
  const d = ray(i * meta.cell - ox, j * meta.cell - oy)
  const base = hit(d)
  const raw = dist[j * gw + i]!
  const ratio = raw / base
  return d.multiplyScalar(ratio > 0 ? base * Math.pow(ratio, 1 + (deck.depth - 1) * smooth(Math.min(i, gw - 1 - i, gh - 1 - j) * meta.cell, 0, deck.depthBorder)) : raw)
}
const surface = (cx: number, cy: number): THREE.Vector3 => {
  const gx = THREE.MathUtils.clamp(cx / meta.cell, 0, gw - 1.001)
  const gy = THREE.MathUtils.clamp(cy / meta.cell, 0, gh - 1.001)
  const i = Math.floor(gx)
  const j = Math.floor(gy)
  const fx = gx - i
  const fy = gy - j
  return vertex(i, j).multiplyScalar((1 - fx) * (1 - fy)).addScaledVector(vertex(i + 1, j), fx * (1 - fy)).addScaledVector(vertex(i, j + 1), (1 - fx) * fy).addScaledVector(vertex(i + 1, j + 1), fx * fy)
}
const lifted = (tx: number, ty: number, cy: number, layer: number): number => {
  let scale = 1
  for (let n = 0; n < layer; n++) scale -= tiers.tiers[n].lift * THREE.MathUtils.clamp((tiers.rise[1] - Math.max(ty, cy)) / (tiers.rise[1] - tiers.rise[0]), 0, 1) * (1 - smooth(tx, tiers.tiers[n].taper[0], tiers.tiers[n].taper[1]))
  return scale
}
const screen = (frame: number, tx: number, ty: number, layer: number): [number, number] => {
  const time = (frame + config.shutterFraction * 0.5) / config.fps
  const pose = plan.terrain(time - plan.seg.terrain.start)
  const dt = time - (plan.seg.terrain.start + plan.seg.terrain.end) / 2
  let cx = tx
  let cy = ty
  let world = surface(cx, cy)
  for (let k = 0; k < 60; k++) {
    const g = ground(cx - ox, cy - oy)
    const a = toPx(swirl(g, dt))
    const b = toPx(g)
    const near = 1 - smooth(world.distanceTo(pose.position), deck.wisp.fade[0], deck.wisp.fade[1])
    cx = tx - (a[0] - b[0]) * near
    cy = ty - (a[1] - b[1]) * near
    world = surface(cx, cy)
  }
  const f = 540 / Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)
  const v = world.multiplyScalar(lifted(tx, ty, cy, layer)).sub(pose.position).applyQuaternion(pose.quaternion.clone().invert())
  return [960 + (f * v.x) / -v.z, 540 - (f * v.y) / -v.z]
}
const points: [string, number, number, number][] = (process.env.POINTS ?? 'crest:2300:1990:1,lobe:2600:2010:1,mid:2300:1750:0,rim:2540:1420:0,far:2700:1000:0').split(',').map((p) => {
  const [name, x, y, layer] = p.split(':')
  return [name!, Number(x), Number(y), Number(layer)]
})
for (const frame of (process.env.FR ?? '3070,3150,3230').split(',').map(Number)) {
  let line = `${frame}`
  for (const [name, x, y, layer] of points) {
    for (const l of layer > 0 ? [0, layer] : [0]) {
      const a = screen(frame - 1, x, y, l)
      const m = screen(frame, x, y, l)
      const b = screen(frame + 1, x, y, l)
      const vx = (b[0] - a[0]) / 2
      const vy = (b[1] - a[1]) / 2
      const inside = m[0] >= 0 && m[0] < 1920 && m[1] >= 0 && m[1] < 1080
      line += `\n  ${name}${layer > 0 ? (l > 0 ? ' on its tier' : ' on the base') : ''} at ${m[0].toFixed(0)},${m[1].toFixed(0)}${inside ? '' : ' (out of frame)'} moves ${vx.toFixed(2)},${vy.toFixed(2)} speed ${Math.hypot(vx, vy).toFixed(2)}`
    }
  }
  console.log(line)
}
