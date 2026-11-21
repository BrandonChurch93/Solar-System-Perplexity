import * as THREE from 'three'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import holdJson from './hold.json'

export const LIMB = { azimuth: 64, half: 128, inside: 0.3, outside: 1.5, edgePx: 2 }

export const LIMB_GLSL = /* glsl */ `
uniform sampler2D uLimb;
uniform vec3 uLimbS;
uniform vec3 uLimbT;
uniform float uLimbFar;
vec4 limbAt(vec3 at, float row) {
  float phi = atan(dot(at, uLimbT), dot(at, uLimbS));
  float u = ((phi / 6.2831853 + 0.5) * ${LIMB.azimuth}.0 + 0.5) / ${LIMB.azimuth + 1}.0;
  return mix(textureLod(uLimb, vec2(u, row / ${LIMB.half * 4}.0), 0.0), textureLod(uLimb, vec2(u, (row + ${LIMB.half * 2}.0) / ${LIMB.half * 4}.0), 0.0), uLimbFar);
}
vec4 limbGlow(vec3 at, float b) {
  float x = b - 1.0;
  float s = sqrt(clamp(abs(x) / (x < 0.0 ? ${LIMB.inside.toFixed(3)} : ${LIMB.outside.toFixed(3)}), 0.0, 1.0)) * ${LIMB.half - 1}.0;
  return limbAt(at, x < 0.0 ? ${LIMB.half}.0 - 0.5 - s : ${LIMB.half}.0 + 0.5 + s);
}
vec4 limbEdge(vec3 at) {
  return limbAt(at, ${LIMB.half}.0 - 0.5);
}`

const R = holdJson.rim
const ROWS = R.inside + R.outside

export const HOLD_RIM_GLSL = /* glsl */ `
uniform sampler2D uHoldRim;
uniform vec3 uHoldCamW;
uniform vec3 uHoldRW;
uniform vec3 uHoldUW;
uniform vec3 uHoldFW;
uniform vec4 uHoldRimMap;
vec3 holdRim(vec3 p, bool outer) {
  vec3 hv = p - uHoldCamW;
  vec2 e = (vec2(dot(hv, uHoldRW), dot(hv, uHoldUW)) / max(dot(hv, uHoldFW), 1e-3) - uHoldRimMap.xy) * uHoldRimMap.z;
  float rho = length(e);
  float u = ((atan(e.y, e.x) / 6.2831853 + 0.5) * ${R.cols}.0 + 0.5) / ${R.cols + 1}.0;
  float v = outer ? ${R.inside}.0 + clamp((rho - 1.0) / ${(R.to - 1).toFixed(5)} * ${R.outside}.0, 0.5, ${R.outside}.0 - 0.5) : clamp((rho - ${R.from.toFixed(5)}) / ${(1 - R.from).toFixed(5)} * ${R.inside}.0, 0.5, ${R.inside}.0 - 0.5);
  return exp2(textureLod(uHoldRim, vec2(u, v / ${ROWS}.0), 0.0).rgb * uHoldRimMap.w);
}`

export interface HoldRimUniforms { [name: string]: THREE.IUniform; uHoldRim: THREE.IUniform<THREE.Texture>; uHoldCamW: THREE.IUniform<THREE.Vector3>; uHoldRW: THREE.IUniform<THREE.Vector3>; uHoldUW: THREE.IUniform<THREE.Vector3>; uHoldFW: THREE.IUniform<THREE.Vector3>; uHoldRimMap: THREE.IUniform<THREE.Vector4> }

export class HoldRim {
  readonly uniforms: HoldRimUniforms
  readonly size = { width: R.cols + 1, height: ROWS }
  private readonly back = new THREE.Quaternion()
  private readonly seen = new THREE.Vector3()

  constructor(map: THREE.Texture, private readonly fitted: THREE.Vector3, private readonly near: [number, number]) {
    this.uniforms = {
      uHoldRim: { value: map }, uHoldCamW: { value: new THREE.Vector3() }, uHoldRW: { value: new THREE.Vector3(1, 0, 0) }, uHoldUW: { value: new THREE.Vector3(0, 1, 0) }, uHoldFW: { value: new THREE.Vector3(0, 0, -1) },
      uHoldRimMap: { value: new THREE.Vector4(R.centre[0]!, R.centre[1]!, 1 / R.radius, 0) },
    }
  }

  update(camera: THREE.Vector3, world: THREE.Quaternion, weight: number): void {
    const u = this.uniforms
    u.uHoldCamW.value.copy(this.fitted).applyQuaternion(world)
    u.uHoldRW.value.set(1, 0, 0).applyQuaternion(world)
    u.uHoldUW.value.set(0, 1, 0).applyQuaternion(world)
    u.uHoldFW.value.set(0, 0, -1).applyQuaternion(world)
    const off = this.seen.copy(camera).applyQuaternion(this.back.copy(world).invert()).sub(this.fitted).length() / this.fitted.length()
    const t = Math.min(Math.max((off - this.near[0]) / (this.near[1] - this.near[0]), 0), 1)
    u.uHoldRimMap.value.w = weight * (1 - t * t * (3 - 2 * t))
  }
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
in vec3 vPos;
in vec3 vClip;
uniform vec3 uCam;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform int uDiag;
uniform float uEdge;
uniform vec3 uHide;
out vec4 outColor;
${LIMB_GLSL}
${HOLD_RIM_GLSL}
${INVERSE_FILMIC_GLSL}
vec3 shown(vec3 x) {
  return sqrt(clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 0.985));
}
void main() {
  if (uDiag >= 2) discard;
  vec3 dir = normalize(vPos);
  float along = -dot(uCam, dir);
  if (along <= 0.0) discard;
  vec3 p = uCam + dir * along;
  float b = length(p);
  vec3 at = p / b;
  b = max(b, 1.0);
  vec3 glow = max(limbGlow(at, b).rgb, 0.0);
  float t = clamp((b - 1.0) / uEdge, 0.0, 1.0);
  for (int k = 0; k < (t < 1.0 ? 1 : 0); k++) {
    vec3 m = mix(shown(max(limbEdge(at).rgb, 0.0)), shown(glow), t * t * (3.0 - 2.0 * t));
    glow = inverseFilmic(m * m);
  }
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  vec3 col = glow * uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  for (int pass = 0; pass < (uHoldRimMap.w > 0.0 ? 1 : 0); pass++) col *= holdRim(p, true);
  outColor = vec4(col, uLimbFar * uHide.z * smoothstep(uHide.x, uHide.y, dot(shown(col), vec3(0.3, 0.5, 0.2))));
}`

export function limbFrame(camera: THREE.Vector3, sun: THREE.Vector3, s: THREE.Vector3, t: THREE.Vector3): void {
  const d = camera.length()
  const vx = -camera.x / d
  const vy = -camera.y / d
  const vz = -camera.z / d
  const k = sun.x * vx + sun.y * vy + sun.z * vz
  s.set(sun.x - vx * k, sun.y - vy * k, sun.z - vz * k)
  if (s.lengthSq() < 1e-8) s.set(vy, -vx, 0).lengthSq() < 1e-8 && s.set(0, vz, -vy)
  s.normalize()
  t.set(vy * s.z - vz * s.y, vz * s.x - vx * s.z, vx * s.y - vy * s.x)
}

export class Rim {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(lut: THREE.Texture, radius: number, diag: THREE.IUniform<number>, hide: [number, number, number], hold: HoldRim) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uCam: { value: new THREE.Vector3(0, 0, 3) }, uLimb: { value: lut }, uLimbS: { value: new THREE.Vector3(1, 0, 0) }, uLimbT: { value: new THREE.Vector3(0, 1, 0) },
        uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uEdge: { value: 0.003 }, uLimbFar: { value: 0 }, uHide: { value: new THREE.Vector3().fromArray(hide) }, uDiag: diag,
        ...hold.uniforms,
      },
      side: THREE.BackSide,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
      transparent: true,
      depthWrite: false,
      depthTest: true,
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 96, 48), this.material)
    this.mesh.renderOrder = 6
  }

  update(camera: THREE.Vector3, s: THREE.Vector3, t: THREE.Vector3, gain: number, vignette: number, aspect: number, edge: number, far: number): void {
    const u = this.material.uniforms
    ;(u.uCam!.value as THREE.Vector3).copy(camera)
    ;(u.uLimbS!.value as THREE.Vector3).copy(s)
    ;(u.uLimbT!.value as THREE.Vector3).copy(t)
    u.uGain!.value = gain
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
    u.uEdge!.value = edge
    u.uLimbFar!.value = far
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
