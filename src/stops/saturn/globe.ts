import * as THREE from 'three'
import { HAZE_GLSL, hazeUniforms, type HazeParams } from '../../bodies/haze'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { EQUIRECT_GLSL } from '../../space/sky'
import { RING_PROFILE_GLSL } from './profile'

export interface GlobeLook {
  curve: number[][]
  limb: [number, number]
  ringShadow: number
  ringSoft: [number, number]
  ringSlant: number
  drift: number
  ringShine: [number, number, number]
  hazeShadow: number
}

const VERT = /* glsl */ `
out vec3 vLocal;
out vec3 vView;
out vec3 vClip;
void main() {
  vLocal = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position.xyw;
}`

const FRAG = /* glsl */ `
precision highp float;
precision highp int;
uniform sampler2D uMap;
uniform float uMapWidth;
uniform float uGrad;
uniform float uSpin;
uniform float uDrift;
uniform vec3 uSunL;
uniform float uPolar;
uniform vec3 uCurve[33];
uniform vec2 uLimb;
uniform float uGain;
uniform float uWeight;
uniform vec3 uTint;
uniform float uExtinction;
uniform float uRingShadow;
uniform vec3 uRingSoft;
uniform vec3 uRingShine;
uniform float uHazeShadow;
uniform float uVignette;
uniform float uAspect;
in vec3 vLocal;
in vec3 vView;
in vec3 vClip;
out vec4 outColor;
${EQUIRECT_GLSL}
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
${HAZE_GLSL}
${RING_PROFILE_GLSL}
vec3 spinY(vec3 d, float a) {
  float c = cos(a), s = sin(a);
  return vec3(c * d.x - s * d.z, d.y, s * d.x + c * d.z);
}
vec3 curveAt(float ndl) {
  float x = clamp(ndl * 0.5 + 0.5, 0.0, 1.0) * 32.0;
  int i = int(min(floor(x), 31.0));
  return mix(uCurve[i], uCurve[i + 1], x - float(i));
}
float zonal(float lat) {
  return 0.55 * sin(lat * 7.0 + 0.4) + 0.3 * sin(lat * 17.0 + 1.9) + 0.15 * sin(lat * 31.0 + 0.6);
}
void main() {
  vec3 p = normalize(vLocal);
  vec3 dirS = normalize(vLocal - uCam);
  vec3 nL = normalize(vec3(p.x, p.y / uPolar, p.z));
  vec3 dirL = normalize(vec3(dirS.x, dirS.y * uPolar, dirS.z));
  float mu = clamp(dot(nL, -dirL), 0.0, 1.0);
  float ndl = dot(nL, uSunL);
  float lat = asin(clamp(p.y, -1.0, 1.0));
  float drift = uDrift * zonal(lat);
  vec3 d = spinY(p, uSpin + drift);
  vec3 albedo = equirectGrad(uMap, d, uGrad).rgb;
  float texels = diagTexelsDir(p, uMapWidth);

  vec3 P = vec3(p.x, p.y * uPolar, p.z);
  float shadow = 1.0 - uRingShadow * ringShadowAt(P, uSunL, uRingSoft, uGrad);
  vec3 night = uCurve[0];
  vec3 shade = max(curveAt(ndl) - night, vec3(0.0)) * shadow * mix(1.0, pow(max(mu, 1e-3), uLimb.y), uLimb.x) + night;
  shade += uRingShine * smoothstep(0.0, -0.5, ndl) * smoothstep(0.0, 0.35, abs(p.y)) * (1.0 - smoothstep(0.35, 0.9, abs(p.y)));
  vec3 col = inverseFilmic(albedo) * shade * uTint;
  vec3 at;
  float tau = hazeDepth(dirS, true, at);
  col = col * exp(-tau * uExtinction) + hazeLight(p, dirS) * (1.0 - exp(-tau)) * mix(1.0, shadow, uHazeShadow);
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain * uWeight / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = diagOut(vec4(col, 1.0), texels, 1.0, vec3(0.15, 0.45, 0.9), vec2(drift * 8.0, 0.0), length(vView));
}`

export function curveUniform(curve: number[][]): THREE.Vector3[] {
  if (curve.length !== 33) throw new Error('light curve needs 33 knots')
  return curve.map((c) => new THREE.Vector3(c[0], c[1], c[2]))
}

export class Globe {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(map: THREE.Texture, mapWidth: number, look: GlobeLook, haze: HazeParams, profile: Record<string, THREE.IUniform>, polar: number) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG,
      uniforms: {
        ...hazeUniforms(haze), ...profile,
        uMap: { value: map }, uMapWidth: { value: mapWidth }, uGrad: gradUniform, uDiag: diagUniform,
        uSpin: { value: 0 }, uDrift: { value: 0 }, uSunL: { value: new THREE.Vector3(1, 0, 0) }, uPolar: { value: polar },
        uCurve: { value: curveUniform(look.curve) }, uLimb: { value: new THREE.Vector2().fromArray(look.limb) },
        uGain: { value: 1 }, uWeight: { value: 1 }, uTint: { value: new THREE.Vector3(1, 1, 1) }, uExtinction: { value: haze.extinction },
        uRingShadow: { value: look.ringShadow }, uRingSoft: { value: new THREE.Vector3(look.ringSoft[0], look.ringSoft[1], look.ringSlant) },
        uRingShine: { value: new THREE.Vector3().fromArray(look.ringShine) }, uHazeShadow: { value: look.hazeShadow },
        uVignette: { value: 0 }, uAspect: { value: 16 / 9 },
      },
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 384, 192), this.material)
    this.mesh.scale.set(1, polar, 1)
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}

const SHELL_FRAG = /* glsl */ `
precision highp float;
precision highp int;
in vec3 vLocal;
uniform float uGain;
uniform int uDiag;
uniform vec3 uSunL;
uniform float uPolar;
uniform float uRingShadow;
uniform vec3 uRingSoft;
out vec4 outColor;
${HAZE_GLSL}
${RING_PROFILE_GLSL}
void main() {
  if (uDiag >= 2) discard;
  vec3 dir = normalize(vLocal - uCam);
  float r = length(uCam);
  float b = -dot(uCam, dir);
  float rt2 = r * r - b * b;
  if (b > 0.0 && rt2 < 0.99) discard;
  vec3 at;
  float tau = hazeDepth(dir, false, at);
  float shadow = 1.0 - uRingShadow * ringShadowAt(vec3(at.x, at.y * uPolar, at.z), uSunL, uRingSoft, 1.0);
  outColor = vec4(hazeLight(at, dir) * (1.0 - exp(-tau)) * shadow * uGain, 0.0);
}`

export class Shell {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(haze: HazeParams, look: GlobeLook, profile: Record<string, THREE.IUniform>, polar: number) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: SHELL_FRAG,
      uniforms: {
        ...hazeUniforms(haze), ...profile, uGain: { value: 1 }, uDiag: diagUniform, uSunL: { value: new THREE.Vector3(1, 0, 0) }, uPolar: { value: polar },
        uRingShadow: { value: look.ringShadow }, uRingSoft: { value: new THREE.Vector3(look.ringSoft[0], look.ringSoft[1], look.ringSlant) },
      },
      side: THREE.BackSide, blending: THREE.AdditiveBlending, premultipliedAlpha: true, transparent: true, depthWrite: false,
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1 + haze.top * haze.scaleHeight, 192, 96), this.material)
    this.mesh.scale.set(1, polar, 1)
    this.mesh.renderOrder = 4
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
