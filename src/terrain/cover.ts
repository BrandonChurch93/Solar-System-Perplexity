import * as THREE from 'three'
import { Pass } from '../core/pass'
import type { CoverState } from '../core/types'

const FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform float uAmount;
out vec4 outColor;
void main() {
  outColor = vec4(uColor, uAmount);
}`

export class Cover {
  private readonly pass = new Pass(FRAG, { uColor: { value: new THREE.Vector3(1, 1, 1) }, uAmount: { value: 0 } }, {
    transparent: true,
    blending: THREE.CustomBlending,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.ZeroFactor,
    blendDstAlpha: THREE.OneFactor,
  })

  render(renderer: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget, cover: CoverState, exposure: number): void {
    const u = this.pass.material.uniforms
    ;(u.uColor!.value as THREE.Vector3).fromArray(cover.color).multiplyScalar(1 / exposure)
    u.uAmount!.value = cover.amount
    this.pass.render(renderer, target)
  }
}
