import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/saturn/plan'
import * as look from '../../../src/stops/saturn/look'
import ringsJson from '../../../src/stops/saturn/rings.json'
const poseAt = (time: number): any => {
  const seg = plan.seg
  if (time >= seg.terrain.start && time < seg.terrain.end) return plan.skimAt(time)
  const shot: any = seg.dive && time >= seg.dive.start && time < seg.dive.end ? plan.dive(time) : plan.rise(time)
  return shot.view === 'terrain' ? { position: shot.pose.position.clone().applyQuaternion(plan.terrainFrame).add(plan.spot), quaternion: plan.terrainFrame.clone().multiply(shot.pose.quaternion), vfov: shot.pose.vfov } : shot.pose
}
const toTilt = new THREE.Quaternion().fromArray(plan.fit.globe.quaternion).invert()
const [r0, r1] = ringsJson.span as [number, number]
const seg = 720
const inner = Math.min(r0 - 0.01, 0.01)
const outer = Math.max(r1 + 0.01, look.rings.reach) / Math.cos(Math.PI / seg)
const radii: number[] = []
for (let j = 0; j <= 6; j++) radii.push(inner + ((outer - inner) * j) / 6)
const more = look.rings.skimReach > outer ? Math.ceil(Math.log(look.rings.skimReach / outer) / Math.log(1.25)) : 0
for (let j = 1; j <= more; j++) radii.push(outer * Math.pow(look.rings.skimReach / outer, j / more))
const args = process.argv.slice(2)
const frames = args.filter((a) => !a.includes(',')).map(Number)
const pts = args.filter((a) => a.includes(',')).map((a) => a.split(',').map(Number) as [number, number])
console.log('radii', radii.map((r) => r.toFixed(3)).join(' '))
for (const f of frames) {
  const p = poseAt((f + config.shutterFraction * 0.5) / config.fps)
  const camL = p.position.clone().applyQuaternion(toTilt)
  const q = toTilt.clone().multiply(p.quaternion)
  const inv = q.clone().invert()
  const px = 540 / Math.tan(THREE.MathUtils.degToRad(p.vfov) / 2)
  const view = (x: number, z: number): THREE.Vector3 => new THREE.Vector3(x, 0, z).sub(camL).applyQuaternion(inv)
  const scr = (v: THREE.Vector3): string => v.z < 0 ? `${(960 + (v.x / -v.z) * px).toFixed(1)},${(540 - (v.y / -v.z) * px).toFixed(1)}` : 'behind'
  console.log('frame', f, 'camL', camL.toArray().map((v: number) => v.toFixed(5)).join(' '), 'r', Math.hypot(camL.x, camL.z).toFixed(5), 'az deg', THREE.MathUtils.radToDeg(Math.atan2(camL.z, camL.x)).toFixed(4), 'vfov', p.vfov)
  for (const [x, y] of pts) {
    const d = new THREE.Vector3((x + 0.5 - 960) / px, (540 - y - 0.5) / px, -1).applyQuaternion(q)
    const t = -camL.y / d.y
    if (!(t > 0)) { console.log(' ', x, y, 'no plane'); continue }
    const P = camL.clone().addScaledVector(d, t)
    const r = Math.hypot(P.x, P.z)
    let a = Math.atan2(P.z, P.x)
    if (a < 0) a += Math.PI * 2
    const i = Math.floor((a / (Math.PI * 2)) * seg)
    let j = 0
    while (j < radii.length - 2 && radii[j + 1]! * Math.cos(Math.PI / seg) < r) j++
    const c = [[j, i], [j + 1, i], [j, i + 1], [j + 1, i + 1]].map(([jj, ii]) => { const an = (ii! / seg) * Math.PI * 2; return view(Math.cos(an) * radii[jj!]!, Math.sin(an) * radii[jj!]!) })
    console.log(' ', x, y, 'plane r', r.toFixed(5), 'az', THREE.MathUtils.radToDeg(a).toFixed(4), 'dist', t.toFixed(5), 'band', j, 'seg', i, 'corners view z', c.map((v) => v.z.toFixed(5)).join(' '), 'screen', c.map(scr).join(' | '))
  }
}
