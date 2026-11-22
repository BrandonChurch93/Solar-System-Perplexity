import * as THREE from 'three'
import { readFileSync } from 'node:fs'
import { config } from '../../../src/config'
import { deck } from '../../../src/stops/jupiter/look'
import { plan } from '../../../src/stops/jupiter/plan'

const meta = JSON.parse(readFileSync('src/stops/jupiter/relief.json', 'utf8'))
const tiers = JSON.parse(readFileSync('assets-src/jupiter/relief/tiers.json', 'utf8'))
const buf = readFileSync('public/assets/jupiter/full/deck-dist.bin')
const dist = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4)
const [gw] = meta.grid
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
const point = (cx: number, cy: number, layer: number): THREE.Vector3 => {
  const d = ray(cx - ox, cy - oy)
  const base = hit(d)
  const raw = dist[Math.round(cy / meta.cell) * gw + Math.round(cx / meta.cell)]!
  const ratio = raw / base
  const edge = Math.min(cx, iw + 2 * ox - cx, ih + 2 * oy - cy)
  let scale = 1
  for (let n = 0; n < layer; n++) scale -= tiers.tiers[n].lift * THREE.MathUtils.clamp((tiers.rise[1] - cy) / (tiers.rise[1] - tiers.rise[0]), 0, 1) * (1 - smooth(cx, tiers.tiers[n].taper[0], tiers.tiers[n].taper[1]))
  return d.multiplyScalar(scale * (ratio > 0 ? base * Math.pow(ratio, 1 + (deck.depth - 1) * smooth(edge, 0, deck.depthBorder)) : raw))
}
const screen = (frame: number, w: THREE.Vector3): [number, number] => {
  const pose = plan.terrain((frame + 0.25) / config.fps - plan.seg.terrain.start)
  const f = 540 / Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)
  const v = w.clone().sub(pose.position).applyQuaternion(pose.quaternion.clone().invert())
  return [960 + (f * v.x) / -v.z, 540 - (f * v.y) / -v.z]
}
const points: [string, number, number, number][] = (process.env.POINTS ?? 'crest:2300:2010:1,bank:2600:2200:1,behind:2300:1960:0,storm:3110:1640:0,far:2900:1250:0').split(',').map((p) => {
  const [name, x, y, layer] = p.split(':')
  return [name!, Number(x), Number(y), Number(layer)]
})
for (const frame of (process.env.FR ?? '3070,3150,3230').split(',').map(Number)) {
  let line = `${frame}`
  for (const [name, x, y, layer] of points) {
    for (const l of layer > 0 ? [0, layer] : [0]) {
      const w = point(x, y, l)
      const a = screen(frame, w)
      const b = screen(frame + 1, w)
      line += ` | ${name}${layer > 0 ? (l > 0 ? ' lifted' : ' kept') : ''} at ${a[0].toFixed(0)},${a[1].toFixed(0)} moves ${(b[0] - a[0]).toFixed(2)},${(b[1] - a[1]).toFixed(2)}`
    }
  }
  console.log(line)
}
