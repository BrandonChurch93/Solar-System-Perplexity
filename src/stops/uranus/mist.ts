import * as THREE from 'three'
import { diagUniform } from '../../diagnostics/diag'
import { NOISE_GLSL } from '../../terrain/relief'

type Rgb = [number, number, number]

export interface MistLook {
  glow: Rgb
  deep: Rgb
  high: Rgb
  up: [number, number]
  down: [number, number]
  peak: number
  sun: [number, number]
  wisp: [number, number]
}

const VERT = /* glsl */ `
uniform vec3 uSunW;
out vec2 vP;
out vec3 vDir;
flat out vec3 vEye;
flat out vec3 vSun;
void main() {
  vP = position.xy * vec2(1.0 / projectionMatrix[0][0], 1.0 / projectionMatrix[1][1]);
  mat4 back = inverse(modelViewMatrix);
  vEye = back[3].xyz;
  vDir = mat3(back) * vec3(vP, -1.0);
  vSun = mat3(viewMatrix) * uSunW;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`

const FRAG = /* glsl */ `
precision highp float;
uniform float uMist;
uniform vec3 uFocus;
uniform vec3 uBillow;
uniform vec3 uGlow;
uniform vec3 uDeep;
uniform vec3 uHigh;
uniform vec4 uShape;
uniform vec2 uDown;
uniform vec2 uSunK;
uniform vec2 uWisp;
uniform float uGain;
uniform int uDiag;
in vec2 vP;
in vec3 vDir;
flat in vec3 vEye;
flat in vec3 vSun;
out vec4 outColor;
${NOISE_GLSL}
float rush(vec2 p, vec3 k) {
  vec2 r = p - uFocus.xy;
  float rad = length(r) + 1e-4;
  vec3 q = vec3(r / rad * k.x, log(rad) * k.y - uFocus.z * k.z);
  float n = 0.6 * vnoise(q) + 0.28 * vnoise(q * 2.07 + 4.3) + 0.12 * vnoise(q * 4.3 + 9.1);
  return (n - 0.5) * smoothstep(0.03, 0.3, rad);
}
void main() {
  if (uDiag >= 2) discard;
  vec3 ray = normalize(vec3(vP, -1.0));
  float dist = length(vEye);
  float d = acos(clamp(dot(normalize(vDir), -vEye / dist), -1.0, 1.0)) - asin(min(1.0 / dist, 1.0)) + uShape.w;
  float up = mix(uShape.x, uShape.y, uMist);
  float w = d > 0.0 ? up : mix(uDown.x, uDown.y, uMist);
  float g = 1.0 / (1.0 + d * d / (w * w));
  float away = acos(clamp(dot(ray, vSun), -1.0, 1.0));
  float k = mix(uSunK.x, 1.0, exp(-away * away / (uSunK.y * uSunK.y)));
  vec3 col = mix(mix(uDeep, uHigh, smoothstep(-up, up, d)), uGlow, g * k);
  float n = rush(vP, uBillow);
  col *= 1.0 + uWisp.x * n;
  float a = clamp(uMist + uWisp.y * n * 4.0 * uMist * (1.0 - uMist), 0.0, 1.0);
  outColor = vec4(col * uGain, a);
}`

export class Mist {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(look: MistLook) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uSunW: { value: new THREE.Vector3(1, 0, 0) }, uMist: { value: 0 },
        uFocus: { value: new THREE.Vector3() }, uBillow: { value: new THREE.Vector3(1, 1, 1) },
        uGlow: { value: new THREE.Vector3().fromArray(look.glow) }, uDeep: { value: new THREE.Vector3().fromArray(look.deep) }, uHigh: { value: new THREE.Vector3().fromArray(look.high) },
        uShape: { value: new THREE.Vector4(look.up[0], look.up[1], 0, look.peak) }, uDown: { value: new THREE.Vector2().fromArray(look.down) }, uSunK: { value: new THREE.Vector2().fromArray(look.sun) }, uWisp: { value: new THREE.Vector2().fromArray(look.wisp) },
        uGain: { value: 1 }, uDiag: diagUniform,
      },
      transparent: true,
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
      depthTest: false,
      depthWrite: false,
    })
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = 12
    this.mesh.visible = false
  }

  update(amount: number, sun: THREE.Vector3, focus: [number, number], phase: number, billow: [number, number, number], gain: number): void {
    this.mesh.visible = amount > 0
    const u = this.material.uniforms
    u.uMist!.value = amount
    ;(u.uSunW!.value as THREE.Vector3).copy(sun)
    ;(u.uFocus!.value as THREE.Vector3).set(focus[0], focus[1], phase)
    ;(u.uBillow!.value as THREE.Vector3).fromArray(billow)
    u.uGain!.value = gain
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
