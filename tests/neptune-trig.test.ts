import { describe, expect, it } from 'vitest'
import { ownTrigText, TRIG_GLSL } from '../src/stops/neptune/trig'

// The text change that gives a graphics card the Neptune stop's own asin, acos and atan (see src/stops/neptune/trig.ts).
describe('ownTrigText', () => {
  it('leaves a text without asin, acos or atan as it is', () => {
    const text = 'precision highp float;\nvoid main() { gl_FragColor = vec4(sin(1.0)); }'
    expect(ownTrigText(text)).toBe(text)
  })

  it('turns every call and puts the functions in once, after the precision lines', () => {
    const head = 'precision highp float;\nprecision highp int;'
    const text = head + '\nfloat f(float x) { return asin(x) + acos (x) + atan(x, 1.0) + atan(x); }'
    const out = ownTrigText(text)
    expect(out.startsWith(head)).toBe(true)
    expect(out.split(TRIG_GLSL).length).toBe(2)
    expect(out.indexOf(TRIG_GLSL)).toBe(head.length + 1)
    const body = out.replace(TRIG_GLSL, '')
    expect(body).toContain('nepAsin(x) + nepAcos (x) + nepAtan(x, 1.0) + nepAtan(x)')
    expect(/\b(?:asin|acos|atan)\s*\(/.test(out)).toBe(false)
  })

  it('puts the functions at the top of a text that has no precision line', () => {
    const text = 'varying vec3 vDir;\nvoid main() { float a = atan(vDir.z, vDir.x); gl_Position = vec4(a); }'
    const out = ownTrigText(text)
    expect(out.startsWith('\n' + TRIG_GLSL)).toBe(true)
    expect(out.endsWith('float a = nepAtan(vDir.z, vDir.x); gl_Position = vec4(a); }')).toBe(true)
  })

  it('does not touch other names that hold the three words', () => {
    const text = 'float myatan(float x) { return x; }\nfloat g(float x) { return myatan(x) + fastAsin(x) + asinh(x); }'
    expect(ownTrigText(text)).toBe(text)
  })

  it('holds every function it turns the calls to, and calls no built in one itself', () => {
    for (const name of ['float nepAsin(float x)', 'float nepAcos(float x)', 'float nepAtan(float y, float x)', 'float nepAtan(float t)']) {
      expect(TRIG_GLSL.split(name).length).toBe(2)
    }
    expect(/\b(?:asin|acos|atan|sin|cos|tan|pow|exp|log)\s*\(/.test(TRIG_GLSL)).toBe(false)
  })
})
