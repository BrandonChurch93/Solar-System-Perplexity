import * as THREE from 'three'
import type { HazeParams } from './haze'
import { AIR_LAW_SCALE_HEIGHT } from '../terrain/air'

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
  glow?: Rgb
  glowPower?: number
}

export interface AirLaw {
  light: Rgb
  density: number
  scaleHeight: number
  dayFrom: number
  dayTo: number
}

export function airLawUniforms(a: AirLaw): Record<string, THREE.IUniform> {
  if (!(a.density >= 0) || !(a.dayTo > a.dayFrom)) throw new Error('the air law needs a density of 0 or more and a day edge that rises')
  if (!(a.scaleHeight >= AIR_LAW_SCALE_HEIGHT[0] && a.scaleHeight <= AIR_LAW_SCALE_HEIGHT[1])) throw new Error('the air law is measured for a scale height of ' + AIR_LAW_SCALE_HEIGHT[0] + ' to ' + AIR_LAW_SCALE_HEIGHT[1] + ' radii, not ' + a.scaleHeight)
  return { uAirLight: { value: new THREE.Vector3().fromArray(a.light) }, uAirLaw: { value: new THREE.Vector4(a.density, a.scaleHeight, a.dayFrom, a.dayTo) } }
}

export interface GlobeAir {
  limb?: number
  tint?: Rgb
  haze?: HazeAir
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
  if ((a.glow === undefined) !== (a.glowPower === undefined)) throw new Error('the glow of an air is a colour and a power, both or neither')
  if (a.glow && uniforms.uHazeGlow) {
    if (!(a.glowPower! > 0)) throw new Error('the glow power must be above 0')
    ;(uniforms.uHazeGlow.value as THREE.Vector3).fromArray(a.glow)
    uniforms.uHazeGlowPower!.value = a.glowPower
  }
}
