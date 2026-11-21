import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'

const d = new FilmDirector(plans)
const DEG = 180 / Math.PI
config.stopIds.forEach((id, i) => {
  if (i === 0) return
  const p = plans[i - 1]!
  const seg = p.seg.travel!
  console.log(p.id + '.travel: legacy begin ' + d.beginOf(i).toFixed(3) + ', clear ' + d.clearAtOf(i).toFixed(3))
  for (const u of [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6]) {
    const time = seg.start + u * (seg.end - seg.start)
    const frame = Math.min(seg.firstFrame + Math.floor(u * seg.frames), seg.endFrame - 1)
    const shot = d.shotAt(frame, time)
    const inv = shot.camera.quaternion.clone().invert()
    const line = d.leavingThings(i - 1, time).map((t) => {
      const v = t.to.clone().applyQuaternion(inv)
      return t.name + ' (' + (Math.atan2(v.x, -v.z) * DEG).toFixed(0) + ', ' + (Math.atan2(v.y, Math.hypot(v.x, v.z)) * DEG).toFixed(0) + ') r ' + (Math.asin(Math.min(t.radius / v.length(), 1)) * DEG).toFixed(1)
    })
    console.log('  u ' + u.toFixed(1) + ': ' + line.join('; '))
  }
})
