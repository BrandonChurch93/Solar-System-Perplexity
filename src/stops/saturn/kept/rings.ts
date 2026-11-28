import * as THREE from 'three'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../../diagnostics/diag'
import { LIMB_GLSL } from './globe'
import { INVERSE_FILMIC_GLSL } from '../../../post/chain'
import azimuth from '../azimuth.json'
import { RING_LAYOUT_GLSL, RING_PROFILE_GLSL } from './profile'
import { ICE_GRADE_GLSL, gradeUniforms } from '../grade'
import ringsJson from '../rings.json'
import skimJson from '../skim.json'
import { SHOT_GLSL } from '../shot'

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
  innerDark: [number, number, number, number]
  shadeSolid: [number, number]
  shadeRamp: [number, number, number]
  graze: [number, number, number]
  penumbraAway: [number, number, number]
  heroTone: [number, number, number]
  heroTurn: number
  shapeFit: [number, number]
  outerFit: [number, number, number, number]
  gapFit: [number, number]
  arc: [number, number, number, number]
  arcAz: [number, number, number, number]
  skimEdge: [number, number]
  skimFoot: number
  skimDensity: [number, number]
  skimShow: number
  apronEdge: [number, number, number]
  apronAway: [number, number]
  apronShow: number
  debloom: number
  skimTone: number
  skimHigh: [number, number, number, number]
  reach: number
  skimReach: number
  sheetRadii: number[]
  sheetThrough: number[]
  wedgeGain: number[]
  wedge: [number, number, number, number]
  wedgeIn: [number, number]
  sheetGlow: [number, number, number, number]
  sheetFit: [number, number, number, number]
  shine: [number, number, number, number]
  shineWide: [number, number, number, number]
  shineBack: number
  even: number
  polarHigh: [number, number, number, number]
  rimNear: [number, number, number, number]
  rimEdge: [number, number, number, number]
  rimFar: [number, number, number]
  rimHalo: [number, number, number, number]
  rimAz: [number, number, number, number]
  fillet: [number, number, number, number]
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
uniform vec4 uInnerDark;
uniform vec2 uSolid;
uniform vec3 uShadeRamp;
uniform vec3 uGraze;
uniform vec2 uView;
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
uniform float uSkimPart;
uniform vec4 uSkimUnder;
uniform float uSkimGap;
uniform vec3 uSkimFill;
uniform vec2 uGlobe;
uniform vec3 uSkimCam;
uniform sampler2D uApronMap;
uniform sampler2D uApronMask;
uniform vec4 uApron;
uniform vec2 uApronSize;
uniform vec4 uApronFit;
uniform sampler2D uBloomMap;
uniform sampler2D uSkimTone;
uniform float uSkimToneW;
uniform vec2 uDebloom;
uniform vec4 uSkimHigh;
uniform sampler2D uPolarMap;
uniform highp sampler2D uPolarWarp;
uniform vec2 uPolarSpan;
uniform vec2 uPolarSize;
uniform vec4 uPolarFit;
// the pixels of the drawn frame in one pixel of the frame the look was set on (x), and the texels of the full
// set's polar map (y) and inner map (z) in one texel of the set that is loaded, times x: what the look holds
// in pixels or in texels a pixel is an angle, the same in every format and with every set
uniform vec3 uFoot;
uniform float uSeam;
uniform float uPolarW;
uniform float uPolarShape;
uniform float uPolarBend;
uniform vec2 uPolarOuter;
uniform vec2 uShapeFit;
uniform vec4 uOuterFit;
uniform vec2 uGapFit;
uniform vec4 uArc;
uniform vec4 uArcAz;
uniform sampler2D uInnerMap;
uniform vec2 uInnerSpan;
uniform vec2 uInnerSize;
uniform float uSheetR[9];
uniform float uSheetT[9];
uniform float uWedgeG[9];
uniform vec4 uWedge;
uniform vec2 uWedgeIn;
uniform vec4 uSheetGlow;
uniform vec4 uSheetFit;
uniform vec4 uShine;
uniform float uEven;
uniform float uEvenFloor;
uniform vec4 uPolarHigh;
uniform vec4 uRimNear;
uniform vec4 uRimEdge;
uniform vec3 uRimFar;
uniform vec4 uRimHalo;
uniform vec4 uRimAz;
uniform vec4 uShineWide;
uniform float uShineBack;
uniform vec4 uFillet;
out vec4 outColor;
${DIAG_GLSL}
${RING_PROFILE_GLSL}
${RING_LAYOUT_GLSL}
${HASH_GLSL}
${INVERSE_FILMIC_GLSL}
${ICE_GRADE_GLSL}
${SHOT_GLSL}
${LIMB_GLSL}
float azRow(int i, vec4 h) {
  return uAzGain[i * 5] + uAzGain[i * 5 + 1] * h.x + uAzGain[i * 5 + 2] * h.y + uAzGain[i * 5 + 3] * h.z + uAzGain[i * 5 + 4] * h.w;
}
vec3 evenInverse(vec3 fine, vec3 wide) {
  vec3 hi = min(wide + 0.004, 0.985);
  vec3 lo = max(wide - 0.004, 0.0);
  vec3 even = max(inverseFilmic(wide) + (inverseFilmic(hi) - inverseFilmic(lo)) / max(hi - lo, 1e-4) * (min(fine, 0.985) - min(wide, 0.985)), 0.0);
  // The line above follows the tone curve along its slope at the wide sample. Where the fine sample is far darker than the
  // wide one (single ring strands in a frame larger than 1080p) the line runs under zero in red and blue before it does in
  // green, and the pixel came out teal: 630 such pixels in one part of a 4K frame, none with this floor (measured). The floor
  // is a share of the true light of the fine sample. uEvenFloor is 0 at 1080p and below, so that picture is drawn as before.
  for (int j = 0; j < (uEvenFloor > 0.0 ? 1 : 0); j++) even = max(even, uEvenFloor * inverseFilmic(min(fine, 0.985)));
  return even;
}
vec3 skimFill(vec2 uv, vec2 gx, vec2 gy) {
  vec3 fine = textureGrad(uSkimMap, uv, gx * uSkimFit.w, gy * uSkimFit.w).rgb;
  vec3 wide = textureGrad(uSkimMap, uv, gx * uSkimFit.w * uSkimHigh.w, gy * uSkimFit.w * uSkimHigh.w).rgb;
  vec3 lin = inverseFilmic(fine - uSkimHigh.z * max(fine - wide, 0.0) * smoothstep(uSkimHigh.x, uSkimHigh.y, max(fine.r, max(fine.g, fine.b))));
  for (int j = 0; j < ((uEven > 0.0 && uSkimFit.w < 1.0) ? 1 : 0); j++) lin = max(lin + uEven * (evenInverse(fine, textureGrad(uSkimMap, uv, gx, gy).rgb) - inverseFilmic(fine)), 0.0);
  vec2 q = (clamp(uv, 0.0, 1.0) - 0.5) * vec2(uAspect, 1.0);
  vec3 glow = textureLod(uBloomMap, clamp((uv - uApron.xy) * uApron.zw, 0.0, 1.0), 0.0).rgb;
  return max(lin / mix(1.0, 1.0 / pow(1.0 + dot(q, q) * 0.9, 2.0), uVignette) - uDebloom.x * uDebloom.y * glow * glow, 0.0) / (1.0 - uDebloom.x);
}
float skimTone(vec2 uv) {
  return mix(1.0, textureLod(uSkimTone, vec2(clamp(uv.x, 0.0, 1.0), 1.0 - clamp(uv.y, 0.0, 1.0)), 0.0).r, uSkimToneW);
}
float azGain(float r, float phi) {
  int i = 0;
  for (int k = 1; k < 4; k++) if (r >= uAzRadii[k]) i = k;
  float t = clamp((r - uAzRadii[i]) / (uAzRadii[i + 1] - uAzRadii[i]), 0.0, 1.0);
  vec4 h = vec4(cos(phi), sin(phi), cos(2.0 * phi), sin(2.0 * phi));
  return clamp(mix(azRow(i, h), azRow(i + 1, h), t), 0.4, 1.7);
}
// Each of the two reads its own uniform array where it lives. An array handed to a function as a parameter is drawn wrong by
// Direct3D (Chrome on Windows) in Neptune's light curve (src/stops/neptune/planet.ts, knotDeck); the sums are as before.
float sheetThrough(float r) {
  int i = 0;
  for (int k = 1; k < 8; k++) if (r >= uSheetR[k]) i = k;
  return mix(uSheetT[i], uSheetT[i + 1], clamp((r - uSheetR[i]) / (uSheetR[i + 1] - uSheetR[i]), 0.0, 1.0));
}
float sheetWedge(float r) {
  int i = 0;
  for (int k = 1; k < 8; k++) if (r >= uSheetR[k]) i = k;
  return mix(uWedgeG[i], uWedgeG[i + 1], clamp((r - uSheetR[i]) / (uSheetR[i + 1] - uSheetR[i]), 0.0, 1.0));
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
  float wI = inS > 0.0 ? smoothstep(0.0, max(uSkimFit.x, 1e-5), min(ke.x, ke.y)) : 0.0;
  vec2 av = (kv - uApron.xy) * uApron.zw;
  vec2 agx = kgx * uApron.zw;
  vec2 agy = kgy * uApron.zw;
  float wA = (uSkimM * vec4(vLocal, 1.0)).w > 1e-3 ? uApronFit.w * smoothstep(0.0, uApronFit.x, av.x) * smoothstep(0.0, uApronFit.y, 1.0 - av.x) * smoothstep(0.0, uApronFit.z, av.y) : 0.0;
  float wT = wI + (1.0 - wI) * wA;
  float wK = wI / max(wT, 1e-5);
  float wS = uSkimW * wT;
  vec4 km = vec4(0.0);
  float behind = 0.0;
  float skimTexels = 0.0;
  vec2 kvF = kv;
  vec4 kmF = vec4(0.0);
  float wF = 0.0;
  for (int k = 0; k < (wS > 0.0 ? 1 : 0); k++) {
    vec2 tx = kgx * uSkimSize;
    vec2 ty = kgy * uSkimSize;
    float dense = sqrt(min(dot(tx, tx), dot(ty, ty)));
    skimTexels = sqrt(max(dot(tx, tx), dot(ty, ty)));
    for (int j = 0; j < (wK > 0.0 ? 1 : 0); j++) km = textureGrad(uSkimMask, kv, kgx * uSkimFit.w, kgy * uSkimFit.w);
    for (int j = 0; j < (wK < 1.0 ? 1 : 0); j++) {
      vec2 ax = agx * uApronSize;
      vec2 ay = agy * uApronSize;
      km = mix(textureGrad(uApronMask, av, agx * uSkimFit.w, agy * uSkimFit.w), km, wK);
      dense = mix(sqrt(min(dot(ax, ax), dot(ay, ay))), dense, wK);
      skimTexels = mix(sqrt(max(dot(ax, ax), dot(ay, ay))), skimTexels, wK);
    }
    wS *= min(km.g * 2.0, 1.0) * (1.0 - km.b * uSkimPart) * smoothstep(uSkimFit.y, uSkimFit.z, dense);
    vec3 sc = uSkimCam / uGlobe.xyx;
    vec3 sd = vLocal / uGlobe.xyx - sc;
    float sa = dot(sd, sd);
    float sb = dot(sc, sd);
    behind = (sb < 0.0 && -sb < sa) ? smoothstep(-0.006, 0.0, (sb * sb - sa * (dot(sc, sc) - 1.0)) / sa) : 0.0;
    vec2 sq = vLocal.xz / uGlobe.x;
    float rr = dot(sq, sq);
    float cc = dot(sc, sc);
    float bq = 1.0 - uSkimFill.x;
    float root = bq * bq - cc * cc + (cc - bq) * (rr + cc);
    float ut = bq - sqrt(max(root, 0.0));
    float rho = length(sc.xz);
    float ct = ut / max(rho * sqrt(rr), 1e-5);
    for (int j = 0; j < ((uSkimGap > 0.0 && wI > 0.0 && root > 0.0 && dot(sc.xz, sq) < ut && abs(ct) < 1.0) ? 1 : 0); j++) {
      vec2 ch = sc.xz / rho;
      vec2 ph = vec2(-ch.y, ch.x);
      vec2 src = sqrt(rr) * uGlobe.x * (ch * ct + ph * (dot(sq, ph) < 0.0 ? -1.0 : 1.0) * sqrt(1.0 - ct * ct));
      float inF;
      kvF = shotUv(uSkimM, vec3(src.x, vLocal.y, src.y), 1.0, inF);
      kmF = textureGrad(uSkimMask, kvF, kgx * uSkimFit.w, kgy * uSkimFit.w);
      wF = uSkimGap * uSkimW * wI * (inF > 0.0 ? 1.0 : 0.0) * min(kmF.g * 2.0, 1.0) * (1.0 - kmF.b * uSkimPart) * smoothstep(uSkimFit.y, uSkimFit.z, dense) * smoothstep(uSkimFill.y, uSkimFill.z, r);
    }
  }
  bool far = r > uReach;
  vec3 lay = far ? vec3(r, 1.0, 0.0) : ringLayout(vLocal, r);
  bool disc = r < 1.0;
  float rp = disc ? max(lay.x, mix(r, uEdge.x + 0.006, lay.z)) : lay.x;
  float azd = degrees(atan(vLocal.z, vLocal.x));
  rp += (disc || far) ? 0.0 : (uInner.z * smoothstep(45.0, 60.0, azd) + uInner.w * smoothstep(80.0, 95.0, azd)) * uPolarBend * (1.0 - smoothstep(uInner.x, uInner.y, azd)) * (1.0 - smoothstep(1.2, 1.45, rp));
  float shape = 0.0;
  for (int k = 0; k < ((uPolarBend > 0.0 && !far && !disc) ? 1 : 0); k++) shape = uPolarBend * textureLod(uPolarWarp, vec2(atan(vLocal.z, vLocal.x) / 6.283185307 + 0.5, (rp - uPolarSpan.x) * uPolarSpan.y), 0.0).r;
  float rs = rp - shape;
  float rq = rp - shape * smoothstep(uShapeFit.x, uShapeFit.y, rp);
  float x = far ? -1.0 : ringRadius(rq);
  bool span = x > 0.0 && x < 1.0;
  wS *= span ? 1.0 : uSkimNear;
  wF *= span ? 1.0 : uSkimNear;
  float wC = (far || disc) ? 0.0 : uPolarW * (1.0 - smoothstep(uPolarFit.x, uPolarFit.y, rp)) * smoothstep(uInnerSpan.x, uInnerSpan.x + 0.012, rs);
  // a place that holds nothing of the ring is not drawn (gone), far out, under the globe, and inside the inner
  // rim once the hold's pose has let go. bare: such a place inside the inner rim, which is still drawn where
  // the shaded plane lies on it (the solid shade below), so that no star comes up there as the pose lets go
  bool bare = !span && wS <= 0.0 && wC <= 0.0 && !far && !disc && uPolarShape * uPolarW <= 0.0;
  bool gone = !span && wS <= 0.0 && wC <= 0.0 && (far || disc || uPolarShape * uPolarW <= 0.0);
  vec3 toCam = uCamL - vLocal;
  float dist = length(toCam);
  vec3 V = toCam / dist;
  float nearest = dot(uCamL, V);
  bool hidden = false;
  float rim = 1.0;
  for (int k = 0; k < ((uClose > 0.0 && !disc && (layoutOver > 0.0 || wS * km.r > 0.0)) ? 1 : 0); k++) {
    vec3 c = uCamL / uGlobe.xyx;
    vec3 d = vLocal / uGlobe.xyx - c;
    float qa = dot(d, d);
    float qb = dot(c, d);
    float qd = qb * qb - qa * (dot(c, c) - 1.0);
    hidden = qd > 0.0 && -qb - sqrt(max(qd, 0.0)) > 0.0 && -qb - sqrt(max(qd, 0.0)) < qa;
    rim = qd / qa;
  }
  wS *= mix(1.0, smoothstep(uSkimUnder.x, uSkimUnder.y, rim) * (hidden ? 1.0 - smoothstep(uSkimUnder.z, uSkimUnder.w, rim) : 1.0), 1.0 - smoothstep(0.55, 0.95, km.g));
  if (!hidden && !disc) wS *= mix(1.0 - behind, 1.0, km.r);
  float held = (hidden || disc) ? 1.0 : mix(1.0, smoothstep(uSkimUnder.x, uSkimUnder.y, rim), uSkimGap * behind * smoothstep(uSkimFill.y, uSkimFill.z, r));
  wS *= held;
  wF *= (hidden || disc) ? 0.0 : 1.0 - mix(1.0, smoothstep(uSkimUnder.x, uSkimUnder.y, rim), 1.0 - smoothstep(0.55, 0.95, km.g)) * mix(1.0 - behind, 1.0, km.r) * held;
  vec3 oc = vec3(uCamL.x, uCamL.y / uPolar, uCamL.z);
  vec3 ov = vec3(vLocal.x, vLocal.y / uPolar, vLocal.z) - oc;
  float oa = dot(ov, ov);
  float ob = dot(oc, ov);
  float od = (ob * ob - oa * (dot(oc, oc) - 1.0)) / oa;
  float bb = sqrt(max(1.0 - od, 0.0));
  float bw = max(length(vec2(dFdx(bb), dFdy(bb))) * uFoot.x, 1e-5);
  // the shaded plane does not end at the globe's outline: it goes on under the globe's own soft edge (lip: a
  // place inside the equator's circle whose view ray passes the globe within that edge, uGraze.z pixels and one
  // more, as past below). Without it the sky had a window there, between the plane and the globe's outline at
  // the two ends of the equator, and a star behind the plane flashed up for one frame as the outline passed it.
  // Such a place lies inside the globe, so it is drawn behind the globe in both halves of the plane: the
  // globe's edge keeps its own shape and has the shaded plane behind it in place of the sky
  bool lip = disc && !span && bb > 1.0 - (uGraze.z + 1.0) * bw;
  bare = bare || (lip && wS <= 0.0 && wC <= 0.0 && uPolarShape * uPolarW <= 0.0);
  bool top = (disc && !lip) || hidden;
  bool split = lip ? uPass > 0.5 : (uPass < 0.5 ? (dist < nearest || top) : (dist >= nearest && !top));
  gone = gone || split;
  float fr = length(vec2(dFdx(rq), dFdy(rq)));
  float frTrue = length(vec2(dFdx(r), dFdy(r)));
  float texels = ringTexels(fr);
  float pose = uPolarBend * (1.0 - uClose);
  float edgeCut = smoothstep(uEdge.y + uOuterFit.w, uEdge.y + uOuterFit.w + 0.002, rq);
  float xo = ringRadius(rq - pose * uOuterFit.x * smoothstep(uOuterFit.y, uOuterFit.z, rq));
  // the level of the profile is picked by its texels in a pixel of the master (uFoot.x), and so are the
  // feathers below: a frame of any size is the same picture
  float lodP = texels * uFoot.x * uGrad * mix(uLodBias.x, uLodBias.y, uClose);
  vec4 s = span && !gone ? profAt(xo, lodP) * (1.0 - pose * edgeCut) : vec4(0.0);
  for (int k = 0; k < ((pose > 0.0 && span && !disc && !gone && rq > uEdge.y + 0.02) ? 1 : 0); k++) {
    float ua = atan(vLocal.z, vLocal.x) / 6.283185307 + 0.5;
    float re = uEdge.y + uOuterFit.x;
    float e1 = re + uPolarBend * textureLod(uPolarWarp, vec2(ua, (re - uPolarSpan.x) * uPolarSpan.y), 0.0).r;
    float e2 = re + uPolarBend * textureLod(uPolarWarp, vec2(ua, (e1 - uPolarSpan.x) * uPolarSpan.y), 0.0).r;
    float along = smoothstep(uArcAz.x, uArcAz.y, azd) + 1.0 - smoothstep(uArcAz.z, uArcAz.w, azd);
    float rl = uArc.x + (rp - e2 - uArc.y) * uArc.z;
    s += pose * uArc.w * along * smoothstep(uEdge.y + 0.02, uEdge.y + 0.04, rl) * (rl < uReach ? 1.0 : 0.0) * profAt(ringRadius(rl), lodP * uArc.z * min(1.0, uSeam * frTrue / max(fr, 1e-9)));
  }
  float mu = abs(V.y);
  bool fore = uClose < 1.0 && !disc && !far && -ob > oa;
  // what the globe behind the sheet adds to the hold's look of the ice in front of it (the strands over the
  // globe, the thin sheet at the inner rim, its glow and the shine) holds while the view on the plane is steep:
  // where the view grazes the plane the globe is hidden and the ice in front of it looks as it does beside it
  // (uGraze, sheet.json graze, by the angle alone; the whole of it in the hold)
  float steep = mix(1.0, smoothstep(uGraze.x, uGraze.y, mu), uSolid.x);
  float over = fore ? smoothstep(-0.05, 0.0, od) * (1.0 - uClose) * smoothstep(uEdge.x, uEdge.x + uOver.x, rq) * steep : 0.0;
  float body = smoothstep(uEdge.x - 0.004, uEdge.x + 0.004, rq) * (1.0 - smoothstep(uEdge.y - 0.002, uEdge.y + 0.002, rq));
  // once the lens has left the hold no star shows through any part of the sheet that holds ice: where the view
  // ray passes the globe the depth of the sheet counts uShadeRamp.z times (sheet.json starCover, as in the
  // model near the sheet); the globe shows through by the true depth while the view on the plane is steep, and
  // is hidden like the stars where the view grazes the plane (uGraze, sheet.json graze, by the angle alone)
  // (a ray counts as passing the globe from where the globe's own soft edge begins, uGraze.z pixels inside its
  // outline, so no star shows in that edge)
  float past = max(smoothstep(1.0 - (uGraze.z + 1.0) * bw, 1.0 - uGraze.z * bw, bb), 1.0 - smoothstep(uGraze.x, uGraze.y, mu));
  float cover = mix(1.0, uShadeRamp.z, uSolid.x * (1.0 - uClose) * body * past);
  // the one law of cover (skim.json handover.kept): a view ray that crosses the plane is covered by
  // 1 - exp(-depth / sine), the depth that which gives the ring's own opacity at the sine of the hold's eye
  // (uView.x), the sine floored only against the division (uView.y). No height of the lens and no clock is in it
  float rise = uView.x / max(mu, uView.y);
  float alpha = 1.0 - pow(1.0 - min(max(s.a, uFloorA * body * mix(1.0, smoothstep(uFloorRamp.x, uFloorRamp.y, rq), 1.0 - uClose)), 0.999), rise * cover);
  float swept = (1.0 - smoothstep(uVeil.x, uVeil.y, uClose)) * uSweep;
  float lift = max(smoothstep(-uJunction, uJunction, layoutDist + 2.0 * uJunction - swept), wS * (1.0 - smoothstep(0.0, 1.0, swept)));
  alpha = top ? 0.999 : alpha;
  float cut = mix(1.0 - uClose * smoothstep(uEdge.y - 0.002, uEdge.y + 0.004, rq), 1.0, wS + wF) * (top ? mix(hidden ? layoutOver : layoutCut, 1.0, wS) * lift : 1.0);
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
  vec2 lg = log2(max(vec2(fr, fa) * uFoot.x, 1e-7) * 1e4) + uGrainCell;
  vec2 fg = fract(lg);
  vec2 cg = 1e-4 * exp2(floor(lg));
  vec4 wg = vec4((1.0 - fg.x) * (1.0 - fg.y), fg.x * (1.0 - fg.y), (1.0 - fg.x) * fg.y, fg.x * fg.y);
  float ga = mix(uGrain.x, uGrain.y, uClose) * smoothstep(0.02, 0.1, s.a) * smoothstep(2e-6, 2e-5, fr * uFoot.x) * (top ? 0.0 : 1.0);
  for (int k = 0; k < (ga > 0.0 && !gone ? 1 : 0); k++) {
    float gr = wg.x * grain(phi, rp, cg.y, cg.x) + wg.y * grain(phi, rp, cg.y, 2.0 * cg.x) + wg.z * grain(phi, rp, 2.0 * cg.y, cg.x) + wg.w * grain(phi, rp, 2.0 * cg.y, 2.0 * cg.x);
    mottle += ga * 2.0 * gr / length(wg);
  }
  col *= mottle;
  vec2 azg = vec2(vLocal.x * dFdx(vLocal.z) - vLocal.z * dFdx(vLocal.x), vLocal.x * dFdy(vLocal.z) - vLocal.z * dFdy(vLocal.x)) / (6.283185307 * r * r);
  vec2 rpg = vec2(dFdx(rp), dFdy(rp));
  float wP = far || disc ? 0.0 : uPolarW * smoothstep(uPolarFit.x, uPolarFit.y, rp) * (1.0 - smoothstep(uPolarOuter.x, uPolarOuter.y, rs));
  for (int k = 0; k < (wP > 0.0 && !gone ? 1 : 0); k++) {
    float pa = phi / 6.283185307 + 0.5;
    float pv = (rp - uPolarSpan.x) * uPolarSpan.y;
    float pr = clamp(pv - shape * uPolarSpan.y, 0.5 / uPolarSize.y, 1.0 - 0.5 / uPolarSize.y);
    vec2 pgx = vec2(azg.x, rpg.x * uPolarSpan.y);
    vec2 pgy = vec2(azg.y, rpg.y * uPolarSpan.y);
    vec2 tx = pgx * uPolarSize;
    vec2 ty = pgy * uPolarSize;
    float w = wP * smoothstep(uPolarFit.z, uPolarFit.w, uFoot.y * sqrt(min(dot(tx, tx), dot(ty, ty))));
    vec3 pf = textureGrad(uPolarMap, vec2(pa, pr), pgx * uGrad, pgy * uGrad).rgb;
    for (int j = 0; j < (uPolarHigh.z > 0.0 ? 1 : 0); j++) pf -= uPolarHigh.z * max(pf - textureGrad(uPolarMap, vec2(pa, pr), pgx * uPolarHigh.w, pgy * uPolarHigh.w).rgb, 0.0) * smoothstep(uPolarHigh.x, uPolarHigh.y, max(pf.r, max(pf.g, pf.b)));
    vec3 pm = inverseFilmic(pf);
    if (uGrad < 1.0 && uEven > 0.0) pm = mix(pm, evenInverse(pf, textureGrad(uPolarMap, vec2(pa, pr), pgx, pgy).rgb), uEven);
    col = mix(col, pm * mix(1.0, turning, uHeroTurn), w);
    alpha *= 1.0 - w * smoothstep(2.235, 2.25, rs) * (1.0 - smoothstep(uGapFit.x, uGapFit.y, dot(pm, vec3(0.2126, 0.7152, 0.0722))));
    texels = mix(texels, sqrt(max(dot(tx, tx), dot(ty, ty))), w);
  }
  float wIn = 0.0;
  for (int k = 0; k < (wC > 0.0 && !gone ? 1 : 0); k++) {
    float pa = phi / 6.283185307 + 0.5;
    float pr = clamp((rs - uInnerSpan.x) * uInnerSpan.y, 0.5 / uInnerSize.y, 1.0 - 0.5 / uInnerSize.y);
    vec2 pgx = vec2(azg.x, rpg.x * uInnerSpan.y);
    vec2 pgy = vec2(azg.y, rpg.y * uInnerSpan.y);
    vec2 tx = pgx * uInnerSize;
    vec2 ty = pgy * uInnerSize;
    wIn = wC * smoothstep(uPolarFit.z, uPolarFit.w, uFoot.z * sqrt(min(dot(tx, tx), dot(ty, ty))));
    vec3 pf = textureGrad(uInnerMap, vec2(pa, pr), pgx * uGrad, pgy * uGrad).rgb;
    vec3 pm = inverseFilmic(pf);
    if (uGrad < 1.0 && uEven > 0.0) pm = mix(pm, evenInverse(pf, textureGrad(uInnerMap, vec2(pa, pr), pgx, pgy).rgb), uEven);
    col = mix(col, pm * mix(1.0, turning, uHeroTurn), wIn);
    texels = mix(texels, sqrt(max(dot(tx, tx), dot(ty, ty))), wIn);
  }
  // the grade of the rings by the height of the lens (grade.ts); nothing of it runs at the heights of the hold
  for (int k = 0; k < (uGrade.x > 0.0 ? 1 : 0); k++) {
    col = iceGrade(col, rq) * iceView(mu, rq) * iceZone(rq, mu);
    // the ringlets' amplitude by radius (grade.ts iceFine): the light of the profile at the pixel over the
    // light of its zone, the same in the far look of the model (sheet.ts)
    float fine = iceFine(rq);
    for (int j = 0; j < ((abs(fine) > 0.0 && span && !gone) ? 1 : 0); j++) col *= iceRinglets(dot(inverseFilmic(profAt(xo, lodP).rgb), vec3(0.2126, 0.7152, 0.0722)), dot(inverseFilmic(profAt(xo, max(lodP, 1.0) * uGradeFine.x).rgb), vec3(0.2126, 0.7152, 0.0722)), fine);
  }

  float eo = uEdge.y + uOuterFit.w;
  float nearRim = smoothstep(uRimAz.x, uRimAz.y, azd) * (1.0 - smoothstep(uRimAz.z, uRimAz.w, azd));
  float rimW = (far || disc) ? 0.0 : pose * smoothstep(eo - uRimNear.w, eo - uRimEdge.w, rq) * (1.0 - smoothstep(eo + 0.002, eo + 0.004, rq));
  vec3 rimTint = mix(uRimFar, mix(uRimNear.rgb, uRimEdge.rgb, smoothstep(eo - uRimEdge.w, eo + 0.001, rq)), nearRim);
  col = mix(col, dot(col, vec3(0.2126, 0.7152, 0.0722)) * rimTint, rimW);
  vec3 halo = (far || disc) ? vec3(0.0) : uRimHalo.rgb * (pose * nearRim * smoothstep(eo - 0.001, eo + 0.001, rq) * exp(-max(rq - eo, 0.0) / uRimHalo.w));

  float cell = uSparkleCell;
  float det = qx.x * qy.y - qx.y * qy.x;
  float show = 1.0 - smoothstep(0.12, 0.3, major * uFoot.x / cell);
  for (int k = 0; k < ((uAzimuth.w > 0.0 && show > 0.0 && abs(det) > 1e-16 && !gone) ? 1 : 0); k++) {
    int row = int(floor(r / cell));
    int per = max(int(floor(6.283185307 * (float(row) + 0.5))), 1);
    float cx = tu * float(per);
    ivec3 id = ivec3(wrapI(int(floor(cx)), per), row, 7);
    float pick = hash3(id);
    for (int m = 0; m < (pick < 0.2 ? 1 : 0); m++) {
      vec2 centre = 0.25 + 0.5 * vec2(hash3(id + ivec3(0, 0, 4)), hash3(id + ivec3(0, 0, 6)));
      vec2 dq = (vec2(fract(cx), fract(r / cell)) - centre) * cell;
      vec2 px = vec2(qy.y * dq.x - qy.x * dq.y, -qx.y * dq.x + qx.x * dq.y) / (det * uFoot.x);
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
  float mw = 0.75 * length(vec2(dFdx(miss), dFdy(miss))) * uFoot.x;
  float lit = (disc && !lip) ? smoothstep(-0.3, 0.15, along) : (along > 0.0 ? 1.0 : smoothstep(uPenumbra.x - mw, uPenumbra.y + mw + uPenumbra.z * max(-along, 0.0) + uPenumbraFar.y * max(-along - uPenumbraFar.x, 0.0), miss));
  // the shadowed outer ring is thin in the hold's picture (the approved goes to black there, with the stars through
  // it): part of that picture, so it stands on the picture's own weight (uPolarW) and goes out with it
  float thin = 1.0 - uShadowThin.z * smoothstep(uShadowThin.x, uShadowThin.y, rq) * (1.0 - lit) * (1.0 - uClose) * uPolarW * (1.0 - uSolid.x) * (disc ? 0.0 : 1.0);
  over *= lit;
  float through = sheetThrough(rs) * (1.0 - uSheetFit.w * uPolarShape * smoothstep(uSheetFit.z, 1.0, bb));
  float bx = max(bb - uFillet.x, 0.0);
  float rin = uEdge.x - uPolarBend * (uFillet.y * bx + uFillet.z * bx * bx * bx * bx);
  float bout = mix(1.0, uWedge.w, uPolarShape);
  vec3 on = oc + ov * ((-ob - sqrt(max(od * oa, 0.0))) / oa);
  float bulge = uLimbW > 0.0 ? max(limbAt(normalize(on), uPolar, uSunL), 0.0) : 0.0;
  float fw = max(uFillet.w, 1.5 * length(vec2(dFdx(rs - rin), dFdy(rs - rin))) * uFoot.x);
  float keep = max(smoothstep(uSheetFit.x, uSheetFit.y, rs), 1.0 - smoothstep(1.0 + bulge - bw, 1.0 + bulge + bw, bb));
  float sheet = fore ? steep * (1.0 - smoothstep(bout - bw, bout + bw, bb)) * (1.0 - uClose) * lit * smoothstep(rin - fw, rin + fw, rs) * mix(1.0, keep, smoothstep(1.0 - bw, 1.0 + bw, bb)) * (1.0 - smoothstep(uEdge.y - 0.002, uEdge.y + 0.002, rq)) : 0.0;
  alpha = max(alpha, (1.0 - pow(through, rise)) * sheet) * thin;
  // and the shaded plane lets no sky through from the globe on (sheet.json shadow.solid, by the true radius): no
  // star shows between the night side and the shaded rings. Where the view ray ends on the globe the true depth
  // counts, so the night side is the body's own ellipse behind the empty space and behind thin ice, unless the
  // view grazes the plane (uGraze)
  float shade = uSolid.x * uSolid.y * (1.0 - lit) * (1.0 - uClose) * (1.0 - smoothstep(uEdge.y - 0.002, uEdge.y + 0.002, rq)) * (lip ? 1.0 : smoothstep(uShadeRamp.x, uShadeRamp.y, r)) * past;
  alpha = max(alpha, shade);
  float day = smoothstep(-0.05, 0.25, dot(normalize(vec3(on.x, on.y / uPolar, on.z)), normalize(uSunL)));
  vec3 wedge = mix(uSheetGlow.rgb, uWedge.rgb * uPolarShape, smoothstep(uWedgeIn.x, uWedgeIn.y, bb)) * sheetWedge(rs) * sheet * day;
  col *= 1.0 - uSheetGlow.w * sheet * uPolarShape * (1.0 - day);
  float hb = max(bb - 1.0, 0.0);
  vec3 shine = (uShine.rgb * exp(-hb / uShine.w) + uShineWide.rgb * exp(-hb / uShineWide.w)) * (steep * uPolarShape * day * (1.0 - uClose) * smoothstep(0.0, uShineBack, (1.0 + ob / oa) * sqrt(oa)));
  for (int k = 0; k < (over > 0.0 && !gone ? 1 : 0); k++) {
    float sx = ringRadius(uStrand.x + (rq - uEdge.x) * uStrand.y);
    float sl = texels * uFoot.x * uGrad * uStrand.y * 1.5;
    float zone = over * (1.0 - smoothstep(uOver.y, uOver.w, rq)) * (1.0 - wIn);
    float tone = mix(mix(uOverTone.x, uOverTone.y, smoothstep(1.2, 1.4, rq)), uOverTone.z, mix(1.0, smoothstep(uOverTone.w - 6.0, uOverTone.w + 6.0, azd), uPolarShape));
    float st = clamp(pow(max(dot(profAt(sx, sl).rgb, vec3(0.2126, 0.7152, 0.0722)), 1e-3) / max(dot(profAt(sx, sl * 24.0).rgb, vec3(0.2126, 0.7152, 0.0722)), 1e-3), uStrand.z), 0.5, 1.6);
    col *= mix(1.0, tone * st, zone);
  }
  float dense = smoothstep(0.0, 0.6, dot(col, vec3(0.2126, 0.7152, 0.0722)));
  vec3 unlit = mix(uFloorHold * (uFloorTone.x + uFloorTone.y * dense) * smoothstep(uFloorRamp.x, uFloorRamp.y, rq), uShadowFloor * (0.6 + 0.9 * dense), uClose) * body * thin;
  col = mix(unlit, col, mix(lit, 1.0, uShadowLift * uClose)) * lay.y * mix(vec3(1.0), layoutTone, lay.z);
  col = mix(vec3(dot(col, vec3(0.2126, 0.7152, 0.0722))) * uShadeTint, col, mix(1.0, smoothstep(uShadeGrey.x, uShadeGrey.y, lay.y), lay.z));
  float inner = lay.z * (1.0 - uGate) * (1.0 - smoothstep(uInnerDark.y, uInnerDark.z, rq)) * (1.0 - ((!far && -ob > oa) ? smoothstep(-0.05, 0.0, od) : 0.0));
  col = mix(col, vec3(dot(col, vec3(0.2126, 0.7152, 0.0722))) * uShadeTint, uInnerDark.w * inner) * (1.0 - uInnerDark.x * inner);
  if (uSunL.y * uCamL.y < 0.0) col *= uUnlit * (0.25 + 3.0 * s.a * (1.0 - s.a)) / max(s.a, 0.05);
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  float vig = mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  vec3 base = col;
  float baseA = alpha;
  float baseT = texels;
  for (int k = 0; k < (wS > 0.0 && !gone ? 1 : 0); k++) {
    vec2 kq = (clamp(kv, 0.0, 1.0) - 0.5) * vec2(uAspect, 1.0);
    vec3 pix = vec3(0.0);
    for (int j = 0; j < (wK > 0.0 ? 1 : 0); j++) pix = textureGrad(uSkimMap, kv, kgx * uSkimFit.w, kgy * uSkimFit.w).rgb;
    for (int j = 0; j < (wK * uSkimHigh.z > 0.0 ? 1 : 0); j++) {
      vec3 wide = textureGrad(uSkimMap, kv, kgx * uSkimFit.w * uSkimHigh.w, kgy * uSkimFit.w * uSkimHigh.w).rgb;
      pix -= uSkimHigh.z * max(pix - wide, 0.0) * smoothstep(uSkimHigh.x, uSkimHigh.y, max(pix.r, max(pix.g, pix.b)));
    }
    for (int j = 0; j < (wK < 1.0 ? 1 : 0); j++) pix = mix(textureGrad(uApronMap, av, agx * uSkimFit.w, agy * uSkimFit.w).rgb, pix, wK);
    vec3 glow = textureLod(uBloomMap, clamp(av, 0.0, 1.0), 0.0).rgb;
    vec3 lin = inverseFilmic(pix);
    for (int j = 0; j < ((wK * uEven > 0.0 && uSkimFit.w < 1.0) ? 1 : 0); j++) {
      vec3 fine = textureGrad(uSkimMap, kv, kgx * uSkimFit.w, kgy * uSkimFit.w).rgb;
      lin = max(lin + wK * uEven * (evenInverse(fine, textureGrad(uSkimMap, kv, kgx, kgy).rgb) - inverseFilmic(fine)), 0.0);
    }
    vec3 img = max(lin / mix(1.0, 1.0 / pow(1.0 + dot(kq, kq) * 0.9, 2.0), uVignette) - uDebloom.x * uDebloom.y * glow * glow, 0.0) / (1.0 - uDebloom.x) * vig;
    col = mix(col, img * km.r * skimTone(kv), wS);
    alpha = mix(alpha, km.r, wS);
    texels = mix(texels, skimTexels, wS);
  }
  for (int k = 0; k < (wF > 0.0 && !gone ? 1 : 0); k++) {
    col += (skimFill(kvF, kgx, kgy) * skimTone(kvF) * vig * kmF.r - base) * wF;
    alpha += (kmF.r - baseA) * wF;
    texels += (skimTexels - baseT) * wF;
  }
  col = (col + (wedge + shine * alpha + halo * lit) * (1.0 - wS - wF)) * uGain * uWeight / vig;
  outColor = diagOut(vec4(col, alpha * uWeight) * cut, texels, 1.0, vec3(0.95, 0.7, 0.2), vec2(kepler * 8.0, 0.0), length(vView));
  if ((gone && !(bare && !split && shade > 0.0)) || (uDiag >= 2 && alpha * cut < 0.5)) discard;
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
    const index: number[] = []
    const inner = Math.min(r0 - 0.01, 0.01)
    const outer = Math.max(r1 + 0.01, look.reach) / Math.cos(Math.PI / seg)
    const radii: number[] = []
    for (let j = 0; j <= 6; j++) radii.push(inner + ((outer - inner) * j) / 6)
    const more = look.skimReach > outer ? Math.ceil(Math.log(look.skimReach / outer) / Math.log(1.25)) : 0
    for (let j = 1; j <= more; j++) radii.push(outer * Math.pow(look.skimReach / outer, j / more))
    const bands = radii.length - 1
    const pos = new Float32Array((seg + 1) * (bands + 1) * 3)
    for (let j = 0; j <= bands; j++) {
      const r = radii[j]!
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
      uHeroTurn: { value: look.heroTurn }, uShapeFit: { value: new THREE.Vector2().fromArray(look.shapeFit) }, uOuterFit: { value: new THREE.Vector4().fromArray(look.outerFit) }, uGapFit: { value: new THREE.Vector2().fromArray(look.gapFit) }, uArc: { value: new THREE.Vector4().fromArray(look.arc) }, uArcAz: { value: new THREE.Vector4().fromArray(look.arcAz) }, uSkimFit: { value: new THREE.Vector4(look.skimEdge[0], look.skimDensity[0], look.skimDensity[1], 0) }, uReach: { value: ringsJson.span[1] }, uSkimNear: { value: 1 }, uSkimPart: { value: 0 }, uSkimUnder: { value: new THREE.Vector4(-0.005, -0.002, 0.009, 0.015) }, uSkimGap: { value: 0 }, uSkimFill: { value: new THREE.Vector3(-0.009, 0, 0.001) }, uGlobe: { value: new THREE.Vector2(1, polar) }, uSkimCam: { value: new THREE.Vector3() },
      uSheetR: { value: look.sheetRadii }, uSheetT: { value: look.sheetThrough }, uWedgeG: { value: look.wedgeGain }, uWedge: { value: new THREE.Vector4().fromArray(look.wedge) }, uWedgeIn: { value: new THREE.Vector2().fromArray(look.wedgeIn) }, uSheetGlow: { value: new THREE.Vector4().fromArray(look.sheetGlow) }, uSheetFit: { value: new THREE.Vector4().fromArray(look.sheetFit) }, uShine: { value: new THREE.Vector4().fromArray(look.shine) }, uShineWide: { value: new THREE.Vector4().fromArray(look.shineWide) }, uShineBack: { value: look.shineBack }, uEven: { value: look.even }, uEvenFloor: { value: 0 }, uPolarHigh: { value: new THREE.Vector4().fromArray(look.polarHigh) }, uRimNear: { value: new THREE.Vector4().fromArray(look.rimNear) }, uRimEdge: { value: new THREE.Vector4().fromArray(look.rimEdge) }, uRimFar: { value: new THREE.Vector3().fromArray(look.rimFar) }, uRimHalo: { value: new THREE.Vector4().fromArray(look.rimHalo) }, uRimAz: { value: new THREE.Vector4().fromArray(look.rimAz) }, uFillet: { value: new THREE.Vector4().fromArray(look.fillet) },
      uCamL: { value: new THREE.Vector3(0, 1, 3) }, uSunL: { value: new THREE.Vector3(1, 0.2, 0) }, uShadowL: { value: new THREE.Vector3(1, 0.2, 0) }, uPolar: { value: polar },
      uFloorA: { value: look.floorAlpha }, uEdge: { value: new THREE.Vector2(ringsJson.inner, ringsJson.outer) },
      ...gradeUniforms(),
      uGain: { value: 1 }, uWeight: { value: 1 }, uTime: { value: 0 }, uSpinRate: { value: 0 }, uFoot: { value: new THREE.Vector3(1, 1, 1) }, uSeam: { value: 1e9 },
      uGrad: gradUniform, uDiag: diagUniform, uLodBias: { value: new THREE.Vector2(look.lodBias, look.lodBiasClose) },
      uShadowFloor: { value: new THREE.Vector3().fromArray(look.shadowFloor) }, uFloorHold: { value: new THREE.Vector3().fromArray(look.floorHold) }, uPenumbraFar: { value: new THREE.Vector2().fromArray(look.penumbraFar) }, uInner: { value: new THREE.Vector4().fromArray(look.inner) }, uOver: { value: new THREE.Vector4().fromArray(look.over) }, uStrand: { value: new THREE.Vector3().fromArray(look.strand) }, uOverTone: { value: new THREE.Vector4().fromArray(look.overTone) }, uShadowThin: { value: new THREE.Vector3().fromArray(look.shadowThin) }, uFloorTone: { value: new THREE.Vector2().fromArray(look.floorTone) }, uShadowLift: { value: look.shadowLift }, uPenumbra: { value: new THREE.Vector3().fromArray(look.penumbra) }, uAzGain: { value: azimuth.coeffs.flat() }, uAzRadii: { value: azimuth.radii },
      uUnlit: { value: look.unlit }, uAzimuth: { value: new THREE.Vector4(look.spokes, look.clumps, look.grain, look.sparkle) },
      uSparkleTint: { value: new THREE.Vector3().fromArray(look.sparkleTint) }, uSparkleCell: { value: look.sparkleCell },
      uCloseTone: { value: new THREE.Vector3().fromArray(look.closeTone) }, uHeroTone: { value: new THREE.Vector3().fromArray(look.heroTone) },
      uGrainCell: { value: new THREE.Vector2().fromArray(look.grainCell) }, uView: { value: new THREE.Vector2(skimJson.handover.kept.view, skimJson.handover.kept.floor) }, uFloorRamp: { value: new THREE.Vector2().fromArray(look.floorRamp) }, uGrain: { value: new THREE.Vector2(look.grainHero, look.grain) }, uVeil: { value: new THREE.Vector2().fromArray(look.veil) }, uSweep: { value: look.sweep }, uJunction: { value: look.junction }, uShadeTint: { value: new THREE.Vector3().fromArray(look.shadeTint) }, uShadeGrey: { value: new THREE.Vector2().fromArray(look.shadeGrey) }, uInnerDark: { value: new THREE.Vector4().fromArray(look.innerDark) }, uSolid: { value: new THREE.Vector2(0, look.shadeSolid[0]) }, uShadeRamp: { value: new THREE.Vector3().fromArray(look.shadeRamp) }, uGraze: { value: new THREE.Vector3().fromArray(look.graze) }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 },
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
      // the far pass leaves out a triangle that lies wholly in the near half or wholly under the globe. One that
      // lies in the near half and meets the equator's circle stays in it: it holds the lip (the shaded plane
      // under the globe's own soft edge, drawn behind the globe in both halves), and every other place of it is
      // taken out by the shader as before. Left out, the lip was missing on the near side of the two ends of the
      // equator and a star flashed there for one frame as the outline passed it
      const drop0 = (inK === 3 && far(x, z, 0, 0) > 1 + eps) || inD === 3
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
