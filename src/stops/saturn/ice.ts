import * as THREE from 'three'
import { diagUniform } from '../../diagnostics/diag'
import { RING_LAYOUT_GLSL, RING_PROFILE_GLSL } from './profile'

export interface IceLook {
  count: number
  box: [number, number, number]
  heightPower: number
  blur: number
  radius: [number, number]
  near: [number, number]
  energy: number
  energyPower: number
  dim: [number, number]
  tint: [number, number, number]
  glint: [number, number]
  drift: number
  thin: number
  thinRange: [number, number]
  heightRange: [number, number]
  dense: [number, number]
  eye: [number, number]
  lod: number
}

const VERT = /* glsl */ `
in vec4 aSeed;
${RING_PROFILE_GLSL.slice(0, RING_PROFILE_GLSL.indexOf('float ringShadowAt'))}
${RING_LAYOUT_GLSL}
uniform vec2 uDense;
uniform vec2 uEye;
uniform float uLod;
uniform vec3 uCamL;
uniform vec3 uSkimL;
uniform vec3 uShadowL;
uniform float uPolar;
uniform float uTime;
uniform vec2 uView;
uniform vec3 uBox;
uniform float uHeightPower;
uniform float uBlur;
uniform vec2 uRadius;
uniform vec2 uNear;
uniform vec2 uEnergy;
uniform vec2 uDim;
uniform vec3 uTint;
uniform vec2 uGlint;
uniform float uDrift;
uniform float uThin;
uniform vec2 uThinRange;
uniform float uGain;
out vec2 vQ;
out vec3 vCol;
out float vSoft;
float ringAt(vec3 q) {
  vec3 lay = ringLayout(q, length(q.xz));
  float x = ringRadius(lay.x);
  vec4 s = x > 0.0 && x < 1.0 ? profAt(x, uLod) : vec4(0.0);
  return smoothstep(uDense.x, uDense.y, s.a * dot(s.rgb, vec3(0.2126, 0.7152, 0.0722)) * lay.y);
}
void main() {
  float h1 = fract(aSeed.w * 7.13 + 0.37);
  float h2 = fract(aSeed.w * 13.71 + 0.11);
  float h3 = fract(aSeed.w * 29.37 + 0.71);
  float h4 = fract(aSeed.w * 53.11 + 0.53);
  vec3 base = vec3(aSeed.x * uBox.x, uBox.z + uBox.y * pow(aSeed.y, uHeightPower), aSeed.z * uBox.x);
  base += vec3(h1 - 0.5, 0.0, h2 - 0.5) * uDrift * uTime;
  base.y += 0.004 * sin(uTime * (0.3 + h3) + 6.2832 * h4);
  vec3 rel = vec3(mod(base.x - uCamL.x + 0.5 * uBox.x, uBox.x) - 0.5 * uBox.x, base.y - uCamL.y, mod(base.z - uCamL.z + 0.5 * uBox.x, uBox.x) - 0.5 * uBox.x);
  vec3 p = uCamL + rel;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float d = length(mv.xyz);
  float want = uBlur / max(d, 1e-4);
  float R = clamp(want, uRadius.x, uRadius.y);
  vec3 ss = normalize(vec3(uShadowL.x, uShadowL.y / uPolar, uShadowL.z));
  float along = dot(p, ss);
  float lit = along > 0.0 ? 1.0 : smoothstep(0.97, 1.03, length(p - ss * along));
  float edge = 1.0 - smoothstep(0.34 * uBox.x, 0.47 * uBox.x, max(abs(rel.x), abs(rel.z)));
  float close = smoothstep(uNear.x, uNear.y, d);
  float thin = mix(uThin, 1.0, smoothstep(uThinRange.x, uThinRange.y, length(p - uSkimL)));
  float below = smoothstep(uEye.x, uEye.y, (uCamL.y - p.y) / max(d, 1e-4));
  vec3 behind = uCamL + (p - uCamL) * (uCamL.y / max(uCamL.y - p.y, 1e-4));
  float dense = below > 0.0 ? ringAt(vec3(p.x, 0.0, p.z)) * ringAt(vec3(behind.x, 0.0, behind.z)) : 0.0;
  float tw = pow(0.5 + 0.5 * sin(6.2832 * h3 + uTime * (1.5 + 6.0 * h4)), uGlint.y);
  float energy = uEnergy.x * pow(h1, uEnergy.y) * (1.0 + uGlint.x * tw);
  float flux = min(want / R, 1.0) * pow(min(uDim.x / R, 1.0), 0.5 * uDim.y);
  vCol = uTint * mix(vec3(1.0), vec3(0.82, 0.92, 1.1), h2 * h2) * (uGain * energy * flux * flux * lit * edge * close * thin * below * dense);
  vSoft = smoothstep(2.5, 7.0, R);
  vQ = position.xy;
  gl_Position = projectionMatrix * mv;
  gl_Position.xy += position.xy * R * 2.0 / uView * gl_Position.w;
  if (mv.z > -0.004 || dot(vCol, vec3(1.0)) < 1e-5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`

const FRAG = /* glsl */ `
precision highp float;
in vec2 vQ;
in vec3 vCol;
in float vSoft;
uniform int uDiag;
out vec4 outColor;
void main() {
  if (uDiag != 0) discard;
  float rho = length(vQ);
  float a = mix(exp(-rho * rho * 3.5), (1.0 - smoothstep(0.72, 1.0, rho)) * (0.75 + 0.25 * rho * rho), vSoft);
  outColor = vec4(vCol * a, 0.0);
}`

function seeds(count: number): Float32Array {
  const out = new Float32Array(count * 4)
  let s = 0x9e3779b9
  const next = (): number => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  for (let i = 0; i < out.length; i++) out[i] = next()
  return out
}

export class Ice {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(look: IceLook, polar: number, ring: Record<string, THREE.IUniform>) {
    const geometry = new THREE.InstancedBufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3))
    geometry.setIndex([0, 1, 2, 0, 2, 3])
    geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds(look.count), 4))
    geometry.instanceCount = look.count
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG,
      uniforms: {
        ...ring, uJunction: { value: 5 }, uDense: { value: new THREE.Vector2().fromArray(look.dense) }, uEye: { value: new THREE.Vector2().fromArray(look.eye) }, uLod: { value: look.lod },
        uCamL: { value: new THREE.Vector3() }, uSkimL: { value: new THREE.Vector3() }, uShadowL: { value: new THREE.Vector3(1, 0, 0) }, uPolar: { value: polar },
        uTime: { value: 0 }, uView: { value: new THREE.Vector2(1920, 1080) }, uBox: { value: new THREE.Vector3().fromArray(look.box) }, uHeightPower: { value: look.heightPower },
        uBlur: { value: look.blur }, uRadius: { value: new THREE.Vector2().fromArray(look.radius) }, uNear: { value: new THREE.Vector2().fromArray(look.near) },
        uEnergy: { value: new THREE.Vector2(look.energy, look.energyPower) }, uTint: { value: new THREE.Vector3().fromArray(look.tint) }, uDim: { value: new THREE.Vector2().fromArray(look.dim) }, uGlint: { value: new THREE.Vector2().fromArray(look.glint) },
        uDrift: { value: look.drift }, uThin: { value: look.thin }, uThinRange: { value: new THREE.Vector2().fromArray(look.thinRange) }, uGain: { value: 1 }, uDiag: diagUniform,
      },
      transparent: true, depthWrite: false, depthTest: false,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    })
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = 9
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
