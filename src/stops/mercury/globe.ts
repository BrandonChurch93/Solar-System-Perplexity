import * as THREE from 'three'
import type { Pose } from '../../core/types'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { EQUIRECT_GLSL } from '../../space/sky'

export interface GlobeLight {
  curve: number[][]
  limb: number[][]
  limbTo: number
  night: [number, number, number]
  wrap: number
  relief: number
  reliefNear: number
  reliefDay: number
  reliefRange: [number, number]
  silhouette: { amp: number; floor: number; taps: number; fade: [number, number] }
  nightFlat: number
  nightDetail: number
  nightVeil: number
  nightVeilFrom: number
  nightSoft: [number, number, number, number]
  dusk: { from: number; range: [number, number, number, number] }
  edge: number
  rim: { color: [number, number, number]; width: number; wide: number; wideGain: number }
  glareGate: [number, number, number]
  glareLens: [number, number]
  nightAfter: number
  shoulder: { from: number; strength: number; frames: [number, number] }
}

export interface GlobePatches {
  textures: THREE.Texture[]
  widthsDeg: number[]
  spot: THREE.Vector3
  feather: number
  fade: [number, number]
  nearDeg: number
}

export interface GlobeOptions {
  map: THREE.Texture
  mapWidth: number
  height: THREE.Texture
  heightWidth: number
  light: GlobeLight
  patches?: GlobePatches
}

export const SHELL = 1.3
export const MAX_PATCHES = 6

const VERT = /* glsl */ `
out vec3 vPos;
out vec3 vClip;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
  vClip = gl_Position.xyw;
}`

const PATCH_SAMPLERS = Array.from({ length: MAX_PATCHES }, (_, i) => 'uniform sampler2D uPatch' + i + ';').join('\n')

const PATCH_LEVELS = Array.from({ length: MAX_PATCHES }, (_, i) => `    if (uPatchCount > ${i}.5) {
      vec2 q = g * uPatchScale[${i}];
      float w = front * smoothstep(0.5, 0.5 - uFeather, max(abs(q.x), abs(q.y))) * (1.0 - smoothstep(${i === 0 ? 'mix(uPatchFade.x, uMend.w, mend)' : 'uPatchFade.x'}, uPatchFade.y, parent));
      for (int k = 0; k < (uSmear > 0.0 ? 0 : 1); k++) {
        if (w > 0.0) albedo = mix(albedo, textureGrad(uPatch${i}, q + 0.5, gx * uPatchScale[${i}], gy * uPatchScale[${i}]).rgb, w);
      }
      for (int k = 0; k < (uSmear > 0.0 && w > 0.0 && bare ? 1 : 0); k++) albedo = mix(albedo, streak(uPatch${i}, q + 0.5, sx * uPatchScale[${i}], sy * uPatchScale[${i}], along, lat), w);
      parent = gd * uPatchScale[${i}] * uPatchSize[${i}];
      texels = mix(texels, parent, step(0.5, w));
      near = max(near, w * uPatchNear[${i}]);
    }`).join('\n')

const CLOSE_DRAWS = [['uWide', 'uvw', 'axw', 'ayw', 'ww', 'uWideSize'], ['uClose', 'uvc', 'axc', 'ayc', 'wc', 'uCloseSize']].map(([map, uv, ax, ay, w, size]) => `  for (int k = 0; k < (${w} > 0.0 ? 1 : 0); k++) {
    vec3 photo = vec3(0.0);
    for (int j = 0; j < (uSmear > 0.0 ? 0 : 1); j++) photo = textureGrad(${map}, ${uv}, ${ax} * uGrad, ${ay} * uGrad).rgb;
    for (int j = 0; j < (uSmear > 0.0 ? 1 : 0); j++) photo = streak(${map}, ${uv}, ${ax} * mh.x + ${ay} * mh.y, ${ay} * mh.x - ${ax} * mh.y, along, lat);
    vec3 ph = inverseFilmic(photo) * thin;
    col = mix(col, mix(ph, dot(ph, vec3(0.2126, 0.7152, 0.0722)) * uPlain, mute), ${w});
    vec2 tx = ${ax} * ${size};
    vec2 ty = ${ay} * ${size};
    texels = mix(texels, sqrt(max(dot(tx, tx), dot(ty, ty))), step(0.5, ${w}));
  }`).join('\n')

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform sampler2D uHeight;
${PATCH_SAMPLERS}
uniform float uPatchScale[${MAX_PATCHES}];
uniform float uPatchSize[${MAX_PATCHES}];
uniform float uPatchNear[${MAX_PATCHES}];
uniform float uPatchCount;
uniform float uFeather;
uniform vec2 uPatchFade;
uniform vec4 uMend;
uniform vec3 uSpotN;
uniform vec3 uSpotE;
uniform vec3 uSpotU;
uniform float uMapWidth;
uniform float uGrad;
uniform float uHeightStep;
uniform float uSpin;
uniform float uGain;
uniform float uWeight;
uniform vec3 uTint;
uniform float uWrap;
uniform vec3 uCurve[33];
uniform vec3 uLimb[17];
uniform float uLimbTo;
uniform vec3 uNight;
uniform float uNightDim;
uniform vec2 uShoulder;
uniform vec4 uRelief;
uniform vec4 uNightFlat;
uniform vec4 uNightSoft;
uniform vec3 uCarry;
uniform sampler2D uClose;
uniform mat3 uCloseCam;
uniform vec3 uCloseUp;
uniform vec4 uCloseLens;
uniform vec4 uCloseBox;
uniform vec4 uCloseFade;
uniform vec2 uCloseSize;
uniform float uCloseW;
uniform sampler2D uWide;
uniform sampler2D uWideAlpha;
uniform mat3 uWideCam;
uniform vec3 uWideEye;
uniform vec3 uWideLens;
uniform vec4 uWideBox;
uniform vec4 uWideFade;
uniform vec2 uWideOver;
uniform vec4 uWideDrop;
uniform vec3 uWideDown;
uniform vec3 uWideHold;
uniform vec2 uWideSize;
uniform float uSink;
uniform vec3 uHazeSun;
uniform vec3 uHazeGain[17];
uniform vec4 uHazeSpan;
uniform vec3 uHazeCut;
uniform vec3 uHazeCalm;
uniform vec2 uWash;
uniform vec2 uLift;
uniform vec2 uKnee;
uniform vec4 uDusk;
uniform float uDuskFrom;
uniform vec2 uReliefRange;
uniform vec3 uSil;
uniform vec3 uPlain;
uniform float uEdge;
uniform vec3 uRimColor;
uniform float uRimWide;
uniform vec3 uRimDir;
uniform vec3 uGlareW;
uniform vec3 uGlareGate;
uniform float uGlareLens;
uniform vec2 uRimWidth;
uniform mat3 uBodyToWorld;
uniform vec3 uCenter;
uniform vec3 uSunW;
uniform float uVignette;
uniform float uAspect;
uniform mat4 uPrev;
uniform float uSmear;
uniform vec3 uJitter;
in vec3 vPos;
in vec3 vClip;
out vec4 outColor;
${EQUIRECT_GLSL}
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
vec3 spinY(vec3 d, float a) {
  float c = cos(a), s = sin(a);
  return vec3(c * d.x - s * d.z, d.y, s * d.x + c * d.z);
}
float heightAt(vec3 d) {
  float u = atan(d.x, d.z) / (2.0 * PI) + 0.5;
  float v = asin(clamp(d.y, -1.0, 1.0)) / PI + 0.5;
  return textureLod(uHeight, vec2(u, v), 0.0).r;
}
vec3 slopeAt(vec3 d) {
  vec3 east = cross(vec3(0.0, 1.0, 0.0), d);
  float el = length(east);
  east = el > 1e-4 ? east / el : vec3(1.0, 0.0, 0.0);
  vec3 north = cross(d, east);
  float e = uHeightStep;
  float hE = heightAt(normalize(d + east * e)) - heightAt(normalize(d - east * e));
  float hN = heightAt(normalize(d + north * e)) - heightAt(normalize(d - north * e));
  return (east * hE + north * hN) / (2.0 * e);
}
vec3 curveAt(float ndl) {
  float x = clamp(ndl * 0.5 + 0.5, 0.0, 1.0) * 32.0;
  int i = int(min(floor(x), 31.0));
  return mix(uCurve[i], uCurve[i + 1], x - float(i));
}
vec3 streak(sampler2D tex, vec2 uv, vec2 am, vec2 an, float along, float lat) {
  float count = clamp(ceil(along / lat), 1.0, 4.0);
  float f = max(lat, along / count);
  vec3 sum = vec3(0.0);
  for (int i = 0; i < int(count); i++) sum += textureGrad(tex, uv + am * (along * ((float(i) + 0.5) / count - 0.5)), am * f, an * f).rgb;
  return sum / count;
}
vec3 closeSpot(vec3 dc) {
  vec3 cp = uCloseLens.x * dc - (uCloseLens.x + 1.0) * uCloseUp;
  return vec3((uCloseLens.zw + uCloseLens.y * vec2(cp.x, -cp.y) / max(-cp.z, 0.02) - uCloseBox.xy) / uCloseBox.zw, -cp.z);
}
vec3 limbAt(float mu) {
  float x = clamp(mu / uLimbTo, 0.0, 1.0) * 16.0;
  int i = int(min(floor(x), 15.0));
  return mix(uLimb[i], uLimb[i + 1], x - float(i));
}
void main() {
  vec3 ray = normalize(vPos);
  vec3 oc = -uCenter;
  float b = dot(oc, ray);
  float c = dot(oc, oc) - 1.0;
  float s = sqrt(max(dot(oc, oc) - b * b, 0.0));
  float px = max(fwidth(s), 1e-7);
  float crest = 0.0;
  for (int k = 0; k < (uSil.x > 0.0 && c > 0.0 && b < 0.0 && abs(s - 1.0) < uSil.x + 3.0 * px ? 1 : 0); k++) {
    vec3 nc = normalize(oc - ray * b);
    vec3 dl = spinY(nc * uBodyToWorld, uSpin);
    vec3 tl = spinY(normalize(cross(nc, ray)) * uBodyToWorld, uSpin);
    float w = max(uSil.z * px, uHeightStep);
    float hh = 0.0;
    for (int i = -2; i <= 2; i++) hh += heightAt(normalize(dl + tl * (w * float(i))));
    crest = uSil.x * max(hh / 5.0 - uSil.y, 0.0);
  }
  float cov = c > 0.0 ? clamp(0.5 + (1.0 - uSink + crest - s) / (px * uEdge), 0.0, 1.0) : 1.0;
  if (c > 0.0 && b > 0.0) cov = 0.0;
  float h = b * b - c;
  float t = -b - sqrt(max(h, 0.0));
  vec3 n = normalize(oc + ray * t);
  float out1 = max(s - 1.0 + uSink - crest, 0.0);
  float toward = smoothstep(uGlareGate.x, uGlareGate.y, dot(ray, uGlareW)) * uGlareLens;
  float ndlRim = dot(n, uSunW);
  vec3 rim = vec3(0.0);
  vec3 d = spinY(n * uBodyToWorld, uSpin);
  if (c > 0.0 && b < 0.0 && cov < 1.0) {
    vec3 lit = max(curveAt(dot(n, uRimDir)) - uNight, vec3(0.0)) * smoothstep(0.0, 0.35, ndlRim);
    float fall = exp(-out1 / uRimWidth.x) + uRimWide * exp(-out1 / uRimWidth.y);
    rim = uRimColor * lit * fall * (1.0 - cov) * mix(uGlareGate.z, 1.0, toward);
  }
  float mu = clamp(dot(n, -ray), 0.0, 1.0);
  vec2 ndc = vClip.xy / vClip.z;
  vec4 before = uPrev * vec4(ray * t, 1.0);
  vec2 move = (ndc - before.xy / max(before.w, 1e-6)) / vec2(dFdx(ndc.x), dFdy(ndc.y)) * uSmear;
  float sm = length(move);
  vec2 mh = sm > 1e-6 ? move / sm : vec2(1.0, 0.0);
  float still = smoothstep(0.5, 1.0, sm);
  float lat = mix(uGrad, 1.0, still);
  float along = max(lat, sm);
  vec3 jx = dFdx(d);
  vec3 jy = dFdy(d);
  vec2 jit = vec2(-uJitter.x, uJitter.y);
  vec2 jal = mh * dot(jit, mh);
  jit = jal * smoothstep(2.0, 6.0, sm * uJitter.z) + (jit - jal) * still;
  for (int k = 0; k < (uSmear > 0.0 ? 1 : 0); k++) d = normalize(d + jx * jit.x + jy * jit.y);
  vec3 dc = uCloseCam * d;
  float reach = uCloseLens.x * acos(clamp(dot(dc, uCloseUp), -1.0, 1.0));
  float span = uCloseW * (1.0 - smoothstep(uCloseFade.x, uCloseFade.y, reach));
  vec3 qc = closeSpot(dc);
  float glow = acos(clamp(dot(normalize(uCloseLens.x * dc - (uCloseLens.x + 1.0) * uCloseUp), uHazeSun), -1.0, 1.0));
  float hx = clamp((glow - uHazeSpan.x) / (uHazeSpan.y - uHazeSpan.x), 0.0, 1.0) * 16.0;
  int hi = int(min(floor(hx), 15.0));
  vec3 raw = mix(uHazeGain[hi], uHazeGain[hi + 1], hx - float(hi));
  vec3 thin = mix(vec3(1.0), min(raw * uHazeSpan.w, vec3(1.0)), uHazeSpan.z);
  float mute = uHazeCalm.z * (1.0 - smoothstep(uHazeCalm.x, uHazeCalm.y, raw.g));
  float clearOf = mix(1.0, smoothstep(uHazeCut.x, uHazeCut.y, glow), uHazeCut.z);
  vec2 uvc = vec2(qc.x, 1.0 - qc.y);
  vec2 axc = dFdx(uvc);
  vec2 ayc = dFdy(uvc);
  float wc = span * step(0.02, qc.z) * step(0.0, qc.y) * smoothstep(0.0, 1.0, min(qc.x, 1.0 - qc.x) / uCloseFade.z) * smoothstep(0.0, 1.0, (1.0 - qc.y) / uCloseFade.w) * clearOf;
  float sunk = 1.0 - uWideDrop.x * smoothstep(uWideDrop.y, uWideDrop.z, reach);
  vec3 ns = normalize(oc + ray * (-b - sqrt(max(h + (sunk * sunk - 1.0), 0.0))));
  vec3 dw = uWideCam * (d + spinY((ns - n) * uBodyToWorld, uSpin));
  vec3 wp = uCloseLens.x * sunk * dw - uWideEye;
  float wal = dot(wp, uWideDown);
  vec3 wpp = wp - wal * uWideDown;
  float wpl = max(length(wpp), 1e-6);
  wp = dot(dw, uWideEye) < uCloseLens.x * sunk || wpl > wal * uWideDrop.w ? uWideDown + wpp * (uWideDrop.w / wpl) : wp;
  vec2 qw = (uWideLens.yz + uWideLens.x * vec2(wp.x, -wp.y) / max(-wp.z, 0.02) - uWideBox.xy) / uWideBox.zw;
  vec2 uvw = vec2(qw.x, 1.0 - qw.y);
  vec2 axw = dFdx(uvw);
  vec2 ayw = dFdy(uvw);
  vec2 fold = step(uWideOver.y, uvw) * 2.0 - 1.0;
  float held = uWideHold.y * smoothstep(0.0, uWideHold.z, uCloseLens.x * acos(clamp(-dot(dw, uWideDown), -1.0, 1.0)) - uWideHold.x);
  axw = axw * fold + vec2(held / uWideSize.x, 0.0);
  ayw = ayw * fold + vec2(0.0, held / uWideSize.y);
  uvw = uWideOver.y + abs(uvw - uWideOver.y);
  float ww = uCloseW * step(0.02, -wp.z) * smoothstep(0.0, 1.0, min(min(qw.x + uWideOver.x, 1.0 - qw.x), min(qw.y, 1.0 - qw.y + uWideOver.x)) / uWideFade.x) * (1.0 - smoothstep(uWideFade.y, uWideFade.z, reach)) * clearOf;
  for (int k = 0; k < (ww > 0.0 ? 1 : 0); k++) ww *= smoothstep(uWideFade.w, 1.0, textureGrad(uWideAlpha, uvw, axw, ayw).r);
  bool bare = max(wc, ww) < 1.0;
  float wu = atan(d.x, d.z) / (2.0 * PI) + 0.5;
  float wv = asin(clamp(d.y, -1.0, 1.0)) / PI + 0.5;
  float wu2 = fract(wu + 0.5) - 0.5;
  vec2 wx = vec2(abs(dFdx(wu)) < abs(dFdx(wu2)) ? dFdx(wu) : dFdx(wu2), dFdx(wv));
  vec2 wy = vec2(abs(dFdy(wu)) < abs(dFdy(wu2)) ? dFdy(wu) : dFdy(wu2), dFdy(wv));
  vec3 albedo = vec3(0.0);
  for (int k = 0; k < (uSmear > 0.0 ? 0 : 1); k++) albedo = equirectGrad(uMap, d, uGrad).rgb;
  for (int k = 0; k < (uSmear > 0.0 && bare ? 1 : 0); k++) albedo = streak(uMap, vec2(wu, wv), wx * mh.x + wy * mh.y, wy * mh.x - wx * mh.y, along, lat);
  float texels = diagTexelsDir(d, uMapWidth);
  float dn = dot(d, uSpotN);
  float near = 0.0;
  if (uPatchCount > 0.5) {
    float inv = 1.0 / max(dn, 0.05);
    vec2 g = vec2(dot(d, uSpotE), dot(d, uSpotU)) * inv;
    vec2 gx = dFdx(g);
    vec2 gy = dFdy(g);
    float gd = sqrt(max(dot(gx, gx), dot(gy, gy)));
    vec2 sx = gx * mh.x + gy * mh.y;
    vec2 sy = gy * mh.x - gx * mh.y;
    gx *= uGrad;
    gy *= uGrad;
    float front = step(0.3, dn);
    float parent = texels;
    float mend = 1.0 - smoothstep(0.55 * uMend.z, uMend.z, length(g - uMend.xy));
${PATCH_LEVELS}
  }
  vec3 east = cross(vec3(0.0, 1.0, 0.0), d);
  float el = length(east);
  east = el > 1e-4 ? east / el : vec3(1.0, 0.0, 0.0);
  vec3 north = cross(d, east);
  float e = uHeightStep;
  float hE = 0.0;
  float hN = 0.0;
  for (int k = 0; k < (bare ? 1 : 0); k++) {
    hE = heightAt(normalize(d + east * e)) - heightAt(normalize(d - east * e));
    hN = heightAt(normalize(d + north * e)) - heightAt(normalize(d - north * e));
  }
  vec3 slope = (east * hE + north * hN) / (2.0 * e);
  vec3 dm = dFdx(d) * mh.x + dFdy(d) * mh.y;
  for (int k = 0; k < (uSmear > 0.0 && bare ? 1 : 0); k++) {
    float count = clamp(ceil(along / lat), 1.0, 4.0);
    slope = vec3(0.0);
    for (int i = 0; i < int(count); i++) slope += slopeAt(normalize(d + dm * (along * ((float(i) + 0.5) / count - 0.5))));
    slope /= count;
  }
  vec3 slopeW = uBodyToWorld * spinY(slope, -uSpin);
  float ndl0 = dot(n, uSunW);
  float dusk = 1.0 - smoothstep(uReliefRange.x, uReliefRange.y, ndl0);
  float strength = mix(mix(uRelief.z, uRelief.x, dusk), uRelief.y, near) * smoothstep(0.0, 0.12, mu);
  vec3 np = normalize(n - slopeW * strength);
  float ndl = dot(np, uSunW);
  float lift = clamp((ndl - ndl0) / max(ndl0 + uWrap, 0.06), uLift.x, uLift.y);
  vec3 lit = max(curveAt(ndl0) - uNight, vec3(0.0)) * mix(vec3(1.0), limbAt(mu), toward) * (1.0 + lift);
  vec3 ground = inverseFilmic(albedo);
  float band = smoothstep(uDusk.x, uDusk.y, ndl0) * (1.0 - smoothstep(uDusk.z, uDusk.w, ndl0));
  vec3 calm = ground;
  float deep = 1.0 - smoothstep(uNightSoft.x, uNightSoft.y, ndl0);
  for (int k = 0; k < (deep > 0.0 && bare ? 1 : 0); k++) calm = mix(ground, mix(inverseFilmic(textureGrad(uMap, vec2(wu, wv), wx * uNightSoft.w, wy * uNightSoft.w).rgb), ground, uNightSoft.z), deep);
  vec3 dim = mix(vec3(uNightFlat.x), calm, uNightFlat.y) + max(ground - uDuskFrom, vec3(0.0)) * (band * (1.0 - uNightFlat.y));
  vec3 col = (ground * lit + dim * uNight * uNightDim * (1.0 + uNightFlat.z * smoothstep(uNightFlat.w, 1.0, mu))) * uTint;
  col = mix(col, dot(col, vec3(0.2126, 0.7152, 0.0722)) * uPlain, uCarry.z);
  col *= uCarry.x / (1.0 + max(col.r, max(col.g, col.b)) * (uCarry.x - 1.0) * uCarry.y);
  col *= 1.0 / (1.0 + uShoulder.y * max(max(col.r, max(col.g, col.b)) - uShoulder.x, 0.0));
  col *= 1.0 / (1.0 + uKnee.y * max(max(col.r, max(col.g, col.b)) - uKnee.x, 0.0));
  vec3 wash = 1.0 / max(raw, vec3(0.02));
  wash *= min(1.0, uWash.y / max(wash.r, max(wash.g, wash.b)));
  col *= mix(vec3(1.0), wash, uWash.x);
${CLOSE_DRAWS}
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  float k = uGain * uWeight / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  vec4 beauty = vec4((col * cov + rim) * k, cov);
  outColor = diagOut(beauty, texels, 1.0, vec3(0.55, 0.5, 0.45), vec2(0.0), t);
  if (uDiag >= 2 ? cov < 0.5 : cov <= 0.0 && dot(rim, vec3(1.0)) < 1e-6) discard;
}`

export class Globe {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly bodyToWorld = new THREE.Matrix3()
  private readonly m4 = new THREE.Matrix4()
  private readonly center = new THREE.Vector3()
  private readonly edge: number
  private readonly rim: [number, number]
  private readonly axis = new THREE.Vector3()
  private readonly q = new THREE.Quaternion()

  constructor(o: GlobeOptions) {
    const p = o.patches
    const l = o.light
    this.edge = l.edge
    this.rim = [l.rim.width, l.rim.wide]
    if ((p?.textures.length ?? 0) > MAX_PATCHES) throw new Error('too many patch levels')
    const tex = (i: number): THREE.Texture | null => p?.textures[i] ?? p?.textures[0] ?? null
    const scale = (i: number): number => {
      const w = p?.widthsDeg[i]
      return w ? 1 / (2 * Math.tan(THREE.MathUtils.degToRad(w) / 2)) : 1
    }
    const size = (i: number): number => (p?.textures[i]?.image as unknown as { width: number } | undefined)?.width ?? 1
    const levels = Array.from({ length: MAX_PATCHES }, (_, i) => i)
    const spot = p?.spot.clone().normalize() ?? new THREE.Vector3(0, 0, 1)
    const east = new THREE.Vector3(0, 1, 0).cross(spot).normalize()
    const north = spot.clone().cross(east)
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      side: THREE.BackSide,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      uniforms: {
        uMap: { value: o.map }, uHeight: { value: o.height },
        ...Object.fromEntries(levels.map((i) => ['uPatch' + i, { value: tex(i) }])),
        uPatchScale: { value: levels.map(scale) }, uPatchSize: { value: levels.map(size) },
        uPatchNear: { value: levels.map((i) => ((p?.widthsDeg[i] ?? 360) <= (p?.nearDeg ?? 0) ? 1 : 0)) },
        uPatchCount: { value: p?.textures.length ?? 0 },
        uFeather: { value: p?.feather ?? 0.12 }, uPatchFade: { value: new THREE.Vector2(p?.fade[0] ?? 1.1, p?.fade[1] ?? 1.7) }, uMend: { value: new THREE.Vector4(1000, 1000, 1, 0) },
        uSpotN: { value: spot }, uSpotE: { value: east }, uSpotU: { value: north },
        uMapWidth: { value: o.mapWidth }, uHeightStep: { value: (2 * Math.PI) / o.heightWidth },
        uSpin: { value: 0 }, uGain: { value: 1 }, uWeight: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uTint: { value: new THREE.Vector3(1, 1, 1) },
        uWrap: { value: l.wrap }, uCurve: { value: l.curve.map((k) => new THREE.Vector3(k[0], k[1], k[2])) }, uLimb: { value: l.limb.map((k) => new THREE.Vector3(k[0], k[1], k[2])) }, uLimbTo: { value: l.limbTo }, uNight: { value: new THREE.Vector3().fromArray(l.night) }, uNightDim: { value: 1 },
        uRelief: { value: new THREE.Vector4(l.relief, l.reliefNear, l.reliefDay, 0) }, uNightFlat: { value: new THREE.Vector4(l.nightFlat, l.nightDetail, l.nightVeil, l.nightVeilFrom) }, uNightSoft: { value: new THREE.Vector4(l.nightSoft[0], l.nightSoft[1], l.nightSoft[2], l.nightSoft[3]) }, uDusk: { value: new THREE.Vector4().fromArray(l.dusk.range) }, uDuskFrom: { value: l.dusk.from }, uReliefRange: { value: new THREE.Vector2().fromArray(l.reliefRange) }, uSil: { value: new THREE.Vector3(0, l.silhouette.floor, l.silhouette.taps) },
        uEdge: { value: l.edge },
        uRimColor: { value: new THREE.Vector3().fromArray(l.rim.color) },
        uRimWide: { value: l.rim.wideGain }, uRimDir: { value: new THREE.Vector3(1, 0, 0) }, uGlareW: { value: new THREE.Vector3(1, 0, 0) }, uGlareGate: { value: new THREE.Vector3().fromArray(l.glareGate) }, uGlareLens: { value: 1 }, uRimWidth: { value: new THREE.Vector2(l.rim.width, l.rim.wide) },
        uBodyToWorld: { value: this.bodyToWorld }, uCenter: { value: this.center }, uSunW: { value: new THREE.Vector3(1, 0, 0) },
        uCarry: { value: new THREE.Vector3(1, 0, 0) }, uShoulder: { value: new THREE.Vector2(l.shoulder.from, 0) },
        uClose: { value: o.map }, uCloseCam: { value: new THREE.Matrix3() }, uCloseUp: { value: new THREE.Vector3(0, 1, 0) }, uCloseLens: { value: new THREE.Vector4(1, 1, 0, 0) }, uCloseBox: { value: new THREE.Vector4(0, 0, 1, 1) }, uCloseFade: { value: new THREE.Vector4(1, 2, 0.1, 0) }, uCloseSize: { value: new THREE.Vector2(1, 1) }, uCloseW: { value: 0 },
        uWide: { value: o.map }, uWideAlpha: { value: o.map }, uWideCam: { value: new THREE.Matrix3() }, uWideEye: { value: new THREE.Vector3(0, 2, 0) }, uWideLens: { value: new THREE.Vector3(1, 0, 0) }, uWideBox: { value: new THREE.Vector4(0, 0, 1, 1) }, uWideOver: { value: new THREE.Vector2(0, 0) }, uWideDrop: { value: new THREE.Vector4(0, 1, 2, 1e6) }, uWideDown: { value: new THREE.Vector3(0, -1, 0) }, uWideHold: { value: new THREE.Vector3(1e6, 0, 1) }, uWideFade: { value: new THREE.Vector4(0.1, 1, 2, 0.5) }, uWideSize: { value: new THREE.Vector2(1, 1) }, uSink: { value: 0 },
        uHazeSun: { value: new THREE.Vector3(0, 0, 1) }, uHazeGain: { value: Array.from({ length: 17 }, () => new THREE.Vector3(1, 1, 1)) }, uHazeSpan: { value: new THREE.Vector4(0, 1, 0, 1) }, uHazeCut: { value: new THREE.Vector3(0, 1, 0) }, uHazeCalm: { value: new THREE.Vector3(0, 1, 0) }, uWash: { value: new THREE.Vector2(0, 1) }, uLift: { value: new THREE.Vector2(-0.85, 1.6) }, uKnee: { value: new THREE.Vector2(1, 0) },
        uPrev: { value: new THREE.Matrix4() }, uSmear: { value: 0 }, uJitter: { value: new THREE.Vector3() }, uPlain: { value: new THREE.Vector3(1, 1, 1) }, uDiag: diagUniform, uGrad: gradUniform,
      },
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(SHELL, 96, 48), this.material)
    this.mesh.frustumCulled = false
  }

  carry(lift: number, knee: number, grey: number): void {
    ;(this.material.uniforms.uCarry!.value as THREE.Vector3).set(lift, knee, grey)
  }

  close(texture: THREE.Texture, toCamera: THREE.Quaternion, up: THREE.Vector3, radius: number, focal: number, center: readonly [number, number], box: readonly [number, number, number, number], far: readonly [number, number], feather: readonly [number, number]): void {
    const u = this.material.uniforms
    const size = texture.image as unknown as { width: number; height: number }
    u.uClose!.value = texture
    ;(u.uCloseCam!.value as THREE.Matrix3).setFromMatrix4(this.m4.makeRotationFromQuaternion(toCamera))
    ;(u.uCloseUp!.value as THREE.Vector3).copy(up)
    ;(u.uCloseLens!.value as THREE.Vector4).set(radius, focal, center[0], center[1])
    ;(u.uCloseBox!.value as THREE.Vector4).set(box[0], box[1], box[2], box[3])
    ;(u.uCloseFade!.value as THREE.Vector4).set(far[0], far[1], feather[0], feather[1])
    ;(u.uCloseSize!.value as THREE.Vector2).set(size.width, size.height)
  }

  wide(texture: THREE.Texture, alpha: THREE.Texture, toCamera: THREE.Quaternion, eye: THREE.Vector3, focal: number, center: readonly [number, number], box: readonly [number, number, number, number], feather: number, far: readonly [number, number], solid: number, radius: number, sink: number, drop: readonly [number, number], margin: number, blur: readonly [number, number]): void {
    const u = this.material.uniforms
    const size = texture.image as unknown as { width: number; height: number }
    const cone = Math.asin((radius - sink) / eye.length()) - margin
    ;(u.uWideDrop!.value as THREE.Vector4).set(sink / radius, drop[0], drop[1], Math.tan(cone))
    ;(u.uWideHold!.value as THREE.Vector3).set(radius * (Math.asin((eye.length() * Math.sin(cone)) / (radius - sink)) - cone), blur[0], blur[1])
    ;(u.uWideDown!.value as THREE.Vector3).copy(eye).normalize().negate()
    u.uWide!.value = texture
    u.uWideAlpha!.value = alpha
    ;(u.uWideCam!.value as THREE.Matrix3).setFromMatrix4(this.m4.makeRotationFromQuaternion(toCamera))
    ;(u.uWideEye!.value as THREE.Vector3).copy(eye)
    ;(u.uWideLens!.value as THREE.Vector3).set(focal, center[0], center[1])
    ;(u.uWideBox!.value as THREE.Vector4).set(box[0], box[1], box[2], box[3])
    ;(u.uWideFade!.value as THREE.Vector4).set(feather, far[0], far[1], solid)
    ;(u.uWideSize!.value as THREE.Vector2).set(size.width, size.height)
  }

  reach(from: number, to: number, feather: number, over: readonly [number, number]): void {
    ;(this.material.uniforms.uWideOver!.value as THREE.Vector2).set(over[0], over[1])
    const fade = this.material.uniforms.uWideFade!.value as THREE.Vector4
    fade.x = feather
    fade.y = from
    fade.z = to
  }

  mend(at: THREE.Vector3, reach: number, from: number): void {
    const u = this.material.uniforms
    const d = at.clone().normalize()
    const n = d.dot(u.uSpotN!.value as THREE.Vector3)
    ;(u.uMend!.value as THREE.Vector4).set(d.dot(u.uSpotE!.value as THREE.Vector3) / n, d.dot(u.uSpotU!.value as THREE.Vector3) / n, reach, from)
  }

  near(weight: number, sink: number): void {
    this.material.uniforms.uCloseW!.value = weight
    this.material.uniforms.uSink!.value = sink
  }

  haze(sun: readonly number[], fromDeg: number, toDeg: number, gain: readonly number[][], cutDeg: readonly [number, number], calm: readonly [number, number]): void {
    const u = this.material.uniforms
    ;(u.uHazeSun!.value as THREE.Vector3).fromArray(sun)
    ;(u.uHazeGain!.value as THREE.Vector3[]).forEach((v, i) => v.fromArray(gain[i]!))
    const span = u.uHazeSpan!.value as THREE.Vector4
    span.x = THREE.MathUtils.degToRad(fromDeg)
    span.y = THREE.MathUtils.degToRad(toDeg)
    ;(u.uHazeCut!.value as THREE.Vector3).set(THREE.MathUtils.degToRad(cutDeg[0]), THREE.MathUtils.degToRad(cutDeg[1]), 0)
    ;(u.uHazeCalm!.value as THREE.Vector3).set(calm[0], calm[1], 0)
  }

  wash(amount: number, cap: number): void {
    ;(this.material.uniforms.uWash!.value as THREE.Vector2).set(amount, cap)
  }

  clear(amount: number, level: number, lift: readonly [number, number], knee: readonly [number, number], calm: number): void {
    const u = this.material.uniforms
    ;(u.uHazeSpan!.value as THREE.Vector4).z = amount
    ;(u.uHazeSpan!.value as THREE.Vector4).w = level
    ;(u.uHazeCut!.value as THREE.Vector3).z = amount
    ;(u.uHazeCalm!.value as THREE.Vector3).z = calm
    ;(u.uLift!.value as THREE.Vector2).set(lift[0], lift[1])
    ;(u.uKnee!.value as THREE.Vector2).set(knee[0], knee[1])
  }

  night(dim: number, shoulder: number): void {
    this.material.uniforms.uNightDim!.value = dim
    ;(this.material.uniforms.uShoulder!.value as THREE.Vector2).y = shoulder
  }

  plain(tint: readonly [number, number, number]): void {
    ;(this.material.uniforms.uPlain!.value as THREE.Vector3).set(tint[0], tint[1], tint[2])
  }

  silhouette(amp: number): void {
    ;(this.material.uniforms.uSil!.value as THREE.Vector3).x = amp
  }

  update(sun: THREE.Vector3, glare: THREE.Vector3, lens: number, spin: number, gain: number, weight: number, rim: number, vignette: number, aspect: number): void {
    const u = this.material.uniforms
    ;(u.uSunW!.value as THREE.Vector3).copy(sun)
    u.uSpin!.value = spin
    u.uGain!.value = gain
    u.uWeight!.value = weight
    ;(u.uRimWidth!.value as THREE.Vector2).set(this.rim[0] * rim, this.rim[1] * rim)
    u.uEdge!.value = this.edge * Math.max(gradUniform.value, 0.35)
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
    this.mesh.updateWorldMatrix(true, false)
    this.center.setFromMatrixPosition(this.mesh.matrixWorld)
    this.bodyToWorld.setFromMatrix4(this.m4.extractRotation(this.mesh.matrixWorld))
    const axis = this.axis.copy(this.center).normalize()
    ;(u.uGlareW!.value as THREE.Vector3).copy(glare).normalize()
    u.uGlareLens!.value = lens
    const dir = u.uRimDir!.value as THREE.Vector3
    dir.copy(glare).addScaledVector(axis, -glare.dot(axis))
    if (dir.lengthSq() < 1e-6) dir.copy(sun).addScaledVector(axis, -sun.dot(axis))
    dir.normalize()
  }

  smear(camera: THREE.PerspectiveCamera, now: Pose | null, before: Pose | null, strength: number, jitterX: number, jitterY: number, samples: number): void {
    const u = this.material.uniforms
    ;(u.uJitter!.value as THREE.Vector3).set(jitterX, jitterY, samples)
    if (!now || !before || strength <= 0) {
      u.uSmear!.value = 0
      return
    }
    const m = u.uPrev!.value as THREE.Matrix4
    const k = Math.tan(THREE.MathUtils.degToRad(now.vfov) / 2) / Math.tan(THREE.MathUtils.degToRad(before.vfov) / 2)
    m.copy(camera.projectionMatrix)
    m.elements[0]! *= k
    m.elements[5]! *= k
    m.multiply(this.m4.makeRotationFromQuaternion(this.q.copy(before.quaternion).invert()))
    m.multiply(this.m4.makeTranslation(now.position.x - before.position.x, now.position.y - before.position.y, now.position.z - before.position.z))
    m.multiply(this.m4.makeRotationFromQuaternion(now.quaternion))
    m.multiply(this.m4.makeRotationFromQuaternion(this.q.copy(camera.quaternion).invert()))
    u.uSmear!.value = strength
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
