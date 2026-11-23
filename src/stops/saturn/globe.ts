import * as THREE from 'three'
import { HAZE_GLSL, hazeUniforms, type HazeParams } from '../../bodies/haze'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { EQUIRECT_GLSL } from '../../space/sky'
import { RING_FIELD_GLSL } from './field'

export interface GlobeLook {
  curve: number[][]
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
  nightBlurFar: number
  fine: [number, number, number]
  fineTop: number
  probe: number
  edgePx: number
  limbFit: number[]
  limbLat: [number, number]
  limbInflate: number
  glowNorth: [number, number, number, number]
  glowPole: [number, number, number, number]
  glowWide: [number, number, number, number]
  glowCap: [number, number, number]
}

export interface ShotLight { texture: THREE.Texture; matrix: THREE.Matrix4; camera: THREE.Vector3; weight: THREE.IUniform<number> }

export const RING_SHADOW_GLSL = /* glsl */ `
float ringShadowAt(vec3 P, vec3 sunL, vec3 soft, float grad) {
  float t = -P.y / (abs(sunL.y) > 1e-4 ? sunL.y : 1e-4);
  float rho = length(P.xz + sunL.xz * t);
  float fp = max(length(vec2(dFdx(rho), dFdy(rho))) * grad, soft.x + soft.y * max(t, 0.0));
  float tau = ringDepth(rho, fp);
  return t > 0.0 ? 1.0 - exp(-tau * soft.z / max(abs(sunL.y), 0.02)) : 0.0;
}`

export const LIMB_GLSL = /* glsl */ `
uniform float uLimbFit[23];
uniform vec2 uLimbLat;
uniform float uLimbW;
float limbAt(vec3 tp, float polar, vec3 sun) {
  float x = clamp((degrees(asin(clamp(tp.y, -1.0, 1.0))) - uLimbLat.x) / uLimbLat.y, 0.0, 22.0);
  int i = int(min(floor(x), 21.0));
  float day = smoothstep(0.0, 0.3, dot(normalize(vec3(tp.x, tp.y / polar, tp.z)), normalize(sun)));
  return uLimbW * mix(uLimbFit[i], uLimbFit[i + 1], x - float(i)) * day;
}`

const VERT = /* glsl */ `
out vec3 vLocal;
out vec3 vView;
out vec3 vClip;
uniform float uInflate;
void main() {
  vLocal = position * uInflate;
  vec4 mv = modelViewMatrix * vec4(vLocal, 1.0);
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
uniform vec4 uFine;
uniform float uFineTop;
uniform vec3 uTerm;
uniform sampler2D uTable;
uniform float uNightFloor;
uniform vec4 uDusk;
uniform int uProbe;
uniform float uVignette;
uniform float uAspect;
uniform sampler2D uHoldLight;
uniform mat4 uHoldM;
uniform vec3 uHoldCam;
uniform float uHoldW;
uniform float uEdgePx;
uniform float uEdgeLin;
in vec3 vLocal;
in vec3 vView;
in vec3 vClip;
out vec4 outColor;
${EQUIRECT_GLSL}
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
${HAZE_GLSL}
${RING_FIELD_GLSL}
${RING_SHADOW_GLSL}
${LIMB_GLSL}
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
  vec3 dirS = normalize(vLocal - uCam);
  float along = -dot(uCam, dirS);
  float rt = sqrt(max(dot(uCam, uCam) - along * along, 0.0));
  vec3 p = normalize(uLimbW > 0.0 ? uCam + dirS * (along - sqrt(max(1.0 - rt * rt, 0.0))) : vLocal);
  vec3 nL = normalize(vec3(p.x, p.y / uPolar, p.z));
  vec3 dirL = normalize(vec3(dirS.x, dirS.y * uPolar, dirS.z));
  float mu = clamp(dot(nL, -dirL), 0.0, 1.0);
  float ndl = dot(nL, uLightL) - uTerm.x * smoothstep(uTerm.y, uTerm.z, p.y);
  float lat = asin(clamp(p.y, -1.0, 1.0));
  float drift = uDrift * zonal(lat);
  vec3 d = spinY(p, uSpin + drift);
  vec3 albedo = inverseFilmic(equirectGrad(uMap, d, uGrad).rgb);
  vec3 soft = inverseFilmic(equirectGrad(uMap, d, uNightBlur).rgb);
  float texels = diagTexelsDir(p, uMapWidth);
  for (int k = 0; k < (uProbe >= 5 ? 1 : 0); k++) {
    albedo = vec3(uProbe == 5 ? 0.0 : 0.6);
    soft = albedo;
  }

  vec3 P = vec3(p.x, p.y * uPolar, p.z);
  float shadow = 1.0 - uRingShadow * ringShadowAt(P, uSunL, uRingSoft, uGrad);
  vec3 light = curveAt(ndl) * tableAt(uTable, ndl, lat);
  vec3 night = min(light, vec3(uNightFloor));
  // near the sheet the terminator is narrower: the twilight zone is cut down by the dusk (0 in the hold)
  vec3 lit = (light - night) * shadow * mix(1.0, pow(max(mu, 1e-3), uLimb.y), uLimb.x) * mix(1.0, smoothstep(uDusk.x, uDusk.y, ndl), uDusk.z) + night * uDusk.w;
  for (int k = 0; k < (uFine.w > 0.0 ? 1 : 0); k++) {
    vec3 mid = inverseFilmic(equirectGrad(uMap, d, uFine.x).rgb);
    vec3 lw = vec3(0.2126, 0.7152, 0.0722);
    float lm = max(dot(mid, lw), 1e-3);
    float power = clamp(uFine.y * pow(1.0 + 5.0 * lm * dot(lit, lw), 1.2), 1.0, uFine.z);
    albedo *= mix(1.0, min(pow(clamp(dot(albedo, lw) / lm, 0.5, 2.0), power - 1.0), uFineTop), uFine.w);
  }
  vec3 col = mix(soft, albedo, smoothstep(-0.25, 0.1, ndl)) * lit * uTint;
  col += uRim.rgb * exp(-mu * mu / (uRim.w * uRim.w)) * pow(max(ndl, 0.0), uRimPower) * shadow;
  col += uRimNight.rgb * exp(-mu / uRimNight.w);
  vec3 at;
  float tau = hazeDepth(dirS, true, at);
  col = col * exp(-tau * uExtinction) + hazeLight(p, dirS) * (1.0 - exp(-tau)) * mix(1.0, shadow, uHazeShadow);
  for (int k = 0; k < (uHoldW > 0.0 ? 1 : 0); k++) col *= shotLight(uHoldLight, uHoldM, uHoldCam, uHoldW, P, nL);
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain * uWeight / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  vec3 layer = vec3(0.15, 0.45, 0.9);
  for (int k = 0; k < (uProbe > 0 ? 1 : 0); k++) {
    float val = uProbe == 1 ? atan(d.z, d.x) / 6.283185307 + 0.5 : (uProbe == 2 ? asin(clamp(d.y, -1.0, 1.0)) / 3.14159265 + 0.5 : (uProbe == 3 ? clamp(ndl * 0.5 + 0.5, 0.0, 1.0) : mu));
    float hi = min(floor(val * 255.0), 254.0);
    layer = vec3(hi / 255.0, val * 255.0 - hi, 1.0);
  }
  float dl = uLimbW > 0.0 ? limbAt((uCam + dirS * along) / max(rt, 1e-4), uPolar, uSunL) : 0.0;
  float cover = uDiag >= 2 ? 1.0 : clamp((1.0 + dl - rt) / (uEdgePx * length(vec2(dFdx(rt), dFdy(rt)))), 0.0, 1.0);
  outColor = diagOut(vec4(col * cover * mix(cover, 1.0, uEdgeLin), cover), texels, 1.0, layer, vec2(drift * 8.0, 0.0), length(vView));
  if (uLimbW > 0.0 && rt >= 1.0 + dl) discard;
}`

export function curveUniform(curve: number[][]): THREE.Vector3[] {
  if (curve.length !== 33) throw new Error('light curve needs 33 knots')
  return curve.map((c) => new THREE.Vector3(c[0], c[1], c[2]))
}

export class Globe {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(map: THREE.Texture, mapWidth: number, table: THREE.Texture, hold: ShotLight, look: GlobeLook, haze: HazeParams, field: Record<string, THREE.IUniform>, polar: number) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG,
      uniforms: {
        ...hazeUniforms(haze), ...field,
        uMap: { value: map }, uTable: { value: table }, uNightFloor: { value: look.nightFloor }, uDusk: { value: new THREE.Vector4(0, 1, 0, 1) }, uMapWidth: { value: mapWidth }, uGrad: gradUniform, uDiag: diagUniform,
        uSpin: { value: 0 }, uDrift: { value: 0 }, uSunL: { value: new THREE.Vector3(1, 0, 0) }, uPolar: { value: polar },
        uCurve: { value: curveUniform(look.curve) }, uLightL: { value: new THREE.Vector3(1, 0, 0) }, uLimb: { value: new THREE.Vector2().fromArray(look.limb) },
        uGain: { value: 1 }, uWeight: { value: 1 }, uTint: { value: new THREE.Vector3(1, 1, 1) }, uExtinction: { value: haze.extinction },
        uRingShadow: { value: look.ringShadow }, uRingSoft: { value: new THREE.Vector3(look.ringSoft[0], look.ringSoft[1], look.ringSlant) },
        uHazeShadow: { value: look.hazeShadow },
        uRim: { value: new THREE.Vector4().fromArray(look.rim) }, uRimNight: { value: new THREE.Vector4().fromArray(look.rimNight) },
        uRimPower: { value: look.rimPower }, uNightBlur: { value: look.nightBlur }, uFine: { value: new THREE.Vector4(look.fine[0], look.fine[1], look.fine[2], 0) }, uFineTop: { value: look.fineTop }, uTerm: { value: new THREE.Vector3().fromArray(look.termShift) },
        uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uProbe: { value: look.probe },
        uEdgePx: { value: look.edgePx }, uEdgeLin: { value: 0 },
        uLimbFit: { value: look.limbFit }, uLimbLat: { value: new THREE.Vector2().fromArray(look.limbLat) }, uLimbW: { value: 0 }, uInflate: { value: 1 },
        uHoldLight: { value: hold.texture }, uHoldM: { value: hold.matrix }, uHoldCam: { value: hold.camera }, uHoldW: hold.weight,
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
uniform vec4 uGlowNorth;
uniform vec4 uGlowPole;
uniform vec4 uGlowWide;
uniform vec3 uGlowCap;
out vec4 outColor;
${HAZE_GLSL}
${RING_FIELD_GLSL}
${RING_SHADOW_GLSL}
${LIMB_GLSL}
void main() {
  vec3 dir = normalize(vLocal - uCam);
  float r = length(uCam);
  float b = -dot(uCam, dir);
  float rt2 = r * r - b * b;
  bool under = b > 0.0 && rt2 < (uLimbW > 0.0 ? 0.96 : 0.99);
  float rt = sqrt(max(rt2, 0.0));
  vec3 tp = (uCam + dir * b) / max(rt, 1e-4);
  float fit = b > 0.0 ? uLimbW : 0.0;
  float dl = fit > 0.0 ? min(limbAt(tp, uPolar, uSunL), 0.0) : 0.0;
  float lat = degrees(asin(clamp(tp.y, -1.0, 1.0)));
  float north = fit * smoothstep(uGlowNorth.x, uGlowNorth.y, lat);
  float pole = smoothstep(uGlowPole.x, uGlowPole.y, lat);
  float high = max(rt - 1.0 - dl, 0.0);
  float hh = uHazeH * mix(1.0, uGlowNorth.w, north);
  vec3 at;
  float tau = hazeDepthAt(dir, false, hh, at) * exp((max(rt - 1.0, 0.0) - high) / hh);
  float sunny = smoothstep(uHazeEdge.x, uHazeEdge.y, dot(at, uSunW));
  vec3 wide = mix(uGlowWide.rgb, uGlowCap, pole) * (north * sunny * sunny * exp(-high / uGlowWide.w));
  float tight = mix(1.0, uGlowNorth.z, north) * mix(1.0, uGlowPole.z, north * pole);
  vec3 Pa = vec3(at.x, at.y * uPolar, at.z);
  float shadow = 1.0 - uRingShadow * ringShadowAt(Pa, uSunL, uRingSoft, 1.0);
  outColor = vec4((hazeLight(at, dir) * (1.0 - exp(-tau)) * tight + wide) * shadow * uGain, 0.0);
  if (under || uDiag >= 2) discard;
}`

export class Shell {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(haze: HazeParams, look: GlobeLook, field: Record<string, THREE.IUniform>, polar: number, height = haze.scaleHeight) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: SHELL_FRAG,
      uniforms: {
        ...hazeUniforms(haze), ...field, uGain: { value: 1 }, uDiag: diagUniform, uSunL: { value: new THREE.Vector3(1, 0, 0) }, uPolar: { value: polar },
        uRingShadow: { value: look.ringShadow }, uRingSoft: { value: new THREE.Vector3(look.ringSoft[0], look.ringSoft[1], look.ringSlant) },
        uLimbFit: { value: look.limbFit }, uLimbLat: { value: new THREE.Vector2().fromArray(look.limbLat) }, uLimbW: { value: 0 }, uInflate: { value: 1 },
        uGlowNorth: { value: new THREE.Vector4().fromArray(look.glowNorth) }, uGlowPole: { value: new THREE.Vector4().fromArray(look.glowPole) }, uGlowWide: { value: new THREE.Vector4().fromArray(look.glowWide) }, uGlowCap: { value: new THREE.Vector3().fromArray(look.glowCap) },
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
