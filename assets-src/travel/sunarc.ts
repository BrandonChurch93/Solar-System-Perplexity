import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'

const d = new FilmDirector(plans)
const DEG = 180 / Math.PI
const at = (f: number) => d.shotAt(f, (f + 0.25) / config.fps)
const axis = (q: THREE.Quaternion) => new THREE.Vector3(0, 0, -1).applyQuaternion(q)
plans.slice(0, -1).forEach((p, i) => {
  const seg = config.segments.find((s) => s.id === p.id + '.travel')!
  const a = axis(at(seg.firstFrame).camera.quaternion)
  const b = axis(at(seg.endFrame).camera.quaternion)
  const s = d.sunWorld
  const n = new THREE.Vector3().crossVectors(a, b).normalize()
  const flat = s.clone().addScaledVector(n, -s.dot(n)).normalize()
  const along = Math.atan2(new THREE.Vector3().crossVectors(a, flat).dot(n), a.dot(flat)) * DEG
  let least = 999
  let leastAt = 0
  for (let f = seg.firstFrame; f <= seg.endFrame; f++) {
    const x = axis(at(f).camera.quaternion).angleTo(s) * DEG
    if (x < least) { least = x; leastAt = f }
  }
  const la = plans[i]!.p.light
  const lb = plans[i + 1]!.p.light
  console.log(`${p.id}.travel | turn ${(a.angleTo(b) * DEG).toFixed(1)} | Sun to first axis ${(a.angleTo(s) * DEG).toFixed(1)} | Sun to last axis ${(b.angleTo(s) * DEG).toFixed(1)} | Sun off the turn's plane ${(Math.asin(Math.min(Math.abs(s.dot(n)), 1)) * DEG).toFixed(1)} | Sun along the turn from the first axis ${along.toFixed(1)} | nearest on today's path ${least.toFixed(1)} at ${leastAt} | radius ${la.sunRadiusDeg} to ${lb.sunRadiusDeg} | glare ${la.sunGlare} to ${lb.sunGlare}`)
})
