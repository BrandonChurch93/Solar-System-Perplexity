import * as THREE from 'three'
import { HAZE_GLSL, hazeUniforms, type HazeParams } from '../../bodies/haze'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { EQUIRECT_GLSL } from '../../space/sky'
import { RING_PROFILE_GLSL } from './profile'

export interface GlobeLook {
  curve: number[][]
  closeCurve: number[][]
  limb: [number, number]
  ringShadow: number
  ringShadowHero: number
  ringSoft: [number, number]
  ringSlant: number
  drift: number
  nightFloor: number
  hazeShadow: number
  rim: [number, number, number, number]
  rimPower: number
  rimNight: [number, number, number, number]
  termShift: [number, number, number]
  nightBlur: number
  probe: number
  edgePx: number
}

export interface GlobePatch { texture: THREE.Texture; table: THREE.Texture; box: THREE.Vector4; size: THREE.Vector2 }

export interface ShotLight { texture: THREE.Texture; matrix: THREE.Matrix4; camera: THREE.Vector3; weight: THREE.IUniform<number> }

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
uniform vec3 uCurveC[33];
uniform vec3 uLightL;
uniform vec2 uLimb;
uniform float uGain;
uniform float uWeight;
uniform vec3 uTint;
uniform float uExtinction;
uniform float uRingShadow;
uniform vec3 uRingSoft;
uniform float uHazeShadow;
uniform vec4 uRim;
uniform vec4 uRimNight;
uniform float uRimPower;
uniform float uNightBlur;
uniform vec3 uTerm;
uniform sampler2D uTable;
uniform sampler2D uTableC;
uniform float uNightFloor;
uniform int uProbe;
uniform sampler2D uPatch;
uniform vec4 uPatchBox;
uniform vec2 uPatchSize;
uniform float uVignette;
uniform float uAspect;
uniform sampler2D uHoldLight;
uniform mat4 uHoldM;
uniform vec3 uHoldCam;
uniform float uHoldW;
uniform sampler2D uSkimLight;
uniform mat4 uSkimM;
uniform vec3 uSkimCam;
uniform float uSkimW;
uniform float uEdgePx;
in vec3 vLocal;
in vec3 vView;
in vec3 vClip;
out vec4 outColor;
${EQUIRECT_GLSL}
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
${HAZE_GLSL}
${RING_PROFILE_GLSL}
vec3 shotLight(sampler2D tex, mat4 m, vec3 cam, float w, vec3 P, vec3 n) {
  vec4 c = m * vec4(P, 1.0);
  vec2 uv = c.xy / max(c.w, 1e-4) * vec2(0.5, -0.5) + 0.5;
  vec2 e = min(uv, 1.0 - uv);
  float k = w * (c.w > 1e-3 ? smoothstep(0.0, 0.03, min(e.x, e.y)) : 0.0) * smoothstep(0.03, 0.2, dot(n, normalize(cam - P)));
  return mix(vec3(1.0), texture(tex, uv).rgb, k);
}
vec3 spinY(vec3 d, float a) {
  float c = cos(a), s = sin(a);
  return vec3(c * d.x - s * d.z, d.y, s * d.x + c * d.z);
}
vec3 curveAt(float ndl) {
  float x = clamp(ndl * 0.5 + 0.5, 0.0, 1.0) * 32.0;
  int i = int(min(floor(x), 31.0));
  return mix(uCurve[i], uCurve[i + 1], x - float(i));
}
vec3 curveCloseAt(float ndl) {
  float x = clamp(ndl * 0.5 + 0.5, 0.0, 1.0) * 32.0;
  int i = int(min(floor(x), 31.0));
  return mix(uCurveC[i], uCurveC[i + 1], x - float(i));
}
vec3 tableAt(sampler2D uTable, float ndl, float lat) {
  ivec2 size = textureSize(uTable, 0);
  vec2 q = vec2(clamp(ndl * 0.5 + 0.5, 0.0, 1.0) * float(size.x - 1), clamp(lat / 3.14159265 + 0.5, 0.0, 1.0) * float(size.y - 1));
  ivec2 i = min(ivec2(floor(q)), size - 2);
  vec2 f = q - vec2(i);
  return mix(mix(texelFetch(uTable, i, 0).rgb, texelFetch(uTable, i + ivec2(1, 0), 0).rgb, f.x), mix(texelFetch(uTable, i + ivec2(0, 1), 0).rgb, texelFetch(uTable, i + ivec2(1, 1), 0).rgb, f.x), f.y);
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
  float ndl = dot(nL, uLightL) - (1.0 - uClose) * uTerm.x * smoothstep(uTerm.y, uTerm.z, p.y);
  float lat = asin(clamp(p.y, -1.0, 1.0));
  float drift = uDrift * zonal(lat);
  vec3 d = spinY(p, uSpin + drift);
  vec3 albedo = inverseFilmic(equirectGrad(uMap, d, uGrad).rgb);
  vec3 soft = inverseFilmic(equirectGrad(uMap, d, uNightBlur).rgb);
  float texels = diagTexelsDir(p, uMapWidth);
  vec3 e = spinY(d, uPatchBox.x);
  vec2 q = vec2(atan(e.z, e.x) / uPatchBox.y * 0.5 + 0.5, (asin(clamp(e.y, -1.0, 1.0)) - uPatchBox.z) / (uPatchBox.w - uPatchBox.z));
  vec2 qe = min(q, 1.0 - q);
  float pw = e.x > 0.0 ? uClose * smoothstep(0.0, 0.1, qe.x) * smoothstep(0.0, 0.1, qe.y) : 0.0;
  for (int k = 0; k < (pw > 0.0 ? 1 : 0); k++) {
    albedo = mix(albedo, inverseFilmic(textureGrad(uPatch, q, dFdx(q) * uGrad, dFdy(q) * uGrad).rgb), pw);
    texels = mix(texels, diagTexels(q * uPatchSize), pw);
  }
  for (int k = 0; k < (uProbe >= 5 ? 1 : 0); k++) {
    albedo = vec3(uProbe == 5 ? 0.0 : 0.6);
    soft = albedo;
  }

  vec3 P = vec3(p.x, p.y * uPolar, p.z);
  float shadow = 1.0 - uRingShadow * ringShadowAt(P, uSunL, uRingSoft, uGrad);
  vec3 light = mix(curveAt(ndl) * tableAt(uTable, ndl, lat), curveCloseAt(ndl) * tableAt(uTableC, ndl, lat), uClose);
  vec3 night = min(light, vec3(uNightFloor));
  vec3 lit = (light - night) * shadow * mix(1.0, pow(max(mu, 1e-3), uLimb.y), uLimb.x) + night;
  vec3 col = mix(soft, albedo, smoothstep(-0.25, 0.1, ndl)) * lit * uTint;
  col += uRim.rgb * exp(-mu * mu / (uRim.w * uRim.w)) * pow(max(ndl, 0.0), uRimPower) * shadow;
  col += uRimNight.rgb * exp(-mu / uRimNight.w);
  vec3 at;
  float tau = hazeDepth(dirS, true, at);
  col = col * exp(-tau * uExtinction) + hazeLight(p, dirS) * (1.0 - exp(-tau)) * mix(1.0, shadow, uHazeShadow);
  col *= mix(1.0, smoothstep(-0.03, 0.0, p.y), uClose);
  for (int k = 0; k < (uHoldW > 0.0 ? 1 : 0); k++) col *= shotLight(uHoldLight, uHoldM, uHoldCam, uHoldW, P, nL);
  for (int k = 0; k < (uSkimW > 0.0 ? 1 : 0); k++) col *= shotLight(uSkimLight, uSkimM, uSkimCam, uSkimW, P, nL);
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain * uWeight / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  vec3 layer = vec3(0.15, 0.45, 0.9);
  for (int k = 0; k < (uProbe > 0 ? 1 : 0); k++) {
    float val = uProbe == 1 ? atan(d.z, d.x) / 6.283185307 + 0.5 : (uProbe == 2 ? asin(clamp(d.y, -1.0, 1.0)) / 3.14159265 + 0.5 : (uProbe == 3 ? clamp(ndl * 0.5 + 0.5, 0.0, 1.0) : mu));
    float hi = min(floor(val * 255.0), 254.0);
    layer = vec3(hi / 255.0, val * 255.0 - hi, 1.0);
  }
  float along = -dot(uCam, dirS);
  float rt = sqrt(max(dot(uCam, uCam) - along * along, 0.0));
  float cover = uDiag >= 2 ? 1.0 : clamp((1.0 - rt) / (uEdgePx * length(vec2(dFdx(rt), dFdy(rt)))), 0.0, 1.0);
  outColor = diagOut(vec4(col * cover * cover, cover), texels, 1.0, layer, vec2(drift * 8.0, 0.0), length(vView));
}`

export function curveUniform(curve: number[][]): THREE.Vector3[] {
  if (curve.length !== 33) throw new Error('light curve needs 33 knots')
  return curve.map((c) => new THREE.Vector3(c[0], c[1], c[2]))
}

export class Globe {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(map: THREE.Texture, mapWidth: number, table: THREE.Texture, patch: GlobePatch, lights: { hold: ShotLight; skim: ShotLight }, look: GlobeLook, haze: HazeParams, profile: Record<string, THREE.IUniform>, polar: number) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG,
      uniforms: {
        ...hazeUniforms(haze), ...profile,
        uMap: { value: map }, uTable: { value: table }, uTableC: { value: patch.table }, uNightFloor: { value: look.nightFloor }, uMapWidth: { value: mapWidth }, uGrad: gradUniform, uDiag: diagUniform,
        uSpin: { value: 0 }, uDrift: { value: 0 }, uSunL: { value: new THREE.Vector3(1, 0, 0) }, uPolar: { value: polar },
        uCurve: { value: curveUniform(look.curve) }, uCurveC: { value: curveUniform(look.closeCurve) }, uLightL: { value: new THREE.Vector3(1, 0, 0) }, uLimb: { value: new THREE.Vector2().fromArray(look.limb) },
        uGain: { value: 1 }, uWeight: { value: 1 }, uTint: { value: new THREE.Vector3(1, 1, 1) }, uExtinction: { value: haze.extinction },
        uRingShadow: { value: look.ringShadow }, uRingSoft: { value: new THREE.Vector3(look.ringSoft[0], look.ringSoft[1], look.ringSlant) },
        uHazeShadow: { value: look.hazeShadow },
        uRim: { value: new THREE.Vector4().fromArray(look.rim) }, uRimNight: { value: new THREE.Vector4().fromArray(look.rimNight) },
        uRimPower: { value: look.rimPower }, uNightBlur: { value: look.nightBlur }, uTerm: { value: new THREE.Vector3().fromArray(look.termShift) },
        uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uProbe: { value: look.probe },
        uPatch: { value: patch.texture }, uPatchBox: { value: patch.box }, uPatchSize: { value: patch.size },
        uEdgePx: { value: look.edgePx },
        uHoldLight: { value: lights.hold.texture }, uHoldM: { value: lights.hold.matrix }, uHoldCam: { value: lights.hold.camera }, uHoldW: lights.hold.weight,
        uSkimLight: { value: lights.skim.texture }, uSkimM: { value: lights.skim.matrix }, uSkimCam: { value: lights.skim.camera }, uSkimW: lights.skim.weight,
      },
      transparent: true, premultipliedAlpha: true,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 384, 192), this.material)
    this.mesh.scale.set(1, polar, 1)
    this.mesh.renderOrder = 3
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
  vec3 Pa = vec3(at.x, at.y * uPolar, at.z);
  float shadow = 1.0 - uRingShadow * ringShadowAt(Pa, uSunL, uRingSoft, 1.0);
  outColor = vec4(hazeLight(at, dir) * (1.0 - exp(-tau)) * shadow * uGain * mix(1.0, smoothstep(-0.03, 0.02, at.y), uClose), 0.0);
}`

export class Shell {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(haze: HazeParams, look: GlobeLook, profile: Record<string, THREE.IUniform>, polar: number, height = haze.scaleHeight) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: SHELL_FRAG,
      uniforms: {
        ...hazeUniforms(haze), ...profile, uGain: { value: 1 }, uDiag: diagUniform, uSunL: { value: new THREE.Vector3(1, 0, 0) }, uPolar: { value: polar },
        uRingShadow: { value: look.ringShadow }, uRingSoft: { value: new THREE.Vector3(look.ringSoft[0], look.ringSoft[1], look.ringSlant) },
      },
      side: THREE.BackSide, blending: THREE.AdditiveBlending, premultipliedAlpha: true, transparent: true, depthWrite: false, depthTest: false,
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1 + haze.top * height, 192, 96), this.material)
    this.mesh.scale.set(1, polar, 1)
    this.mesh.renderOrder = 1
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
