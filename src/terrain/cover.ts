import * as THREE from 'three'
import { Pass } from '../core/pass'
import type { CoverState } from '../core/types'

const FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform vec3 uLow;
uniform float uAmount;
uniform vec3 uHorizon;
uniform float uSoft;
uniform vec2 uFlow;
uniform vec2 uTan;
in vec2 vUv;
out vec4 outColor;
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += a * noise(p);
    p = p * 2.03 + 11.7;
    a *= 0.5;
  }
  return s;
}
void main() {
  vec2 p = (vUv * 2.0 - 1.0) * uTan;
  float s = dot(p, uHorizon.xy) + uHorizon.z;
  vec2 along = vec2(uHorizon.y, -uHorizon.x);
  vec2 q = vec2(dot(p, along), s);
  float streak = fbm(q * vec2(1.6, 5.0) + uFlow) - 0.47;
  float wisp = fbm(q * vec2(4.0, 13.0) + uFlow * 2.3 + 5.0) - 0.47;
  float band = smoothstep(-uSoft, uSoft, s + 0.12 * streak);
  vec3 col = mix(uLow, uColor, band) * (1.0 + 0.5 * streak + 0.22 * wisp);
  col *= mix(1.0, 0.3, smoothstep(0.04, 0.55, s)) * mix(1.0, 0.7, smoothstep(0.0, -0.6, s));
  float a = smoothstep(0.0, 1.0, uAmount * (1.35 + 0.9 * streak) - 0.18 * (1.0 - uAmount));
  a = mix(a, 1.0, smoothstep(0.82, 1.0, uAmount));
  outColor = vec4(col, a);
}`

export class Cover {
  private readonly pass = new Pass(FRAG, {
    uColor: { value: new THREE.Vector3(1, 1, 1) }, uLow: { value: new THREE.Vector3(1, 1, 1) }, uAmount: { value: 0 }, uHorizon: { value: new THREE.Vector3(0, 1, 0) }, uSoft: { value: 0.2 }, uFlow: { value: new THREE.Vector2() }, uTan: { value: new THREE.Vector2(1, 1) },
  }, {
    transparent: true,
    blending: THREE.CustomBlending,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.ZeroFactor,
    blendDstAlpha: THREE.OneFactor,
  })

  render(renderer: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget, cover: CoverState, exposure: number, vfov: number, aspect: number): void {
    const u = this.pass.material.uniforms
    ;(u.uColor!.value as THREE.Vector3).fromArray(cover.color).multiplyScalar(1 / exposure)
    ;(u.uLow!.value as THREE.Vector3).fromArray(cover.low ?? cover.color).multiplyScalar(1 / exposure)
    u.uAmount!.value = cover.amount
    const h = cover.horizon
    ;(u.uHorizon!.value as THREE.Vector3).set(h ? h.normal[0] : 0, h ? h.normal[1] : 1, h ? h.offset : 0)
    u.uSoft!.value = h ? h.soft : 4
    ;(u.uFlow!.value as THREE.Vector2).set(cover.flow?.[0] ?? 0, cover.flow?.[1] ?? 0)
    const t = Math.tan(THREE.MathUtils.degToRad(vfov) / 2)
    ;(u.uTan!.value as THREE.Vector2).set(t * aspect, t)
    this.pass.render(renderer, target)
  }
}
