import * as THREE from 'three'
import { hazeHidden, keepTriangles, type Trim } from './trim'
import { AIR_LAW_GLSL } from '../terrain/air'
import { airLawUniforms, setHazeAir, type AirLaw, type HazeAir } from './air'

interface HazeCore {
  scaleHeight: number
  day: [number, number, number]
  dayFrom: number
  dayTo: number
}

export interface HazeParams {
  scaleHeight: number
  depth: number
  day: [number, number, number]
  twilight: [number, number, number]
  night?: [number, number, number]
  dayFrom?: number
  dayTo?: number
  strength: number
  extinction: number
  forward: number
  top: number
  core?: HazeCore
  glow?: boolean
}

export const HAZE_GLSL = /* glsl */ `
uniform vec3 uCam;
uniform vec3 uSunW;
uniform float uHazeH;
uniform float uHazeTau;
uniform vec3 uHazeDay;
uniform vec3 uHazeTwilight;
uniform vec3 uHazeNight;
uniform vec2 uHazeEdge;
uniform float uHazeStrength;
uniform float uHazeForward;
float hazeCh(float c, float scaleHeight) {
  float k = sqrt(1.5707963 / scaleHeight);
  return 1.0 / (max(c, 0.0) + 1.0 / k);
}
float hazeDensity(float h, float scaleHeight) {
  return exp(-max(h, 0.0) / scaleHeight);
}
float hazeDepthAt(vec3 dir, bool ground, float scaleHeight, out vec3 at) {
  float r = length(uCam);
  vec3 up = uCam / r;
  float c = dot(dir, up);
  float h = r - 1.0;
  float here = hazeDensity(h, scaleHeight);
  if (c >= 0.0) {
    at = up;
    return uHazeTau * here * hazeCh(c, scaleHeight);
  }
  float b = -r * c;
  vec3 tangent = uCam + dir * b;
  float rt = length(tangent);
  if (ground) {
    float disc = max(1.0 - rt * rt, 0.0);
    vec3 hit = uCam + dir * (b - sqrt(disc));
    at = normalize(hit);
    float mu = sqrt(disc);
    return max(uHazeTau * (hazeCh(mu, scaleHeight) - here * hazeCh(-c, scaleHeight)), 0.0);
  }
  at = tangent / rt;
  return max(uHazeTau * (2.0 * hazeDensity(rt - 1.0, scaleHeight) * hazeCh(0.0, scaleHeight) - here * hazeCh(-c, scaleHeight)), 0.0);
}
float hazeDepth(vec3 dir, bool ground, out vec3 at) {
  return hazeDepthAt(dir, ground, uHazeH, at);
}
float hazeForward(vec3 dir) {
  return 1.0 + uHazeForward * pow(max(dot(dir, uSunW), 0.0), 6.0);
}
vec3 hazeLight(vec3 at, vec3 dir) {
  float ndl = dot(at, uSunW);
  float day = smoothstep(uHazeEdge.x, uHazeEdge.y, ndl);
  float tw = smoothstep(-0.42, -0.04, ndl) * (1.0 - smoothstep(-0.04, 0.36, ndl));
  return ((uHazeDay * day * day + uHazeTwilight * tw) * hazeForward(dir) + uHazeNight) * uHazeStrength;
}`

export const GROUND_AIR_GLSL = /* glsl */ `
float airDepth(float ha, float ca, float hb, float cb, float scaleHeight, float depth) {
  float da = exp(-ha / scaleHeight);
  float db = exp(-hb / scaleHeight);
  if (ca >= 0.0) return max(depth * (da * hazeCh(ca, scaleHeight) - db * hazeCh(cb, scaleHeight)), 0.0);
  if (cb <= 0.0) return max(depth * (db * hazeCh(-cb, scaleHeight) - da * hazeCh(-ca, scaleHeight)), 0.0);
  float ht = (1.0 + ha) * sqrt(max(1.0 - ca * ca, 0.0)) - 1.0;
  return max(depth * (2.0 * exp(-ht / scaleHeight) * hazeCh(0.0, scaleHeight) - da * hazeCh(-ca, scaleHeight) - db * hazeCh(cb, scaleHeight)), 0.0);
}
float airDepthTo(vec3 eye, vec3 point, float scaleHeight, float depth) {
  float ra = length(eye);
  float rb = length(point);
  vec3 dir = normalize(point - eye);
  return airDepth(ra - 1.0, dot(dir, eye) / ra, rb - 1.0, dot(dir, point) / rb, scaleHeight, depth);
}
vec3 airOver(vec3 col, float tau, float extinction, vec3 up, vec3 dir) {
  return col * exp(-tau * extinction) + hazeLight(up, dir) * (1.0 - exp(-tau));
}`

const ch = (c: number, scaleHeight: number): number => 1 / (Math.max(c, 0) + 1 / Math.sqrt(1.5707963 / scaleHeight))

export function airDepth(ha: number, ca: number, hb: number, cb: number, scaleHeight: number, depth: number): number {
  const da = Math.exp(-ha / scaleHeight)
  const db = Math.exp(-hb / scaleHeight)
  if (ca >= 0) return Math.max(depth * (da * ch(ca, scaleHeight) - db * ch(cb, scaleHeight)), 0)
  if (cb <= 0) return Math.max(depth * (db * ch(-cb, scaleHeight) - da * ch(-ca, scaleHeight)), 0)
  const ht = (1 + ha) * Math.sqrt(Math.max(1 - ca * ca, 0)) - 1
  return Math.max(depth * (2 * Math.exp(-ht / scaleHeight) * ch(0, scaleHeight) - da * ch(-ca, scaleHeight) - db * ch(cb, scaleHeight)), 0)
}

const GLOW_FROM = 'uniform float uHazeForward;'
const LIGHT_FROM = 'hazeForward(dir) + uHazeNight) * uHazeStrength;'

export function hazeGlsl(glow: boolean): string {
  if (!glow) return HAZE_GLSL
  if (!HAZE_GLSL.includes(GLOW_FROM) || !HAZE_GLSL.includes(LIGHT_FROM)) throw new Error('the haze text has no place for the glow')
  return HAZE_GLSL
    .replace(GLOW_FROM, GLOW_FROM + '\nuniform vec3 uHazeGlow;\nuniform vec3 uHazeGlowDir;\nuniform float uHazeGlowPower;')
    .replace(LIGHT_FROM, 'hazeForward(dir) + uHazeNight + uHazeGlow * pow(max(dot(dir, uHazeGlowDir), 0.0), uHazeGlowPower)) * uHazeStrength;')
}

export function setHazeGlow(uniforms: Record<string, THREE.IUniform>, direction: THREE.Vector3, colour: [number, number, number], power: number): void {
  const glow = uniforms.uHazeGlow
  if (!glow) throw new Error('this haze has no glow: set glow in its params')
  if (!(power > 0)) throw new Error('the glow power must be above 0')
  ;(glow.value as THREE.Vector3).fromArray(colour)
  ;(uniforms.uHazeGlowDir!.value as THREE.Vector3).copy(direction).normalize()
  uniforms.uHazeGlowPower!.value = power
}

const VERT = /* glsl */ `
out vec3 vPos;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`

const frag = (glow: boolean): string => /* glsl */ `
precision highp float;
in vec3 vPos;
uniform float uGain;
uniform int uDiag;
uniform float uCoreHeight;
uniform vec3 uCoreDay;
uniform vec3 uCoreSun;
uniform vec2 uCoreRange;
out vec4 outColor;
${hazeGlsl(glow)}
void main() {
  if (uDiag >= 2) discard;
  vec3 dir = normalize(vPos);
  float r = length(uCam);
  float b = -dot(uCam, dir);
  float rt2 = r * r - b * b;
  if (b > 0.0 && rt2 < 0.99) discard;
  vec3 at;
  float tau = hazeDepth(dir, false, at);
  vec3 col = hazeLight(at, dir) * (1.0 - exp(-tau));
  if (uCoreHeight > 0.0) {
    float coreTau = hazeDepthAt(dir, false, uCoreHeight, at);
    float day = smoothstep(uCoreRange.x, uCoreRange.y, dot(at, uCoreSun));
    col += uCoreDay * day * day * (1.0 - exp(-coreTau));
  }
  outColor = vec4(col * uGain, 0.0);
}`

const lawFrag = /* glsl */ `
precision highp float;
in vec3 vPos;
uniform float uGain;
uniform int uDiag;
uniform vec3 uCam;
uniform vec3 uSunW;
uniform vec3 uAirLight;
uniform vec4 uAirLaw;
out vec4 outColor;
${AIR_LAW_GLSL}
void main() {
  if (uDiag >= 2) discard;
  vec3 dir = normalize(vPos);
  float r = length(uCam);
  float b = -dot(uCam, dir);
  float rt2 = r * r - b * b;
  if (b > 0.0 && rt2 < 0.99) discard;
  float through = 1.0 - airLawFactor(airLawDepthOut(uCam, dir, uAirLaw.y), uAirLaw.x);
  vec3 at = b > 0.0 ? normalize(uCam + dir * b) : uCam / r;
  outColor = vec4(uAirLight * smoothstep(uAirLaw.z, uAirLaw.w, dot(at, uSunW)) * through * uGain, through);
}`

export function hazeUniforms(p: HazeParams): Record<string, THREE.IUniform> {
  return {
    uCam: { value: new THREE.Vector3(0, 0, 3) },
    uSunW: { value: new THREE.Vector3(1, 0, 0) },
    uHazeH: { value: p.scaleHeight },
    uHazeTau: { value: p.depth },
    uHazeDay: { value: new THREE.Vector3().fromArray(p.day) },
    uHazeTwilight: { value: new THREE.Vector3().fromArray(p.twilight) },
    uHazeEdge: { value: new THREE.Vector2(p.dayFrom ?? -0.16, p.dayTo ?? 0.34) },
    uHazeNight: { value: new THREE.Vector3().fromArray(p.night ?? [0, 0, 0]) },
    uHazeStrength: { value: p.strength },
    uHazeForward: { value: p.forward },
    ...(p.glow ? { uHazeGlow: { value: new THREE.Vector3() }, uHazeGlowDir: { value: new THREE.Vector3(1, 0, 0) }, uHazeGlowPower: { value: 1 } } : {}),
  }
}

export class HazeShell implements Trim {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly full: THREE.BufferGeometry
  private readonly lean = new THREE.BufferGeometry()
  private readonly hidden: Uint8Array

  constructor(p: HazeParams, diag: THREE.IUniform<number>, law?: AirLaw) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: law ? lawFrag : frag(p.glow === true),
      uniforms: {
        ...hazeUniforms(p), uGain: { value: 1 }, uDiag: diag,
        uCoreHeight: { value: p.core?.scaleHeight ?? 0 },
        uCoreDay: { value: new THREE.Vector3().fromArray(p.core?.day ?? [0, 0, 0]) },
        uCoreSun: { value: new THREE.Vector3() },
        uCoreRange: { value: new THREE.Vector2(p.core?.dayFrom ?? 0, p.core?.dayTo ?? 1) },
        ...(law ? airLawUniforms(law) : {}),
      },
      side: THREE.BackSide,
      blending: law ? THREE.CustomBlending : THREE.AdditiveBlending,
      ...(law ? { blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor } : {}),
      premultipliedAlpha: true,
      transparent: true,
      depthWrite: false,
    })
    this.full = new THREE.SphereGeometry(1 + p.top * p.scaleHeight, 160, 80)
    for (const name of Object.keys(this.full.attributes)) this.lean.setAttribute(name, this.full.getAttribute(name))
    const own = this.full.getIndex()!.clone()
    own.setUsage(THREE.DynamicDrawUsage)
    this.lean.setIndex(own)
    this.hidden = new Uint8Array(this.full.getAttribute('position').count)
    this.mesh = new THREE.Mesh(this.full, this.material)
    this.mesh.renderOrder = 5
    this.mesh.userData.trim = this
  }

  hide(): void {
    const mesh = this.mesh
    mesh.updateWorldMatrix(true, false)
    const cam = this.material.uniforms.uCam!.value as THREE.Vector3
    hazeHidden(this.full.getAttribute('position').array, mesh.matrixWorld.elements, cam.x, cam.y, cam.z, this.hidden)
    const index = this.lean.getIndex()!
    const n = keepTriangles(this.full.getIndex()!.array, this.hidden, index.array as Uint16Array | Uint32Array)
    index.clearUpdateRanges()
    index.addUpdateRange(0, n)
    index.needsUpdate = true
    this.lean.setDrawRange(0, n)
    mesh.geometry = this.lean
  }

  show(): void {
    this.mesh.geometry = this.full
  }

  setAir(air: HazeAir): void {
    setHazeAir(this.material.uniforms, air)
  }

  setGlow(direction: THREE.Vector3, colour: [number, number, number], power: number): void {
    setHazeGlow(this.material.uniforms, direction, colour, power)
  }

  dispose(): void {
    this.full.dispose()
    this.lean.dispose()
    this.material.dispose()
  }
}
