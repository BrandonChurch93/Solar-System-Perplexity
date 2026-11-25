import { createHash } from 'node:crypto'
import * as THREE from 'three'
import { afterAll, describe, expect, it } from 'vitest'
import { capDetail, capHeights, capVert, type CapDetail, type CapOptions } from '../src/bodies/cap'
import { Planet, planetFrag, type PatchShader } from '../src/bodies/planet'
import { setFrame } from '../src/core/frame'
import * as look from '../src/stops/mars/look'
import { frozen } from './globe-frozen'

const hash = (text: string): string => createHash('sha256').update(frozen(text)).digest('hex')
const KEPT = '81b0189383d53555c8623467df803b233644cf143249b11aa3e3a28f5548a308'
const level = (widthDeg: number): CapOptions['levels'][number] => ({ height: capHeights(new Uint16Array(16), 4), size: 4, widthDeg, low: -0.002, high: 0.001 })
const options = (o: Partial<CapOptions> = {}): CapOptions => ({ levels: [8.5, 3.8, 1.6].map(level), border: [0.065, 0.074], from: [2, 1.2], cells: 128, pixel: 2e-4, ...o })
const planet = (cap?: CapOptions, exactSpin = false): Planet => {
  const t = new THREE.Texture()
  return new Planet({ map: t, mapWidth: 8, height: t, heightWidth: 8, light: look.light, haze: look.haze, grazing: look.grazing, ...(cap ? { cap } : {}), ...(exactSpin ? { exactSpin } : {}) })
}
const body = 'vec4 groundDetail(vec3 dir, float height, vec3 normal, float texelPx) {\n  return vec4(vec3(1.0 - uDetailDepth * step(1.0, texelPx)), uDetailRise * height);\n}'
const text = 'uniform float uDetailDepth;\nuniform float uDetailRise;\n' + body
const detail = (): CapDetail => ({ text, uniforms: { uDetailDepth: { value: 0.2 }, uDetailRise: { value: 3 } } })
const lines = (s: string): string[] => s.split('\n')

describe('the detail a stop lays on the cap of its globe', () => {
  afterAll(() => setFrame(1, 1))

  it('leaves the text of the globe and of a cap without it to the letter', () => {
    const none = planet()
    const plain = planet(options())
    const lit = planet(options({ light: { relief: 1, own: 1 } }))
    const on = planet(options({ detail: detail() }))
    expect(hash(none.material.fragmentShader)).toBe(KEPT)
    expect(on.material.fragmentShader).toBe(plain.material.fragmentShader)
    expect(Object.keys(on.material.uniforms)).toEqual(Object.keys(plain.material.uniforms))
    const shapes: PatchShader[] = [
      { slots: 6, own: false, gain: false, minor: false, glow: false },
      { slots: 6, own: false, gain: false, minor: false, glow: false, cap: true },
      { slots: 8, own: true, gain: true, minor: true, glow: true, cap: true, capLight: true, turn: true, centres: true },
      { slots: 6, own: true, gain: false, minor: false, glow: false, cut: true },
    ]
    for (const s of shapes) expect(planetFrag({ ...s, detail: undefined as unknown as string })).toBe(planetFrag(s))
    expect(plain.cap!.material.fragmentShader).toBe(planetFrag(shapes[1]!))
    expect(plain.cap!.material.vertexShader).toBe(capVert([false, false, false], plain.cap!.gridsDeg.length))
    expect(lit.cap!.material.vertexShader).toBe(capVert([false, false, false], lit.cap!.gridsDeg.length, true))
    expect(Object.keys(plain.cap!.material.uniforms).filter((k) => k === 'uFrame' || k.startsWith('uDetail'))).toEqual([])
    for (const p of [none, plain, lit, on]) p.dispose()
  })

  it('adds the stop\'s text once before main, reads it three times and changes four lines of the cap with a light of its own', () => {
    for (const s of [{ capLight: true, turn: true }, { capLight: true }, { turn: true }, {}] as Partial<PatchShader>[]) {
      const base: PatchShader = { slots: 6, own: true, gain: true, minor: false, glow: false, cap: true, ...s }
      const off = lines(planetFrag(base))
      const on = lines(planetFrag({ ...base, detail: text }))
      const added = on.filter((l) => !off.includes(l))
      const lost = off.filter((l) => !on.includes(l))
      expect(lost.length).toBe(2)
      expect(lost[0]).toContain(s.capLight ? 'np = normalize(np + nc * uCapLight.x);' : 'vec3 np = normalize(n - slopeW * strength);')
      expect(lost[1]).toContain('if (own > 0.0) col = mix(col, inverseFilmic(ownSum / own) * uOwnGain')
      const whole = on.join('\n')
      expect(whole.split(text).length).toBe(2)
      expect(whole.indexOf(text)).toBeLessThan(whole.indexOf('void main()'))
      expect(whole.indexOf(text)).toBeGreaterThan(whole.indexOf('vec3 curveAt(float ndl)'))
      expect(whole.split('groundDetail(').length - 1).toBe(4)
      expect(whole).toContain('uniform float uFrame;')
      expect(whole).toContain('in vec3 vCapN;')
      expect(whole).toContain('float texelPx = 1.0 / max(seen * uFrame, 1e-20);')
      expect(whole).toContain(s.capLight ? 'np = normalize(np + nc * uCapLight.x + nt);' : 'vec3 np = normalize(n - slopeW * strength + nt);')
      expect(whole).toContain(s.capLight ? 'normalize(n + nc * uCapLight.y + nt)' : 'nt == vec3(0.0) ? 1.0 : 1.0 + clamp((dot(normalize(n + nt), uSunW) - ndl0)')
      expect(whole).toContain(s.turn ? 'spinBy(transpose(uBodyToWorld) * normalize(vCapN), uSpinTurn)' : 'spinY(transpose(uBodyToWorld) * normalize(vCapN), uSpin)')
      expect(whole.includes('uniform vec2 uCapLight;')).toBe(s.capLight === true)
      expect(added.length).toBeGreaterThan(20)
      for (const banned of ['gl_FragDepth', 'Math.random', 'Date.now', 'performance.now']) expect(whole).not.toContain(banned)
      expect(whole.split('outColor = ').length).toBe(off.join('\n').split('outColor = ').length)
      expect(on[on.length - 2]).toBe(off[off.length - 2])
    }
  })

  it('gives the cap the stop\'s uniforms and the frame factor, the globe none of them, and the cap its normal without a light of its own', () => {
    const d = detail()
    const p = planet(options({ detail: d }), true)
    const cap = p.cap!
    expect(cap.material.fragmentShader).toBe(planetFrag({ slots: 6, own: false, gain: false, minor: false, glow: false, turn: true, cap: true, detail: text }))
    expect(cap.material.vertexShader).toBe(capVert([false, false, false], cap.gridsDeg.length, true))
    expect(cap.material.uniforms.uDetailDepth).toBe(d.uniforms.uDetailDepth)
    expect(cap.material.uniforms.uDetailRise).toBe(d.uniforms.uDetailRise)
    expect(cap.material.uniforms.uCapLight).toBeUndefined()
    expect(Object.keys(p.material.uniforms).filter((k) => k === 'uFrame' || k.startsWith('uDetail'))).toEqual([])
    for (const [height, master, want] of [[1080, 1080, 1], [540, 1080, 0.5], [2160, 1080, 2]] as [number, number, number][]) {
      setFrame(height, master)
      p.update(new THREE.Vector3(0, 0, 1.5), new THREE.Vector3(1, 0, 0), 0.2, 1, 1)
      expect(cap.material.uniforms.uFrame!.value).toBe(want)
    }
    p.dispose()
  })

  it('refuses a text without the function, with a word that draws or cuts, with a sampler, and uniforms that are not named, not given or not declared', () => {
    const bad = (t: string, uniforms: Record<string, THREE.IUniform> = {}): (() => string) => () => capDetail({ text: t, uniforms })
    expect(capDetail(detail())).toBe(text)
    expect(capDetail({ text: body.replace('uDetailDepth', '0.1').replace('uDetailRise', '2.0'), uniforms: {} })).toContain('groundDetail')
    expect(bad('float groundDetail(vec3 dir) { return 1.0; }')).toThrow('defines vec4 groundDetail(vec3 dir, float height, vec3 normal, float texelPx)')
    expect(bad('vec4 groundDetail(vec3 dir, float height, vec3 normal) { return vec4(1.0); }')).toThrow('defines vec4 groundDetail')
    for (const [word, line] of [['void main', 'void main() {}'], ['discard', 'void cut() { discard; }'], ['outColor', 'void put() { outColor = vec4(0.0); }'], ['gl_FragDepth', 'void sink() { gl_FragDepth = 0.0; }'], ['a sampler', 'uniform sampler2D uDetailMap;']] as [string, string][]) {
      expect(bad(body.replace('uDetailDepth', '0.1').replace('uDetailRise', '2.0') + '\n' + line)).toThrow('may not hold ' + word)
    }
    expect(bad('uniform float uDepth;\n' + body, { uDepth: { value: 1 } })).toThrow('named uDetail and its own name, not uDepth')
    expect(bad(text, { uDetailDepth: { value: 1 } })).toThrow('declares uDetailRise and is not given it')
    expect(bad(text, { ...detail().uniforms, uDetailMore: { value: 1 } })).toThrow('is given uDetailMore and does not declare it')
    expect(bad(text, { ...detail().uniforms, uGain: { value: 1 } })).toThrow('not uGain')
    expect(bad('uniform float uDetailDepth;\n' + text, detail().uniforms)).toThrow('declares a uniform twice')
    expect(capDetail({ text: 'uniform vec3 uDetailA, uDetailB[2];\nuniform highp float uDetailC;\n' + body.replace('uDetailDepth', 'uDetailC').replace('uDetailRise', 'uDetailA.x'), uniforms: { uDetailA: { value: 0 }, uDetailB: { value: 0 }, uDetailC: { value: 0 } } })).toContain('uDetailB[2]')
    expect(() => planet(options({ detail: { text: 'void main() {}', uniforms: {} } }))).toThrow('defines vec4 groundDetail')
  })
})
