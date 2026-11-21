import * as THREE from 'three'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import azimuth from './azimuth.json'
import { RING_LAYOUT_GLSL, RING_PROFILE_GLSL } from './profile'
import ringsJson from './rings.json'
import { SHOT_GLSL } from './shot'

export interface RingLook {
  shadowFloor: [number, number, number]
  floorHold: [number, number, number]
  floorTone: [number, number]
  shadowClose: [number, number]
  shadowLift: number
  floorAlpha: number
  penumbra: [number, number, number]
  penumbraFar: [number, number]
  inner: [number, number, number, number]
  over: [number, number, number, number]
  strand: [number, number, number]
  overTone: [number, number, number, number]
  shadowThin: [number, number, number]
  unlit: number
  lodBias: number
  lodBiasClose: number
  spokes: number
  clumps: number
  grain: number
  sparkle: number
  sparkleTint: [number, number, number]
  sparkleCell: number
  closeTone: [number, number, number]
  veil: [number, number]
  sweep: number
  grainHero: number
  grainCell: [number, number]
  floorRamp: [number, number]
  junction: number
  shadeTint: [number, number, number]
  shadeGrey: [number, number]
  heroTone: [number, number, number]
  heroTurn: number
  shapeFit: [number, number]
  skimEdge: [number, number]
  skimFoot: number
  skimDensity: [number, number]
  skimShow: number
  reach: number
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

export const HASH_GLSL = /* glsl */ `
uint pcg(uint v) {
  uint s = v * 747796405u + 2891336453u;
  uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u;
  return (w >> 22u) ^ w;
}
float hash2(ivec2 p) {
  return float(pcg(uint(p.x) + pcg(uint(p.y))) >> 8) * (1.0 / 16777216.0);
}
float hash3(ivec3 p) {
  return float(pcg(uint(p.x) + pcg(uint(p.y) + pcg(uint(p.z)))) >> 8) * (1.0 / 16777216.0);
}
int wrapI(int a, int n) {
  return ((a % n) + n) % n;
}
float vnoise(vec2 p, int period) {
  vec2 i = floor(p);
  vec2 f = p - i;
  f = f * f * (3.0 - 2.0 * f);
  ivec2 a = ivec2(i);
  int x0 = wrapI(a.x, period);
  int x1 = wrapI(a.x + 1, period);
  return mix(mix(hash2(ivec2(x0, a.y)), hash2(ivec2(x1, a.y)), f.x), mix(hash2(ivec2(x0, a.y + 1)), hash2(ivec2(x1, a.y + 1)), f.x), f.y);
}`

const FRAG = /* glsl */ `
precision highp float;
precision highp int;
in vec3 vLocal;
in vec3 vView;
in vec3 vClip;
uniform vec3 uCamL;
uniform vec3 uSunL;
uniform vec3 uShadowL;
uniform float uFloorA;
uniform vec2 uEdge;
uniform float uPolar;
uniform float uGain;
uniform float uWeight;
uniform float uTime;
uniform float uSpinRate;
uniform float uGrad;
uniform vec2 uLodBias;
uniform vec3 uShadowFloor;
uniform vec3 uFloorHold;
uniform vec2 uFloorTone;
uniform float uShadowLift;
uniform vec3 uPenumbra;
uniform vec2 uPenumbraFar;
uniform vec4 uInner;
uniform vec4 uOver;
uniform vec3 uStrand;
uniform vec4 uOverTone;
uniform vec3 uShadowThin;
uniform float uAzGain[25];
uniform float uAzRadii[5];
uniform float uUnlit;
uniform vec4 uAzimuth;
uniform vec3 uSparkleTint;
uniform float uSparkleCell;
uniform vec3 uCloseTone;
uniform vec2 uVeil;
uniform float uSweep;
uniform vec2 uGrain;
uniform vec2 uGrainCell;
uniform vec2 uFloorRamp;
uniform vec3 uShadeTint;
uniform vec2 uShadeGrey;
uniform vec3 uHeroTone;
uniform float uVignette;
uniform float uAspect;
uniform float uPass;
uniform float uHeroTurn;
uniform sampler2D uSkimMap;
uniform sampler2D uSkimMask;
uniform mat4 uSkimM;
uniform vec2 uSkimSize;
uniform float uSkimW;
uniform vec4 uSkimFit;
uniform float uReach;
uniform float uSkimNear;
uniform vec3 uSkimCam;
uniform sampler2D uPolarMap;
uniform highp sampler2D uPolarWarp;
uniform vec2 uPolarSpan;
uniform vec2 uPolarSize;
uniform vec4 uPolarFit;
uniform float uPolarW;
uniform float uPolarShape;
uniform vec2 uPolarOuter;
uniform vec2 uShapeFit;
out vec4 outColor;
${DIAG_GLSL}
${RING_PROFILE_GLSL}
${RING_LAYOUT_GLSL}
${HASH_GLSL}
${INVERSE_FILMIC_GLSL}
${SHOT_GLSL}
float azRow(int i, vec4 h) {
  return uAzGain[i * 5] + uAzGain[i * 5 + 1] * h.x + uAzGain[i * 5 + 2] * h.y + uAzGain[i * 5 + 3] * h.z + uAzGain[i * 5 + 4] * h.w;
}
float azGain(float r, float phi) {
  int i = 0;
  for (int k = 1; k < 4; k++) if (r >= uAzRadii[k]) i = k;
  float t = clamp((r - uAzRadii[i]) / (uAzRadii[i + 1] - uAzRadii[i]), 0.0, 1.0);
  vec4 h = vec4(cos(phi), sin(phi), cos(2.0 * phi), sin(2.0 * phi));
  return clamp(mix(azRow(i, h), azRow(i + 1, h), t), 0.4, 1.7);
}
float rowNoise(float phi, int row, float cellA, float cellR) {
  float rr = (float(row) + 0.5) * cellR;
  int per = max(int(floor(6.283185307 * rr / cellA)), 1);
  float p = (phi + uSpinRate * pow(max(rr, 1.0) / 1.86, -1.5) * uTime) / 6.283185307 * float(per);
  float i = floor(p);
  float f = p - i;
  f = f * f * (3.0 - 2.0 * f);
  int x0 = wrapI(int(i), per);
  return mix(hash2(ivec2(x0, row)), hash2(ivec2(wrapI(x0 + 1, per), row)), f);
}
float grain(float phi, float r, float cellA, float cellR) {
  float y = r / cellR - 0.5;
  float i = floor(y);
  float f = y - i;
  f = f * f * (3.0 - 2.0 * f);
  return mix(rowNoise(phi, int(i), cellA, cellR), rowNoise(phi, int(i) + 1, cellA, cellR), f) - 0.5;
}
void main() {
  float r = length(vLocal.xz);
  float inS;
  vec2 kv = shotUv(uSkimM, vLocal, 1.0, inS);
  vec2 kgx = dFdx(kv);
  vec2 kgy = dFdy(kv);
  vec2 ke = min(kv, 1.0 - kv);
  float wS = uSkimW * (inS > 0.0 || min(ke.x, ke.y) > -0.004 ? smoothstep(0.0, max(uSkimFit.x, 1e-5), min(ke.x, ke.y) + 0.004) : 0.0);
  vec4 km = vec4(0.0);
  float behind = 0.0;
  for (int k = 0; k < (wS > 0.0 ? 1 : 0); k++) {
    km = textureGrad(uSkimMask, kv, kgx * uSkimFit.w, kgy * uSkimFit.w);
    vec2 tx = kgx * uSkimSize;
    vec2 ty = kgy * uSkimSize;
    wS *= km.g * smoothstep(uSkimFit.y, uSkimFit.z, sqrt(min(dot(tx, tx), dot(ty, ty))));
    vec3 sc = vec3(uSkimCam.x, uSkimCam.y / uPolar, uSkimCam.z);
    vec3 sd = vec3(vLocal.x, vLocal.y / uPolar, vLocal.z) - sc;
    float sa = dot(sd, sd);
    float sb = dot(sc, sd);
    behind = (sb < 0.0 && -sb < sa) ? smoothstep(-0.006, 0.0, (sb * sb - sa * (dot(sc, sc) - 1.0)) / sa) : 0.0;
  }
  bool far = r > uReach;
  vec3 lay = far ? vec3(r, 1.0, 0.0) : ringLayout(vLocal, r);
  bool disc = r < 1.0;
  float rp = disc ? max(lay.x, mix(r, uEdge.x + 0.006, lay.z)) : lay.x;
  float azd = degrees(atan(vLocal.z, vLocal.x));
  rp += (disc || far) ? 0.0 : (uInner.z * smoothstep(45.0, 60.0, azd) + uInner.w * smoothstep(80.0, 95.0, azd)) * uPolarShape * (1.0 - smoothstep(uInner.x, uInner.y, azd)) * (1.0 - smoothstep(1.2, 1.45, rp));
  float shape = 0.0;
  for (int k = 0; k < ((uPolarShape > 0.0 && !far && !disc) ? 1 : 0); k++) shape = uPolarShape * texture(uPolarWarp, vec2(atan(vLocal.z, vLocal.x) / 6.283185307 + 0.5, (rp - uPolarSpan.x) * uPolarSpan.y)).r;
  float rs = rp - shape;
  float rq = rp - shape * smoothstep(uShapeFit.x, uShapeFit.y, rp);
  float x = far ? -1.0 : ringRadius(rq);
  bool span = x > 0.0 && x < 1.0;
  wS *= span ? 1.0 : uSkimNear;
  if (!span && wS <= 0.0) discard;
  vec3 toCam = uCamL - vLocal;
  float dist = length(toCam);
  vec3 V = toCam / dist;
  float nearest = dot(uCamL, V);
  bool hidden = false;
  for (int k = 0; k < ((uClose > 0.0 && !disc && (layoutOver > 0.0 || wS * km.r > 0.0)) ? 1 : 0); k++) {
    vec3 c = vec3(uCamL.x, uCamL.y / uPolar, uCamL.z);
    vec3 d = vec3(vLocal.x, vLocal.y / uPolar, vLocal.z) - c;
    float qa = dot(d, d);
    float qb = dot(c, d);
    float qd = qb * qb - qa * (dot(c, c) - 1.0);
    hidden = qd > 0.0 && -qb - sqrt(max(qd, 0.0)) > 0.0 && -qb - sqrt(max(qd, 0.0)) < qa;
  }
  if (!hidden && !disc) wS *= mix(1.0 - behind, 1.0, km.r);
  bool top = disc || hidden;
  if (uPass < 0.5 ? (dist < nearest || top) : (dist >= nearest && !top)) discard;
  float fr = length(vec2(dFdx(rq), dFdy(rq)));
  float texels = ringTexels(fr);
  vec4 s = span ? profAt(x, texels * uGrad * mix(uLodBias.x, uLodBias.y, uClose)) * (1.0 - uPolarShape * (1.0 - uClose) * smoothstep(uEdge.y + 0.004, uEdge.y + 0.02, rq)) : vec4(0.0);
  float mu = abs(V.y);
  float over = 0.0;
  for (int k = 0; k < ((uClose < 1.0 && !disc && !far) ? 1 : 0); k++) {
    vec3 c = vec3(uCamL.x, uCamL.y / uPolar, uCamL.z);
    vec3 d = vec3(vLocal.x, vLocal.y / uPolar, vLocal.z) - c;
    float qa = dot(d, d);
    float qb = dot(c, d);
    float od = (qb * qb - qa * (dot(c, c) - 1.0)) / qa;
    over = -qb > qa ? smoothstep(-0.05, 0.0, od) * (1.0 - uClose) * smoothstep(uEdge.x, uEdge.x + uOver.x, rq) : 0.0;
  }
  float body = smoothstep(uEdge.x - 0.004, uEdge.x + 0.004, rq) * (1.0 - smoothstep(uEdge.y - 0.002, uEdge.y + 0.002, rq));
  float alpha = 1.0 - pow(1.0 - min(max(s.a, uFloorA * body * mix(1.0, smoothstep(uFloorRamp.x, uFloorRamp.y, rq), 1.0 - uClose)), 0.999), clamp(mix(0.43, 0.25, uClose) / max(mu, 0.02), 1.0, 8.0));
  float swept = (1.0 - smoothstep(uVeil.x, uVeil.y, uClose)) * uSweep;
  float lift = max(smoothstep(-uJunction, uJunction, layoutDist + 2.0 * uJunction - swept), wS * (1.0 - smoothstep(0.0, 1.0, swept)));
  alpha = top ? 0.999 : alpha;
  float cut = mix(1.0 - uClose * smoothstep(uEdge.y - 0.002, uEdge.y + 0.004, rq), 1.0, wS) * (top ? mix(hidden ? layoutOver : layoutCut, 1.0, wS) * lift : 1.0);
  vec3 col = inverseFilmic(s.rgb) * mix(uHeroTone * azGain(r, atan(vLocal.z, vLocal.x)), uCloseTone, uClose);

  float kepler = uSpinRate * pow(max(rp, 1.0) / 1.86, -1.5);
  float th = atan(vLocal.z, vLocal.x) + kepler * uTime;
  float tu = th / 6.283185307;
  float inB = smoothstep(1.5, 1.6, rp) * (1.0 - smoothstep(1.88, 1.95, rp));
  float n1 = vnoise(vec2(tu * 36.0, r * 3.0), 36);
  float n2 = vnoise(vec2(tu * 640.0, r * 70.0), 640);
  float mottle = 1.0 - uAzimuth.x * inB * smoothstep(0.55, 0.9, n1) + uAzimuth.y * (n2 - 0.5);
  float turning = mottle;
  vec2 q = vec2(tu * 6.283185307 * r, r);
  vec2 qx = dFdx(q);
  vec2 qy = dFdy(q);
  float major = max(length(qx), length(qy));
  vec2 tang = vec2(-vLocal.z, vLocal.x) / max(r, 1e-4);
  float fa = max(abs(dot(dFdx(vLocal.xz), tang)), abs(dot(dFdy(vLocal.xz), tang)));
  float phi = atan(vLocal.z, vLocal.x);
  vec2 lg = log2(max(vec2(fr, fa), 1e-7) * 1e4) + uGrainCell;
  vec2 fg = fract(lg);
  vec2 cg = 1e-4 * exp2(floor(lg));
  vec4 wg = vec4((1.0 - fg.x) * (1.0 - fg.y), fg.x * (1.0 - fg.y), (1.0 - fg.x) * fg.y, fg.x * fg.y);
  float ga = mix(uGrain.x, uGrain.y, uClose) * smoothstep(0.02, 0.1, s.a) * smoothstep(2e-6, 2e-5, fr) * (top ? 0.0 : 1.0);
  for (int k = 0; k < (ga > 0.0 ? 1 : 0); k++) {
    float gr = wg.x * grain(phi, rp, cg.y, cg.x) + wg.y * grain(phi, rp, cg.y, 2.0 * cg.x) + wg.z * grain(phi, rp, 2.0 * cg.y, cg.x) + wg.w * grain(phi, rp, 2.0 * cg.y, 2.0 * cg.x);
    mottle += ga * 2.0 * gr / length(wg);
  }
  col *= mottle;
  float wP = far || disc ? 0.0 : uPolarW * smoothstep(uPolarFit.x, uPolarFit.y, rp) * (1.0 - smoothstep(uPolarOuter.x, uPolarOuter.y, rs));
  for (int k = 0; k < (wP > 0.0 ? 1 : 0); k++) {
    float pa = phi / 6.283185307 + 0.5;
    float pv = (rp - uPolarSpan.x) * uPolarSpan.y;
    float pr = clamp(pv - shape * uPolarSpan.y, 0.5 / uPolarSize.y, 1.0 - 0.5 / uPolarSize.y);
    vec2 pgx = vec2((vLocal.x * dFdx(vLocal.z) - vLocal.z * dFdx(vLocal.x)) / (6.283185307 * r * r), dFdx(rp) * uPolarSpan.y);
    vec2 pgy = vec2((vLocal.x * dFdy(vLocal.z) - vLocal.z * dFdy(vLocal.x)) / (6.283185307 * r * r), dFdy(rp) * uPolarSpan.y);
    vec2 tx = pgx * uPolarSize;
    vec2 ty = pgy * uPolarSize;
    float w = wP * smoothstep(uPolarFit.z, uPolarFit.w, sqrt(min(dot(tx, tx), dot(ty, ty))));
    col = mix(col, inverseFilmic(textureGrad(uPolarMap, vec2(pa, pr), pgx * uGrad, pgy * uGrad).rgb) * mix(1.0, turning, uHeroTurn), w);
    texels = mix(texels, sqrt(max(dot(tx, tx), dot(ty, ty))), w);
  }

  float cell = uSparkleCell;
  float det = qx.x * qy.y - qx.y * qy.x;
  float show = 1.0 - smoothstep(0.12, 0.3, major / cell);
  for (int k = 0; k < ((uAzimuth.w > 0.0 && show > 0.0 && abs(det) > 1e-16) ? 1 : 0); k++) {
    int row = int(floor(r / cell));
    int per = max(int(floor(6.283185307 * (float(row) + 0.5))), 1);
    float cx = tu * float(per);
    ivec3 id = ivec3(wrapI(int(floor(cx)), per), row, 7);
    float pick = hash3(id);
    for (int m = 0; m < (pick < 0.2 ? 1 : 0); m++) {
      vec2 centre = 0.25 + 0.5 * vec2(hash3(id + ivec3(0, 0, 4)), hash3(id + ivec3(0, 0, 6)));
      vec2 dq = (vec2(fract(cx), fract(r / cell)) - centre) * cell;
      vec2 px = vec2(qy.y * dq.x - qy.x * dq.y, -qx.y * dq.x + qx.x * dq.y) / det;
      float size = 0.4 + 0.45 * hash3(id + ivec3(0, 0, 10));
      float tw = 0.5 + 0.5 * sin(6.283185307 * hash3(id + ivec3(0, 0, 12)) + uTime * (2.0 + 5.0 * hash3(id + ivec3(0, 0, 16))));
      float glint = exp(-dot(px, px) / (size * size)) * pow(tw, 3.0) * (0.3 + 1.7 * pick / 0.2);
      vec3 tint = mix(vec3(1.0), uSparkleTint, hash3(id + ivec3(0, 0, 22)));
      col += tint * glint * uAzimuth.w * show * smoothstep(0.03, 0.2, dot(col, vec3(0.2126, 0.7152, 0.0722)));
    }
  }

  vec3 ss = normalize(vec3(uShadowL.x, uShadowL.y / uPolar, uShadowL.z));
  float along = dot(vLocal, ss);
  float miss = length(vLocal - ss * along);
  float mw = 0.75 * length(vec2(dFdx(miss), dFdy(miss)));
  float lit = disc ? smoothstep(-0.3, 0.15, along) : (along > 0.0 ? 1.0 : smoothstep(uPenumbra.x - mw, uPenumbra.y + mw + uPenumbra.z * max(-along, 0.0) + uPenumbraFar.y * max(-along - uPenumbraFar.x, 0.0), miss));
  float thin = 1.0 - uShadowThin.z * smoothstep(uShadowThin.x, uShadowThin.y, rq) * (1.0 - lit) * (1.0 - uClose) * uPolarShape * (disc ? 0.0 : 1.0);
  over *= lit;
  alpha = max(alpha, uOver.z * over) * thin;
  for (int k = 0; k < (over > 0.0 ? 1 : 0); k++) {
    float sx = ringRadius(uStrand.x + (rq - uEdge.x) * uStrand.y);
    float sl = texels * uGrad * uStrand.y * 1.5;
    float zone = over * (1.0 - smoothstep(uOver.y, uOver.w, rq));
    float tone = mix(mix(uOverTone.x, uOverTone.y, smoothstep(1.2, 1.4, rq)), uOverTone.z, mix(1.0, smoothstep(uOverTone.w - 6.0, uOverTone.w + 6.0, azd), uPolarShape));
    float st = clamp(pow(max(dot(profAt(sx, sl).rgb, vec3(0.2126, 0.7152, 0.0722)), 1e-3) / max(dot(profAt(sx, sl * 24.0).rgb, vec3(0.2126, 0.7152, 0.0722)), 1e-3), uStrand.z), 0.5, 1.6);
    col *= mix(1.0, tone * st, zone);
  }
  float dense = smoothstep(0.0, 0.6, dot(col, vec3(0.2126, 0.7152, 0.0722)));
  vec3 unlit = mix(uFloorHold * (uFloorTone.x + uFloorTone.y * dense) * smoothstep(uFloorRamp.x, uFloorRamp.y, rq), uShadowFloor * (0.6 + 0.9 * dense), uClose) * body * thin;
  col = mix(unlit, col, mix(lit, 1.0, uShadowLift * uClose)) * lay.y * mix(vec3(1.0), layoutTone, lay.z);
  col = mix(vec3(dot(col, vec3(0.2126, 0.7152, 0.0722))) * uShadeTint, col, mix(1.0, smoothstep(uShadeGrey.x, uShadeGrey.y, lay.y), lay.z));
  if (uSunL.y * uCamL.y < 0.0) col *= uUnlit * (0.25 + 3.0 * s.a * (1.0 - s.a)) / max(s.a, 0.05);
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  float vig = mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  for (int k = 0; k < (wS > 0.0 ? 1 : 0); k++) {
    vec2 kq = (kv - 0.5) * vec2(uAspect, 1.0);
    vec3 img = inverseFilmic(textureGrad(uSkimMap, kv, kgx * uSkimFit.w, kgy * uSkimFit.w).rgb) * vig / mix(1.0, 1.0 / pow(1.0 + dot(kq, kq) * 0.9, 2.0), uVignette);
    col = mix(col, img * km.r, wS);
    alpha = mix(alpha, km.r, wS);
    vec2 tx = kgx * uSkimSize;
    vec2 ty = kgy * uSkimSize;
    texels = mix(texels, sqrt(max(dot(tx, tx), dot(ty, ty))), wS);
  }
  col *= uGain * uWeight / vig;
  if (uDiag >= 2 && alpha * cut < 0.5) discard;
  outColor = diagOut(vec4(col, alpha * uWeight) * cut, texels, 1.0, vec3(0.95, 0.7, 0.2), vec2(kepler * 8.0, 0.0), length(vView));
}`

export class Rings {
  readonly group = new THREE.Group()
  readonly materials: THREE.ShaderMaterial[] = []
  private readonly geometry: THREE.BufferGeometry
  private readonly parts: THREE.BufferGeometry[] = []
  private pos: Float32Array = new Float32Array(0)
  private all: number[] = []

  constructor(profile: Record<string, THREE.IUniform>, layout: Record<string, THREE.IUniform>, shots: Record<string, THREE.IUniform>, look: RingLook, polar: number) {
    const [r0, r1] = ringsJson.span as [number, number]
    const seg = 720
    const bands = 6
    const pos = new Float32Array((seg + 1) * (bands + 1) * 3)
    const index: number[] = []
    const inner = Math.min(r0 - 0.01, 0.01)
    const outer = Math.max(r1 + 0.01, look.reach) / Math.cos(Math.PI / seg)
    for (let j = 0; j <= bands; j++) {
      const r = inner + ((outer - inner) * j) / bands
      for (let i = 0; i <= seg; i++) {
        const a = (i / seg) * Math.PI * 2
        pos.set([Math.cos(a) * r, 0, Math.sin(a) * r], (j * (seg + 1) + i) * 3)
      }
    }
    for (let j = 0; j < bands; j++) for (let i = 0; i < seg; i++) {
      const a = j * (seg + 1) + i
      const b = a + seg + 1
      index.push(a, b, a + 1, a + 1, b, b + 1)
    }
    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    this.geometry.setIndex(index)
    this.pos = pos
    this.all = index
    const shared = {
      ...profile,
      ...layout,
      ...shots,
      uHeroTurn: { value: look.heroTurn }, uShapeFit: { value: new THREE.Vector2().fromArray(look.shapeFit) }, uSkimFit: { value: new THREE.Vector4(look.skimEdge[0], look.skimDensity[0], look.skimDensity[1], 0) }, uReach: { value: ringsJson.span[1] }, uSkimNear: { value: 1 }, uSkimCam: { value: new THREE.Vector3() },
      uCamL: { value: new THREE.Vector3(0, 1, 3) }, uSunL: { value: new THREE.Vector3(1, 0.2, 0) }, uShadowL: { value: new THREE.Vector3(1, 0.2, 0) }, uPolar: { value: polar },
      uFloorA: { value: look.floorAlpha }, uEdge: { value: new THREE.Vector2(ringsJson.inner, ringsJson.outer) },
      uGain: { value: 1 }, uWeight: { value: 1 }, uTime: { value: 0 }, uSpinRate: { value: 0 },
      uGrad: gradUniform, uDiag: diagUniform, uLodBias: { value: new THREE.Vector2(look.lodBias, look.lodBiasClose) },
      uShadowFloor: { value: new THREE.Vector3().fromArray(look.shadowFloor) }, uFloorHold: { value: new THREE.Vector3().fromArray(look.floorHold) }, uPenumbraFar: { value: new THREE.Vector2().fromArray(look.penumbraFar) }, uInner: { value: new THREE.Vector4().fromArray(look.inner) }, uOver: { value: new THREE.Vector4().fromArray(look.over) }, uStrand: { value: new THREE.Vector3().fromArray(look.strand) }, uOverTone: { value: new THREE.Vector4().fromArray(look.overTone) }, uShadowThin: { value: new THREE.Vector3().fromArray(look.shadowThin) }, uFloorTone: { value: new THREE.Vector2().fromArray(look.floorTone) }, uShadowLift: { value: look.shadowLift }, uPenumbra: { value: new THREE.Vector3().fromArray(look.penumbra) }, uAzGain: { value: azimuth.coeffs.flat() }, uAzRadii: { value: azimuth.radii },
      uUnlit: { value: look.unlit }, uAzimuth: { value: new THREE.Vector4(look.spokes, look.clumps, look.grain, look.sparkle) },
      uSparkleTint: { value: new THREE.Vector3().fromArray(look.sparkleTint) }, uSparkleCell: { value: look.sparkleCell },
      uCloseTone: { value: new THREE.Vector3().fromArray(look.closeTone) }, uHeroTone: { value: new THREE.Vector3().fromArray(look.heroTone) },
      uGrainCell: { value: new THREE.Vector2().fromArray(look.grainCell) }, uFloorRamp: { value: new THREE.Vector2().fromArray(look.floorRamp) }, uGrain: { value: new THREE.Vector2(look.grainHero, look.grain) }, uVeil: { value: new THREE.Vector2().fromArray(look.veil) }, uSweep: { value: look.sweep }, uJunction: { value: look.junction }, uShadeTint: { value: new THREE.Vector3().fromArray(look.shadeTint) }, uShadeGrey: { value: new THREE.Vector2().fromArray(look.shadeGrey) }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 },
    }
    for (const pass of [0, 1]) {
      const material = new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG,
        uniforms: { ...shared, uPass: { value: pass } },
        side: THREE.DoubleSide, transparent: true, depthWrite: false, depthTest: false, premultipliedAlpha: true,
        blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      })
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', this.geometry.getAttribute('position'))
      const ia = new THREE.BufferAttribute(new Uint16Array(index), 1)
      ia.setUsage(THREE.DynamicDrawUsage)
      g.setIndex(ia)
      this.parts.push(g)
      const mesh = new THREE.Mesh(g, material)
      mesh.frustumCulled = false
      mesh.renderOrder = pass === 0 ? 2 : 6
      this.materials.push(material)
      this.group.add(mesh)
    }
  }

  cull(cam: THREE.Vector3, close: number): void {
    const p = this.pos
    const cx = cam.x * 0.5
    const cz = cam.z * 0.5
    const rad = Math.hypot(cx, cz)
    const eps = 1e-3 * (1 + rad)
    const seg = (ax: number, az: number, bx: number, bz: number, qx: number, qz: number): number => {
      const dx = bx - ax
      const dz = bz - az
      const l = dx * dx + dz * dz
      const t = l > 0 ? Math.min(1, Math.max(0, ((qx - ax) * dx + (qz - az) * dz) / l)) : 0
      return Math.hypot(ax + dx * t - qx, az + dz * t - qz)
    }
    const inside = (x: number[], z: number[], qx: number, qz: number): boolean => {
      let pos = 0
      let neg = 0
      for (let k = 0; k < 3; k++) {
        const n = (k + 1) % 3
        const c = (x[n]! - x[k]!) * (qz - z[k]!) - (z[n]! - z[k]!) * (qx - x[k]!)
        if (c >= 0) pos++
        if (c <= 0) neg++
      }
      return pos === 3 || neg === 3
    }
    const far = (x: number[], z: number[], qx: number, qz: number): number => inside(x, z, qx, qz) ? 0 : Math.min(seg(x[0]!, z[0]!, x[1]!, z[1]!, qx, qz), seg(x[1]!, z[1]!, x[2]!, z[2]!, qx, qz), seg(x[2]!, z[2]!, x[0]!, z[0]!, qx, qz))
    const counts = [0, 0]
    const out = this.parts.map((g) => g.getIndex()!.array as Uint16Array)
    const x = [0, 0, 0]
    const z = [0, 0, 0]
    for (let t = 0; t < this.all.length; t += 3) {
      let inK = 0
      let inD = 0
      for (let k = 0; k < 3; k++) {
        const v = this.all[t + k]! * 3
        x[k] = p[v]!
        z[k] = p[v + 2]!
        if (Math.hypot(x[k]! - cx, z[k]! - cz) < rad - eps) inK++
        if (Math.hypot(x[k]!, z[k]!) < 1 - eps) inD++
      }
      const drop0 = inK === 3 || inD === 3
      const drop1 = close <= 0 && far(x, z, cx, cz) > rad + eps && far(x, z, 0, 0) > 1 + eps
      for (let pass = 0; pass < 2; pass++) {
        if (pass === 0 ? drop0 : drop1) continue
        const o = out[pass]!
        const c = counts[pass]!
        o[c] = this.all[t]!
        o[c + 1] = this.all[t + 1]!
        o[c + 2] = this.all[t + 2]!
        counts[pass] = c + 3
      }
    }
    this.parts.forEach((g, i) => {
      g.setDrawRange(0, counts[i]!)
      g.getIndex()!.needsUpdate = true
    })
  }

  get uniforms(): Record<string, THREE.IUniform> {
    return this.materials[0]!.uniforms
  }

  dispose(): void {
    this.geometry.dispose()
    for (const m of this.materials) m.dispose()
  }
}
