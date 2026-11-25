import * as THREE from 'three'
import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import place from '../../../src/stops/sun/place.json'
// The sky over the Sun's rise as the camera sees it: how far it moves in the picture from frame to frame (the angle
// between the sky's turn against the camera at two frames, degrees), the largest step and where, beside the camera's
// own turn. With pairs of heights as arguments (a:b a:b ...) the law of the sky's turn by the eye's height
// (place.json onGlobe.heights.carry, read by plan.ts skyCarryShare) is tried with each pair and one line is printed
// for each; with none, the table of the law as it stands.
//   npx tsx assets-src/sun/place/skyturn.ts [a:b ...]
const film = new FilmDirector(plans)
const timeOf = (f: number): number => (f + config.shutterFraction / 2) / config.fps
const heights = (place as unknown as { onGlobe: { heights: Record<string, number[]> } }).onGlobe.heights
function read(): { steps: number[]; cam: number[]; left: number[] } {
  const steps: number[] = []
  const cam: number[] = []
  const left: number[] = []
  let before: { sky: THREE.Quaternion; cam: THREE.Quaternion } | null = null
  const hold = film.shotAt(300, timeOf(300)) as unknown as { skyQuaternion: THREE.Quaternion }
  for (let f = 180; f <= 270; f += 1) {
    const s = film.shotAt(f, timeOf(f)) as unknown as { skyQuaternion: THREE.Quaternion; camera: { quaternion: THREE.Quaternion } }
    const now = { sky: s.skyQuaternion.clone(), cam: s.camera.quaternion.clone() }
    if (before) {
      steps.push(THREE.MathUtils.radToDeg(now.sky.angleTo(before.sky)))
      cam.push(THREE.MathUtils.radToDeg(now.cam.angleTo(before.cam)))
    }
    left.push(THREE.MathUtils.radToDeg(now.sky.angleTo(hold.skyQuaternion)))
    before = now
  }
  return { steps, cam, left }
}
function line(name: string, r: { steps: number[]; cam: number[] }): string {
  let worst = 0
  let jump = 0
  for (let i = 0; i < r.steps.length; i += 1) {
    if (r.steps[i]! > r.steps[worst]!) worst = i
    if (i > 0 && Math.abs(r.steps[i]! - r.steps[i - 1]!) > jump) jump = Math.abs(r.steps[i]! - r.steps[i - 1]!)
  }
  const sum = r.steps.reduce((a, b) => a + b, 0)
  return `${name}: largest step of the sky in the picture ${r.steps[worst]!.toFixed(3)} degrees at ${180 + worst} to ${181 + worst}, way of the sky 180 to 270 ${sum.toFixed(2)} degrees, largest change of step ${jump.toFixed(3)}, largest step of the camera ${Math.max(...r.cam).toFixed(3)}`
}
const pairs = process.argv.slice(2)
if (pairs.length === 0) {
  const r = read()
  const rows = ['frame  sky step  camera step  sky left to the hold']
  for (let f = 181; f <= 270; f += 3) rows.push(`${f}  ${r.steps[f - 181]!.toFixed(3)}  ${r.cam[f - 181]!.toFixed(3)}  ${r.left[f - 180]!.toFixed(2)}`)
  console.log(rows.join('\n'))
  console.log(line('as it stands' + (heights.carry ? ' (carry ' + heights.carry.join(' to ') + ')' : ''), r))
} else {
  for (const p of pairs) {
    heights.carry = p.split(':').map(Number)
    console.log(line('carry ' + p, read()))
  }
}
