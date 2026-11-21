import * as THREE from 'three'
import { diagUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'

export interface CoronaLook {
  inner: number
  outer: number
  gain: number
  edge: number
  wave: { amount: number; scale: number; speed: number; sway: number }
  drift: number
  hide: { from: number; to: number; amount: number }
}

const VERT = /* glsl */ `
out vec3 vPos;
out vec3 vClip;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
  vClip = gl_Position.xyw;
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform int uDiag;
uniform vec3 uCenter;
uniform mat3 uToSet;
uniform vec2 uRange;
uniform float uGain;
uniform float uShow;
uniform float uEdge;
uniform float uTime;
uniform vec4 uWave;
uniform float uDrift;
uniform vec3 uHide;
uniform float uVignette;
uniform float uAspect;
in vec3 vPos;
in vec3 vClip;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
const float TAU = 6.283185307179586;
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float cells(vec2 p, float wrap) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float x0 = mod(i.x, wrap);
  float x1 = mod(i.x + 1.0, wrap);
  return mix(mix(hash(vec2(x0, i.y)), hash(vec2(x1, i.y)), f.x), mix(hash(vec2(x0, i.y + 1.0)), hash(vec2(x1, i.y + 1.0)), f.x), f.y);
}
float stream(float u, float lr, float t) {
  return 0.5 * cells(vec2(u * 11.0 + 3.0, lr * uWave.y * 0.45 - t * 0.6 + 5.0), 11.0) + 0.3 * cells(vec2(u * 40.0, lr * uWave.y - t), 40.0) + 0.2 * cells(vec2(u * 96.0 + 7.0, lr * uWave.y * 1.9 - t * 1.6 + 3.0), 96.0);
}
vec3 ray(vec2 uv, vec2 dx, vec2 dy) {
  return inverseFilmic(textureGrad(uMap, uv, dx, dy).rgb);
}
void main() {
  if (uDiag >= 2) discard;
  vec3 dir = normalize(vPos);
  float t = max(dot(uCenter, dir), 0.0);
  vec3 near = dir * t - uCenter;
  float b = length(near);
  vec3 n = uToSet * (near / max(b, 1e-5));
  float span = log(uRange.y / uRange.x);
  float u = atan(n.y, n.x) / TAU;
  float v = log(max(b, 1e-4) / uRange.x) / span;
  float u2 = fract(u);
  vec2 dx = vec2(abs(dFdx(u)) < abs(dFdx(u2)) ? dFdx(u) : dFdx(u2), dFdx(v));
  vec2 dy = vec2(abs(dFdy(u)) < abs(dFdy(u2)) ? dFdy(u) : dFdy(u2), dFdy(v));
  float height = max(b - 1.0, 0.0);
  float grow = smoothstep(0.0, 0.25, height);
  float sway = uWave.w * grow * (sin(u * TAU * 9.0 + v * 2.5 - uTime * 1.1) - sin(u * TAU * 9.0 + v * 2.5) + 0.6 * (sin(u * TAU * 23.0 - v * 4.0 + uTime * 1.7) - sin(u * TAU * 23.0 - v * 4.0)));
  float turn = uDrift * uTime * grow;
  vec2 uv = vec2(u + sway + turn, clamp(v, 0.0, 1.0));
  vec3 col = ray(uv, dx, dy);
  float glare = uHide.z * smoothstep(uHide.x, uHide.y, dot(col, vec3(0.2126, 0.7152, 0.0722)));
  float lr = log(max(b, 1.0));
  float flick = stream(u, lr, uTime * uWave.z) - stream(u, lr, 0.0);
  col *= max(1.0 + uWave.x * grow * flick, 0.3);
  float inside = b < 1.0 ? exp((b - 1.0) / uEdge) : 1.0;
  float out0 = 1.0 - smoothstep(0.92, 1.0, v);
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain * inside * out0 / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = vec4(col, glare * inside * out0) * uShow;
}`

export class Corona {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly toSet = new THREE.Matrix3()
  private readonly m4 = new THREE.Matrix4()
  private readonly q = new THREE.Quaternion()

  constructor(map: THREE.Texture, look: CoronaLook) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uMap: { value: map }, uDiag: diagUniform,
        uCenter: { value: new THREE.Vector3() }, uToSet: { value: this.toSet },
        uRange: { value: new THREE.Vector2(look.inner, look.outer) },
        uGain: { value: look.gain }, uShow: { value: 1 }, uEdge: { value: look.edge }, uTime: { value: 0 },
        uWave: { value: new THREE.Vector4(look.wave.amount, look.wave.scale, look.wave.speed, look.wave.sway) },
        uDrift: { value: look.drift }, uHide: { value: new THREE.Vector3(look.hide.from, look.hide.to, look.hide.amount) }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 },
      },
      side: THREE.BackSide,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(look.outer, 96, 48), this.material)
    this.mesh.renderOrder = 6
    this.mesh.frustumCulled = false
  }

  update(center: THREE.Vector3, rotation: THREE.Quaternion, time: number, gain: number, vignette: number, aspect: number, look: CoronaLook, shown = 1): void {
    const u = this.material.uniforms
    ;(u.uCenter!.value as THREE.Vector3).copy(center)
    this.toSet.setFromMatrix4(this.m4.makeRotationFromQuaternion(this.q.copy(rotation).invert()))
    u.uTime!.value = time
    u.uGain!.value = gain * look.gain
    u.uShow!.value = shown
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
