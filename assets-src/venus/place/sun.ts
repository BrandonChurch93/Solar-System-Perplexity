import * as THREE from 'three'
import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'

// Prints where the engine's Sun stands in the frame (0 to 1 from the left and from the top) on both sides at given frames
// of the Venus dive and rise, with the height of the globe side camera, the sky exposure and the sky glow of the shot.
// npx tsx assets-src/venus/place/sun.ts 1331 1343 1349 1544 1556
const film = new FilmDirector(plans)
const aspect = 16 / 9
for (const a of process.argv.slice(2)) {
  const f = Number(a)
  const time = (f + config.shutterFraction * 0.5) / config.fps
  const row: string[] = [String(f)]
  for (const side of ['orbit', 'terrain'] as const) {
    const s = film.shotAt(f, time, side)
    const d = s.sun.dir.clone().applyQuaternion(s.camera.quaternion.clone().invert())
    const t = Math.tan(THREE.MathUtils.degToRad(s.camera.vfov) / 2)
    const x = 0.5 + d.x / -d.z / (t * aspect) / 2
    const y = 0.5 - d.y / -d.z / t / 2
    row.push(side, 'sun', d.z < 0 ? x.toFixed(4) + ', ' + y.toFixed(4) : 'behind', 'vfov', s.camera.vfov.toFixed(2), 'skyExposure', s.skyExposure.toFixed(4), 'skyGlow', s.skyGlow.toFixed(3), 'exposure', s.post.exposure.toFixed(3), 'glare', s.sun.glare.toFixed(3), 'flare', s.post.flare.toFixed(3), 'radius deg', THREE.MathUtils.radToDeg(s.sun.angularRadius).toFixed(3), '|')
  }
  console.log(row.join(' '))
}
