import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import { TRAVEL } from '../../src/space/travel/path'
import { carriedCamera, project } from '../../tools/smooth/camera'

// npx tsx assets-src/travel/landing.ts [--stop mars] [--from -12] [--to 2] [--step 0.5]: where a travel arrives, by part frames: the sky's turn, the centre of the body and its edge, px a frame
const arg = (name: string, d: string): string => {
  const i = process.argv.indexOf('--' + name)
  return i > 0 ? process.argv[i + 1]! : d
}
const only = arg('stop', '')
const FROM = Number(arg('from', '-12'))
const TO = Number(arg('to', '2'))
const STEP = Number(arg('step', '0.5'))
const set = arg('set', '')
for (const pair of set ? set.split(',') : []) {
  const [key, value] = pair.split('=')
  const [id, field] = key!.split('.')
  ;(TRAVEL[id!] as Record<string, unknown>)[field!] = value!.includes(':') ? value!.split(':').map(Number) : Number(value)
}
const film = new FilmDirector(plans)
const master = config.formats[config.formatKeys.master]!
const N = 8
const zero = new THREE.Vector3()
config.stopIds.forEach((stop, i) => {
  const travel = config.segments.find((s) => s.stop === stop && s.kind === 'travel')
  const next = config.stopIds[i + 1]
  if (!travel || !next || stop === 'sun' || (only && only !== stop)) return
  const plan = plans.find((p) => p.id === next)!
  const end = travel.endFrame
  const pose = (p: number) => carriedCamera(film, plan, next, Math.min(Math.floor(p), config.frameCount - 1), p / config.fps).pose
  const focal = (p: number): number => master.height / 2 / Math.tan((pose(p).vfov * Math.PI) / 360)
  const turn = (p: number): THREE.Vector3 => {
    const a = pose(p - 0.5 / N)
    const b = pose(p + 0.5 / N)
    const d = a.quaternion.clone().invert().multiply(b.quaternion)
    if (d.w < 0) d.set(-d.x, -d.y, -d.z, -d.w)
    const s = Math.hypot(d.x, d.y, d.z)
    return new THREE.Vector3(d.x, d.y, d.z).multiplyScalar(s > 1e-15 ? ((2 * Math.atan2(s, d.w)) / s) * N * focal(p) : 0)
  }
  const stars = (p: number): number => {
    const a = pose(p - 0.5 / N)
    const b = pose(p + 0.5 / N)
    const f = focal(p)
    const back = b.quaternion.clone().invert().multiply(a.quaternion)
    let sum = 0
    let count = 0
    for (let gx = -4; gx <= 4; gx++) {
      for (let gy = -2; gy <= 2; gy++) {
        const x = (gx / 4.5) * (master.width / 2)
        const y = (gy / 2.5) * (master.height / 2)
        const v = new THREE.Vector3(x, y, -f).applyQuaternion(back)
        sum += Math.hypot((v.x / -v.z) * f - x, (v.y / -v.z) * f - y)
        count++
      }
    }
    return (sum / count) * N
  }
  const size = (p: number): number => focal(p) / Math.sqrt(Math.max(pose(p).position.lengthSq() - 1, 1e-12))
  const centre = (p: number): number => {
    const a = project(pose(p - 0.5 / N), zero, master.width, master.height)
    const b = project(pose(p + 0.5 / N), zero, master.width, master.height)
    return Math.hypot(b.x - a.x, b.y - a.y) * N
  }
  const grow = (p: number): number => (size(p + 0.5 / N) - size(p - 0.5 / N)) * N
  const near = pose(end).position.clone().normalize()
  const face = (p: number): number => {
    const a = project(pose(p - 0.5 / N), near, master.width, master.height)
    const b = project(pose(p + 0.5 / N), near, master.width, master.height)
    return Math.hypot(b.x - a.x, b.y - a.y) * N
  }
  console.log(travel.id + ' into ' + next + '.hold, first frame of the hold ' + end + '\n  frame | sky px a frame | its change in a frame (vector) | centre px a frame | radius px | edge px a frame | its loss a frame | face px a frame | sky + edge + face | share lost in a step | stars px a frame, mean over the picture')
  if (process.argv.includes('--top')) {
    const top = [0, 0, 0]
    const at = [0, 0, 0]
    for (let p = travel.firstFrame; p <= end; p += 0.5) {
      const v = [turn(p).length(), Math.abs(grow(p)), turn(p).length() + Math.abs(grow(p))]
      v.forEach((x, k) => {
        if (x > top[k]!) {
          top[k] = x
          at[k] = p
        }
      })
    }
    console.log('  top sky ' + top[0]!.toFixed(2) + ' at ' + at[0] + ' | top edge ' + top[1]!.toFixed(2) + ' at ' + at[1] + ' | top sky + edge ' + top[2]!.toFixed(2) + ' at ' + at[2])
    return
  }
  let last = 0
  for (let j = FROM; j <= TO + 1e-9; j += STEP) {
    const p = end + j
    const acc = turn(p + 0.5 / N).sub(turn(p - 0.5 / N)).multiplyScalar(N).length()
    const both = turn(p).length() + Math.abs(grow(p)) + face(p)
    console.log('  ' + [p.toFixed(2), turn(p).length().toFixed(2), acc.toFixed(3), centre(p).toFixed(2), size(p).toFixed(1), grow(p).toFixed(2), (grow(p - 0.5) - grow(p + 0.5)).toFixed(2), face(p).toFixed(2), both.toFixed(2), last > 0 ? ((last - both) / last).toFixed(3) : '-', stars(p).toFixed(2)].join(' | '))
    last = both
  }
})
