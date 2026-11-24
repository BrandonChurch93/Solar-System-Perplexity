import * as THREE from 'three'
import { args } from './lib/common'
import { config } from '../src/config'
import { FilmDirector } from '../src/director/film'
import { forceOneMove } from '../src/director/handover'
import { plans } from '../src/director/plans'
import { eyeOf } from './lib/pace'
import { AT_SPEED, farEndOf, seamOf, type SeamKind } from './lib/seam'
import { SEAM_REACH } from './smooth/camera'
import { position } from './smooth/path'

// The seam between a surface view and its dive or its rise, read on the eye itself (ruling d196): across the seam the eye's speed over
// its own height may not dip and the eye may not stop and go back the way it came.
//   npx tsx tools/seam.ts [--stop ID] [--kind dive|rise] [--rate N] [--frames N] [--before N] [--rows] [--force]
// The eye is the film's own camera as a camera at the unit sphere of the stop, read as the judge reads it (tools/lib/seam.ts on
// tools/smooth/camera.ts, carriedCamera at the capture rate: the close view through the twin, the globe as it stands), taken in the
// frame the ground itself stands in, so what is counted is its way over the ground. From one capture frame to the next: the length of
// that way a film frame over the height of the eye above the ground (the unit sphere, or the plane of the rings where the place lies
// on them, as the judge takes it). That number is the share of its own height the eye flies in a film frame, and so the speed at which
// the near ground runs through the picture. A step carries the name of the frame it ends on, as in the judge's report.
// One line a seam:
//   the surface view's own number where it meets the move (the mean of its 2 film frames next to the seam);
//   the lowest of the move's first (rise) or last (dive) --frames film frames (16) over that, and its frame: 1 is no dent;
//   where the part of the eye's way along the surface view's own way at the seam passes 0 inside those frames, and the speed it has
//   there over the surface view's: a small number is an eye that stops and turns back, a large one is a bend at speed;
//   the largest step of the number from one film frame to the next inside the surface view's --before film frames (the bend of a
//   surface view must not lose speed either) and the frame of the change of view;
//   the judge's own eye line (npm run smooth, the path part: 16 film frames to each side of the seam, so the surface view's side
//   counts too, at the rate of the harness) against smooth.path.minEye, GREEN or RED. With --frames 16 and --rate at the rate of the
//   harness the lowest of this tool is the judge's lowest inside the move (tests/seam.test.ts).
//   --rows    every capture frame: speed over height, the same over the surface view's, its parts along the surface view's way, up and
//             across (all over the surface view's speed), the turn of the lens in degrees a film frame, the height.
//   --before  film frames of the surface view shown and read before a rise or after a dive (3; give the length of your bend).
//   --rate    capture frames a film frame (2).
//   --force   fly the stop on the engine's one move whatever handover.ownPath says.
// Under the line of a rise on the one move: the way the move alone takes the eye out of the seam, and the terrain.bend that ends on it.
// For a stop that bends its surface view by its own code (no terrain.bend in its params) that line is read at the seam, on the way the
// surface view has there after its bend: the degrees it names are what is left to turn.
// Under a rise that a travel follows, two lines on its far end (MAIL 602: a rise and the travel after it are one flight, the picture
// may not come to rest between them), read by tools/lib/seam.ts farEndOf:
//   as the travel reads it: how far the rise's own last pose lies from the pose the travel starts on; the eye's speed at the end, its
//   excess over the drift and the angle of that excess to the drift's line; whether the travel carries the excess; whether the eye
//   brakes or speeds up there (it may brake or coast, it may not speed up) and its acceleration across its way; the turn of the
//   camera and the change of its angle of view (both at rest);
//   as the judge reads the picture (the rest line of npm run smooth, at its rate and reach): the fastest point of the body's edge in
//   pixels a film frame, its lowest against its two ends; and the body's centre: where it is slowest, how far its way turns through
//   the window, and the sharpest turn between two capture frames that both have speed. A turn at speed is a bend the eye sees.
// A stop asks for a far end that is not at rest with handover.rise.pullBack of its params (StopPlan.pullBack).
// Nothing is written and nothing is judged here: the judge is npm run smooth, whose eye line this prints.

type Kind = SeamKind

const a = args()
if (a.force === 'true') forceOneMove(true)
const rate = Math.max(1, Math.round(Number(a.rate ?? 2)))
const frames = Number(a.frames ?? SEAM_REACH)
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

// The judge's own eye line: the lowest speed of the eye over the surface view's own, SEAM_REACH film frames to each side of the seam.
function judged(plan: (typeof plans)[number], kind: Kind): string {
  const e = eyeOf(film, plan, kind, rate)
  if (!e || !e.lowest) return 'the judge reads no eye here' + (e && !(e.own !== null && e.own > 1e-12) ? ' (the surface view stands still)' : '')
  const low = e.lowest
  const inside = e.inMove && e.inMove.k !== low.k ? ' (inside the move ' + e.inMove.value.toFixed(3) + ' at ' + position(e.inMove.k, rate) + ')' : ''
  return 'the judge, ' + SEAM_REACH + ' film frames to each side: lowest ' + low.value.toFixed(3) + ' at ' + position(low.k, rate) + inside + (e.limit === null ? ', no limit set' : ', at least ' + e.limit + ': ' + (e.fault ? 'RED' : 'GREEN'))
}

// The far end of a rise that a travel follows: the travel's reading and the picture's (tools/lib/seam.ts farEndOf).
function farEnd(plan: (typeof plans)[number]): string[] {
  const r = farEndOf(film, plan, { rate })
  if (!r) return []
  const at = (x: { value: number; f: number } | null): string => (x ? x.value.toFixed(2) + ' at ' + label(x.f) : 'not read')
  const pull = plan.p.handover?.rise?.pullBack
  const out = [
    '  far end, seam ' + r.seam + ' into the travel' + (pull ? ', pullBack ' + JSON.stringify(pull) : ', no pullBack') + ', as the travel reads it (step 1/' + Math.round(1 / r.step) + ' s' + (r.carryKnown ? '' : ', the numbers agreed with its builder: this tree has no CARRY') + '): the rise ends ' + r.gap.toExponential(1) + ' radii from the pose the travel starts on, ' + r.height.toFixed(3) + ' over the body' +
      ' | the eye flies ' + r.speed.toFixed(4) + ' radii a second, ' + r.excess.toFixed(4) + ' over the drift (' + r.drift.toFixed(4) + ')' + (r.offLine === null ? '' : ', ' + r.offLine.toFixed(2) + ' degrees off its line') + ': ' + (r.carried ? 'the travel carries it' : 'at rest on the drift, nothing to carry') + ' (from ' + r.from + ')' +
      ' | ' + (Math.abs(r.along) < 1e-6 ? 'coasts' : r.along < 0 ? 'brakes by ' + (-r.along).toFixed(3) : (r.carried ? 'SPEEDS UP by ' : 'speeds up by ') + r.along.toFixed(3)) + ' radii/s2 along its way, ' + r.across.toFixed(3) + ' across' +
      ' | camera: turn ' + r.turn.toFixed(4) + ' deg/s, angle of view ' + r.vfov.toFixed(4) + ' deg/s',
  ]
  out.push(
    '  the picture, ' + r.rest.reach + ' film frames to each side at rate ' + r.rest.rate + ' (the rest line of the judge): the fastest point of the body\'s edge, px a film frame: lowest ' + at(r.rest.lowest) + ', ' + at(r.rest.first) + ' and ' + at(r.rest.last) + ' at the ends' + (r.rest.over === null ? '' : ': the lowest is ' + r.rest.over.toFixed(3) + ' of the slower end') +
      (r.centre ? ' | the body\'s centre: slowest ' + at(r.centre.slowest) + (r.centre.turned === null ? '' : ', its way turns ' + r.centre.turned.toFixed(1) + ' degrees from the first step to the last') + ', sharpest turn between two capture frames at speed (' + AT_SPEED + ' px a film frame and more): ' + (r.centre.sharpest ? r.centre.sharpest.value.toFixed(1) + ' degrees at ' + label(r.centre.sharpest.f) + ', where it moves ' + r.centre.sharpest.speed.toFixed(2) : 'none at speed') : ''),
  )
  if (r.asked !== null && r.reached === false)
    out.push('  THE PULL BACK DOES NOT REACH THIS RISE: it states ' + r.asked + ' radii a second over the drift and the travel reads ' + r.excess.toFixed(4) + '. The path of this rise does not follow the far end the engine moves through its last moments: let it end on after(time) with the far end\'s own speed, not on exitPose(time) and not on a law that reads the far end only for its place.')
  return out
}

function seam(stop: string, kind: Kind): string[] {
  const plan = plans.find((p) => p.id === stop)!
  const r = seamOf(film, plan, kind, { rate, frames, before })!
  const shown = (x: number): string => (r.still ? x.toFixed(5) + ' of its height' : x.toFixed(3))
  const out: string[] = []
  out.push(
    stop + ' ' + kind + ', seam ' + r.seam + (r.oneMove ? ' (the one move)' : ' (its own path)') + (r.onRings ? ', height above the plane of the rings' : '') + ': the surface view flies ' + r.own.toFixed(5) + ' of its height a film frame' +
      (r.still ? ', it stands still, so the numbers are shares of the height' : '') +
      ' | lowest ' + shown(r.lowest.over) + ' at ' + label(r.lowest.f) +
      ' | ' + (r.back ? 'goes against the surface view\'s way ' + (kind === 'rise' ? 'from ' : 'until ') + label(r.back.f) + ' with ' + shown(r.back.over) : 'never against the surface view\'s way') +
      ' | surface view, largest step a film frame ' + shown(r.viewStep.value) + ' at ' + label(r.viewStep.f) +
      (r.changeOfView !== null ? ' | change of view at ' + label(r.changeOfView) : '') +
      ' | ' + judged(plan, kind),
  )
  if (kind === 'rise' && plan.engineMove) out.push(advice(plan))
  if (kind === 'rise') out.push(...farEnd(plan))
  if (a.rows === 'true') {
    out.push('  frame        speed/height   over own   along      up     across   turn deg   height')
    for (const row of r.rows) out.push('  ' + label(row.f).padEnd(12) + ' ' + row.speed.toFixed(5).padStart(10) + ' ' + (r.still ? '' : (row.speed / r.own).toFixed(3)).padStart(10) + ' ' + row.along.toFixed(3).padStart(8) + ' ' + row.up.toFixed(3).padStart(8) + ' ' + row.across.toFixed(3).padStart(8) + ' ' + row.turn.toFixed(4).padStart(9) + '   ' + row.height.toExponential(3) + (row.inMove ? '' : '  surface view'))
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
