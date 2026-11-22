import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/venus/plan'
import * as look from '../../../src/stops/venus/look'

const spinY = (v: THREE.Vector3, a: number): THREE.Vector3 => new THREE.Vector3(Math.cos(a) * v.x - Math.sin(a) * v.z, v.y, Math.sin(a) * v.x + Math.cos(a) * v.z)

for (const arg of process.argv.slice(2)) {
  const f = Number(arg)
  const t = (f + 0.5) / config.fps
  const seg = config.segments.find((s) => s.stop === 'venus' && f >= s.firstFrame && f < s.firstFrame + s.frames)!
  const pose = seg.kind === 'hold' ? plan.hold(t - seg.start) : seg.kind === 'dive' ? plan.dive(t).pose : plan.rise(t).pose
  const back = new THREE.Quaternion().fromArray(plan.fit.globe.quaternion).invert()
  const spot = plan.spot.clone().applyQuaternion(back)
  const elapsed = Math.min(Math.max(t - plan.holdMid, look.drift.from), look.drift.to)
  const drift = THREE.MathUtils.degToRad(look.drift.bandDegPerSecond) * elapsed
  const body = (v: THREE.Vector3): THREE.Vector3 => {
    const d = spinY(v.clone().applyQuaternion(back).normalize(), plan.spin(t))
    return spinY(d, drift * (1 - d.y * d.y - (1 - spot.y * spot.y)))
  }
  const eye = body(pose.position)
  const turn = (v: THREE.Vector3): number[] => spinY(spinY(v.applyQuaternion(pose.quaternion).applyQuaternion(back), plan.spin(t)), drift * (1 - eye.y * eye.y - (1 - spot.y * spot.y))).toArray()
  console.log(JSON.stringify({ frame: f, eye: eye.toArray(), dist: pose.position.length(), right: turn(new THREE.Vector3(1, 0, 0)), up: turn(new THREE.Vector3(0, 1, 0)), fwd: turn(new THREE.Vector3(0, 0, -1)), sun: body(plan.lightDir).toArray(), th: Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2) }))
}
