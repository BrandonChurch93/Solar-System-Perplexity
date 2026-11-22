import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import { inFrame, TRAVEL } from '../../src/space/travel/path'

const fmt = config.formats[config.formatKeys.master]!
const aspect = fmt.width / fmt.height
const DEG = 180 / Math.PI
const LIMIT = 0.0015 * fmt.height
const WINDOW = 33
export const PEAK: Record<string, number> = { sun: 1, mercury: 3, venus: 4, earth: 4.5, mars: 4.5, jupiter: 3, saturn: 3, uranus: 4 }

export interface Frame { f: number; px: number; turn: number; light: number; seen: boolean; inside: boolean }
export interface Row { id: string; first: number; frames: Frame[]; peak: number; leave: number; leaveAt: number; lit: number; over: number; limb: number; limbAt: number; last3: number; falls: number; grow: number; jerk: number; t60: number; t250: number; f60: number; f250: number; sweep: number; shares: number[] }

export function measure(id: string, look: object = {}): Row {
  const keep = TRAVEL[id]
  TRAVEL[id] = { ...keep, ...look }
  const d = new FilmDirector(plans)
  TRAVEL[id] = keep
  const i = plans.findIndex((p) => p.id === id)
  const seg = config.segments.find((s) => s.id === id + '.travel')!
  const at = (f: number) => d.shotAt(f, (f + 0.25) / config.fps)
  const frames: Frame[] = []
  let s = at(seg.firstFrame)
  for (let f = seg.firstFrame; f <= seg.endFrame; f++) {
    const t = at(f + 1)
    const lead = s.sets[0]!
    const things = f < seg.endFrame ? d.leavingThings(i, s.time) : []
    const cam = things.length ? things[0]!.to.clone().negate().add(lead.origin) : lead.origin
    const seen = f < seg.endFrame && lead.weight > 0 && s.sets.length > 1 && things.some((x) => inFrame(s.camera.quaternion, s.camera.vfov, aspect, x.to.clone().add(cam).sub(s.camera.position), x.radius, 0))
    const set = s.sets[s.sets.length - 1]!
    const to = set.origin.clone().sub(s.camera.position)
    const dist = to.length()
    const ty = Math.tan(s.camera.vfov / DEG / 2)
    const px = (1 / Math.sqrt(Math.max(dist * dist - 1, 1e-9))) / ty * (fmt.height / 2)
    const v = to.applyQuaternion(s.camera.quaternion.clone().invert())
    const sx = (v.x / -v.z / (ty * aspect) * 0.5 + 0.5) * fmt.width
    const sy = (0.5 - v.y / -v.z / ty * 0.5) * fmt.height
    const inside = v.z < 0 && sx > -px && sx < fmt.width + px && sy > -px && sy < fmt.height + px
    frames.push({ f, px, turn: s.camera.quaternion.angleTo(t.camera.quaternion) * DEG, light: s.farLight ?? 1, seen, inside })
    s = t
  }
  const hold = frames[frames.length - 1]!
  const row: Row = { id, first: seg.firstFrame, frames, peak: 0, leave: 0, leaveAt: 0, lit: -1, over: -1, limb: 0, limbAt: 0, last3: 0, falls: 0, grow: 0, jerk: 0, t60: 0, t250: 0, f60: -1, f250: -1, sweep: 0, shares: [] }
  frames.forEach((a, k) => {
    const n = k
    const b = frames[k - 1]
    if (k === frames.length - 1) return
    row.peak = Math.max(row.peak, a.turn)
    if (b) row.jerk = Math.max(row.jerk, Math.abs(a.turn - b.turn))
    if (a.seen) { row.leave = a.turn; row.leaveAt = n }
    if (a.light > 0 && a.inside && row.lit < 0) row.lit = n
    if (a.px > LIMIT && row.over < 0) row.over = n
    if (a.px > 60) { if (row.f60 < 0) row.f60 = n; row.t60 = Math.max(row.t60, a.turn) }
    if (a.px > 250) { if (row.f250 < 0) row.f250 = n; row.t250 = Math.max(row.t250, a.turn) }
    row.sweep += a.turn * Math.min(a.px / hold.px, 1)
    const next = frames[k + 1]!
    if (a.inside && next.px - a.px > row.limb) { row.limb = next.px - a.px; row.limbAt = a.f + 1 }
    if (next.px < a.px - 1e-6 && a.px > LIMIT && a.light > 0 && a.inside) row.falls++
    if (a.px > LIMIT && a.inside) row.grow = Math.max(row.grow, (next.px / a.px - 1) * 100)
    if (k >= frames.length - 4) row.last3 = Math.max(row.last3, (next.px / a.px - 1) * 100)
  })
  const start = frames.length - 1 - WINDOW
  row.shares = [0.1, 0.5, 0.9].map((w) => {
    const at = start + w * WINDOW
    const k = Math.floor(at)
    return (frames[k]!.px + (frames[Math.min(k + 1, frames.length - 1)]!.px - frames[k]!.px) * (at - k)) / hold.px
  })
  return row
}

export const show = (r: Row): string =>
  `${r.id}.travel | point lit from ${r.first + r.lit} (${r.frames.length - 1 - r.lit} frames before the hold) | over 1.62 px from ${r.first + r.over} | share of the full size 10, 50, 90 percent into the last ${WINDOW} frames: ${r.shares.map((x) => (x * 100).toFixed(1)).join(', ')} | largest limb step ${r.limb.toFixed(1)} px at ${r.limbAt} | growth in the last three frames ${r.last3.toFixed(2)}% | frames where it shrinks ${r.falls} | peak turn ${r.peak.toFixed(2)} | turn at the last frame the leaving body is in frame (${r.first + r.leaveAt}) ${r.leave.toFixed(2)} | turn over 60 px (from ${r.first + r.f60}) ${r.t60.toFixed(2)}, over 250 px (from ${r.first + r.f250}) ${r.t250.toFixed(2)} | largest change of turn rate ${r.jerk.toFixed(2)}`

export const probe = (r: Row): string => {
  const lines = [`${r.id}.travel: frame, diameter px, limb step px, growth percent, far light, turn degrees a frame`]
  r.frames.forEach((a, k) => {
    if (k < r.frames.length - 1 - 40 || k === 0) return
    const b = r.frames[k - 1]!
    lines.push(`${a.f} ${(2 * a.px).toFixed(1)} ${(a.px - b.px).toFixed(1)} ${((a.px / b.px - 1) * 100).toFixed(1)} ${a.light.toFixed(2)} ${a.turn.toFixed(2)}${a.inside ? '' : ' out of frame'}`)
  })
  return lines.join('\n')
}

const doc = (): string => {
  const ids = Object.keys(PEAK)
  const out: string[] = ['# Steady growth: probe table', '', 'Made by `npx tsx assets-src/travel/grow.ts doc`. Shot values in the 1920 format, sampled a quarter frame into each frame. Before is window 0 (the curve of f4472a3), after is the window in `TRAVEL`.', '', '## Rows', '']
  const before = Object.fromEntries(ids.map((id) => [id, measure(id, { window: 0 })]))
  const after = Object.fromEntries(ids.map((id) => [id, measure(id)]))
  for (const id of ids) out.push(`- before: ${show(before[id]!)}`, `- after (window ${TRAVEL[id]?.window ?? 0}): ${show(after[id]!)}`, '')
  out.push('## Diameter of the next body per frame, last 41 frames and the first frame of the hold', '')
  for (const id of ids) {
    const a = before[id]!.frames
    const b = after[id]!.frames
    out.push(`### ${id}.travel, window ${TRAVEL[id]?.window ?? 0}`, '', 'frame | diameter before px | diameter after px | limb step after px | growth after percent | far light after | turn after', '--- | --- | --- | --- | --- | --- | ---')
    for (let k = a.length - 42; k < a.length; k++) {
      const x = b[k]!
      const y = b[k - 1]!
      out.push(`${x.f} | ${(2 * a[k]!.px).toFixed(1)}${a[k]!.inside ? '' : ' out of frame'} | ${(2 * x.px).toFixed(1)}${x.inside ? '' : ' out of frame'} | ${(x.px - y.px).toFixed(1)} | ${((x.px / y.px - 1) * 100).toFixed(1)} | ${x.light.toFixed(2)} | ${x.turn.toFixed(2)}`)
    }
    out.push('')
  }
  out.push('## Turn while the body is over 60 px radius, window 33 against window 24', '')
  for (const id of ['venus', 'earth', 'uranus']) {
    const a = measure(id, { window: 33 }).frames
    const b = measure(id, { window: 24 }).frames
    out.push(`### ${id}.travel`, '', 'frame | radius px at 33 | turn at 33 | radius px at 24 | turn at 24', '--- | --- | --- | --- | ---')
    for (let k = 0; k < a.length - 1; k++) if (a[k]!.px > 60 || b[k]!.px > 60) out.push(`${a[k]!.f} | ${a[k]!.px.toFixed(0)} | ${a[k]!.turn.toFixed(2)} | ${b[k]!.px.toFixed(0)} | ${b[k]!.turn.toFixed(2)}`)
    out.push('')
  }
  out.push('## Every window from 20 to 40', '', 'travel | window | point lit, frames before the hold | over 1.62 px, frames before the hold | largest limb step px | growth in the last three frames percent | frames where it shrinks | turn over 60 px | turn over 250 px', '--- | --- | --- | --- | --- | --- | --- | --- | ---')
  for (const id of ids) {
    if (id === 'mars') continue
    for (let w = 20; w <= 40; w++) {
      const r = measure(id, { window: w })
      const n = r.frames.length - 1
      out.push(`${id} | ${w} | ${n - r.lit} | ${n - r.over} | ${r.limb.toFixed(1)} | ${r.last3.toFixed(2)} | ${r.falls} | ${r.t60.toFixed(2)} | ${r.t250.toFixed(2)}`)
    }
  }
  return out.join('\n') + '\n'
}

if (process.argv[1]?.endsWith('grow.ts')) {
  if (process.argv[2] === 'doc') { console.log(doc()); process.exit(0) }
  const over = process.env.OVER ? (JSON.parse(process.env.OVER) as Record<string, object>) : {}
  const mode = process.argv[2] ?? 'table'
  for (const id of Object.keys(PEAK)) if (!process.argv[3] || process.argv[3] === id) console.log(mode === 'probe' ? probe(measure(id, over[id] ?? {})) : show(measure(id, over[id] ?? {})))
}
