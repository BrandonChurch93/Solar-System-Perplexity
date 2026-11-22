import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import { inFrame, TRAVEL } from '../../src/space/travel/path'

const fmt = config.formats[config.formatKeys.master]!
const aspect = fmt.width / fmt.height
const DEG = 180 / Math.PI
const LIMIT = 0.0015 * fmt.height
const PEAK: Record<string, number> = { mercury: 3, venus: 4, earth: 4.5, jupiter: 3, saturn: 3, uranus: 4 }

export interface Row { id: string; peak: number; leave: number; leaveAt: number; t60: number; t250: number; grow: number; over: number; lit: number; jerk: number; f60: number; f250: number; score: number }

export function measure(id: string, look: object): Row {
  const keep = TRAVEL[id]
  TRAVEL[id] = { ...keep, ...look }
  const d = new FilmDirector(plans)
  TRAVEL[id] = keep
  const i = plans.findIndex((p) => p.id === id)
  const seg = config.segments.find((s) => s.id === id + '.travel')!
  const at = (f: number) => d.shotAt(f, (f + 0.25) / config.fps)
  const row: Row = { id, peak: 0, leave: 0, leaveAt: 0, t60: 0, t250: 0, grow: 0, over: -1, lit: -1, jerk: 0, f60: -1, f250: -1, score: 0 }
  let s = at(seg.firstFrame)
  let rate = -1
  let prev = 0
  for (let f = seg.firstFrame; f < seg.endFrame; f++) {
    const t = at(f + 1)
    const full = s.camera.quaternion.angleTo(t.camera.quaternion) * DEG
    if (rate >= 0) row.jerk = Math.max(row.jerk, Math.abs(full - rate))
    rate = full
    const lead = s.sets[0]!
    const cam = d.leavingThings(i, s.time)[0]!.to.clone().negate().add(lead.origin)
    const seen = lead.weight > 0 && s.sets.length > 1 && d.leavingThings(i, s.time).some((x) => inFrame(s.camera.quaternion, s.camera.vfov, aspect, x.to.clone().add(cam).sub(s.camera.position), x.radius, 0))
    if (seen) { row.leave = full; row.leaveAt = f - seg.firstFrame }
    const set = s.sets[s.sets.length - 1]!
    const dist = set.origin.distanceTo(s.camera.position)
    const px = (1 / Math.sqrt(Math.max(dist * dist - 1, 1e-9))) / Math.tan(s.camera.vfov / DEG / 2) * (fmt.height / 2)
    const g = prev > 0 ? (px / prev - 1) * 100 : 0
    if (px > LIMIT) { if (row.over < 0) row.over = f - seg.firstFrame; row.grow = Math.max(row.grow, g) }
    if (px > 60) { if (row.f60 < 0) row.f60 = f - seg.firstFrame; row.t60 = Math.max(row.t60, full) }
    if (px > 250) { if (row.f250 < 0) row.f250 = f - seg.firstFrame; row.t250 = Math.max(row.t250, full) }
    if ((s.farLight ?? 1) > 0 && row.lit < 0) row.lit = f - seg.firstFrame
    row.peak = Math.max(row.peak, full)
    prev = px
    s = t
  }
  row.score = Math.max(row.peak / PEAK[id]!, row.leave / 0.4, row.t60 / 1.5, row.t250 / 0.5, row.grow / 22, row.jerk / 0.35)
  return row
}

export const show = (r: Row): string => `${r.id} peak ${r.peak.toFixed(2)} | leaving body last in frame ${r.leaveAt} turn ${r.leave.toFixed(2)} | lit ${r.lit} over 1.62 px ${r.over} | 60 px from ${r.f60} turn ${r.t60.toFixed(2)} | 250 px from ${r.f250} turn ${r.t250.toFixed(2)} | growth ${r.grow.toFixed(1)}% | change ${r.jerk.toFixed(2)} | score ${r.score.toFixed(3)}`

if (process.argv[1]?.endsWith('grow.ts')) {
  const over = process.env.OVER ? (JSON.parse(process.env.OVER) as Record<string, object>) : {}
  for (const id of Object.keys(PEAK)) if (!process.argv[2] || process.argv[2] === id) console.log(show(measure(id, over[id] ?? {})))
}
