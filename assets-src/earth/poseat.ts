import * as THREE from 'three'
import { config } from '../../src/config'
import { plan } from '../../src/stops/earth/plan'

const frames = process.argv.slice(2).map(Number)
const out: unknown[] = []
for (const f of frames) {
  const time = (f + config.shutterFraction / 2) / config.fps
  const seg = config.segments.find((s) => s.stop === 'earth' && f >= s.firstFrame && f < s.endFrame)!
  let pose: { position: THREE.Vector3; quaternion: THREE.Quaternion; vfov: number } | null = null
  if (seg.kind === 'hold') pose = plan.hold(time - plan.seg.hold.start)
  else if (seg.kind === 'dive' || seg.kind === 'rise') {
    const r = seg.kind === 'dive' ? plan.dive(time) : plan.rise(time)
    if (r.view === 'orbit') pose = r.pose
  }
  if (!pose) continue
  const m = new THREE.Matrix4().makeRotationFromQuaternion(pose.quaternion)
  out.push({ frame: f, kind: seg.kind, eye: pose.position.toArray(), basis: Array.from(m.elements), vfov: pose.vfov, sun: plan.lightDir.toArray() })
}
console.log(JSON.stringify(out))
