import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/sun/plan'
import { stage } from '../../../src/stops/sun/stage'
// where the ball's centre and the spot stand in the picture over the rise (in half heights of the frame from its
// middle, x to the right, y up), the ball's radius in the picture and the lens
const timeOf = (f: number): number => (f + 0.5 * config.shutterFraction) / config.fps
const P = plan as any
const spot = stage.onGround(stage.spot[0], stage.spot[1])
const rows: string[] = ['frame\theight\tvfov\tcentre x\tcentre y\tradius\tspot x\tspot y\tlimb top y at x 0\toff plane deg']
let worst = 0
const short = process.argv[2] === 'short'
for (let f = 180; f <= 290; f += 1) {
  const t = timeOf(f)
  let pose: { position: THREE.Vector3; quaternion: THREE.Quaternion; vfov: number }
  if (f < 270) {
    const shot = P.engineMove ? { view: 'orbit', pose: P.eyeOrbit('rise', t) } : P.eyeShot('rise', t)
    pose = shot.view === 'terrain' ? shot.pose : P.local(P.uncarried(shot.pose, t))
  } else continue
  const inv = pose.quaternion.clone().invert()
  const k = Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)
  const at = (p: THREE.Vector3): [number, number, number] => { const v = p.clone().sub(pose.position).applyQuaternion(inv); return [v.x / -v.z / k, v.y / -v.z / k, v.z] }
  const c = at(stage.centre)
  const s = at(spot)
  const d = pose.position.distanceTo(stage.centre) / stage.radius
  const cv = stage.centre.clone().sub(pose.position).applyQuaternion(inv).normalize()
  // the limb is the cone of half angle asin(1/d) about cv; its point on the picture's middle column (x 0), upper one
  const a = Math.asin(Math.min(1 / d, 1))
  let top = NaN
  for (let i = 0; i < 4000; i += 1) { const y = 3 - i * 0.0015; const dir = new THREE.Vector3(0, y * k, -1).normalize(); if (Math.acos(THREE.MathUtils.clamp(dir.dot(cv), -1, 1)) <= a) { top = y; break } }
  if (f % 3 === 0 || f > 262) rows.push([f, (d - 1).toFixed(3), pose.vfov.toFixed(2), c[2] < 0 ? c[0].toFixed(3) : 'behind', c[2] < 0 ? c[1].toFixed(3) : 'behind', (Math.tan(a) / k).toFixed(3), s[0].toFixed(3), s[1].toFixed(3), top.toFixed(3), THREE.MathUtils.radToDeg(Math.asin(cv.x)).toFixed(2)].join('\t'))
  worst = Math.max(worst, Math.abs(THREE.MathUtils.radToDeg(Math.asin(cv.x))))
}
console.log(short ? rows.filter((_, i) => i === 0 || (i - 1) % 3 === 0).map((r) => r.split('\t').filter((_, j) => [0, 1, 3, 4, 6, 7, 9].includes(j)).join('\t')).join('\n') : rows.join('\n'))
console.log('largest angle of the centre off the upright plane of the camera', worst.toFixed(2))
