import { args, loadConfig } from './lib/common'
import { setCapture, spanMid } from '../src/core/clock'
import { FilmDirector } from '../src/director/film'
import { plumbOf } from '../src/director/moves'
import { plans } from '../src/director/plans'
import { carriedCamera } from './smooth/camera'

// The plumb of the film's camera along every dive and rise: the angle of the body's centre off the camera's upright plane (plumbOf of
// src/director/moves.ts), in degrees, at the middle of the shutter of every film frame, on the camera the picture is drawn with (the
// film's own shot, the close view carried through the twin). A ball that leans to one side in the middle of a move and comes back shows
// here as an angle that leaves the span of the first and the last frame of the segment.
//   npx tsx tools/plumb.ts [--stop ID] [--try] [--rows N]
// A line a segment: the angle at the first and the last frame, the largest and its frame, and how far it stands beyond the two ends.
//   --try   a second line with handover.KIND.path.plumb set in memory, for a side that has not asked: what the switch would give it.
//           Nothing is written, and the law of the stop is the one it has: a stop that takes the switch searches its law again
//           (tools/law.ts) and reads its path through npm run smooth.
//   --rows  every Nth frame of the segment under its line: the angle, the centre's place in the picture (half heights from the middle,
//           to the right and up; blank where the centre lies behind the camera) and the height of the eye in radii.
// It measures poses and draws nothing.

const a = args()
const cfg = loadConfig()
const every = a.rows === undefined ? 0 : Math.max(Math.round(Number(a.rows)), 1)
if (a.stop !== undefined && !cfg.segments.some((s) => s.stop === a.stop && (s.kind === 'dive' || s.kind === 'rise'))) {
  console.error('plumb: --stop must be a stop with a dive or a rise')
  process.exit(2)
}
setCapture(1)
const DEG = 180 / Math.PI

interface Row { frame: number; plumb: number; x: number; y: number; height: number }

function rowsOf(film: FilmDirector, stop: string, first: number, end: number): Row[] {
  const plan = film.plans.find((p) => p.id === stop)!
  const out: Row[] = []
  for (let f = first; f < end; f++) {
    const pose = carriedCamera(film, plan, stop, f, (f + spanMid()) / cfg.fps).pose
    const c = pose.position.clone().negate().applyQuaternion(pose.quaternion.clone().invert()).normalize()
    const lens = Math.tan((pose.vfov * Math.PI) / 360)
    out.push({ frame: f, plumb: plumbOf(pose) * DEG, x: c.z < 0 ? c.x / -c.z / lens : Number.NaN, y: c.z < 0 ? c.y / -c.z / lens : Number.NaN, height: pose.position.length() - 1 })
  }
  return out
}

function line(rows: Row[]): string {
  const first = rows[0]!
  const last = rows[rows.length - 1]!
  const lo = Math.min(first.plumb, last.plumb)
  const hi = Math.max(first.plumb, last.plumb)
  let most = first
  let beyond = 0
  let at = first.frame
  for (const r of rows) {
    if (Math.abs(r.plumb) > Math.abs(most.plumb)) most = r
    const out = Math.max(lo - r.plumb, r.plumb - hi, 0)
    if (out > beyond) {
      beyond = out
      at = r.frame
    }
  }
  return 'first ' + first.plumb.toFixed(2) + ', last ' + last.plumb.toFixed(2) + ', largest ' + most.plumb.toFixed(2) + ' at ' + most.frame + ', beyond the two ends ' + beyond.toFixed(2) + (beyond >= 0.005 ? ' at ' + at : '')
}

function print(rows: Row[]): void {
  if (!every) return
  for (const r of rows) {
    if ((r.frame - rows[0]!.frame) % every !== 0 && r !== rows[rows.length - 1]) continue
    console.log('    ' + r.frame + '  ' + r.plumb.toFixed(2) + ' deg  centre at ' + (Number.isFinite(r.x) ? r.x.toFixed(3) + ' ' + r.y.toFixed(3) : 'behind') + '  height ' + r.height.toExponential(3))
  }
}

for (const seg of cfg.segments) {
  if (seg.kind !== 'dive' && seg.kind !== 'rise') continue
  if (a.stop !== undefined && seg.stop !== a.stop) continue
  const kind = seg.kind
  const plan = plans.find((p) => p.id === seg.stop)!
  const asked = plan.handoverPath(kind).plumb === true
  const rows = rowsOf(new FilmDirector(plans), seg.stop, seg.firstFrame, seg.endFrame)
  console.log((seg.stop + ' ' + kind).padEnd(13) + ' frames ' + seg.firstFrame + ' to ' + (seg.endFrame - 1) + (plan.engineMove ? ', one move' : ', own path') + (asked ? ', path.plumb' : '') + ': ' + line(rows))
  print(rows)
  if (a.try !== 'true' || asked) continue
  const params = plan.p as { handover?: Record<string, { path?: object } | undefined> }
  const kept = params.handover
  params.handover = { ...(kept ?? {}), [kind]: { ...(kept?.[kind] ?? {}), path: { ...(kept?.[kind]?.path ?? {}), plumb: true } } }
  try {
    const tried = rowsOf(new FilmDirector(plans), seg.stop, seg.firstFrame, seg.endFrame)
    const same = tried.every((r, i) => r.plumb === rows[i]!.plumb)
    console.log('   with path.plumb: ' + (same ? 'the same poses: this path does not fly the glide that reads it' : line(tried)))
    if (!same) print(tried)
  } finally {
    params.handover = kept
  }
}
