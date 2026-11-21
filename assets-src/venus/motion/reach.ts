import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan, params, drift } from '../../../src/stops/venus/plan'
import relief from '../../../src/stops/venus/relief.json'
import aprons from '../../../src/stops/venus/aprons.json'

const cam = relief.camera
const [W, H] = relief.imageSize.full
const up = new THREE.Vector3().fromArray(cam.up).normalize()
const centre = up.clone().multiplyScalar(-(cam.radius + 1))
const th = Math.tan(THREE.MathUtils.degToRad(cam.vfovDeg) / 2)
const aspect = W / H
const box = (relief.layers as unknown as Record<string, { box: number[] }>).L0.box
const seg = (kind: string) => config.segments.find((s) => s.stop === 'venus' && s.kind === kind)!
if (process.env.SET) Object.assign(params.terrain, JSON.parse(process.env.SET))
if (process.env.BEND) drift.bend = Number(process.env.BEND)
const frames = process.argv.slice(2).map(Number)
const nx = 192
const ny = 108

for (const f of frames) {
  const time = f / config.fps
  const kind = f < seg('terrain').start * config.fps ? 'dive' : f >= seg('rise').start * config.fps ? 'rise' : 'terrain'
  const shot = kind === 'dive' ? plan.dive(time) : kind === 'rise' ? plan.rise(time) : { pose: plan.terrain(time - seg('terrain').start), view: 'terrain' as const }
  if (shot.view !== 'terrain') { console.log(f, 'orbit'); continue }
  const p = shot.pose
  const t = Math.tan(THREE.MathUtils.degToRad(p.vfov) / 2)
  let hole = 0, left = 0, right = 0, low = 0, ground = 0, far = 0, reach = 0, band = 0, bandX = 1, bandY0 = 1, bandY1 = 0
  const rows: string[] = []
  for (let j = 0; j < ny; j++) {
    let row = ''
    for (let i = 0; i < nx; i++) {
      const x = ((i + 0.5) / nx) * 2 - 1
      const y = 1 - ((j + 0.5) / ny) * 2
      const d = new THREE.Vector3(x * t * (16 / 9), y * t, -1).normalize().applyQuaternion(p.quaternion)
      const oc = p.position.clone().sub(centre)
      const b = oc.dot(d)
      const disc = b * b - (oc.lengthSq() - cam.radius * cam.radius)
      if (disc < 0 || -b - Math.sqrt(disc) < 0) { row += ' '; continue }
      ground++
      const q = p.position.clone().addScaledVector(d, -b - Math.sqrt(disc))
      if (q.z > -1e-3) { hole++; row += '#'; continue }
      const px = ((q.x / -q.z / (th * aspect)) * 0.5 + 0.5) * W
      const py = (0.5 - (q.y / -q.z / th) * 0.5) * H
      const inBox = (b: number[]) => px >= b[0]! && px <= b[0]! + b[2]! && py >= b[1]! && py <= b[1]! + b[3]!
      if (!inBox(box)) {
        if (inBox(aprons.layers.Al.box)) { far++; row += 'L' }
        else if (inBox(aprons.layers.Ar.box)) { far++; row += 'R'; if (py < 1296 + 1000) { band++; reach = Math.max(reach, px - 6336); bandX = Math.min(bandX, (i + 0.5) / nx); bandY0 = Math.min(bandY0, (j + 0.5) / ny); bandY1 = Math.max(bandY1, (j + 0.5) / ny) } }
        else { hole++; row += '#' }
      }
      else if (px < 0) { left++; row += 'l' }
      else if (px > W) { right++; row += 'r' }
      else if (py > H) { low++; row += 'b' }
      else row += '.'
    }
    rows.push(row)
  }
  const pc = (n: number) => ((100 * n) / (nx * ny)).toFixed(1)
  console.log(f, kind, 'pos', p.position.toArray().map((v) => v.toFixed(2)).join(' '), 'hole', pc(hole), 'left', pc(left), 'right', pc(right), 'below', pc(low), 'aprons', pc(far), 'band', pc(band), 'reach', reach.toFixed(0), 'frame x from', bandX.toFixed(3), 'y', bandY0.toFixed(3), bandY1.toFixed(3))
  if (process.env.MAP) console.log(rows.join('\n'))
}
