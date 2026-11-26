import { createHash } from 'node:crypto'
import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { hazeAir, setHazeAir, type GlobeAir } from '../src/bodies/air'
import { GROUND_AIR_GLSL, HazeShell, airDepth, hazeUniforms, type HazeParams } from '../src/bodies/haze'
import { Planet, planetFrag } from '../src/bodies/planet'
import * as look from '../src/stops/mars/look'
import { frozen } from './globe-frozen'

const hash = (text: string): string => createHash('sha256').update(frozen(text)).digest('hex')
const KEPT = '81b0189383d53555c8623467df803b233644cf143249b11aa3e3a28f5548a308'
const SHELL = '692d6d8ba375114b2cd5dd0f4126a2d7edfa8a2b1569e9eaa8e6e23f0ced5e02'
const values = (u: Record<string, THREE.IUniform>): string => JSON.stringify(Object.keys(u).sort().map((k) => [k, u[k]!.value instanceof THREE.Texture ? 'texture' : u[k]!.value]))
const planet = (haze: HazeParams = look.haze): Planet => {
  const t = new THREE.Texture()
  return new Planet({ map: t, mapWidth: 8, height: t, heightWidth: 8, light: look.light, haze, grazing: look.grazing })
}
const low: GlobeAir = {
  limb: 0.25, tint: [0.9, 0.8, 0.7],
  haze: { depth: 1.5, scaleHeight: 0.002, day: [0.4, 0.3, 0.2], twilight: [0.1, 0.05, 0.02], night: [0.01, 0.01, 0.02], edge: [-0.3, 0.2], strength: 1.2, extinction: 0.8, forward: 2.5 },
}

describe('the air of the globe', () => {
  it('keeps every uniform of a hold when the air holds the numbers the globe was made with', () => {
    const p = planet()
    const before = values(p.material.uniforms)
    p.setAir({ limb: look.light.limb, tint: [1, 1, 1], haze: hazeAir(look.haze) })
    expect(values(p.material.uniforms)).toBe(before)
    expect(hash(p.material.fragmentShader)).toBe(KEPT)
    const shell = new HazeShell(look.shellHaze, { value: 0 })
    const shellBefore = values(shell.material.uniforms)
    shell.setAir(hazeAir(look.shellHaze))
    expect(values(shell.material.uniforms)).toBe(shellBefore)
    expect(hash(shell.material.fragmentShader)).toBe(SHELL)
    p.dispose()
    shell.dispose()
  })

  it('reads a haze without a night colour and without an edge as the shader does', () => {
    const a = hazeAir({ scaleHeight: 0.01, depth: 1, day: [1, 1, 1], twilight: [0, 0, 0], strength: 1, extinction: 1, forward: 0, top: 4 })
    expect(a.night).toEqual([0, 0, 0])
    expect(a.edge).toEqual([-0.16, 0.34])
  })

  it('writes the limb, the tint and the haze of the air into the uniforms the globe has today', () => {
    const p = planet()
    const names = Object.keys(p.material.uniforms).sort()
    p.setAir(low)
    const u = p.material.uniforms
    expect(Object.keys(u).sort()).toEqual(names)
    expect(u.uLimb!.value).toBe(0.25)
    expect((u.uTint!.value as THREE.Vector3).toArray()).toEqual([0.9, 0.8, 0.7])
    expect(u.uHazeTau!.value).toBe(1.5)
    expect(u.uHazeH!.value).toBe(0.002)
    expect((u.uHazeDay!.value as THREE.Vector3).toArray()).toEqual([0.4, 0.3, 0.2])
    expect((u.uHazeTwilight!.value as THREE.Vector3).toArray()).toEqual([0.1, 0.05, 0.02])
    expect((u.uHazeNight!.value as THREE.Vector3).toArray()).toEqual([0.01, 0.01, 0.02])
    expect((u.uHazeEdge!.value as THREE.Vector2).toArray()).toEqual([-0.3, 0.2])
    expect(u.uHazeStrength!.value).toBe(1.2)
    expect(u.uHazeForward!.value).toBe(2.5)
    expect(u.uExtinction!.value).toBe(0.8)
    expect(hash(p.material.fragmentShader)).toBe(KEPT)
    p.dispose()
  })

  it('writes only the parts an air holds: an air of the film with no haze, no limb or no tint leaves those uniforms alone', () => {
    const p = planet()
    const before = values(p.material.uniforms)
    const film: GlobeAir & { height: number; share: number; exposure: number; sky: number; stars: number; sunRadius: number; glare: number } = { height: 1, share: 0, exposure: 1, sky: 1, stars: 1, sunRadius: 0.3, glare: 1 }
    p.setAir(film)
    expect(values(p.material.uniforms)).toBe(before)
    p.setAir({ ...film, limb: 0.4 })
    expect(p.material.uniforms.uLimb!.value).toBe(0.4)
    expect(p.material.uniforms.uHazeTau!.value).toBe(look.haze.depth)
    p.setAir({ ...film, haze: low.haze! })
    expect(p.material.uniforms.uHazeTau!.value).toBe(1.5)
    expect(p.material.uniforms.uLimb!.value).toBe(0.4)
    p.dispose()
  })

  it('sets the shell the same way and leaves the shell text as it was', () => {
    const shell = new HazeShell(look.shellHaze, { value: 0 })
    const names = Object.keys(shell.material.uniforms).sort()
    shell.setAir(low.haze!)
    const u = shell.material.uniforms
    expect(Object.keys(u).sort()).toEqual(names)
    expect(u.uHazeTau!.value).toBe(1.5)
    expect((u.uHazeEdge!.value as THREE.Vector2).toArray()).toEqual([-0.3, 0.2])
    expect(hash(shell.material.fragmentShader)).toBe(SHELL)
    shell.dispose()
  })

  it('does not take the arrays of the air as its own and refuses uniforms without a haze', () => {
    const u = hazeUniforms(look.haze)
    const air = { ...low.haze!, day: [0.4, 0.3, 0.2] as [number, number, number] }
    setHazeAir(u, air)
    ;(u.uHazeDay!.value as THREE.Vector3).x = 9
    expect(air.day).toEqual([0.4, 0.3, 0.2])
    expect(() => setHazeAir({}, air)).toThrow('no haze')
  })

  it('writes the glow of an air where the haze was made with one, leaves a glow alone the air does not name and wants colour and power together', () => {
    const u = hazeUniforms({ ...look.haze, glow: true })
    const dir = (u.uHazeGlowDir!.value as THREE.Vector3).toArray()
    setHazeAir(u, low.haze!)
    expect((u.uHazeGlow!.value as THREE.Vector3).toArray()).toEqual([0, 0, 0])
    expect(u.uHazeGlowPower!.value).toBe(1)
    const glow: [number, number, number] = [0.5, 0.25, 0.125]
    setHazeAir(u, { ...low.haze!, glow, glowPower: 6 })
    expect((u.uHazeGlow!.value as THREE.Vector3).toArray()).toEqual(glow)
    expect(u.uHazeGlowPower!.value).toBe(6)
    expect((u.uHazeGlowDir!.value as THREE.Vector3).toArray()).toEqual(dir)
    setHazeAir(u, low.haze!)
    expect((u.uHazeGlow!.value as THREE.Vector3).toArray()).toEqual(glow)
    const plain = hazeUniforms(look.haze)
    setHazeAir(plain, { ...low.haze!, glow, glowPower: 6 })
    expect(plain.uHazeGlow).toBeUndefined()
    expect(() => setHazeAir(u, { ...low.haze!, glow })).toThrow('both or neither')
    expect(() => setHazeAir(u, { ...low.haze!, glow, glowPower: 0 })).toThrow('above 0')
  })

  it('measures the air to a point by one law: it grows with the distance, is the globe\'s own depth where the point lies on the datum and stays between 0.8 and 1.6 of the integral of the density along the ray', () => {
    const H = 0.003
    const point = (ha: number, ca: number, L: number): [number, number] => {
      const sa = Math.sqrt(1 - ca * ca)
      const rb = Math.hypot(sa * L, 1 + ha + ca * L)
      return [rb - 1, (sa * sa * L + ca * (1 + ha + ca * L)) / rb]
    }
    const integral = (ha: number, ca: number, L: number): number => {
      const sa = Math.sqrt(1 - ca * ca)
      const n = 4000
      let sum = 0
      for (let i = 0; i < n; i++) {
        const t = ((i + 0.5) / n) * L
        sum += Math.exp(-(Math.hypot(sa * t, 1 + ha + ca * t) - 1) / H)
      }
      return (sum * L) / n / H
    }
    let low = Infinity
    let high = 0
    for (const ha of [0.0005, 0.002, 0.01]) {
      for (const ca of [-1, -0.3, -0.05, -0.01, 0, 0.01, 0.05, 0.3]) {
        let last = 0
        for (let k = 0; k <= 40; k++) {
          const L = 1e-5 * 10 ** (k / 10)
          const [hb, cb] = point(ha, ca, L)
          if (hb < -0.003) break
          const tau = airDepth(ha, ca, hb, cb, H, 1)
          expect(tau).toBeGreaterThanOrEqual(last)
          last = tau
          low = Math.min(low, tau / integral(ha, ca, L))
          high = Math.max(high, tau / integral(ha, ca, L))
        }
      }
    }
    expect(low).toBeGreaterThan(0.8)
    expect(high).toBeLessThan(1.6)
    const k = Math.sqrt(1.5707963 / H)
    expect(airDepth(1.5, -1, 0, -1, H, 0.7)).toBeCloseTo(0.7 * (1 / (1 + 1 / k) - Math.exp(-1.5 / H) / (1 + 1 / k)), 12)
    expect(airDepth(1.5, -1, -0.002, -1, H, 1) / airDepth(1.5, -1, 0, -1, H, 1)).toBeCloseTo(Math.exp(0.002 / H), 6)
    expect(GROUND_AIR_GLSL).toContain('float airDepth(float ha, float ca, float hb, float cb, float scaleHeight, float depth)')
    expect(GROUND_AIR_GLSL).toContain('float airDepthTo(vec3 eye, vec3 point, float scaleHeight, float depth)')
    expect(GROUND_AIR_GLSL).toContain('vec3 airOver(vec3 col, float tau, float extinction, vec3 up, vec3 dir)')
    expect(planetFrag({ slots: 0, own: false, gain: false, minor: false, glow: false })).not.toContain('airDepth')
    expect(planetFrag({ slots: 0, own: false, gain: false, minor: false, glow: false, cap: true })).toContain(GROUND_AIR_GLSL)
  }, 60000)
})
