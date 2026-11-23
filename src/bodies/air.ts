import * as THREE from 'three'
import type { HazeParams } from './haze'

export type Rgb = [number, number, number]

export interface HazeAir {
  depth: number
  scaleHeight: number
  day: Rgb
  twilight: Rgb
  night: Rgb
  edge: [number, number]
  strength: number
  extinction: number
  forward: number
}

export interface GlobeAir {
  limb: number
  tint: Rgb
  haze: HazeAir
}

export function hazeAir(p: HazeParams): HazeAir {
  return {
    depth: p.depth, scaleHeight: p.scaleHeight, day: p.day, twilight: p.twilight, night: p.night ?? [0, 0, 0],
    edge: [p.dayFrom ?? -0.16, p.dayTo ?? 0.34], strength: p.strength, extinction: p.extinction, forward: p.forward,
  }
}

export function setHazeAir(uniforms: Record<string, THREE.IUniform>, a: HazeAir): void {
  if (!uniforms.uHazeTau) throw new Error('these uniforms hold no haze')
  uniforms.uHazeH!.value = a.scaleHeight
  uniforms.uHazeTau.value = a.depth
  ;(uniforms.uHazeDay!.value as THREE.Vector3).fromArray(a.day)
  ;(uniforms.uHazeTwilight!.value as THREE.Vector3).fromArray(a.twilight)
  ;(uniforms.uHazeNight!.value as THREE.Vector3).fromArray(a.night)
  ;(uniforms.uHazeEdge!.value as THREE.Vector2).fromArray(a.edge)
  uniforms.uHazeStrength!.value = a.strength
  uniforms.uHazeForward!.value = a.forward
  if (uniforms.uExtinction) uniforms.uExtinction.value = a.extinction
}
