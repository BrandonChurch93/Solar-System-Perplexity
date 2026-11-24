import * as THREE from 'three'
import { config, type Segment } from '../../config'
import type { Pose } from '../../core/types'
import type { HandoverParams, SkyShares } from '../../director/handover'
import { StopPlan, type Fit, type MoveParams } from '../../director/moves'
import { smooth } from '../../director/rig'
import deck from './deck.json'
import fields from './deck-fields.json'
import fit from './fit.json'
import place from './place.json'
import relief from './relief.json'

export const params: MoveParams = {
  hold: { orbitDeg: 3, axis: [0.25, 1, 0], push: -0.03 },
  spot: { x: 0.405, y: 0.605 },
  dive: { headingDeg: 80, altitude: 0.045, back: 0.08, ahead: 0.15, bow: 0.24, rollDeg: 4, swoop: true, surge: { glide: 0.1, rise: 8, fall: 0.8 } },
  terrain: { vfov: 64, horizonDeg: 17.72, dipDeg: 4.44, rollDeg: 17.09, gather: -0.1, forward: 1.0, rise: 0.22, side: -1.0, yawDeg: -5, pitchDeg: -5, entryHeight: 0.5, entryBack: 0.1, entryPitchDeg: 6, exitHeight: 2.5, exitForward: -0.15, exitPitchDeg: 9 },
  rise: { azimuthDeg: 44, elevationDeg: -12, distance: 5.6, offset: [0.34, 0.1], driftSpeed: 0.08, rollDeg: -6, ahead: 0.03, hug: 1.7, settle: 2, tilt: 0.5 },
  travel: { turnDeg: 74, side: 1 },
  arrive: { swingDeg: 46, axis: [0.2, 1, 0], power: 2.9, offset: [0.7, -0.15] },
  skyAim: { terrain: [0, -21.8, 31] },
  light: { exposure: 1, skyExposure: 0.5, terrainSkyGlow: 0.35, skyLow: [0.045, 1.0, 0], sunRadiusDeg: 0.5, sunGlare: 0.75, flare: 0.18 },
  cover: [0.42, 0.34, 0.26],
  handover: place.handover as unknown as HandoverParams,
  spinDegPerSecond: 1.6,
  moonDegPerSecond: 2.6,
  tint: [0.9, 0.75, 0.55],
}

const up0 = new THREE.Vector3().fromArray(relief.nadir).negate()
const centre = up0.clone().multiplyScalar(-(relief.radius + 1))
const ahead0 = new THREE.Vector3().fromArray(fields.chart.ey).addScaledVector(up0, -new THREE.Vector3().fromArray(fields.chart.ey).dot(up0)).normalize()
const left0 = new THREE.Vector3().crossVectors(up0, ahead0)
const chartOrigin = new THREE.Vector3().fromArray(fields.chart.origin)
const s = place.solved.toSurface as number[][]
const toSurface = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().set(s[0]![0]!, s[0]![1]!, s[0]![2]!, 0, s[1]![0]!, s[1]![1]!, s[1]![2]!, 0, s[2]![0]!, s[2]![1]!, s[2]![2]!, 0, 0, 0, 0, 1))
const toGlobe = new THREE.Quaternion().fromArray(fit.globe.quaternion).multiply(toSurface)

const chartEx = new THREE.Vector3().fromArray(fields.chart.ex)
const chartEy = new THREE.Vector3().fromArray(fields.chart.ey)
const chartEn = new THREE.Vector3().fromArray(fields.chart.en)

export function chartEye(turn: THREE.Quaternion, position: THREE.Vector3, eye: THREE.Vector3): void {
  const p = position.clone().applyQuaternion(turn.clone().multiply(toGlobe).invert()).multiplyScalar(relief.radius).add(centre).sub(chartOrigin)
  eye.set(p.dot(chartEx), p.dot(chartEy), p.dot(chartEn))
}

export function chartAxes(turn: THREE.Quaternion, quaternion: THREE.Quaternion, axes: THREE.Matrix3): void {
  const q = turn.clone().multiply(toGlobe).invert().multiply(quaternion)
  const x = new THREE.Vector3(1, 0, 0).applyQuaternion(q)
  const y = new THREE.Vector3(0, 1, 0).applyQuaternion(q)
  const z = new THREE.Vector3(0, 0, 1).applyQuaternion(q)
  axes.set(x.dot(chartEx), y.dot(chartEx), z.dot(chartEx), x.dot(chartEy), y.dot(chartEy), z.dot(chartEy), x.dot(chartEn), y.dot(chartEn), z.dot(chartEn))
}

export function low(height: number, range: number[]): number {
  return 1 - smooth(Math.log(Math.max(height, 1e-9) / range[0]!) / Math.log(range[1]! / range[0]!))
}

export function lowEven(height: number, range: number[], round: number): number {
  const x = Math.min(Math.max(Math.log(Math.max(height, 1e-9) / range[0]!) / Math.log(range[1]! / range[0]!), 0), 1)
  if (x < round) return 1 - x * x / (2 * round * (1 - round))
  if (x > 1 - round) return (1 - x) * (1 - x) / (2 * round * (1 - round))
  return 1 - (x - round / 2) / (1 - round)
}

export function closeHeight(position: THREE.Vector3): number {
  return (position.distanceTo(centre) - relief.radius) / relief.radius
}

function hermite(x: number, from: number, to: number, slopeFrom: number, slopeTo: number): number {
  const x2 = x * x
  const x3 = x2 * x
  return (2 * x3 - 3 * x2 + 1) * from + (x3 - 2 * x2 + x) * slopeFrom + (-2 * x3 + 3 * x2) * to + (x3 - x2) * slopeTo
}

function eased(seconds: number): number {
  const e = deck.flight.ease
  const end = deck.flight.seconds / 2
  return seconds <= 0 ? 0 : hermite(seconds / end, 0, e.units, 0, e.unitsPerSecond * end)
}

function pushed(seconds: number): number {
  const f = deck.flight
  const run = (u: number): number => f.seconds * (f.startUnitsPerSecond * u + (f.endUnitsPerSecond - f.startUnitsPerSecond) * Math.pow(Math.max(u, 0), f.power + 1) / (f.power + 1))
  return run(seconds / f.seconds + 0.5) - run(0.5) - eased(seconds)
}

interface Bend { from: number; step: number; at: Float64Array; rate: Float64Array }

function bendOf(): Bend {
  const f = deck.flight
  const b = f.bend
  const half = config.shutterFraction / (2 * config.fps)
  const from = half
  const end = f.seconds / 2 - half
  const lens = new THREE.Vector3(0, 0, 1)
  const way = Math.atan2(lens.dot(left0), lens.dot(ahead0))
  const heading = b.through * way < 0 ? way + b.through * 2 * Math.PI : way
  const climb = Math.asin(lens.dot(up0))
  const tiny = half / 64
  const speedFrom = (pushed(from) - pushed(from - tiny)) / tiny
  const rateAt = (t: number, lift: number, out: number[]): void => {
    const x = Math.min(Math.max((t - from) / (end - from), 0), 1)
    const w = smooth(x)
    const a = heading * w
    const c = climb * Math.pow(w, b.climbPower)
    const speed = (speedFrom + (b.endPerSecond - speedFrom) * x) * (1 + lift)
    out[0] = speed * Math.cos(c) * Math.cos(a)
    out[1] = speed * Math.cos(c) * Math.sin(a)
    out[2] = speed * Math.sin(c)
  }
  const n = Math.ceil((end - from + b.beyondSeconds) * b.stepsPerSecond)
  const step = (end - from + b.beyondSeconds) / n
  const at = new Float64Array(3 * (n + 1))
  const rate = new Float64Array(3 * (n + 1))
  const p = [pushed(from), 0, 0]
  const k1 = [0, 0, 0]
  const k2 = [0, 0, 0]
  const k3 = [0, 0, 0]
  const k4 = [0, 0, 0]
  for (let i = 0; i <= n; i++) {
    const t = from + i * step
    rateAt(t, p[2]!, k1)
    for (let j = 0; j < 3; j++) {
      at[3 * i + j] = p[j]!
      rate[3 * i + j] = k1[j]!
    }
    rateAt(t + step / 2, p[2]! + (step / 2) * k1[2]!, k2)
    rateAt(t + step / 2, p[2]! + (step / 2) * k2[2]!, k3)
    rateAt(t + step, p[2]! + step * k3[2]!, k4)
    for (let j = 0; j < 3; j++) p[j] = p[j]! + (step / 6) * (k1[j]! + 2 * k2[j]! + 2 * k3[j]! + k4[j]!)
  }
  return { from, step, at, rate }
}

const bend = bendOf()

function bent(seconds: number, axis: number): number {
  const n = bend.at.length / 3 - 1
  const u = Math.min(Math.max((seconds - bend.from) / bend.step, 0), n)
  const i = Math.min(Math.floor(u), n - 1)
  return hermite(u - i, bend.at[3 * i + axis]!, bend.at[3 * i + 3 + axis]!, bend.rate[3 * i + axis]! * bend.step, bend.rate[3 * i + 3 + axis]! * bend.step)
}

export function flight(seconds: number, vfov: number): Pose {
  const f = deck.flight
  const turned = seconds > bend.from
  const along = turned ? bent(seconds, 0) : pushed(seconds)
  const behind = turned ? 0 : Math.max(-along, 0) / -pushed(-f.seconds / 2)
  const high = relief.radius + 1 + f.startAbove * Math.pow(behind, f.sinkPower) + (turned ? bent(seconds, 2) : 0)
  const up = up0.clone().multiplyScalar(relief.radius + 1).addScaledVector(ahead0, along)
  if (turned) up.addScaledVector(left0, bent(seconds, 1))
  up.normalize()
  const position = centre.clone().addScaledVector(up, high)
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up0, up)
  return { position, quaternion, vfov }
}

export function stormTurn(seconds: number): number {
  const s = deck.life.storm
  const bound = THREE.MathUtils.degToRad(s.boundDeg)
  return bound * Math.tanh(THREE.MathUtils.degToRad(s.degPerSecond) * (seconds - config.shutterFraction / (2 * config.fps)) / bound)
}

export function eddyTurn(eddy: number, seconds: number): number {
  const e = deck.life.eddies[eddy]!
  const bound = THREE.MathUtils.degToRad(e.boundDeg)
  return bound * Math.tanh(THREE.MathUtils.degToRad(e.degPerSecond) * (seconds - config.shutterFraction / (2 * config.fps)) / bound)
}

export function ringTurn(ring: number, seconds: number): number {
  const r = deck.life.storm.rings[ring]!
  const bound = THREE.MathUtils.degToRad(r.boundDeg)
  return bound * Math.tanh(THREE.MathUtils.degToRad(r.degPerSecond) * (seconds - config.shutterFraction / (2 * config.fps)) / bound)
}

export function hazeDrift(band: number, seconds: number): number {
  return deck.life.haze.bands[band]!.unitsPerSecond * (seconds - config.shutterFraction / (2 * config.fps))
}

export function flashNow(site: number, seconds: number): number {
  const f = deck.life.flash
  let sum = 0
  for (const [at, strength] of f.sites[site]!.events as number[][]) {
    const u = (seconds - config.shutterFraction / (2 * config.fps) - at!) / f.riseSeconds
    if (u > 0) sum += strength! * u * Math.exp(1 - u)
  }
  return f.gain * sum
}

interface Pace { film: number[]; path: number[]; slope: number[] }

function paceOf(knots: number[][], end = 1): Pace {
  const film = knots.map((k) => k[0]!)
  const path = knots.map((k) => k[1]!)
  const n = film.length
  const rate: number[] = []
  for (let i = 0; i < n - 1; i++) rate.push((path[i + 1]! - path[i]!) / (film[i + 1]! - film[i]!))
  const slope = new Array<number>(n).fill(end)
  for (let i = 1; i < n - 1; i++) slope[i] = rate[i - 1]! * rate[i]! <= 0 ? 0 : (2 * rate[i - 1]! * rate[i]!) / (rate[i - 1]! + rate[i]!)
  for (let i = 0; i < n - 1; i++) {
    if (rate[i] === 0) continue
    const a = slope[i]! / rate[i]!
    const b = slope[i + 1]! / rate[i]!
    const size = Math.hypot(a, b)
    if (size > 3) {
      slope[i] = (3 * a * rate[i]!) / size
      slope[i + 1] = (3 * b * rate[i]!) / size
    }
  }
  return { film, path, slope }
}

function along(p: Pace, seconds: number): number {
  const n = p.film.length
  let i = 0
  while (i < n - 2 && seconds > p.film[i + 1]!) i++
  const span = p.film[i + 1]! - p.film[i]!
  return hermite((seconds - p.film[i]!) / span, p.path[i]!, p.path[i + 1]!, span * p.slope[i]!, span * p.slope[i + 1]!)
}

const stops = paceOf(deck.flight.exposureStops, 0)

export function exposure(seconds: number): number {
  const n = stops.film.length
  return Math.pow(2, seconds <= stops.film[0]! ? stops.path[0]! : seconds >= stops.film[n - 1]! ? stops.path[n - 1]! : along(stops, seconds))
}

export function exposed(seconds: number): number {
  return exposure(deck.life.proof.cameraHeld ? 0 : seconds)
}

export function heightTable(knots: number[][]): (height: number) => number {
  const p = paceOf(knots.map((k) => [Math.log(k[0]!), k[1]!]), 0)
  const n = p.film.length
  return (height) => {
    const x = Math.log(Math.max(height, 1e-9))
    return x <= p.film[0]! ? p.path[0]! : x >= p.film[n - 1]! ? p.path[n - 1]! : along(p, x)
  }
}

export class JupiterPlan extends StopPlan {
  override spin(time: number): number {
    const dive = this.seg.dive!
    const land = this.seg.terrain
    const rise = this.seg.rise
    if (time <= dive.start || time >= rise.end) return super.spin(time)
    const rate = THREE.MathUtils.degToRad(this.p.spinDegPerSecond)
    const still = super.spin((land.start + land.end) / 2)
    if (time < land.start) return hermite((time - dive.start) / (land.start - dive.start), super.spin(dive.start), still, rate * (land.start - dive.start), 0)
    if (time > land.end) return hermite((time - land.end) / (rise.end - land.end), still, super.spin(rise.end), 0, rate * (rise.end - land.end))
    return still
  }

  override turn(time: number): THREE.Quaternion {
    return new THREE.Quaternion().setFromAxisAngle(this.axis, this.spin(time))
  }

  override terrain(tRel: number): Pose {
    const dur = this.seg.terrain.end - this.seg.terrain.start
    return flight(deck.life.proof.cameraHeld ? 0 : tRel - dur / 2 - config.shutterFraction / (2 * config.fps), this.p.terrain.vfov)
  }

  override twin(local: Pose, time: number): Pose {
    const q = this.turn(time).multiply(toGlobe)
    return { position: local.position.clone().sub(centre).multiplyScalar(1 / relief.radius).applyQuaternion(q), quaternion: q.clone().multiply(local.quaternion), vfov: local.vfov }
  }

  override skyShare(seg: Segment, time: number): SkyShares | null {
    if (seg.kind !== 'dive' && seg.kind !== 'rise') return super.skyShare(seg, time)
    return { low: low(this.eyeHeight(time), place.scene.sky) }
  }

  override skyCarryShare(seg: Segment, time: number): number | null {
    if (seg.kind !== 'dive' && seg.kind !== 'rise') return super.skyCarryShare(seg, time)
    return low(this.eyeHeight(time), place.scene.skyTurn)
  }

  override skyTurnShare(seg: Segment, time: number): number | null {
    if (seg.kind !== 'dive' && seg.kind !== 'rise') return super.skyTurnShare(seg, time)
    return low(this.eyeHeight(time), place.scene.skyTurn)
  }
}

export const plan: StopPlan = new JupiterPlan('jupiter', fit as Fit, params)
