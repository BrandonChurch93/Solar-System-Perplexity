import { config, type Segment } from '../../config'
import * as THREE from 'three'
import { StopPlan, type Fit, type MoveParams, type OrbitShot } from '../../director/moves'
import { drift as cameraDrift } from '../../director/rig'
import { coverWindow } from '../../director/timeline'
import type { CoverHorizon, Pose } from '../../core/types'
import { place } from './assets'
import fit from './fit.json'
import moveJson from './move.json'
import { between, type MoveShape } from './path'
import placeJson from './place.json'
import reliefJson from './relief.json'

export const params: MoveParams = {
  hold: { orbitDeg: 8, axis: [-0.3, 1, 0], push: -0.03 },
  spot: { x: 0.6222, y: 0.4356 },
  dive: { headingDeg: 98.25, altitude: 0.0267, back: 0.07, ahead: 0.14, bow: -0.25, rollDeg: -7, swoop: true, surge: { glide: 0.14, rise: 60, fall: 2, swell: [0.3, 9, 1.2] } },
  terrain: { vfov: 60, horizonDeg: 10.57, dipDeg: 10.91, forward: 0.85, rise: 0.12, side: -1, yawDeg: -3, pitchDeg: 1, entryHeight: 0.7, entryBack: 0.3, entryPitchDeg: 0, entryRollDeg: -30, exitHeight: 1.6, exitForward: -0.25, exitPitchDeg: 2.2, exitDipDeg: 4.65 },
  rise: { azimuthDeg: 18, elevationDeg: 12, distance: 5.4, offset: [-0.3, 0.12], driftSpeed: 0.08, rollDeg: 6, ahead: 0.03, hug: 1.7, settle: 5, level: true, pan: 0.3 },
  travel: { turnDeg: 92, side: -1, turnEnd: 0.5 },
  arrive: { swingDeg: -24, axis: [1, 0.25, 0], offset: [-0.45, 0.25] },
  light: { exposure: 1, skyExposure: 0.4, terrainSkyGlow: 0.25, skyLow: [0.03, 2.4, 0.6], sunRadiusDeg: 0.9, sunGlare: 0.9, flare: 0.6 },
  cover: [1.0, 0.82, 0.5],
  coverLow: [0.6, 0.45, 0.24],
  coverTerrain: [0.9, 0.7, 0.4],
  coverLowTerrain: [0.36, 0.26, 0.13],
  coverTop: [1, 1],
  coverEdge: [0.2, 0.4],
  coverEdgeRise: [0.4, 0.45],
  coverShell: [-2, -1],
  coverHides: 1,
  coverRush: { speed: 5, reach: 1.0, billow: [3.5, 3.5, 1.0], streak: [9, 6, 1.6], contrast: [1.7, 1.2] },
  skyAim: { orbit: [-160, -4, -1], terrain: [70.88563, -102.57248, -13.65] },
  spinDegPerSecond: -1,
  moonDegPerSecond: 0,
  tint: [0.95, 0.8, 0.5],
  coverWindow: { dive: { seconds: 1 }, rise: { seconds: 1 } },
}

export const veil = { sky: 0.02, shoulder: 0.35, carry: { dive: 12, rise: 24 }, band: [0.36, 2, 6], ease: 2, slow: 0.45, rush: 0.12, dive: { from: -0.95, full: -0.15, to: 0.15, clear: 0.95, span: 2.5 }, rise: { from: -0.95, full: -0.15, to: 0.15, clear: 1, span: 0.125 } }

export const deck = { centre: new THREE.Vector3().fromArray(reliefJson.camera.up).normalize().multiplyScalar(-(reliefJson.camera.radius + 1)), radius: reliefJson.camera.radius }

const ease = (x: number): number => {
  const t = Math.min(Math.max(x, 0), 1)
  return t * t * (3 - 2 * t)
}

export const bank = { roll: 1288, pitch: 1302 }

export const drift = { bend: -0.6 }

const hermite = (x: number, a: number, da: number, b: number, db: number): number => {
  const t = Math.min(Math.max(x, 0), 1)
  const t2 = t * t
  const t3 = t2 * t
  return (2 * t3 - 3 * t2 + 1) * a + (t3 - 2 * t2 + t) * da + (-2 * t3 + 3 * t2) * b + (t3 - t2) * db
}

interface Limb { tilt: number; gap: number }

interface Probe { side: 'orbit' | 'terrain'; tRel?: number; top?: number; vfov?: number; path?: boolean; on?: number; dusk?: number }

export const move = { anchorAheadDeg: moveJson.anchorAheadDeg, dive: moveJson.dive as MoveShape, rise: moveJson.rise as MoveShape }

const anchorBody = ((): THREE.Vector3 => {
  const a = THREE.MathUtils.degToRad(move.anchorAheadDeg)
  return new THREE.Vector3().fromArray(placeJson.place.under.direction).multiplyScalar(Math.cos(a)).addScaledVector(new THREE.Vector3().fromArray(placeJson.place.heading), Math.sin(a))
})()

const probe = (): Probe | undefined => (globalThis as { __venusProbe?: Probe }).__venusProbe

class VenusPlan extends StopPlan {
  private ends: { roll: [number, number]; pitch: [number, number]; end: [number, number, number, number] } | null = null

  private limb(shot: OrbitShot): Limb {
    const h = this.horizon(shot.view, shot.pose)
    return { tilt: Math.atan2(h.normal[0], h.normal[1]), gap: h.offset / Math.tan(THREE.MathUtils.degToRad(shot.pose.vfov) / 2) }
  }

  private slope(at: number, side: -1 | 1): [Limb, Limb] {
    const dt = 0.125 / config.fps
    const a = this.limb(super.dive(side < 0 ? at - dt : at))
    const b = this.limb(super.dive(side < 0 ? at : at + dt))
    return [side < 0 ? b : a, { tilt: (b.tilt - a.tilt) / dt, gap: (b.gap - a.gap) / dt }]
  }

  twin(time: number, close: Pose): Pose {
    const rot = this.turn(time).multiply(this.terrainFrame)
    return { position: close.position.clone().sub(deck.centre).divideScalar(deck.radius).applyQuaternion(rot), quaternion: rot.clone().multiply(close.quaternion), vfov: close.vfov }
  }

  untwin(time: number, globe: Pose): Pose {
    const back = this.turn(time).multiply(this.terrainFrame).invert()
    return { position: globe.position.clone().applyQuaternion(back).multiplyScalar(deck.radius).add(deck.centre), quaternion: back.clone().multiply(globe.quaternion), vfov: globe.vfov }
  }

  anchor(time: number): THREE.Vector3 {
    return anchorBody.clone().applyQuaternion(new THREE.Quaternion().fromArray(fit.globe.quaternion)).applyQuaternion(this.turn(time))
  }

  // The one steady move is the film's dive and rise once the stop has opted in to the handover (params.handover);
  // until then the film keeps the old path under its cover, and the check tools ask for the new one by the probe.
  private get steady(): boolean {
    return this.handsOver || probe()?.path === true
  }

  // The dive as one move from the hold to the close view, the same camera for both sides (contract E1 of cut/HANDOVER.md).
  override divePose(time: number, view: 'orbit' | 'terrain'): Pose {
    if (!this.steady) return super.divePose(time, view)
    const seg = this.seg.dive!
    const globe = between(this.hold(time - this.seg.hold.start), this.twin(time, this.terrain(time - this.seg.terrain.start)), this.anchor(time), (time - seg.start) / (seg.end - seg.start), move.dive)
    return view === 'orbit' ? globe : this.untwin(time, globe)
  }

  // The rise as one move from the close view to the travel that follows.
  override risePose(time: number, view: 'orbit' | 'terrain'): Pose {
    if (!this.steady) return super.risePose(time, view)
    const seg = this.seg.rise
    const globe = between(this.twin(time, this.terrain(time - this.seg.terrain.start)), this.after(time), this.anchor(time), (time - seg.start) / (seg.end - seg.start), move.rise)
    return view === 'orbit' ? globe : this.untwin(time, globe)
  }

  // The plates and the exposure of the globe side: on is the weight of the plates, dusk the share (0 to 1,
  // in the logarithm) of the gain of plates.json. Both are 0 outside the dive and the rise of this stop.
  placeLook(seg: Segment, time: number): { on: number; dusk: number } {
    const pr = probe()
    const mine = seg.stop === this.id && (seg.kind === 'dive' || seg.kind === 'rise')
    const u = (time - seg.start) / (seg.end - seg.start)
    const ramp = (w: [number, number]): number => ease((u - w[0]) / (w[1] - w[0]))
    const on = !mine ? 0 : seg.kind === 'dive' ? ramp(place.show.dive) : 1 - ramp(place.show.rise)
    const dusk = !mine ? 0 : seg.kind === 'dive' ? ramp(place.dusk.dive) : 1 - ramp(place.dusk.rise)
    return { on: pr?.on ?? on, dusk: pr?.dusk ?? dusk }
  }

  // The height of the steady dive at a time, whatever the film's path is.
  private steadyHeight(time: number): number {
    const seg = this.seg.dive!
    return between(this.hold(time - this.seg.hold.start), this.twin(time, this.terrain(time - this.seg.terrain.start)), this.anchor(time), (time - seg.start) / (seg.end - seg.start), move.dive).position.length() - 1
  }

  above(time: number, height: number, vfov: number): Pose {
    const toPlan = this.turn(time).multiply(new THREE.Quaternion().fromArray(fit.globe.quaternion))
    const centre = new THREE.Vector3().fromArray(place.centre).applyQuaternion(toPlan)
    const head = new THREE.Vector3().fromArray(place.heading).applyQuaternion(toPlan)
    const position = centre.clone().multiplyScalar(1 + height)
    return { position, quaternion: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(position, new THREE.Vector3(), head)), vfov }
  }

  override dive(time: number): OrbitShot {
    const pr = probe()
    if (pr) {
      if (pr.top !== undefined) {
        const pose = this.above(time, pr.top > 0 ? pr.top : this.steadyHeight(time), pr.vfov ?? 60)
        // A view from a fixed height is a survey picture for the plates (build.py base): the film's camera drift is taken out of it,
        // so the picture is the ideal camera's and every frame gives the same one.
        if (pr.top > 0) pose.quaternion.multiply(cameraDrift(time).invert())
        return { pose, view: 'orbit' }
      }
      if (pr.path) return { pose: this.divePose(time, pr.side), view: pr.side }
      const close = this.terrain(pr.tRel ?? time - this.seg.terrain.start)
      return pr.side === 'terrain' ? { pose: close, view: 'terrain' } : { pose: this.twin(time, close), view: 'orbit' }
    }
    const shot = super.dive(time)
    if (this.handsOver) return shot
    const seg = this.seg.dive!
    const centre = this.coverCenter(seg)
    const rollFrom = bank.roll / config.fps
    const pitchFrom = bank.pitch / config.fps
    if (shot.view !== 'orbit' || time <= rollFrom) return shot
    if (!this.ends) {
      const [r, dr] = this.slope(rollFrom, 1)
      const [p, dp] = this.slope(pitchFrom, 1)
      const [e, de] = this.slope(centre, 1)
      this.ends = { roll: [r.tilt, dr.tilt], pitch: [p.gap, dp.gap], end: [e.tilt, de.tilt, e.gap, de.gap] }
    }
    const k = this.ends
    const now = this.limb(shot)
    const spanR = centre - rollFrom
    const tilt = hermite((time - rollFrom) / spanR, k.roll[0], k.roll[1] * spanR, k.end[0], k.end[1] * spanR)
    const spanP = centre - pitchFrom
    const gap = time <= pitchFrom ? now.gap : hermite((time - pitchFrom) / spanP, k.pitch[0], k.pitch[1] * spanP, k.end[2], k.end[3] * spanP)
    const pose = shot.pose
    const alpha = Math.asin(Math.min(1 / pose.position.length(), 1))
    const seen = pose.position.clone().normalize().negate().applyQuaternion(pose.quaternion.clone().invert())
    const roll = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), now.tilt - tilt)
    const turned = seen.clone().applyQuaternion(roll)
    const flat = Math.hypot(turned.x, turned.y)
    if (flat < 1e-6) return shot
    const theta = alpha + Math.atan(gap * Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2))
    const want = new THREE.Vector3((turned.x / flat) * Math.sin(theta), (turned.y / flat) * Math.sin(theta), -Math.cos(theta))
    const fix = new THREE.Quaternion().setFromUnitVectors(turned, want).multiply(roll)
    return { pose: { position: pose.position, quaternion: pose.quaternion.clone().multiply(fix.invert()), vfov: pose.vfov }, view: 'orbit' }
  }

  override rise(time: number): OrbitShot {
    const pr = probe()
    if (pr?.path) return { pose: this.risePose(time, pr.side), view: pr.side }
    return super.rise(time)
  }

  override terrain(tRel: number): Pose {
    const pose = super.terrain(tRel)
    const u = tRel / (this.seg.terrain.end - this.seg.terrain.start) - 0.5
    pose.position.x += drift.bend * u * u
    return pose
  }

  override horizon(view: 'orbit' | 'terrain', local: Pose): CoverHorizon {
    const rel = view === 'orbit' ? local.position : local.position.clone().sub(deck.centre).divideScalar(deck.radius)
    if (view === 'terrain') this.p.coverSea = { centre: [deck.centre.x, deck.centre.y, deck.centre.z], radius: deck.radius, edge: [-2, -1] }
    return super.horizon('orbit', { position: rel, quaternion: local.quaternion, vfov: local.vfov })
  }

  phase(seg: Segment, time: number): number | null {
    const w = coverWindow(seg)
    if (!w || (seg.kind !== 'dive' && seg.kind !== 'rise')) return null
    const f = time * config.fps - w.centerFrame
    return f < 0 ? f / (w.centerFrame - w.firstFrame) : f / (w.lastFrame + 1 - w.centerFrame)
  }

  override coverAmount(seg: Segment, time: number): number {
    if (probe()) return 0
    const x = this.phase(seg, time)
    return x === null ? 0 : veil.sky * ease((1 - Math.abs(x)) / (1 - veil.shoulder))
  }

  veilAmount(seg: Segment, time: number): number {
    if (probe()) return 0
    const x = this.phase(seg, time)
    if (x === null) return 0
    const h = veil[seg.kind as 'dive' | 'rise']
    return Math.min(Math.max(Math.min((x - h.from) / (h.full - h.from), 1 - (x - h.to) / (h.clear - h.to)), 0), 1)
  }

  drop(seg: Segment, time: number): number {
    const w = coverWindow(seg)
    const x = this.phase(seg, time)
    if (!w || x === null) return 0
    const half = (seg.kind === 'rise' ? w.firstFrame - w.centerFrame : w.lastFrame + 1 - w.centerFrame) / config.fps
    return half * (1 - Math.pow(1 - Math.min(Math.abs(x), 1), veil.ease + 1)) / (veil.ease + 1)
  }

  override skyGain(time: number): number {
    const w = coverWindow(this.seg.rise)
    if (!w) return 1
    const f = time * config.fps - w.centerFrame
    const [low, hold, span] = veil.band as [number, number, number]
    if (f < -0.5 || f >= hold + span) return 1
    return low + (1 - low) * ease((f - hold) / span)
  }

  release(seg: Segment, time: number): number {
    if (probe()) return 1
    const w = coverWindow(seg)
    if (!w || (seg.kind !== 'dive' && seg.kind !== 'rise')) return 1
    const f = time * config.fps - w.centerFrame
    return Math.min(Math.max((seg.kind === 'dive' ? -f : f) / veil.carry[seg.kind], 0), 1)
  }
}

export const plan = new VenusPlan('venus', fit as Fit, params)
