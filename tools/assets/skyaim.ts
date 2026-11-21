import type * as THREE from 'three'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'

export { aimAt } from '../../src/space/aim'

export interface SkyAimArgs {
  stop: string
  along: number
  tilt: number
  lift: number
  tstop: string
  talong: number
  ttilt: number
  tlift: number
}

export interface SkyAim {
  quaternion: number[]
  turns: Record<string, number[]>
  patches: Record<string, { orbit: number[]; terrain: number[] }>
  frame: number
  terrainFrame: number
}

const list = (q: THREE.Quaternion): number[] => q.toArray()

export function skyAim(): SkyAim {
  const sky = new FilmDirector(plans).sky
  return {
    quaternion: list(sky.frame),
    turns: Object.fromEntries(Object.entries(sky.turns).map(([k, q]) => [k, list(q)])),
    patches: Object.fromEntries(Object.entries(sky.patches).map(([k, p]) => [k, { orbit: list(p.orbit), terrain: list(p.terrain) }])),
    frame: sky.fitted.frame,
    terrainFrame: sky.fitted.terrainFrame,
  }
}
