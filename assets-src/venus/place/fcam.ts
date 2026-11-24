import * as THREE from 'three'
import { writeFileSync } from 'node:fs'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/venus/plan'
import { drift } from '../../../src/director/rig'
import fit from '../../../src/stops/venus/fit.json'
import plates from '../../../src/stops/venus/plates.json'

// The film's camera on the globe side at the height where the ground of the surface view has half its weight on the globe
// side (plates.json, ground.heights, the middle in the logarithm), on the dive and on the rise, in the body fixed frame of
// the globe: the camera flay.py lays the close side's picture back with. The same record as tcam.ts writes for T.
// npx tsx assets-src/venus/place/fcam.ts --json out/work/venus/place/fcam.json [--height 0.0244]
const args = process.argv.slice(2)
const arg = (name: string): string | undefined => (args.indexOf('--' + name) >= 0 ? args[args.indexOf('--' + name) + 1] : undefined)
const file = arg('json') ?? ''
const [lo, hi] = plates.ground.heights as [number, number]
const height = arg('height') === undefined ? Math.sqrt(lo * hi) : Number(arg('height'))
const film = new FilmDirector(plans)
const globe = new THREE.Quaternion().fromArray(fit.globe.quaternion)
const out: Record<string, object> = {}
for (const kind of ['dive', 'rise'] as const) {
  const seg = config.segments.find((s) => s.stop === 'venus' && s.kind === kind)
  if (!seg) throw new Error('no ' + kind + ' of venus')
  const pose = (time: number) => plan.eye(kind, time, 'orbit')
  const over = (time: number): number => pose(time).position.length() - 1
  // The height falls through the dive and climbs through the rise: the time at which it has the asked value, by halving.
  let a = seg.start
  let b = seg.end
  const sign = kind === 'dive' ? -1 : 1
  for (let i = 0; i < 60; i++) {
    const m = (a + b) / 2
    if (sign * (over(m) - height) < 0) a = m
    else b = m
  }
  const time = (a + b) / 2
  const frame = Math.floor(time * config.fps + 1e-9)
  const p = pose(time)
  const own = p.quaternion.clone().multiply(drift(time))
  const back = globe.clone().invert().multiply(plan.turn(time).invert())
  const pos = p.position.clone().applyQuaternion(back)
  const q = back.clone().multiply(own)
  const x = new THREE.Vector3(), y = new THREE.Vector3(), z = new THREE.Vector3()
  new THREE.Matrix4().makeRotationFromQuaternion(q).extractBasis(x, y, z)
  const vfov = film.shotAt(frame, time, 'orbit').camera.vfov
  out[kind] = { frame, time, position: pos.toArray(), x: x.toArray(), y: y.toArray(), z: z.toArray(), vfovDeg: vfov, height: pos.length() - 1 }
  console.log(kind, 'height', (pos.length() - 1).toFixed(6), 'time', time, 'frame', frame, 'vfov', vfov)
}
if (file) writeFileSync(file, JSON.stringify(out, null, 1))
