import { createHash } from 'node:crypto'
import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { HAZE_GLSL, HazeShell, hazeGlsl, hazeUniforms, setHazeGlow, type HazeParams } from '../src/bodies/haze'
import { Planet } from '../src/bodies/planet'
import * as look from '../src/stops/mars/look'
import { frozen } from './globe-frozen'

const hash = (text: string): string => createHash('sha256').update(frozen(text)).digest('hex')
const params: HazeParams = { scaleHeight: 0.01, depth: 1, day: [1, 1, 1], twilight: [0, 0, 0], strength: 1, extinction: 1, forward: 0, top: 4 }
const LOBE = 'uHazeGlow * pow(max(dot(dir, uHazeGlowDir), 0.0), uHazeGlowPower)'

describe('the haze glow', () => {
  it('leaves the haze text and the shell text of a stop without it as they were', () => {
    expect(hash(HAZE_GLSL)).toBe('8e0c217f1ce7be8c57937f842e92b901c7ea3e759cc033ddc52e77cf0cb823ac')
    expect(hazeGlsl(false)).toBe(HAZE_GLSL)
    const shell = new HazeShell(params, { value: 0 })
    expect(hash(shell.material.fragmentShader)).toBe('692d6d8ba375114b2cd5dd0f4126a2d7edfa8a2b1569e9eaa8e6e23f0ced5e02')
    expect(Object.keys(hazeUniforms(params)).filter((k) => k.includes('Glow'))).toEqual([])
    expect(new HazeShell({ ...params, glow: false }, { value: 0 }).material.fragmentShader).toBe(shell.material.fragmentShader)
    shell.dispose()
  })

  it('adds one lobe inside the haze strength for a stop that asks', () => {
    const text = hazeGlsl(true)
    expect(text.split(LOBE).length - 1).toBe(1)
    expect(text).toContain('hazeForward(dir) + uHazeNight + ' + LOBE + ') * uHazeStrength;')
    for (const name of ['uniform vec3 uHazeGlow;', 'uniform vec3 uHazeGlowDir;', 'uniform float uHazeGlowPower;']) expect(text).toContain(name)
    expect(text.length - HAZE_GLSL.length).toBe(('\nuniform vec3 uHazeGlow;\nuniform vec3 uHazeGlowDir;\nuniform float uHazeGlowPower;' + ' + ' + LOBE).length)
    const shell = new HazeShell({ ...params, glow: true }, { value: 0 })
    expect(shell.material.fragmentShader).toContain(LOBE)
    expect((shell.material.uniforms.uHazeGlow!.value as THREE.Vector3).toArray()).toEqual([0, 0, 0])
    shell.dispose()
  })

  it('sets the direction, the colour and the power, and refuses a haze without the option', () => {
    const shell = new HazeShell({ ...params, glow: true }, { value: 0 })
    shell.setGlow(new THREE.Vector3(0, 3, 4), [1, 0.55, 0.35], 12)
    const u = shell.material.uniforms
    expect((u.uHazeGlow!.value as THREE.Vector3).toArray()).toEqual([1, 0.55, 0.35])
    expect((u.uHazeGlowDir!.value as THREE.Vector3).toArray().map((v) => Math.round(v * 1e6) / 1e6)).toEqual([0, 0.6, 0.8])
    expect(u.uHazeGlowPower!.value).toBe(12)
    expect(() => shell.setGlow(new THREE.Vector3(1, 0, 0), [1, 1, 1], 0)).toThrow('above 0')
    const off = new HazeShell(params, { value: 0 })
    expect(() => off.setGlow(new THREE.Vector3(1, 0, 0), [1, 1, 1], 12)).toThrow('no glow')
    expect(() => setHazeGlow(hazeUniforms(params), new THREE.Vector3(1, 0, 0), [1, 1, 1], 12)).toThrow('no glow')
    shell.dispose()
    off.dispose()
  })

  it('reaches the ground haze of the planet the same way', () => {
    const t = new THREE.Texture()
    const make = (haze: HazeParams): Planet => new Planet({ map: t, mapWidth: 8, height: t, heightWidth: 8, light: look.light, haze, grazing: look.grazing })
    const off = make(look.haze)
    const on = make({ ...look.haze, glow: true })
    expect(hash(off.material.fragmentShader)).toBe('81b0189383d53555c8623467df803b233644cf143249b11aa3e3a28f5548a308')
    expect(off.material.fragmentShader).not.toContain('uHazeGlow')
    expect(on.material.fragmentShader.split(LOBE).length - 1).toBe(1)
    expect(on.material.fragmentShader.replace(hazeGlsl(true), HAZE_GLSL)).toBe(off.material.fragmentShader)
    on.setGlow(new THREE.Vector3(2, 0, 0), [1, 0.55, 0.35], 12)
    expect((on.material.uniforms.uHazeGlowDir!.value as THREE.Vector3).toArray()).toEqual([1, 0, 0])
    expect(() => off.setGlow(new THREE.Vector3(1, 0, 0), [1, 1, 1], 12)).toThrow('no glow')
    off.dispose()
    on.dispose()
  })
})
