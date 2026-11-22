import * as THREE from 'three'
import { config } from '../../../../src/config'
import { FilmDirector } from '../../../../src/director/film'
import { plans } from '../../../../src/director/plans'
import { smooth } from '../../../../src/director/rig'
import * as look from '../../../../src/stops/neptune/look'
import { plan } from '../../../../src/stops/neptune/plan'

const argv = process.argv.slice(2)
const from = Number(argv[0] ?? 5000)
const to = Number(argv[1] ?? 5324)
const every = Number(argv[2] ?? 5)
const film = new FilmDirector(plans)
const DEG = 180 / Math.PI
console.log('frame segment        dist   radius px  phase deg (light used)  phase deg (true Sun)  lit    d phase per frame  ring open deg  sun over ring deg  centre px')
let last: number | null = null
let lastFrame = 0
for (let f = from; f <= to; f += every) {
  const shot = film.shotAt(f, f / config.fps)
  const s = shot.sets.find((x) => x.id === 'neptune')
  if (!s) continue
  const cam = shot.camera.position.clone().sub(s.origin)
  const ending = s.segment.stop !== plan.id && s.segment.kind !== 'travel'
  const lit = ending ? (s.segment.kind === 'retreat' ? smooth(s.u * 1.5) : 1) : 0
  const light = plan.lightDir.clone().applyQuaternion(s.rotation).lerp(shot.sun.dir, lit).normalize()
  const phase = cam.angleTo(light) * DEG
  const truePhase = cam.angleTo(shot.sun.dir) * DEG
  const px = (1 / cam.length()) / Math.tan(THREE.MathUtils.degToRad(shot.camera.vfov) / 2) * 540
  const normal = new THREE.Vector3().fromArray(look.ring.normal).normalize().applyQuaternion(s.rotation)
  const open = 90 - cam.angleTo(normal) * DEG
  const sunOver = 90 - light.angleTo(normal) * DEG
  const v = s.origin.clone().sub(shot.camera.position).applyQuaternion(shot.camera.quaternion.clone().invert())
  const k = 540 / Math.tan(THREE.MathUtils.degToRad(shot.camera.vfov) / 2)
  const cx = 960 + v.x / -v.z * k
  const cy = 540 - v.y / -v.z * k
  console.log(String(f).padEnd(6) + s.segment.id.padEnd(16) + cam.length().toFixed(3).padStart(7) + px.toFixed(1).padStart(10) + phase.toFixed(1).padStart(14) + truePhase.toFixed(1).padStart(22) + lit.toFixed(3).padStart(12) + (last === null ? '' : ((phase - last) / (f - lastFrame)).toFixed(2).padStart(12)) + open.toFixed(1).padStart(12) + sunOver.toFixed(1).padStart(12) + ('  ' + cx.toFixed(0) + ', ' + cy.toFixed(0)))
  last = phase
  lastFrame = f
}
