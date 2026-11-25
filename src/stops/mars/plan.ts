import * as THREE from 'three'
import { config, type Segment } from '../../config'
import type { Pose, ViewKind } from '../../core/types'
import { StopPlan, type Fit, type MoveParams } from '../../director/moves'
import type { HandoverSide, PlaceOptions, SkyShares } from '../../director/handover'
import fit from './fit.json'
import place from './place.json'
import phobos from './phobos.json'
import bend from './bend.json'
import close from './close.json'
import { moon } from './look'

// A side of place.json: at, placeFrames, path, picture, pace, turn, liftPower and pullBack belong to the handover, every other key is an option of the place picture and reaches the
// engine as it stands, so a number set in that file can not be lost on the way.
type SideFile = PlaceOptions & Pick<HandoverSide, 'at' | 'placeFrames' | 'path' | 'picture' | 'pace' | 'turn' | 'liftPower' | 'pullBack'>
function side(file: unknown): HandoverSide {
  const { at, placeFrames, path, picture: on, pace, turn, liftPower, pullBack, ...picture } = file as SideFile
  const out: HandoverSide = { skyFloor: true, place: picture }
  if (at !== undefined) out.at = at
  if (placeFrames !== undefined) out.placeFrames = placeFrames
  if (path !== undefined) out.path = path
  if (on !== undefined) out.picture = on
  if (pace !== undefined) out.pace = pace
  if (turn !== undefined) out.turn = turn
  if (liftPower !== undefined) out.liftPower = liftPower
  if (pullBack !== undefined) out.pullBack = pullBack
  return out
}

// The rise ends north up, as the hold and the approach show the planet (rise.level false, rollDeg 0): the level end
// stood with north 103.5 degrees off and rolled the disc inside the shutter. The offset of the look-at is solved
// (assets-src/mars/RECIPE.md, round 2) so that the north up camera looks along the forward the level end had: the
// engine places every later stop from that forward, so their world turn stays as it was.
export const params: MoveParams = {
  hold: { orbitDeg: -8, axis: [-0.15, 1, 0], push: -0.04 },
  spot: { x: 0.45, y: 0.54 },
  dive: { headingDeg: -245, altitude: 0.032, back: 0.08, ahead: 0.16, bow: -0.2, rollDeg: -6, swoop: true, surge: { glide: 0.14, rise: 60, fall: 2, swell: [0.3, 9, 1.2] } },
  terrain: { vfov: 60, gather: 0.22, forward: 1.65, rise: 0.06, side: 0.3, yawDeg: -2.9, pitchDeg: 0.78, entryHeight: 0.4, entryBack: 0.5, entryPitchDeg: -6, entryYawDeg: -3, entryRollDeg: -3, horizonDeg: 18.43, dipDeg: 2.6, exitHeight: 0.8, exitForward: 0.35, exitPitchDeg: 12 },
  rise: { azimuthDeg: 34, elevationDeg: 16, distance: 4.6, offset: [0.12369695522247795, -0.5308716998277915], driftSpeed: 0.08, rollDeg: 0, ahead: 0.03, hug: 1.7, settle: 5, level: false, pan: 0.3 },
  travel: { turnDeg: 86, side: -1, turnEnd: 0.52 },
  arrive: { swingDeg: -30, axis: [0.3, 1, 0.1], offset: [-0.55, -0.2] },
  light: { exposure: 1, skyExposure: 0.5, terrainSkyGlow: 0.25, skyLow: [0.04, 0.35, 0.3], sunRadiusDeg: 1.1, sunGlare: 0.8, flare: 0.3 },
  cover: [0.55, 0.4, 0.3],
  coverLow: [0.36, 0.17, 0.095],
  coverTerrain: [0.95, 0.62, 0.38],
  coverLowTerrain: [0.085, 0.045, 0.028],
  coverTop: [0.25, 0.04],
  coverEdge: [0.2, 0.4],
  coverEdgeRise: [0.4, 0.45],
  coverShell: [1.04, 1.14],
  coverRush: { speed: 2.4, reach: 2.5, billow: [2.2, 0.9, 1], streak: [9, 2.2, 1.6], contrast: [0.7, 0.55] },
  spinDegPerSecond: 0.9,
  moonDegPerSecond: -1.2,
  near: [{ centre: phobos.center as [number, number, number], radius: phobos.radius * phobos.hi }],
  tint: [0.9, 0.5, 0.3],
  handover: { dive: side(place.dive), rise: side(place.rise) },
}

// The surface view with the bend of its last frames (bend.json, d196): until bend.fromFrame it is the film's own surface view to the bit.
// From there the eye keeps the speed the view has anyway and its velocity turns, eased at both ends, from the push down the lens through a
// track across into the pull back, so that the rise, which takes the view's velocity at the seam, need not stop the eye and turn it round.
// The lens keeps its own slow turn. The eye's place is the sum of that velocity from fromFrame, taken by Simpson's rule in a fixed count
// of steps, so it is a function of the time alone.
class MarsPlan extends StopPlan {
  // The sky of the close view on the globe side of the dive and the rise comes by the height of the globe side's eye (close.json sky), not over a
  // count of frames (MAIL 613): all of it from sky.low down, which lies above both changes of view, none of it above sky.high.
  override skyShare(seg: Segment, time: number): SkyShares | null {
    if (seg.stop !== this.id || (seg.kind !== 'dive' && seg.kind !== 'rise')) return null
    const c = close.sky
    // The globe camera by name: the share is asked on the globe side only, and eyeHeight on a path of a stop's own asks the side, which asks the film, which asks this.
    const height = this.eyeShot(seg.kind, time, 'orbit').pose.position.length() - 1
    const k = Math.min(Math.max((Math.log(Math.max(height, 1e-5)) - Math.log(c.low)) / (Math.log(c.high) - Math.log(c.low)), 0), 1)
    return { low: 1 - k * k * (3 - 2 * k) }
  }

  drawnBodies(view: ViewKind, _eye: THREE.Vector3, time: number): { id: string; place: number[]; turn: number[]; reach: number }[] {
    if (view !== 'orbit') return []
    const e = time - this.holdMid
    const place = new THREE.Vector3().fromArray(phobos.center).applyAxisAngle(this.axis, THREE.MathUtils.degToRad(this.p.moonDegPerSecond) * e)
    const turn = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3().fromArray(phobos.tumbleAxis).normalize(), THREE.MathUtils.degToRad(moon.tumbleDegPerSecond) * e).multiply(new THREE.Quaternion().fromArray(phobos.holdQuaternion))
    return [{ id: 'phobos', place: place.toArray(), turn: turn.toArray(), reach: phobos.radius * phobos.hi }]
  }

  override terrain(tRel: number): Pose {
    const base = super.terrain(tRel)
    const from = bend.fromFrame / config.fps - this.seg.terrain.start
    if (tRel <= from) return base
    const t = this.p.terrain
    const dur = this.seg.terrain.end - this.seg.terrain.start
    const along = new THREE.Vector3(t.side, t.rise, -t.forward)
    const length = along.length()
    along.multiplyScalar(1 / length)
    const across = new THREE.Vector3().fromArray(bend.across as [number, number, number])
    across.addScaledVector(along, -across.dot(along)).normalize()
    const turn = THREE.MathUtils.degToRad(bend.turnDeg)
    const velocity = (at: number): THREE.Vector3 => {
      const speed = (length * (1 + 2 * (t.gather ?? 0) * (at / dur - 0.5))) / dur
      const x = Math.min((at - from) / (dur - from), 1)
      const angle = turn * x * x * x * (x * (x * 6 - 15) + 10)
      return along.clone().multiplyScalar(speed * Math.cos(angle)).addScaledVector(across, speed * Math.sin(angle))
    }
    const n = 64
    const h = (tRel - from) / n
    const sum = velocity(from).add(velocity(tRel))
    for (let i = 1; i < n; i++) sum.addScaledVector(velocity(from + i * h), i % 2 ? 4 : 2)
    return { position: super.terrain(from).position.addScaledVector(sum, h / 3), quaternion: base.quaternion, vfov: base.vfov }
  }
}

export const plan = new MarsPlan('mars', fit as Fit, params)
