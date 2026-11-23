import { createHash } from 'node:crypto'
import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { hazeAir, setHazeAir, type GlobeAir } from '../src/bodies/air'
import { HazeShell, hazeUniforms, type HazeParams } from '../src/bodies/haze'
import { Planet } from '../src/bodies/planet'
import * as look from '../src/stops/mars/look'

const hash = (text: string): string => createHash('sha256').update(text).digest('hex')
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

  it('sets the shell the same way and leaves the shell text as it was', () => {
    const shell = new HazeShell(look.shellHaze, { value: 0 })
    const names = Object.keys(shell.material.uniforms).sort()
    shell.setAir(low.haze)
    const u = shell.material.uniforms
    expect(Object.keys(u).sort()).toEqual(names)
    expect(u.uHazeTau!.value).toBe(1.5)
    expect((u.uHazeEdge!.value as THREE.Vector2).toArray()).toEqual([-0.3, 0.2])
    expect(hash(shell.material.fragmentShader)).toBe(SHELL)
    shell.dispose()
  })

  it('does not take the arrays of the air as its own and refuses uniforms without a haze', () => {
    const u = hazeUniforms(look.haze)
    const air = { ...low.haze, day: [0.4, 0.3, 0.2] as [number, number, number] }
    setHazeAir(u, air)
    ;(u.uHazeDay!.value as THREE.Vector3).x = 9
    expect(air.day).toEqual([0.4, 0.3, 0.2])
    expect(() => setHazeAir({}, air)).toThrow('no haze')
  })
})
