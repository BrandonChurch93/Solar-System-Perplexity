import * as THREE from 'three'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { EQUIRECT_GLSL } from '../../space/sky'
import { NOISE_GLSL } from '../../terrain/relief'
import { GRADE_GLSL } from './grade'

export interface GlobeLook {
  limb: [number, number]
  rim: { color: [number, number, number]; width: number; power: number; by: [number, number, number, number] }
  boil: { reach: number; period: number; step: number; max: number; quiet: [number, number] }
  hot: { from: number; to: number; boost: number }
  pulse: { amount: number; rate: number; from: number; to: number }
  cell: { amount: number; rate: number; scale: number; fine: number }
}

export interface GlobePatches {
  textures: THREE.Texture[]
  widthsDeg: number[]
  spot: THREE.Vector3
  feather: number
  fade: [number, number]
}

export interface GlobeOptions {
  map: THREE.Texture
  grade: THREE.Texture
  mapWidth: number
  look: GlobeLook
  patches?: GlobePatches
  segments?: number
}

const VERT = /* glsl */ `
out vec3 vLocal;
out vec3 vWorldN;
out vec3 vPos;
out vec3 vView;
out vec3 vClip;
void main() {
  vLocal = position;
  vWorldN = normalize(mat3(modelMatrix) * position);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz;
  vec4 mv = viewMatrix * wp;
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position.xyw;
}`

export const MAX_PATCHES = 4

const PATCH_SAMPLERS = Array.from({ length: MAX_PATCHES }, (_, i) => 'uniform sampler2D uPatch' + i + ';').join('\n')

const PATCH_LEVELS = Array.from({ length: MAX_PATCHES }, (_, i) => `    if (uPatchCount > ${i}.5) {
      vec2 q = g * uPatchScale[${i}];
      float w = front * smoothstep(0.5, 0.5 - uFeather, max(abs(q.x), abs(q.y))) * (1.0 - smoothstep(uPatchFade.x, uPatchFade.y, parent));
      if (w > 0.0) albedo = mix(albedo, textureGrad(uPatch${i}, q + 0.5, gx * uPatchScale[${i}], gy * uPatchScale[${i}]).rgb, w);
      parent = gd * uPatchScale[${i}] * uPatchSize[${i}];
      texels = mix(texels, parent, step(0.5, w));
    }`).join('\n')

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
${PATCH_SAMPLERS}
uniform float uPatchScale[${MAX_PATCHES}];
uniform float uPatchSize[${MAX_PATCHES}];
uniform float uPatchCount;
uniform float uFeather;
uniform vec2 uPatchFade;
uniform vec3 uSpotN;
uniform vec3 uSpotE;
uniform vec3 uSpotU;
uniform float uMapWidth;
uniform float uGrad;
uniform float uSpin;
uniform float uGain;
uniform float uWeight;
uniform float uOpen;
uniform vec4 uWash;
uniform vec2 uShade;
uniform vec3 uTint;
uniform vec4 uCalm;
uniform float uVignette;
uniform float uAspect;
uniform float uTime;
uniform vec2 uLimb;
uniform vec3 uRimColor;
uniform vec2 uRimShape;
uniform vec4 uRimBy;
uniform vec3 uCenter;
uniform mat3 uToSet;
uniform mat3 uFit;
uniform vec4 uBoil;
uniform vec2 uQuiet;
uniform vec3 uHot;
uniform vec4 uPulse;
uniform vec4 uCell;
in vec3 vClip;
in vec3 vLocal;
in vec3 vWorldN;
in vec3 vPos;
in vec3 vView;
out vec4 outColor;
${EQUIRECT_GLSL}
${INVERSE_FILMIC_GLSL}
${GRADE_GLSL}
${DIAG_GLSL}
${NOISE_GLSL}
vec3 spinY(vec3 d, float a) {
  float c = cos(a), s = sin(a);
  return vec3(c * d.x - s * d.z, d.y, s * d.x + c * d.z);
}
float lumAt(vec3 d, float lod) {
  float u = atan(d.x, d.z) / (2.0 * PI) + 0.5;
  float v = asin(clamp(d.y, -1.0, 1.0)) / PI + 0.5;
  return dot(textureLod(uMap, vec2(u, v), lod).rgb, vec3(0.3, 0.5, 0.2));
}
vec2 mapDx;
vec2 mapDy;
vec2 mapUv(vec3 d) {
  return vec2(atan(d.x, d.z) / (2.0 * PI) + 0.5, asin(clamp(d.y, -1.0, 1.0)) / PI + 0.5);
}
vec3 surface(vec3 d, vec3 d0, out float texels) {
  vec3 albedo = textureGrad(uMap, mapUv(d), mapDx, mapDy).rgb;
  texels = diagTexelsDir(d0, uMapWidth);
  if (uPatchCount > 0.5) {
    float dn = dot(d, uSpotN);
    float inv = 1.0 / max(dn, 0.05);
    vec2 g = vec2(dot(d, uSpotE), dot(d, uSpotU)) * inv;
    vec2 g0 = vec2(dot(d0, uSpotE), dot(d0, uSpotU)) / max(dot(d0, uSpotN), 0.05);
    vec2 gx = dFdx(g0);
    vec2 gy = dFdy(g0);
    float gd = sqrt(max(dot(gx, gx), dot(gy, gy)));
    gx *= uGrad;
    gy *= uGrad;
    float front = step(0.3, dn);
    float parent = texels;
${PATCH_LEVELS}
  }
  return albedo;
}
void main() {
  vec3 d = spinY(normalize(vLocal), uSpin);
  vec3 n = normalize(vWorldN);
  vec3 dir = normalize(vPos);
  float mu = clamp(dot(n, -dir), 0.0, 1.0);
  vec3 east = cross(vec3(0.0, 1.0, 0.0), d);
  float el = length(east);
  east = el > 1e-4 ? east / el : vec3(1.0, 0.0, 0.0);
  vec3 north = cross(d, east);
  vec2 uv0 = mapUv(d);
  float uAlt = fract(uv0.x + 0.5) - 0.5;
  mapDx = vec2(abs(dFdx(uv0.x)) < abs(dFdx(uAlt)) ? dFdx(uv0.x) : dFdx(uAlt), dFdx(uv0.y)) * uGrad;
  mapDy = vec2(abs(dFdy(uv0.x)) < abs(dFdy(uAlt)) ? dFdy(uv0.x) : dFdy(uAlt), dFdy(uv0.y)) * uGrad;
  float e = uBoil.z;
  float lod = log2(uMapWidth / 1024.0);
  float lE1 = lumAt(normalize(d + east * e), lod + 1.5);
  float lE0 = lumAt(normalize(d - east * e), lod + 1.5);
  float lN1 = lumAt(normalize(d + north * e), lod + 1.5);
  float lN0 = lumAt(normalize(d - north * e), lod + 1.5);
  vec3 push = (east * (lE1 - lE0) + north * (lN1 - lN0)) * (uBoil.x / (2.0 * e));
  float pl = length(push);
  push *= min(1.0, uBoil.w / max(pl, 1e-6)) * smoothstep(uQuiet.x, uQuiet.y, min(min(lE1, lE0), min(lN1, lN0)));
  vec3 dc = normalize(d.zxy + vec3(0.21, -0.13, 0.17));
  float slow = lumAt(dc, lod + 3.0) * 24.0 + lumAt(d, lod + 3.5) * 16.0;
  float swing = 0.5 * (sin(uTime * 6.283185307179586 / uBoil.y + slow) - sin(slow));
  float texels;
  vec3 shown = grade(surface(normalize(d + push * swing), d, texels), 2.0) * uTint;
  shown -= uCalm.w * max(shown - uCalm.xyz, 0.0);
  vec3 lin = inverseFilmic(shown);
  float wide = lumAt(d, lod + 2.5);
  float region = smoothstep(uPulse.z, uPulse.w, wide);
  float phase = dot(d, vec3(23.0, 17.0, 29.0));
  float beat = 1.0 + uPulse.x * region * (sin(uTime * uPulse.y + phase) - sin(phase));
  float churn = vnoise(d * (uCell.z + uTime * uCell.y)) - vnoise(d * uCell.z) + uCell.w * (vnoise(d * (uCell.z * 2.9 + uTime * uCell.y * 2.3) + 7.3) - vnoise(d * uCell.z * 2.9 + 7.3));
  beat *= max(1.0 + uCell.x * churn, 0.35);
  float hot = smoothstep(uHot.x, uHot.y, min(lin.r, lin.g * 1.6));
  vec3 col = lin * ((uLimb.x + uLimb.y * (1.0 - mu)) / uLimb.x) * beat * (1.0 + uHot.z * hot * hot);
  float rim = pow(1.0 - mu, uRimShape.y) * exp(-mu / uRimShape.x);
  for (int k = 0; k < (uRimBy.w > 0.0 && rim > 0.002 ? 1 : 0); k++) {
    vec3 ray = normalize(uFit * vPos);
    vec3 across = uToSet * (ray * dot(uCenter, ray) - uCenter);
    float turn = abs(fract(atan(across.y, across.x) / 6.283185307179586 - uRimBy.y + 0.5) - 0.5);
    rim *= mix(1.0, uRimBy.x, smoothstep(uRimBy.z, uRimBy.w, turn));
  }
  col += uRimColor * rim;
  for (int k = 0; k < (uWash.w > 0.0 ? 1 : 0); k++) {
    col = mix(col * uOpen, uWash.xyz * (1.0 - uShade.x * pow(1.0 - mu, uShade.y)), uWash.w);
  }
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain * uWeight / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = diagOut(vec4(col, 1.0), texels, 1.0, vec3(0.95, 0.55, 0.1), push.xy * 200.0, length(vView));
}`

export class SunGlobe {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(o: GlobeOptions) {
    const p = o.patches
    const l = o.look
    const levels = Array.from({ length: MAX_PATCHES }, (_, i) => i)
    if ((p?.textures.length ?? 0) > MAX_PATCHES) throw new Error('too many patch levels')
    const tex = (i: number): THREE.Texture | null => p?.textures[i] ?? p?.textures[0] ?? null
    const scale = (i: number): number => {
      const w = p?.widthsDeg[i]
      return w ? 1 / (2 * Math.tan(THREE.MathUtils.degToRad(w) / 2)) : 1
    }
    const size = (i: number): number => (p?.textures[i]?.image as unknown as { width: number } | undefined)?.width ?? 1
    const spot = p?.spot.clone().normalize() ?? new THREE.Vector3(0, 0, 1)
    const east = new THREE.Vector3(0, 1, 0).cross(spot).normalize()
    const north = spot.clone().cross(east)
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uMap: { value: o.map }, uGrade: { value: o.grade },
        ...Object.fromEntries(levels.map((i) => ['uPatch' + i, { value: tex(i) }])),
        uPatchScale: { value: levels.map(scale) }, uPatchSize: { value: levels.map(size) },
        uPatchCount: { value: p?.textures.length ?? 0 },
        uFeather: { value: p?.feather ?? 0.12 }, uPatchFade: { value: new THREE.Vector2(p?.fade[0] ?? 1.1, p?.fade[1] ?? 1.7) },
        uSpotN: { value: spot }, uSpotE: { value: east }, uSpotU: { value: north },
        uMapWidth: { value: o.mapWidth },
        uSpin: { value: 0 }, uGain: { value: 1 }, uWeight: { value: 1 }, uOpen: { value: 1 }, uWash: { value: new THREE.Vector4(1, 1, 1, 0) }, uShade: { value: new THREE.Vector2(0, 1) }, uTint: { value: new THREE.Vector3(1, 1, 1) }, uCalm: { value: new THREE.Vector4(1, 1, 1, 0) }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uTime: { value: 0 },
        uLimb: { value: new THREE.Vector2(l.limb[0], l.limb[1]) },
        uRimColor: { value: new THREE.Vector3().fromArray(l.rim.color) },
        uRimShape: { value: new THREE.Vector2(l.rim.width, l.rim.power) },
        uRimBy: { value: new THREE.Vector4(l.rim.by[0], l.rim.by[1], l.rim.by[2], l.rim.by[3]) },
        uCenter: { value: new THREE.Vector3() }, uToSet: { value: new THREE.Matrix3() }, uFit: { value: new THREE.Matrix3() },
        uBoil: { value: new THREE.Vector4(l.boil.reach, l.boil.period, l.boil.step, l.boil.max) },
        uQuiet: { value: new THREE.Vector2(l.boil.quiet[0], l.boil.quiet[1]) },
        uHot: { value: new THREE.Vector3(l.hot.from, l.hot.to, l.hot.boost) },
        uPulse: { value: new THREE.Vector4(l.pulse.amount, l.pulse.rate, l.pulse.from, l.pulse.to) },
        uCell: { value: new THREE.Vector4(l.cell.amount, l.cell.rate, l.cell.scale, l.cell.fine) },
        uDiag: diagUniform, uGrad: gradUniform,
      },
    })
    const seg = o.segments ?? 320
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, seg, seg / 2), this.material)
  }

  update(time: number, spin: number, gain: number, weight: number, vignette: number, aspect: number, tint?: THREE.Vector3, calm?: THREE.Vector4, open = 1, wash?: THREE.Vector4, shade?: [number, number]): void {
    const u = this.material.uniforms
    ;(u.uShade!.value as THREE.Vector2).set(shade ? shade[0] : 0, shade ? shade[1] : 1)
    u.uOpen!.value = open
    if (wash) (u.uWash!.value as THREE.Vector4).copy(wash)
    else (u.uWash!.value as THREE.Vector4).set(1, 1, 1, 0)
    if (calm) (u.uCalm!.value as THREE.Vector4).copy(calm)
    else (u.uCalm!.value as THREE.Vector4).set(1, 1, 1, 0)
    u.uTime!.value = time
    u.uSpin!.value = spin
    u.uGain!.value = gain
    u.uWeight!.value = weight
    if (tint) (u.uTint!.value as THREE.Vector3).copy(tint)
    else (u.uTint!.value as THREE.Vector3).set(1, 1, 1)
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
  }

  limb(center: THREE.Vector3, fit: THREE.Matrix3, toSet: THREE.Matrix3): void {
    const u = this.material.uniforms
    ;(u.uCenter!.value as THREE.Vector3).copy(center)
    ;(u.uFit!.value as THREE.Matrix3).copy(fit)
    ;(u.uToSet!.value as THREE.Matrix3).copy(toSet)
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
