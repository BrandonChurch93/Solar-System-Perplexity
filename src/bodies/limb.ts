import * as THREE from 'three'
import type { Planet } from './planet'

export interface LimbAirParams {
  height: number
  top: number
}

const SHARED = ['uSunW', 'uHazeForward', 'uGain', 'uWeight', 'uVignette', 'uAspect', 'uGrazingShape', 'uGrazingDay', 'uGrazingFill', 'uGrazingHighlight', 'uGrazingDusk', 'uGrazingSun', 'uGrazingRange', 'uGrazingSide', 'uGrazingSideRange'] as const

const VERT = /* glsl */ `
out vec3 vPos;
out vec3 vLocal;
out vec3 vEye;
out vec3 vClip;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz;
  vLocal = position;
  vEye = (inverse(modelMatrix) * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
  vClip = gl_Position.xyw;
}`

export const LIMB_AIR_GLSL = /* glsl */ `
float limbAirShare(float h, float height, float depth, float day, float side) {
  return 1.0 - exp(-depth * exp(-max(h, 0.0) / height) * day * side);
}`

const FRAG = /* glsl */ `
precision highp float;
in vec3 vPos;
in vec3 vLocal;
in vec3 vEye;
in vec3 vClip;
uniform int uDiag;
uniform mat4 modelMatrix;
uniform vec3 uSunW;
uniform float uHazeForward;
uniform float uGain;
uniform float uWeight;
uniform float uVignette;
uniform float uAspect;
uniform float uLimbHeight;
uniform vec4 uGrazingShape;
uniform vec2 uGrazingDay;
uniform vec3 uGrazingFill;
uniform vec3 uGrazingHighlight;
uniform vec3 uGrazingDusk;
uniform vec3 uGrazingSun;
uniform vec2 uGrazingRange;
uniform vec3 uGrazingSide;
uniform vec2 uGrazingSideRange;
out vec4 outColor;
${LIMB_AIR_GLSL}
void main() {
  if (uDiag >= 2 || !(uGrazingShape.x > 0.0)) discard;
  vec3 dir = normalize(vPos);
  vec3 ray = normalize(vLocal - vEye);
  float b = -dot(vEye, ray);
  if (!(b > 0.0)) discard;
  vec3 tangent = vEye + ray * b;
  float rt = length(tangent);
  vec3 at = normalize(mat3(modelMatrix) * tangent);
  float day = smoothstep(uGrazingDay.x, uGrazingDay.y, dot(at, uSunW));
  float side = smoothstep(uGrazingSideRange.x, uGrazingSideRange.y, dot(at, uGrazingSide));
  float share = limbAirShare(rt - 1.0, uLimbHeight, uGrazingShape.x, day, side);
  float highlight = smoothstep(uGrazingRange.x, uGrazingRange.y, dot(at, uGrazingSun));
  float forward = 1.0 + uHazeForward * pow(max(dot(dir, uSunW), 0.0), 6.0);
  vec3 pale = mix(uGrazingDusk, uGrazingFill + uGrazingHighlight * highlight, day) * forward;
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  pale *= uGain * uWeight / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = vec4(pale * share, share);
}`

export function limbAirShare(h: number, height: number, depth: number, day: number, side: number): number {
  return 1 - Math.exp(-depth * Math.exp(-Math.max(h, 0) / height) * day * side)
}

export class LimbAir {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(planet: Planet, p: LimbAirParams, diag: THREE.IUniform<number>) {
    if (!(p.height > 0) || !(p.top > 0)) throw new Error('the limb air needs a height and a top above 0')
    const from = planet.material.uniforms
    const uniforms: Record<string, THREE.IUniform> = { uDiag: diag, uLimbHeight: { value: p.height } }
    for (const name of SHARED) {
      const u = from[name]
      if (!u) throw new Error('the planet has no ' + name + ' for its limb air')
      uniforms[name] = u
    }
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      side: THREE.BackSide,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
      premultipliedAlpha: true,
      transparent: true,
      depthWrite: false,
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1 + p.top * p.height, 160, 80), this.material)
    this.mesh.renderOrder = 6
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
