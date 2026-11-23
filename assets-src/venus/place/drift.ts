// The film's camera drift (src/director/rig.ts) at given frames, as it shows in a check view of 2160 lines and 60 deg:
// where the ideal optical axis lands in the drifted picture, in pixels from the centre (x to the right, y down).
// npx tsx assets-src/venus/place/drift.ts 1300 1349
import * as THREE from 'three'
import { config } from '../../../src/config'
import { drift } from '../../../src/director/rig'

const focal = 1080 / Math.tan(Math.PI / 6)
for (const frame of process.argv.slice(2).map(Number)) {
  const q = drift(frame / config.fps)
  const e = new THREE.Euler().setFromQuaternion(q, 'YXZ')
  const v = new THREE.Vector3(0, 0, -1).applyQuaternion(q.clone().invert())
  const deg = (x: number) => ((x * 180) / Math.PI).toFixed(4)
  console.log(frame, 'euler deg', deg(e.x), deg(e.y), deg(e.z), 'centre px', ((v.x / -v.z) * focal).toFixed(2), ((-v.y / -v.z) * focal).toFixed(2))
}
