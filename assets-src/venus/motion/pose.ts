import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/venus/plan'

for (const arg of process.argv.slice(2)) {
  const f = Number(arg)
  const t = (f + 0.5) / config.fps
  const seg = config.segments.find((s) => s.stop === 'venus' && f >= s.firstFrame && f < s.firstFrame + s.frames)!
  const pose = seg.kind === 'hold' ? plan.hold(t - seg.start) : seg.kind === 'dive' ? plan.dive(t).pose : plan.rise(t).pose
  const c = pose.position.clone().negate().applyQuaternion(pose.quaternion.clone().invert())
  const sun = plan.sunDir.clone().applyQuaternion(pose.quaternion.clone().invert())
  console.log(JSON.stringify({ frame: f, kind: seg.kind, centre: c.toArray(), vfov: pose.vfov, dist: pose.position.length(), sun: sun.toArray(), th: Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2) }))
}
