import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { config } from '../../../src/config'
const d = new FilmDirector(plans) as any
const q = (x: any): string => '[' + x.toArray().map((v: number) => v.toFixed(9)).join(', ') + ']'
const out: any = { frame: d.sky.frame.toArray(), orbit: d.sky.orbits.saturn?.toArray(), jup: d.sky.orbits.jupiter?.toArray(), shots: {} }
for (const f of [3465, 3540, 3567, 3630, 3720, 3809, 3866, 3880, 3883, 3884, 3885, 3886, 3900, 3930, 3959, 3960, 4000]) {
  const s = d.shotAt(f, f / config.fps)
  out.shots[f] = { cam: s.camera.quaternion.toArray(), pos: s.camera.position.toArray(), sky: s.skyQuaternion.toArray(), turn: s.skyTurn.toArray(), stars: s.skyStars, patch: s.skyPatch, exposure: s.skyExposure, glow: s.skyGlow, sets: s.sets }
}
console.log(JSON.stringify(out))
