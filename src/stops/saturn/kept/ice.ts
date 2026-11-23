import * as THREE from 'three'
import { diagUniform } from '../../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../../post/chain'
import { RING_LAYOUT_GLSL, RING_PROFILE_GLSL } from './profile'

export interface IceLook {
  count: number
  box: number
  lift: number
  size: [number, number]
  radius: [number, number]
  floor: number
  reach: [number, number]
  energy: [number, number, number]
  tint: [number, number, number]
  baked: [number, number]
  heightRange: [number, number]
  lod: number
}

const VERT = /* glsl */ `
in vec4 aSeed;
${RING_PROFILE_GLSL.slice(0, RING_PROFILE_GLSL.indexOf('float ringShadowAt'))}
${RING_LAYOUT_GLSL}
${INVERSE_FILMIC_GLSL}
uniform float uLod;
uniform vec3 uCamL;
uniform vec3 uSkimL;
uniform mat4 uSkimM;
uniform float uSkimW;
uniform vec4 uApron;
uniform vec3 uShadowL;
uniform float uPolar;
uniform vec2 uView;
uniform float uBox;
uniform float uLift;
uniform vec2 uSize;
uniform vec2 uRadius;
uniform float uFloor;
uniform vec2 uReach;
uniform vec3 uEnergy;
uniform vec3 uTint;
uniform vec2 uBaked;
uniform float uGain;
out vec2 vQ;
out vec3 vCol;
out vec3 vInv;
vec3 bandAt(vec3 q) {
  vec3 lay = ringLayout(q, length(q.xz));
  float x = ringRadius(lay.x);
  vec4 s = x > 0.0 && x < 1.0 ? profAt(x, uLod) : vec4(0.0);
  return inverseFilmic(s.rgb) * s.a * lay.y;
}
vec2 toPx(vec4 c) {
  return c.xy / c.w * 0.5 * uView;
}
void main() {
  float h1 = fract(aSeed.w * 7.13 + 0.37);
  float h2 = fract(aSeed.w * 13.71 + 0.11);
  float h3 = fract(aSeed.w * 29.37 + 0.71);
  float h4 = fract(aSeed.w * 53.11 + 0.53);
  vec2 rel = mod(aSeed.xz * uBox - uCamL.xz + 0.5 * uBox, uBox) - 0.5 * uBox;
  vec3 p = vec3(uCamL.x + rel.x, uLift, uCamL.z + rel.y);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float d = length(mv.xyz);
  float world = mix(uSize.x, uSize.y, aSeed.y * aSeed.y);
  vec4 c0 = projectionMatrix * mv;
  float turn = 6.2832 * h4;
  vec3 ax = vec3(cos(turn), 0.0, sin(turn)) * world;
  vec3 bx = vec3(-sin(turn), 0.0, cos(turn)) * world * mix(0.55, 1.0, h3);
  vec2 a = toPx(projectionMatrix * modelViewMatrix * vec4(p + ax, 1.0)) - toPx(c0);
  vec2 b = toPx(projectionMatrix * modelViewMatrix * vec4(p + bx, 1.0)) - toPx(c0);
  float want = max(length(a), length(b));
  float R = clamp(want, uRadius.x, uRadius.y);
  float k = R / max(want, 1e-6);
  a *= k;
  b *= k;
  float sxx = a.x * a.x + b.x * b.x + uFloor * uFloor;
  float sxy = a.x * a.y + b.x * b.y;
  float syy = a.y * a.y + b.y * b.y + uFloor * uFloor;
  float det = max(sxx * syy - sxy * sxy, 1e-8);
  vInv = vec3(syy, -sxy, sxx) / det;
  float ext = 2.6 * sqrt(max(sxx, syy)) + 0.5;
  vec3 ss = normalize(vec3(uShadowL.x, uShadowL.y / uPolar, uShadowL.z));
  float along = dot(p, ss);
  float lit = along > 0.0 ? 1.0 : smoothstep(0.97, 1.03, length(p - ss * along));
  float edge = 1.0 - smoothstep(0.38 * uBox, 0.48 * uBox, max(abs(rel.x), abs(rel.y)));
  float reach = 1.0 - smoothstep(uReach.x, uReach.y, d);
  vec4 sc = uSkimM * vec4(p, 1.0);
  vec2 su = sc.xy / max(sc.w, 1e-4) * 0.5 + 0.5;
  vec2 se = (su - uApron.xy) * uApron.zw;
  float baked = uSkimW * (sc.w > 1e-3 ? smoothstep(0.0, 0.05, min(min(se.x, 1.0 - se.x), se.y)) : 0.0) * (1.0 - smoothstep(uBaked.x, uBaked.y, length(p - uSkimL)));
  float energy = uEnergy.x + uEnergy.y * pow(h1, uEnergy.z);
  float flux = min(want / R, 1.0);
  float area = abs(a.x * b.y - a.y * b.x) / sqrt(det);
  vec3 band = reach * edge > 0.0 ? bandAt(vec3(p.x, 0.0, p.z)) : vec3(0.0);
  vCol = band * uTint * mix(vec3(1.06, 1.0, 0.92), vec3(0.9, 0.98, 1.1), h2) * (uGain * energy * flux * flux * mix(0.45, 1.0, clamp(area, 0.0, 1.0)) * lit * edge * reach * (1.0 - baked));
  vQ = position.xy * ext;
  gl_Position = c0;
  gl_Position.xy += position.xy * ext * 2.0 / uView * gl_Position.w;
  if (mv.z > -0.004 || dot(vCol, vec3(1.0)) < 1e-5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`

const FRAG = /* glsl */ `
precision highp float;
in vec2 vQ;
in vec3 vCol;
in vec3 vInv;
uniform int uDiag;
out vec4 outColor;
void main() {
  float m = vInv.x * vQ.x * vQ.x + 2.0 * vInv.y * vQ.x * vQ.y + vInv.z * vQ.y * vQ.y;
  outColor = vec4(vCol * exp(-0.5 * m), 0.0);
  if (uDiag != 0) discard;
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

  constructor(look: IceLook, polar: number, ring: Record<string, THREE.IUniform>, skim: THREE.Matrix4, skimW: THREE.IUniform<number>) {
    const geometry = new THREE.InstancedBufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3))
    geometry.setIndex([0, 1, 2, 0, 2, 3])
    geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds(look.count), 4))
    geometry.instanceCount = look.count
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG,
      uniforms: {
        ...ring, uJunction: { value: 5 }, uLod: { value: look.lod },
        uCamL: { value: new THREE.Vector3() }, uSkimL: { value: new THREE.Vector3() }, uSkimM: { value: skim }, uSkimW: skimW, uApron: { value: new THREE.Vector4(0, 0, 1, 1) }, uShadowL: { value: new THREE.Vector3(1, 0, 0) }, uPolar: { value: polar },
        uView: { value: new THREE.Vector2(1920, 1080) }, uBox: { value: look.box }, uLift: { value: look.lift }, uSize: { value: new THREE.Vector2().fromArray(look.size) },
        uRadius: { value: new THREE.Vector2().fromArray(look.radius) }, uFloor: { value: look.floor }, uReach: { value: new THREE.Vector2().fromArray(look.reach) },
        uEnergy: { value: new THREE.Vector3().fromArray(look.energy) }, uTint: { value: new THREE.Vector3().fromArray(look.tint) }, uBaked: { value: new THREE.Vector2().fromArray(look.baked) }, uGain: { value: 1 }, uDiag: diagUniform,
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
