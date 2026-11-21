import { config, type Segment } from '../../config'
import { StopPlan, type Fit, type MoveParams } from '../../director/moves'
import { coverWindow } from '../../director/timeline'
import type { CoverHorizon, Pose } from '../../core/types'
import fit from './fit.json'

export const params: MoveParams = {
  hold: { orbitDeg: 8, axis: [-0.3, 1, 0], push: -0.03 },
  spot: { x: 0.6222, y: 0.4356 },
  dive: { headingDeg: 98.25, altitude: 0.0267, back: 0.07, ahead: 0.14, bow: -0.25, rollDeg: -7, swoop: true, surge: { glide: 0.14, rise: 60, fall: 2, swell: [0.3, 9, 1.2] } },
  terrain: { vfov: 60, horizonDeg: 10.57, dipDeg: 10.91, forward: 0.6, rise: 0.12, side: -0.1, yawDeg: -3, pitchDeg: 1, entryHeight: 0.7, entryBack: 0.7, entryPitchDeg: 5, exitHeight: 1.6, exitForward: -0.25, exitPitchDeg: 10 },
  rise: { azimuthDeg: 18, elevationDeg: 12, distance: 5.4, offset: [-0.3, 0.12], driftSpeed: 0.08, rollDeg: 6, ahead: 0.03, hug: 1.7, settle: 5, level: true, pan: 0.3 },
  travel: { turnDeg: 92, side: -1, turnEnd: 0.5 },
  arrive: { swingDeg: -24, axis: [1, 0.25, 0], offset: [-0.45, 0.25] },
  light: { exposure: 1, skyExposure: 0.4, terrainSkyGlow: 0.25, sunRadiusDeg: 0.9, sunGlare: 0.9, flare: 0.6 },
  cover: [1.25, 1.02, 0.62],
  coverLow: [0.95, 0.7, 0.36],
  coverTerrain: [1.3, 1.0, 0.56],
  coverLowTerrain: [0.3, 0.19, 0.085],
  coverTop: [0.85, 0.12],
  coverEdge: [0.2, 0.4],
  coverEdgeRise: [0.4, 0.45],
  coverShell: [1.015, 1.07],
  coverRush: { speed: 2.4, reach: 2.5, billow: [2.2, 0.9, 1], streak: [9, 2.2, 1.6], contrast: [0.5, 0.35] },
  skyAim: { orbit: [-160, -4, -1], terrain: [70.88563, -102.57248, -13.65] },
  spinDegPerSecond: -0.5,
  moonDegPerSecond: 0,
  tint: [0.95, 0.8, 0.5],
}

export const haze = { dive: { lead: 3.5, hold: 1, tail: 16 }, rise: { lead: 10, hold: 1.5, tail: 16 } }

export const shell = { thin: [0.985, 1.045], near: [1, 1.18], fade: [0.2, 0.5] }

const ease = (x: number): number => {
  const t = Math.min(Math.max(x, 0), 1)
  return t * t * (3 - 2 * t)
}

const shellAt = (height: number): [number, number] => {
  const k = ease((height - shell.fade[0]!) / (shell.fade[1]! - shell.fade[0]!))
  return [shell.near[0]! + (shell.thin[0]! - shell.near[0]!) * k, shell.near[1]! + (shell.thin[1]! - shell.near[1]!) * k]
}

class VenusPlan extends StopPlan {
  override horizon(view: 'orbit' | 'terrain', local: Pose): CoverHorizon {
    if (view === 'orbit') this.p.coverShell = shellAt(local.position.length() - 1)
    return super.horizon(view, local)
  }

  override coverAmount(seg: Segment, time: number): number {
    const w = coverWindow(seg)
    if (!w || (seg.kind !== 'dive' && seg.kind !== 'rise')) return 0
    const h = haze[seg.kind]
    const f = time * config.fps - w.centerFrame
    const before = seg.kind === 'dive' ? (f + (w.centerFrame - w.firstFrame)) / h.lead : (f + h.hold + h.lead) / h.lead
    const after = (h.hold + h.tail - f) / h.tail
    return Math.min(ease(before), Math.min(Math.max(after, 0), 1))
  }
}

export const plan = new VenusPlan('venus', fit as Fit, params)
