import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { TEXEL_GLSL, bindImplicit, implicitUniform } from '../src/core/texel'

describe('implicit texel switch', () => {
  it('is off unless the engine turns it on', () => {
    expect(implicitUniform.value).toBe(0)
  })

  it('binds the shared uniform only to shaders that declare it', () => {
    const root = new THREE.Group()
    const withIt = new THREE.ShaderMaterial({ fragmentShader: TEXEL_GLSL + 'void main() {}' })
    const without = new THREE.ShaderMaterial({ fragmentShader: 'void main() {}' })
    const child = new THREE.Group()
    child.add(new THREE.Mesh(new THREE.BufferGeometry(), [without, withIt]))
    root.add(child, new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial()))
    bindImplicit(root)
    bindImplicit(undefined)
    expect(withIt.uniforms.uImplicit).toBe(implicitUniform)
    expect(without.uniforms.uImplicit).toBeUndefined()
  })

  it('keeps the explicit gradient fetch as the fallback', () => {
    expect(TEXEL_GLSL).toContain('textureGrad(tex, uv, dx, dy)')
    expect(TEXEL_GLSL).toContain('uImplicit > 0.5')
  })
})
