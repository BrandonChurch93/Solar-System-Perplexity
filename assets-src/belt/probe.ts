import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'

const d = new FilmDirector(plans)
const seg = config.segments.find((s) => s.id === 'mars.travel')!
const mi = config.stopIds.indexOf('mars')
const fmt = config.formats[config.formatKeys.master]!
console.log('segment', seg.firstFrame, seg.endFrame, 'begin', d.beginOf(mi + 1).toFixed(4), 'sunWorld', d.sunWorld.toArray().map((x) => x.toFixed(4)).join(' '))
let prev: THREE.Quaternion | null = null
const toCam = (v: THREE.Vector3, q: THREE.Quaternion): THREE.Vector3 => v.clone().applyQuaternion(q.clone().invert())
const screen = (c: THREE.Vector3, vfov: number): string => {
  if (c.z >= 0) return 'behind'
  const t = Math.tan(THREE.MathUtils.degToRad(vfov) / 2)
  const x = c.x / -c.z / (t * fmt.width / fmt.height)
  const y = c.y / -c.z / t
  return ((x * 0.5 + 0.5) * fmt.width).toFixed(0) + ',' + ((0.5 - y * 0.5) * fmt.height).toFixed(0)
}
for (let f = seg.firstFrame; f < seg.endFrame; f++) {
  const s = d.shotAt(f, (f + 0.25) / config.fps)
  const q = s.camera.quaternion
  const step = prev ? THREE.MathUtils.radToDeg(prev.angleTo(q)) : 0
  prev = q.clone()
  const sun = toCam(s.sun.dir, q)
  const out: string[] = ['f' + f, 'u' + s.u.toFixed(3), 'fov' + s.camera.vfov.toFixed(2), 'turn' + step.toFixed(2), 'sun[' + sun.toArray().map((x) => x.toFixed(2)).join(' ') + ']', 'sunpx ' + screen(sun, s.camera.vfov)]
  for (const st of s.sets) {
    const rel = st.origin.clone().sub(s.camera.position)
    const c = toCam(rel, q)
    const dist = rel.length()
    const rpx = (1 / dist) / Math.tan(THREE.MathUtils.degToRad(s.camera.vfov) / 2) * (fmt.height / 2)
    out.push(st.id + ' w' + st.weight + ' px ' + screen(c, s.camera.vfov) + ' r' + rpx.toFixed(2) + ' d' + dist.toExponential(2))
  }
  out.push('exp' + s.post.exposure.toFixed(2), 'sky' + s.skyExposure.toFixed(2), 'dust' + s.dust.toFixed(2), 'near' + s.near.toFixed(3))
  console.log(out.join('  '))
}
