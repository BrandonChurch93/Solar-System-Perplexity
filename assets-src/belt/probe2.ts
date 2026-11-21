import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import { Flow, FLOW } from '../../src/space/travel/flow'

const d = new FilmDirector(plans)
const seg = config.segments.find((s) => s.id === 'mars.travel')!
const flow = new Flow(d)
const W = 1920, H = 1080
const a = new THREE.Vector3(), b = new THREE.Vector3()
let prev: THREE.Quaternion | null = null
for (let f = seg.firstFrame; f < seg.endFrame; f++) {
  const s = d.shotAt(f, (f + 0.25) / config.fps)
  const inv = s.camera.quaternion.clone().invert()
  const fl = H / 2 / Math.tan(THREE.MathUtils.degToRad(s.camera.vfov) / 2)
  const discs = s.sets.map((x) => {
    const c = x.origin.clone().sub(s.camera.position).applyQuaternion(inv)
    const ang = Math.asin(Math.min(1, 1 / c.length()))
    return x.id + (c.z < 0 ? ' ' + (W / 2 + (c.x / -c.z) * fl).toFixed(0) + ',' + (H / 2 - (c.y / -c.z) * fl).toFixed(0) + ' r' + (Math.tan(ang) * fl).toFixed(0) : ' behind') + ' d' + c.length().toFixed(1)
  })
  flow.at(seg, f, 0, a)
  flow.at(seg, f, FLOW.stepsPerFrame, b)
  const v = b.clone().sub(a).multiplyScalar(config.fps)
  const vc = v.clone().applyQuaternion(inv)
  const turn = prev ? THREE.MathUtils.radToDeg(prev.angleTo(s.camera.quaternion)) : 0
  prev = s.camera.quaternion.clone()
  const sun = s.sun.dir.clone().applyQuaternion(inv)
  if (f % 3 === 0 || f === 2782) console.log(f, 'vfov', s.camera.vfov.toFixed(1), 'turn', turn.toFixed(2), 'flow', a.length().toFixed(2), 'speed', v.length().toFixed(2), 'dirCam', vc.normalize().toArray().map((x) => x.toFixed(2)).join(','), 'sun', sun.toArray().map((x) => x.toFixed(2)).join(','), 'dust', s.dust.toFixed(2), '|', discs.join(' | '))
}
