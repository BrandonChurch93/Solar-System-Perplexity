import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
const sky = (config as any).raw.travel.sky
const run = (lead: number, glare: number): string[] => {
  sky.retreatLead = lead; sky.retreatGlare = glare
  const d = new FilmDirector(plans)
  const out: string[] = []
  for (const f of [5143, 5144, 5144.25, 5144.5, 5144.75, 5145, 5145.25, 5146]) {
    const s = d.shotAt(Math.floor(f), f / config.fps)
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(s.camera.quaternion)
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(s.camera.quaternion)
    out.push(`${f} fwd ${fwd.toArray().map((v) => v.toFixed(7)).join(' ')} up ${up.toArray().map((v) => v.toFixed(6)).join(' ')} pos ${s.camera.position.toArray().map((v) => v.toFixed(5)).join(' ')}`)
  }
  return out
}
const a = run(0, 0.5), b = run(0.06, 0.35)
a.forEach((l, i) => console.log(l === b[i] ? 'same ' + l.slice(0, 30) : 'OLD ' + l + '\nNEW ' + b[i]))
