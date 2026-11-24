import * as THREE from 'three'
import { args } from './lib/common'
import { config } from '../src/config'
import { setCapture, spanMid } from '../src/core/clock'
import { shutterMid } from '../src/core/sampler'
import { FilmDirector } from '../src/director/film'
import { forceOneMove, handoverOf } from '../src/director/handover'
import { plans } from '../src/director/plans'
import { carriedCamera } from './smooth/camera'

// The seam between a surface view and its dive or its rise, read on the eye itself (ruling d196): across the seam the eye's speed over
// its own height may not dip and the eye may not stop and go back the way it came.
//   npx tsx tools/seam.ts [--stop ID] [--kind dive|rise] [--rate N] [--frames N] [--before N] [--rows] [--force]
// The eye is the film's own camera as a camera at the unit sphere of the stop, read as the judge reads it (tools/smooth/camera.ts,
// carriedCamera at the capture rate: the close view through the twin, the globe as it stands), taken in the frame the ground itself
// stands in, so what is counted is its way over the ground. From one capture frame to
// the next: the length of that way a film frame over the height of the eye above the sphere. That number is the share of its own
// height the eye flies in a film frame, and so the speed at which the near ground runs through the picture.
// One line a seam:
//   the surface view's own number where it meets the move (the mean of its 2 film frames next to the seam);
//   the lowest of the move's first (rise) or last (dive) --frames film frames (16) over that, and its frame: 1 is no dent;
//   where the part of the eye's way along the surface view's own way at the seam passes 0 inside those frames, and the speed it has
//   there over the surface view's: a small number is an eye that stops and turns back, a large one is a bend at speed;
//   the largest step of the number from one film frame to the next inside the surface view's --before film frames (the bend of a
//   surface view must not lose speed either) and the frame of the change of view.
//   --rows    every capture frame: speed over height, the same over the surface view's, its parts along the surface view's way, up and
//             across (all over the surface view's speed), the turn of the lens in degrees a film frame, the height.
//   --before  film frames of the surface view shown and read before a rise or after a dive (3; give the length of your bend).
//   --rate    capture frames a film frame (2).
//   --force   fly the stop on the engine's one move whatever handover.ownPath says.
// Under the line of a rise on the one move: the way the move alone takes the eye out of the seam, and the terrain.bend that ends on it.
// Nothing is written and nothing is judged here: the judge is the line of npm run smooth.

type Kind = 'dive' | 'rise'
interface Row { f: number; speed: number; along: number; up: number; across: number; turn: number; height: number; inMove: boolean }

const a = args()
if (a.force === 'true') forceOneMove(true)
const rate = Math.max(1, Math.round(Number(a.rate ?? 2)))
setCapture(rate)
const frames = Number(a.frames ?? 16)
const before = Number(a.before ?? 3)
const film = new FilmDirector(plans)
const deg = THREE.MathUtils.radToDeg

function label(f: number): string {
  const whole = Math.floor(f + 1e-9)
  const part = Math.round((f - whole) * rate)
  return part === 0 ? String(whole) : whole + ' + ' + part + '/' + rate
}

// For a stop on the one move whose surface view is the engine's (terrain.bend of its params, src/director/bend.ts): the way the one move
// alone takes the eye out of the seam, in the ground's frame of the surface view where its bend begins (or at the seam, if it has none),
// and the bend that ends on that way.
function advice(plan: (typeof plans)[number]): string {
  const span = plan.seg.terrain.end - plan.seg.terrain.start
  const bend = plan.p.terrain.bend
  const at = span - (bend ? bend.frames / config.fps : 0)
  const step = 1e-4
  const here = plan.terrain(at).position
  const way = here.clone().sub(plan.terrain(at - step).position).normalize()
  const up = plan.closeGround(here, plan.seg.terrain.start + at).up
  const level = way.clone().addScaledVector(up, -way.dot(up)).normalize()
  const right = level.clone().cross(up).normalize()
  const angles = (d: THREE.Vector3): string => '[' + deg(Math.atan2(d.dot(right), d.dot(level))).toFixed(1) + ', ' + deg(Math.asin(Math.min(Math.max(d.dot(up), -1), 1))).toFixed(1) + ']'
  const first = plan.eyeFirstWay('rise')
  const across = first.clone().addScaledVector(way, -first.dot(way)).normalize()
  return (
    '  the one move alone leaves the seam toward ' + angles(first) + ' (azimuth from the surface view\'s level way, 90 to its right; elevation), ' + deg(first.angleTo(way)).toFixed(1) +
    ' degrees from the way of the surface view ' + (bend ? 'where its bend begins' : 'at the seam') + ' ' + angles(way) + '; the bend that ends on it: "acrossDeg": ' + angles(across) + ', "turnDeg": ' + deg(first.angleTo(way)).toFixed(1) +
    (bend ? '; the bend it has: ' + JSON.stringify(bend) : '')
  )
}

function seam(stop: string, kind: Kind): string[] {
  const plan = plans.find((p) => p.id === stop)!
  const seg = plan.seg[kind]!
  const at = kind === 'dive' ? seg.endFrame : seg.firstFrame
  const from = kind === 'rise' ? at - before : at - frames
  const to = kind === 'rise' ? at + frames : at + before
  // The ground's own frame is the one the stop's twin gives the close view: the pose goes back through the twin of its own time and out
  // through the twin of one fixed time, so a stop whose ground turns by a law of its own is read on that law.
  const fixed = plan.seg.terrain.start
  const eye = (k: number): { ground: THREE.Vector3; quaternion: THREE.Quaternion; height: number; up: THREE.Vector3 } => {
    const time = (k / rate + spanMid()) / config.fps
    const c = carriedCamera(film, plan, plan.id, k / rate, time)
    const g = plan.twin(plan.untwin(c.pose, time), fixed)
    return { ground: g.position, quaternion: g.quaternion, height: g.position.length() - 1, up: g.position.clone().normalize() }
  }
  const raw: { f: number; way: THREE.Vector3; turn: number; height: number; up: THREE.Vector3; inMove: boolean }[] = []
  for (let k = from * rate; k < to * rate; k++) {
    const p = eye(k)
    const q = eye(k + 1)
    const f = k / rate
    raw.push({ f, way: q.ground.clone().sub(p.ground).multiplyScalar(rate), turn: deg(p.quaternion.angleTo(q.quaternion)) * rate, height: (p.height + q.height) / 2, up: p.up, inMove: kind === 'rise' ? f >= at - 1e-9 : f + 1 / rate <= at + 1e-9 })
  }
  // The surface view where it meets the move: its 2 film frames next to the seam, every step wholly inside it.
  const near = raw.filter((r) => !r.inMove && (kind === 'rise' ? r.f >= at - 2 - 1e-9 && r.f + 1 / rate <= at + 1e-9 : r.f >= at - 1e-9 && r.f + 1 / rate <= at + 2 + 1e-9))
  const own = near.reduce((s, r) => s + r.way.length() / r.height, 0) / Math.max(near.length, 1)
  const way = near.reduce((s, r) => s.add(r.way), new THREE.Vector3())
  const still = !(own > 1e-9) || way.length() < 1e-15
  const dir = still ? new THREE.Vector3() : way.normalize()
  const rows: Row[] = raw.map((r) => {
    const along = r.way.dot(dir)
    const up = r.way.dot(r.up)
    const rest = r.way.clone().addScaledVector(dir, -along)
    const across = Math.sqrt(Math.max(rest.lengthSq() - Math.pow(rest.dot(r.up), 2), 0))
    const unit = still ? 1 : own * r.height
    return { f: r.f, speed: r.way.length() / r.height, along: along / unit, up: up / unit, across: across / unit, turn: r.turn, height: r.height, inMove: r.inMove }
  })
  const move = rows.filter((r) => r.inMove)
  const view = rows.filter((r) => !r.inMove)
  let low = move[0]!
  for (const r of move) if (r.speed < low.speed) low = r
  // Where the eye's way along the surface view's own passes 0: in a rise the first step that goes against it, in a dive the last.
  const against = move.filter((r) => r.along < 0)
  const back = against.length ? (kind === 'rise' ? against[0]! : against[against.length - 1]!) : null
  let step = 0
  let stepAt = view[0]?.f ?? at
  for (let i = rate; i < view.length; i++) {
    const d = Math.abs(view[i]!.speed - view[i - rate]!.speed)
    if (d > step) {
      step = d
      stepAt = view[i]!.f
    }
  }
  const h = handoverOf(stop, kind)
  const over = (x: number): string => (still ? x.toFixed(5) + ' of its height' : (x / own).toFixed(3))
  const out: string[] = []
  out.push(
    stop + ' ' + kind + ', seam ' + at + (plan.engineMove ? ' (the one move)' : ' (its own path)') + ': the surface view flies ' + own.toFixed(5) + ' of its height a film frame' +
      (still ? ', it stands still, so the numbers are shares of the height' : '') +
      ' | lowest ' + over(low.speed) + ' at ' + label(low.f) +
      ' | ' + (back ? 'goes against the surface view\'s way ' + (kind === 'rise' ? 'from ' : 'until ') + label(back.f) + ' with ' + over(back.speed) : 'never against the surface view\'s way') +
      ' | surface view, largest step a film frame ' + over(step) + ' at ' + label(stepAt) +
      (h ? ' | change of view at ' + label(Math.round((h.time * config.fps - shutterMid()) * rate) / rate) : ''),
  )
  if (kind === 'rise' && plan.engineMove) out.push(advice(plan))
  if (a.rows === 'true') {
    out.push('  frame        speed/height   over own   along      up     across   turn deg   height')
    for (const r of rows) out.push('  ' + label(r.f).padEnd(12) + ' ' + r.speed.toFixed(5).padStart(10) + ' ' + (still ? '' : (r.speed / own).toFixed(3)).padStart(10) + ' ' + r.along.toFixed(3).padStart(8) + ' ' + r.up.toFixed(3).padStart(8) + ' ' + r.across.toFixed(3).padStart(8) + ' ' + r.turn.toFixed(4).padStart(9) + '   ' + r.height.toExponential(3) + (r.inMove ? '' : '  surface view'))
  }
  return out
}

const stops = a.stop ? [a.stop] : plans.filter((p) => p.handsOver).map((p) => p.id)
const kinds: Kind[] = a.kind === 'dive' || a.kind === 'rise' ? [a.kind] : ['dive', 'rise']
let any = false
for (const stop of stops) {
  const plan = plans.find((p) => p.id === stop)
  if (!plan) {
    console.error('seam: no stop ' + stop)
    process.exit(2)
  }
  for (const kind of kinds) {
    if (!plan.seg[kind] || !plan.handsOver) continue
    any = true
    for (const line of seam(stop, kind)) console.log(line)
  }
}
if (!any) {
  console.error('seam: --stop must be a stop with a dive or a rise')
  process.exit(2)
}
