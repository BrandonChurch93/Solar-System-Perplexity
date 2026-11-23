import * as THREE from 'three'
import { config } from '../../src/config'
import { shutterMid } from '../../src/core/sampler'
import type { Pose } from '../../src/core/types'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import { carriedCamera, curves, project, type Kind, type Sample, type Window } from '../../tools/smooth/camera'

// The seams of every travel, without a picture. Start: the judge's own speed at the place of the stop that is left (npm run smooth, part path),
// over the first REACH frames of the travel. End: the picture speed of the body that arrives (its centre and its edge) and of the sky (the turn),
// over the last REACH frames and the first frames of the hold. A step is the change of a speed from one film frame to the next, px a frame.
// The seam columns cover the judge's own span: up to 2 film frames past the first frame of the travel.
//   npx tsx assets-src/travel/seams.ts [--reach 15] [--rate 2] [--rows 1]

const arg = (name: string, d: number): number => {
  const i = process.argv.indexOf('--' + name)
  return i > 0 ? Number(process.argv[i + 1]) : d
}
const REACH = arg('reach', 15)
const RATE = arg('rate', 2)
const ROWS = arg('rows', 0)
const master = config.formats[config.formatKeys.master]!
const film = new FilmDirector(plans)
const RAD = Math.PI / 180
const ring = (config.raw.smooth?.path?.ringPx as number | undefined) ?? 96

function windowOf(stop: string, kind: Kind, first: number, end: number, rate: number): Window {
  const plan = plans.find((p) => p.id === stop)!
  const seg = config.segments.find((s) => s.stop === stop && s.kind === kind)!
  const k0 = first * rate - 1
  const samples: Sample[] = []
  for (let k = k0; k < end * rate; k++) {
    const frame = Math.floor(k / rate)
    const time = (k + shutterMid()) / (config.fps * rate)
    const c = carriedCamera(film, plan, stop, frame, time)
    samples.push({ k, frame, time, segment: c.segment, side: c.side, pose: c.pose, height: c.pose.position.length() - 1 })
  }
  return { kind, seg, rate, k0, samples, own: { first: seg.firstFrame * rate + 1, end: seg.endFrame * rate }, firstFrame: first, frames: end - first }
}

interface Track { k0: number; rate: number; v: (number | null)[] }
const at = (t: Track, k: number): number | null => t.v[k - t.k0] ?? null
function worst(t: Track, from: number, to: number): { step: number; frame: number; speed: number } {
  let out = { step: 0, frame: from, speed: 0 }
  for (let k = Math.round(from * t.rate); k <= Math.round(to * t.rate); k++) {
    const a = at(t, k)
    const b = at(t, k - t.rate)
    if (a === null || b === null) continue
    if (Math.abs(a - b) > out.step) out = { step: Math.abs(a - b), frame: k / t.rate, speed: a }
  }
  return out
}
const fmt = (w: { step: number; frame: number }): string => w.step.toFixed(2) + ' at ' + w.frame

function arriving(stop: string, first: number, end: number, rate: number): { centre: Track; edge: Track; turn: Track } {
  const plan = plans.find((p) => p.id === stop)!
  const k0 = first * rate - 1
  const poses: Pose[] = []
  for (let k = k0; k < end * rate; k++) poses.push(carriedCamera(film, plan, stop, Math.floor(k / rate), (k + shutterMid()) / (config.fps * rate)).pose)
  const centre: (number | null)[] = [null]
  const edge: (number | null)[] = [null]
  const turn: (number | null)[] = [null]
  const zero = new THREE.Vector3()
  const size = (p: Pose): number => (1 / Math.sqrt(Math.max(p.position.lengthSq() - 1, 1e-12))) * (master.height / 2 / Math.tan((p.vfov * RAD) / 2))
  for (let i = 1; i < poses.length; i++) {
    const a = project(poses[i - 1]!, zero, master.width, master.height)
    const b = project(poses[i]!, zero, master.width, master.height)
    const move = Math.hypot(b.x - a.x, b.y - a.y)
    centre.push(a.front && b.front ? move * rate : null)
    edge.push(a.front && b.front ? (move + Math.abs(size(poses[i]!) - size(poses[i - 1]!))) * rate : null)
    const focal = master.height / 2 / Math.tan((poses[i]!.vfov * RAD) / 2)
    turn.push(poses[i - 1]!.quaternion.angleTo(poses[i]!.quaternion) * focal * rate)
  }
  return { centre: { k0, rate, v: centre }, edge: { k0, rate, v: edge }, turn: { k0, rate, v: turn } }
}

const lines: string[] = []
config.stopIds.forEach((stop, i) => {
  const travel = config.segments.find((s) => s.stop === stop && s.kind === 'travel')
  const next = config.stopIds[i + 1]
  const out = travel ?? config.segments.find((s) => s.stop === config.endingId && s.kind === 'retreat')
  if (!out) return
  const rise = config.segments.find((s) => s.stop === stop && s.kind === 'rise')!
  const hasSeam = rise.endFrame === out.firstFrame
  for (const rate of RATE > 1 ? [1, RATE] : [1]) {
    const w = windowOf(stop, 'rise', out.firstFrame - 4, out.firstFrame + REACH + 1, rate)
    const c = curves(w, plans.find((p) => p.id === stop)!, master.width, master.height, ring)
    const speed: Track = { k0: w.k0, rate, v: c.speed }
    const turn: Track = { k0: w.k0, rate, v: c.turn }
    const seam = worst(speed, out.firstFrame + 1 / rate, out.firstFrame + 2)
    const start = worst(speed, out.firstFrame + 1 / rate, out.firstFrame + REACH)
    const seamTurn = worst(turn, out.firstFrame + 1 / rate, out.firstFrame + 2)
    const startTurn = worst(turn, out.firstFrame + 1 / rate, out.firstFrame + REACH)
    lines.push([out.id, 'start', 'rate ' + rate, hasSeam ? 'after rise' : 'after hold', 'speed step, frames +1 and +2: ' + fmt(seam), 'first ' + REACH + ': ' + fmt(start), 'turn step deg, +1 and +2: ' + fmt(seamTurn), 'first ' + REACH + ': ' + fmt(startTurn)].join(' | '))
    if (ROWS && rate === 1) lines.push('  speed px a frame from ' + (out.firstFrame - 2) + ': ' + Array.from({ length: REACH + 2 }, (_, j) => at(speed, out.firstFrame - 2 + j)).map((v) => (v === null ? '-' : v.toFixed(2))).join(' '))
    if (!travel || !next) continue
    const e = arriving(next, travel.endFrame - REACH - 2, travel.endFrame + 4, rate)
    const span: [number, number] = [travel.endFrame - REACH, travel.endFrame + 2]
    lines.push([out.id, 'end', 'rate ' + rate, 'into ' + next + '.hold', 'centre step, last ' + REACH + ' and 2 of the hold: ' + fmt(worst(e.centre, ...span)), 'centre and edge: ' + fmt(worst(e.edge, ...span)), 'sky (turn in px): ' + fmt(worst(e.turn, ...span)), 'at the seam itself (frames -1 to +2): centre ' + fmt(worst(e.centre, travel.endFrame - 1, travel.endFrame + 2)) + ', centre and edge ' + fmt(worst(e.edge, travel.endFrame - 1, travel.endFrame + 2)) + ', sky ' + fmt(worst(e.turn, travel.endFrame - 1, travel.endFrame + 2))].join(' | '))
    if (ROWS && rate === 1) {
      lines.push('  centre px a frame from ' + (travel.endFrame - REACH) + ': ' + Array.from({ length: REACH + 3 }, (_, j) => at(e.centre, travel.endFrame - REACH + j)).map((v) => (v === null ? '-' : v.toFixed(2))).join(' '))
      lines.push('  sky px a frame from ' + (travel.endFrame - REACH) + ': ' + Array.from({ length: REACH + 3 }, (_, j) => at(e.turn, travel.endFrame - REACH + j)).map((v) => (v === null ? '-' : v.toFixed(2))).join(' '))
    }
  }
})
console.log(lines.join('\n'))
