import * as THREE from 'three'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { EQUIRECT_GLSL } from '../../space/sky'
import { NOISE_GLSL } from '../../terrain/relief'
import { APRON_GLSL } from './apron'
import fieldData from './field.json'
import { GRADE_GLSL } from './grade'
import { LIFE_GLSL, LIFE_NAMES } from './life'
import { STAGE_GLSL } from './stage'
import terrain from './terrain.json'

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

export interface GlobePlace {
  ground: Record<string, THREE.IUniform>
  toStage: THREE.Matrix3
  capDeg: [number, number]
  fade: [number, number]
  lowLod: number
  spotKeep: [number, number]
}

export interface GlobeOptions {
  map: THREE.Texture
  grade: THREE.Texture
  mapWidth: number
  look: GlobeLook
  patches?: GlobePatches
  place?: GlobePlace
  segments?: number
}

const PLACE_SHARED: [string, string][] = [
  ['uPlate', 'uPlate'], ['uSize', 'uSize'], ['uApron', 'uApron'], ['uApronSize', 'uApronSize'], ['uApronOn', 'uApronOn'], ['uApronOut', 'uApronOut'], ['uApronEdge', 'uApronEdge'], ['uApronCell', 'uApronCell'],
  ['uGlow', 'uGlow'], ['uField', 'uField'], ['uFieldSize', 'uFieldSize'], ['uFieldFine', 'uFieldFine'], ['uFieldFineMore', 'uFieldFineMore'], ['uOwn', 'uOwn'], ['uUp', 'uUp'], ['uLift', 'uLift'], ['uEven', 'uEven'], ['uEvenTint', 'uEvenTint'], ['uGlowReach', 'uGlowReach'],
  ['uBox', 'uBox'], ['uGlowBeat', 'uGlowBeat'], ['uCellSize', 'uCellSize'], ['uTwinkle', 'uTwinkle'], ['uInflow', 'uInflow'], ['uInflowRate', 'uInflowRate'],
  ['uEye', 'uCam'], ['uBand', 'uBand'], ['uLod', 'uLod'], ['uGSpot', 'uSpot'], ['uGSpotE', 'uSpotE'], ['uGSpotN', 'uSpotN'], ['uGTime', 'uTime'],
  ...LIFE_NAMES.map((name): [string, string] => [name, name]),
]

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
uniform sampler2D uPlate;
uniform vec2 uSize;
uniform sampler2D uApron;
uniform vec2 uApronSize;
uniform float uApronOn;
uniform float uApronOut;
uniform float uApronEdge;
uniform vec2 uApronCell;
uniform sampler2D uGlow;
uniform sampler2D uField;
uniform vec4 uFieldSize;
uniform vec4 uFieldFine;
uniform vec2 uFieldFineMore;
uniform vec4 uOwn;
uniform vec4 uUp;
uniform vec2 uLift;
uniform vec4 uEven;
uniform vec4 uEvenTint;
uniform vec2 uGlowReach;
uniform vec4 uBox;
uniform float uGlowBeat;
uniform float uCellSize;
uniform vec3 uTwinkle;
uniform vec4 uInflow;
uniform vec2 uInflowRate;
uniform vec3 uEye;
uniform vec2 uBand;
uniform float uLod;
uniform vec3 uGSpot;
uniform vec3 uGSpotE;
uniform vec3 uGSpotN;
uniform float uGTime;
uniform mat3 uToStage;
uniform vec3 uNadir;
uniform vec2 uCap;
uniform vec2 uPlaceFade;
uniform float uPlaceOn;
uniform float uTidy;
uniform vec3 uSpotKeep;
uniform float uBare;
uniform float uLowLod;
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
${STAGE_GLSL}
${APRON_GLSL}
${LIFE_GLSL}
float lumOf(sampler2D map, vec2 uv, float lod) {
  return dot(textureLod(map, uv, lod).rgb, vec3(0.3, 0.5, 0.2));
}
vec2 fieldShift(vec2 id) {
  float lo = uFieldSize.z / uFieldSize.x + 0.02;
  return mix(vec2(lo), vec2(1.0 - lo), vec2(vhash(vec3(id, 3.7)), vhash(vec3(id.yx + 17.3, 9.1))));
}
vec3 fieldTap(vec2 g, vec2 id, vec2 dx, vec2 dy) {
  vec2 at = uFieldSize.z * vec2(id.x + 0.5 * id.y, 0.8660254 * id.y);
  return textureGrad(uField, (g - at) / uFieldSize.x + fieldShift(id), dx, dy).rgb;
}
vec3 fieldAt(vec2 g, vec2 dx, vec2 dy, out vec3 mean) {
  vec2 s = mat2(1.0, 0.0, -0.57735027, 1.15470054) * (g / uFieldSize.z);
  vec2 base = floor(s);
  vec3 t = vec3(fract(s), 0.0);
  t.z = 1.0 - t.x - t.y;
  bool lower = t.z > 0.0;
  vec3 wt = lower ? vec3(t.z, t.y, t.x) : vec3(-t.z, 1.0 - t.y, 1.0 - t.x);
  vec2 a = lower ? base : base + vec2(1.0, 1.0);
  vec2 b = lower ? base + vec2(0.0, 1.0) : base + vec2(1.0, 0.0);
  vec2 c = lower ? base + vec2(1.0, 0.0) : base + vec2(0.0, 1.0);
  wt = pow(wt, vec3(uFieldSize.w));
  wt /= wt.x + wt.y + wt.z;
  mean = textureLod(uField, vec2(0.5), 20.0).rgb;
  vec3 sum = wt.x * fieldTap(g, a, dx, dy) + wt.y * fieldTap(g, b, dx, dy) + wt.z * fieldTap(g, c, dx, dy);
  return max(mean + (sum - mean) / sqrt(dot(wt, wt)), vec3(0.0));
}
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
  float placed = 0.0;
  vec3 at = ST_CENTRE + ST_RADIUS * (uToStage * d);
  vec3 lay = at - ST_DOWN;
  vec2 gnd = vec2(dot(lay, ST_RIGHT), dot(lay, ST_FWD));
  float ring = length(gnd);
  vec2 arc = gnd * (ST_RADIUS * asin(min(ring / ST_RADIUS, 1.0)) / max(ring, 1e-4));
  vec2 uvF = arc / uFieldSize.x;
  vec2 dxF = dFdx(uvF) * uGrad;
  vec2 dyF = dFdy(uvF) * uGrad;
  vec2 uvP = stPlate(stImage(at));
  vec2 dxP = dFdx(uvP) * uGrad;
  vec2 dyP = dFdy(uvP) * uGrad;
  vec2 ab = apImage(at);
  vec2 uvB = apUv(ab);
  vec2 dxB = dFdx(uvB) * uGrad;
  vec2 dyB = dFdy(uvB) * uGrad;
  float texF = diagTexels(uvF * uFieldSize.y);
  float finer = uFieldFine.x * (1.0 - smoothstep(uFieldFine.y, uFieldFine.z, texF));
  float texP = diagTexels(uvP * uSize);
  float texB = diagTexels(uvB * uApronSize);
  vec3 ddx = dFdx(d);
  vec3 ddy = dFdy(d);
  float dA = dot(ddx, ddx);
  float dC = dot(ddy, ddy);
  float dB = dot(ddx, ddy);
  float isoRate = sqrt(max(0.5 * (dA + dC - sqrt((dA - dC) * (dA - dC) + 4.0 * dB * dB)), 0.0)) * uMapWidth / 6.283185307179586;
  vec3 fromSpot = at - uGSpot;
  vec3 spotUp = cross(uGSpotE, uGSpotN);
  fromSpot -= spotUp * dot(fromSpot, spotUp);
  float keep = uSpotKeep.z * (1.0 - smoothstep(uSpotKeep.x, uSpotKeep.y, length(fromSpot)));
  float wPlace = uPlaceOn * smoothstep(uCap.x, uCap.y, dot(d, uNadir)) * max(1.0 - smoothstep(uPlaceFade.x, uPlaceFade.y, isoRate), keep);
  for (int k = 0; k < (wPlace > 0.0 ? 1 : 0); k++) {
    vec2 fromApex = gnd - ST_FOLD.yz;
    float phi = atan(fromApex.x, fromApex.y);
    float dist = length(at);
    vec3 normal = normalize(at - ST_CENTRE);
    float graze = clamp(dot(normal, -at / dist), 0.0, 1.0);
    float now = clamp(dot(normal, normalize(uEye - at)), 0.0, 1.0);
    float lift = smoothstep(uLift.x, uLift.y, now - graze);
    float edge = ring;
    for (int j = 0; j < (lift > 0.0 ? 1 : 0); j++) edge += lift * uUp.z * (vnoise(vec3(gnd * uUp.w, 1.7)) + 0.5 * vnoise(vec3(gnd * uUp.w * 2.7, 5.3)) - 0.75);
    float own = (1.0 - smoothstep(mix(uOwn.x, uUp.x, lift), mix(uOwn.y, uUp.y, lift), edge)) * smoothstep(0.0, uOwn.z, min(ST_PHI.y - phi, phi - ST_PHI.x)) * smoothstep(ST_FOLD.x, ST_FOLD.x + uOwn.w, gnd.y);
    float w = apWeight(at, ab) * uApronOn;
    float bare = (1.0 - own) * (1.0 - w);
    vec3 rel = at - uGSpot;
    vec3 up = cross(uGSpotE, uGSpotN);
    rel -= up * dot(rel, up);
    float r = length(rel);
    float psi = atan(dot(rel, uGSpotN), dot(rel, uGSpotE));
    float band = smoothstep(uInflow.z * 0.85, uInflow.z * 1.35, r) * (1.0 - smoothstep(uInflow.w * 0.7, uInflow.w, r));
    float strand = 9.0 * sin(psi * 23.0) + 7.0 * sin(psi * 57.0 + 1.3) + 5.0 * sin(psi * 131.0 + 0.4);
    float wave = r / uInflow.w * uInflow.y * 6.283185307179586 + strand;
    float inflow = 1.0 + uInflow.x * band * (0.6 * (sin(wave - uGTime * uInflowRate.x) - sin(wave)) + 0.4 * (sin(wave * 2.3 - uGTime * uInflowRate.y) - sin(wave * 2.3)));
    float spot = 1.0 - smoothstep(uInflow.w * 0.88, uInflow.w * 1.12, r);
    float inner = 0.0;
    float seen = 0.0;
    vec2 gq = gnd * uTwinkle.z;
    float flick = vnoise(vec3(gq, uGTime * uTwinkle.y)) - vnoise(vec3(gq, 0.0)) + 0.5 * (vnoise(vec3(gq * 2.3 + 7.3, uGTime * uTwinkle.y * 1.7 + 3.1)) - vnoise(vec3(gq * 2.3 + 7.3, 3.1)));
    inflow *= max(1.0 + uTwinkle.x * flick, 0.35);
    vec3 close = vec3(0.0);
    vec3 fine = vec3(0.0);
    vec3 mid = vec3(1.0);
    for (int j = 0; j < ((w < 1.0 && own > 0.0) ? 1 : 0); j++) {
      float tone = clamp(stLimb(now) / stLimb(graze), 0.25, 5.0);
      float cellU = uCellSize / dist / (2.0 * ST_TAN.x * ST_CANVAS.z);
      vec2 cell = vec2(cellU, cellU * max(graze, 0.08) * uSize.x / uSize.y);
      vec3 low = inverseFilmic(grade(textureLod(uPlate, uvP, log2(max(cell.y * uSize.y * 0.25, 1.0)) + uLowLod).rgb, 0.0));
      vec2 mv;
      seen = lifeSeen(dxP, dyP, uSize);
      vec3 s = alive(uPlate, uCellsPlate, uSwellPlate, arc / uCellSize, uvP, dxP, dyP, cell, 1.0, uGTime, seen, spot, inner, mv);
      vec3 even = mix(vec3(1.0), uEvenTint.rgb, smoothstep(uEven.x, uEven.y, ring)) * mix(1.0, uEvenTint.w, smoothstep(uEven.z, uEven.w, ring));
      close = s * max(inflow, 0.0) * tone * mix(vec3(1.0), even, lift);
      fine = s;
      mid = low;
    }
    for (int j = 0; j < (bare > 0.0 ? 1 : 0); j++) {
      float tone = clamp(stLimb(now) / stLimb(${fieldData.tone}), 0.25, 5.0);
      vec3 mean;
      vec3 f = inverseFilmic(fieldAt(arc, dxF, dyF, mean));
      for (int i = 0; i < (finer > 0.0 ? 1 : 0); i++) {
        vec2 g2 = arc * uFieldFine.w + vec2(5.3, 2.9);
        vec3 none;
        vec3 hi = inverseFilmic(fieldAt(g2, dxF * uFieldFine.w, dyF * uFieldFine.w, none));
        vec3 lo = inverseFilmic(fieldAt(g2, dxF * uFieldFine.w * uFieldFineMore.y, dyF * uFieldFine.w * uFieldFineMore.y, none));
        f *= mix(1.0, pow(clamp(dot(hi, vec3(0.3, 0.5, 0.2)) / max(dot(lo, vec3(0.3, 0.5, 0.2)), 1e-4), 0.25, 4.0), uFieldFineMore.x), finer);
      }
      close = mix(f * max(inflow, 0.0) * tone, close, own);
      fine = mix(f, fine, own);
      mid = mix(inverseFilmic(mean), mid, own);
    }
    for (int j = 0; j < (w > 0.0 ? 1 : 0); j++) {
      vec3 toEye = AP_EYE - at;
      float away = length(toEye);
      float seen = clamp(dot(normal, toEye / away), 0.0, 1.0);
      float tone = clamp(stLimb(now) / stLimb(seen), 0.25, 5.0);
      float cellU = uApronCell.x / away / (2.0 * AP_TAN.x);
      vec2 cell = vec2(cellU, cellU * max(seen, 0.08) * uApronSize.x / uApronSize.y);
      vec3 low = inverseFilmic(grade(textureLod(uApron, uvB, log2(max(cell.y * uApronSize.y * 0.25, 1.0)) + uLowLod).rgb, 0.0));
      vec2 mv;
      float in2;
      float seen2 = lifeSeen(dxB, dyB, uApronSize);
      vec3 s = alive(uApron, uCellsApron, uSwellApron, arc / uCellSize, uvB, dxB, dyB, cell, uCellSize / uApronCell.x, uGTime, seen2, spot, in2, mv);
      inner = mix(inner, in2, w);
      seen = mix(seen, seen2, w);
      close = mix(close, s * max(inflow, 0.0) * tone, w);
      fine = mix(fine, s, w);
      mid = mix(mid, low, w);
    }
    for (int j = 0; j < (seen > 0.0 ? 1 : 0); j++) {
      float px = 1.0 / max(max(length(dFdx(arc)), length(dFdy(arc))), 1e-9) / uLifeFade.z;
      float tone = clamp(stLimb(now) / stLimb(graze), 0.25, 5.0);
      float lane = (1.0 - smoothstep(uLifeGrainMore.x, uLifeGrainMore.y, inner)) * seen * (1.0 - bare) * (1.0 - spot);
      vec2 q = vec2(dot(rel, uGSpotE), dot(rel, uGSpotN)) / uInflow.z;
      close *= 1.0 + uLifeCalm * uLifeStream.x * seen * lifeStream(q, px * uInflow.z, uGTime);
      close += uLifeGrainTint.rgb * (uLifeCalm * uLifeGrain.x * tone * lifeGrains(arc, lane, px * uLifeGrain.y, uGTime));
      close += uLifeDotsTint.rgb * (uLifeCalm * uLifeDots.x * tone * seen * lifeDots(q, px * uInflow.z * uLifeDots.y, uGTime));
    }
    vec3 to = ST_CENTRE - uEye;
    float away = length(to);
    vec3 c1 = to / away;
    vec3 ray = normalize(at - uEye);
    float el = (acos(clamp(dot(ray, c1), -1.0, 1.0)) - asin(clamp(ST_RADIUS / away, 0.0, 1.0))) * sqrt(max(away * away - ST_RADIUS * ST_RADIUS, 0.0)) / ST_RADIUS * tan(ST_ALPHA);
    float limb = smoothstep(uBand.x, uBand.y, el);
    vec2 gb = stImage(at);
    for (int j = 0; j < (limb > 0.0 ? 1 : 0); j++) {
      vec2 far = stImage(stLimbDir(ray, c1, el));
      close = mix(close, inverseFilmic(textureLod(uPlate, stPlate(far), uLod).rgb), limb);
      gb = mix(gb, far, limb);
    }
    vec3 lit = vec3(1.0);
    gb = vec2((gb.x - uBox.x) / (uBox.z - uBox.x), 1.0 - (gb.y - uBox.y) / (uBox.w - uBox.y));
    for (int j = 0; j < ((at.z < -0.5 && gb.x > 0.0 && gb.x < 1.0 && gb.y > 0.0 && gb.y < 1.0) ? 1 : 0); j++) {
      lit += textureLod(uGlow, gb, 0.0).rgb * (uGlowBeat * (1.0 - lift * smoothstep(uGlowReach.x, uGlowReach.y, ring)));
    }
    float detail = clamp(dot(fine, vec3(0.2126, 0.7152, 0.0722)) / max(dot(mid, vec3(0.2126, 0.7152, 0.0722)), 1e-4), 0.0, 3.0);
    vec3 wideCol = col * detail;
    wideCol.g = min(wideCol.g, wideCol.r);
    wideCol.b = min(wideCol.b, wideCol.g);
    float closeShare = max(uTidy, keep);
    col = mix(col, pow(max(wideCol, vec3(1e-5)), vec3(1.0 - closeShare)) * pow(max(close, vec3(1e-5)), vec3(closeShare)) * lit, wPlace);
    placed = wPlace * uBare;
    texels = mix(texels, bare > 0.5 ? texF * mix(1.0, uFieldFine.w, step(0.5, finer)) : mix(texP, texB, step(0.5, w)), step(0.5, wPlace));
  }
  float rim = pow(1.0 - mu, uRimShape.y) * exp(-mu / uRimShape.x) * (1.0 - placed);
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
    const down = new THREE.Vector3().fromArray(terrain.down).normalize()
    const nadir = o.place ? down.clone().negate().applyMatrix3(o.place.toStage.clone().transpose()) : new THREE.Vector3(0, 0, 1)
    const shared = Object.fromEntries(PLACE_SHARED.map(([name, from]) => [name, o.place?.ground[from] ?? { value: null }]))
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
        uToStage: { value: o.place?.toStage ?? new THREE.Matrix3() },
        uNadir: { value: nadir },
        uCap: { value: new THREE.Vector2(Math.cos(THREE.MathUtils.degToRad(o.place?.capDeg[1] ?? 44)), Math.cos(THREE.MathUtils.degToRad(o.place?.capDeg[0] ?? 36))) },
        uPlaceFade: { value: new THREE.Vector2(o.place?.fade[0] ?? 1.1, o.place?.fade[1] ?? 1.7) },
        uPlaceOn: { value: 0 }, uTidy: { value: 0 }, uBare: { value: 0 }, uSpotKeep: { value: new THREE.Vector3(o.place?.spotKeep[0] ?? 1, o.place?.spotKeep[1] ?? 2, 0) }, uLowLod: { value: o.place?.lowLod ?? 3 },
        ...shared,
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

  place(on: number, tidy: number, bare: number, spot: number): void {
    ;(this.material.uniforms.uSpotKeep!.value as THREE.Vector3).z = spot
    this.material.uniforms.uPlaceOn!.value = on
    this.material.uniforms.uTidy!.value = tidy
    this.material.uniforms.uBare!.value = bare
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
