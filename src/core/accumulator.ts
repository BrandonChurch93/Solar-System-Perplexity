import * as THREE from 'three'
import { Pass, floatTarget } from './pass'

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uPrev;
uniform sampler2D uSample;
uniform float uWeight;
uniform float uFirst;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec4 s = texture(uSample, vUv) * uWeight;
  outColor = uFirst > 0.5 ? s : texture(uPrev, vUv) + s;
}`

export class Accumulator {
  private a: THREE.WebGLRenderTarget
  private b: THREE.WebGLRenderTarget
  private readonly pass: Pass
  private count = 0

  constructor(width: number, height: number) {
    this.a = floatTarget(width, height, THREE.FloatType)
    this.b = floatTarget(width, height, THREE.FloatType)
    this.a.texture.minFilter = this.a.texture.magFilter = THREE.NearestFilter
    this.b.texture.minFilter = this.b.texture.magFilter = THREE.NearestFilter
    this.pass = new Pass(FRAG, { uPrev: { value: null }, uSample: { value: null }, uWeight: { value: 1 }, uFirst: { value: 1 } })
  }

  begin(): void {
    this.count = 0
  }

  add(renderer: THREE.WebGLRenderer, sample: THREE.Texture, weight: number): void {
    const u = this.pass.material.uniforms
    u.uPrev!.value = this.a.texture
    u.uSample!.value = sample
    u.uWeight!.value = weight
    u.uFirst!.value = this.count === 0 ? 1 : 0
    this.pass.render(renderer, this.b)
    const t = this.a
    this.a = this.b
    this.b = t
    this.count++
  }

  get texture(): THREE.Texture {
    return this.a.texture
  }

  get target(): THREE.WebGLRenderTarget {
    return this.a
  }

  dispose(): void {
    this.a.dispose()
    this.b.dispose()
    this.pass.dispose()
  }
}
