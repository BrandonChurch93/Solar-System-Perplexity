import * as THREE from 'three'
import type { RenderView, SetContext } from '../../core/types'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import deck from './deck.json'
import fields from './deck-fields.json'
import { frameUniform } from '../../core/frame'
import curve from './curve.json'
import place from './place.json'
import woundJson from './wound.json'

const OCTAVES = deck.look.cloud.octaves
const ABOVE_KNOTS = deck.above.gain.length
const CURVE_KNOTS = curve.curve.length
const ORDERS = deck.look.medium.orders.count
const FLASHES = deck.life.flash.sites.length
const HAZE_TAPS = deck.life.haze.thick.taps
const AGES = deck.life.flow.wound.turnDeg.length
const EDDIES = deck.life.flow.eddies.length

const FLOW_GLSL = /* glsl */ `
uniform vec4 uFlow;
uniform vec2 uFlowJet;
uniform vec4 uFlowPart;
uniform vec4 uEddy[${EDDIES}];
uniform vec2 uEddyFade[${EDDIES}];
uniform float uFlowTime;
vec2 flowAt(vec2 g) {
  vec2 o = g - uFlow.xy;
  float r = length(o);
  float s = r * uFlow.z;
  float t = clamp((r - uFlowPart.x) * uFlowPart.y, 0.0, 1.0);
  float phase = uFlowJet.y * dot(o, uJet.zw);
  float spin = 2.0 * uFlow.w * r * uFlow.z * uFlow.z / (1.0 + s * s * s * s) * (1.0 - smoothstep(uFlowPart.z, uFlowPart.w, r));
  spin += uFlowJet.x / uFlowJet.y * (1.0 - cos(phase)) * 6.0 * t * (1.0 - t) * uFlowPart.y / max(r, 1e-9);
  vec2 v = spin * vec2(-o.y, o.x) - t * t * (3.0 - 2.0 * t) * uFlowJet.x * sin(phase) * uJet.xy;
  for (int e = 0; e < ${EDDIES}; e++) {
    vec2 oe = g - uEddy[e].xy;
    float re = length(oe);
    float se = re * uEddy[e].z;
    v += uEddy[e].w * 2.0 * re * uEddy[e].z * uEddy[e].z / (1.0 + se * se * se * se) * (1.0 - smoothstep(uEddyFade[e].x, uEddyFade[e].y, re)) * vec2(-oe.y, oe.x);
  }
  return v;
}
vec2 carried(vec2 g) {
  return g - uFlowTime * flowAt(g - 0.5 * uFlowTime * flowAt(g));
}
uniform sampler2D uWound;
uniform vec4 uWoundCode[${AGES}];
uniform float uWoundAge[${AGES}];
uniform vec4 uWoundShape;
uniform float uWoundDrawn[${AGES}];
uniform float uWoundLong[${AGES}];
vec3 woundAt(vec2 x, int j) {
  vec2 o = x - uFlow.xy;
  float r = length(o);
  float phase = uFlowJet.y * dot(o, uJet.zw);
  float shear = abs(uWoundAge[j] * uFlowJet.y * cos(phase));
  vec3 y = vec3(x + uWoundAge[j] * sin(phase) * uJet.xy, 2.0 / (shear + sqrt(shear * shear + 4.0)));
  for (int i = 0; i < (r < uWoundShape.w ? 1 : 0); i++) {
    float a = r > 0.0 ? atan(o.y, o.x) : 0.0;
    vec2 uv = vec2(a * 0.15915494309189535 + 0.5, clamp(sqrt(r * uWoundShape.x), uWoundShape.y, 1.0 - uWoundShape.y));
    float dr = uWoundCode[j].x + uWoundCode[j].y * textureLod(uWound, vec2(uv.x, (float(3 * j) + uv.y) / ${3 * AGES}.0), 0.0).r;
    float da = uWoundCode[j].z + uWoundCode[j].w * textureLod(uWound, vec2(uv.x, (float(3 * j + 1) + uv.y) / ${3 * AGES}.0), 0.0).r;
    float ls = uWoundDrawn[j] * textureLod(uWound, vec2(uv.x, (float(3 * j + 2) + uv.y) / ${3 * AGES}.0), 0.0).r;
    y = mix(vec3(uFlow.xy + (r + dr) * vec2(cos(a + da), sin(a + da)), exp2(-ls)), y, smoothstep(uWoundShape.z, uWoundShape.w, r));
  }
  return y;
}
vec2 lain(vec2 y, int j) {
  return vec2(dot(y, uJet.xy) * uWoundLong[j], dot(y, uJet.zw));
}
`

const ABOVE_GLSL = /* glsl */ `float above(vec3 p) {
  float n = dot(p, p) + 2.0 * uRadius * p.z;
  return n / (sqrt(uRadius * uRadius + n) + uRadius);
}
`

const STORED_GLSL = /* glsl */ `float stored(vec2 g) {
  vec2 a = abs(g - uNear.xy) * (2.0 * uNear.z);
  vec2 b = abs(g - uMid.xy) * (2.0 * uMid.z);
  float wn = 1.0 - smoothstep(uJoin.x, uJoin.y, max(a.x, a.y));
  float wm = (1.0 - wn) * (1.0 - smoothstep(uJoin.x, uJoin.y, max(b.x, b.y)));
  float h = 0.0;
  for (int k = 0; k < (wn > 0.0 ? 1 : 0); k++) h += wn * textureLod(uHeightNear, (g - uNear.xy) * uNear.z + 0.5, 0.0).r;
  for (int k = 0; k < (wm > 0.0 ? 1 : 0); k++) h += wm * textureLod(uHeightMid, (g - uMid.xy) * uMid.z + 0.5, 0.0).r;
  return uHeightRange.x * (wn + wm) + h * uHeightRange.y;
}
float unrest(vec2 g) {
  vec2 a = abs(g - uNear.xy) * (2.0 * uNear.z);
  vec2 b = abs(g - uMid.xy) * (2.0 * uMid.z);
  float wn = 1.0 - smoothstep(uJoin.x, uJoin.y, max(a.x, a.y));
  float wm = (1.0 - wn) * (1.0 - smoothstep(uJoin.x, uJoin.y, max(b.x, b.y)));
  float r = 0.0;
  for (int k = 0; k < (wn > 0.0 ? 1 : 0); k++) r += wn * textureLod(uRoughNear, (g - uNear.xy) * uNear.z + 0.5, 0.0).r;
  for (int k = 0; k < (wm > 0.0 ? 1 : 0); k++) r += wm * textureLod(uRoughMid, (g - uMid.xy) * uMid.z + 0.5, 0.0).r;
  return r;
}
float darkAt(vec2 g) {
  vec2 a = abs(g - uNear.xy) * (2.0 * uNear.z);
  vec2 b = abs(g - uMid.xy) * (2.0 * uMid.z);
  float wn = 1.0 - smoothstep(uJoin.x, uJoin.y, max(a.x, a.y));
  float wm = (1.0 - wn) * (1.0 - smoothstep(uJoin.x, uJoin.y, max(b.x, b.y)));
  float r = 0.0;
  for (int k = 0; k < (wn > 0.0 ? 1 : 0); k++) r += wn * textureLod(uDarkNear, (g - uNear.xy) * uNear.z + 0.5, 0.0).r;
  for (int k = 0; k < (wm > 0.0 ? 1 : 0); k++) r += wm * textureLod(uDarkMid, (g - uMid.xy) * uMid.z + 0.5, 0.0).r;
  return r;
}
`

const DETAIL_GLSL = /* glsl */ `
uint bits(uint h) {
  h ^= h >> 15;
  h *= 0x2C1B3C6Du;
  h ^= h >> 12;
  h *= 0x297A2D39u;
  h ^= h >> 15;
  return h;
}
float gnoise(vec2 p, int seed, float turn) {
  vec2 base = floor(p);
  ivec2 cell = ivec2(base);
  vec2 f = p - base;
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec4 n = vec4(0.0);
  for (int k = 0; k < 4; k++) {
    ivec2 o = ivec2(k & 1, k >> 1);
    ivec2 c = cell + o;
    uint h = bits(uint(c.x) * 0x9E3779B1u ^ uint(c.y) * 0x85EBCA77u ^ uint(seed) * 0xC2B2AE3Du);
    float a = float(h) * (6.283185307179586 / 4294967296.0) + turn * (0.5 + float(h & 0xFFFFu) * (0.5 / 65536.0)) * (float((h >> 16) & 1u) * 2.0 - 1.0);
    n[k] = dot(vec2(cos(a), sin(a)), f - vec2(o));
  }
  return mix(mix(n.x, n.y, u.x), mix(n.z, n.w, u.x), u.y);
}
vec2 warped(vec2 y, vec4 w) {
  y += w.y * vec2(gnoise(y / w.x, ${OCTAVES * AGES}, 0.0), gnoise(y / w.x + uCloudShift.zw, ${OCTAVES * AGES + 1}, 0.0));
  return y + w.w * vec2(gnoise(y / w.z, ${OCTAVES * AGES + 2}, 0.0), gnoise(y / w.z + uCloudShift.zw, ${OCTAVES * AGES + 3}, 0.0));
}
vec3 curled(vec2 x, float least) {
  vec2 y = x;
  float strain = 0.0;
  float eye = smoothstep(uCellEye.x, uCellEye.y, length(x - uFlow.xy) * uFlow.z);
  for (int l = 0; l < (eye > 0.0 ? int(uCurl.z) : 0); l++) {
    float size = uCurl.x * pow(uCurl.y, float(l));
    float use = eye * smoothstep(least, uCloudCell.w * least, size * uCurlLook.x * uCurlLook.w);
    if (use <= 0.0) break;
    vec2 p = y / size + uCloudShift.zw * float(l + 3);
    vec2 base = floor(p);
    ivec2 cell = ivec2(base);
    vec2 f = p - base;
    vec2 moved = vec2(0.0);
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      ivec2 c = cell + ivec2(i, j);
      uint h = bits(uint(c.x) * 0x9E3779B1u ^ uint(c.y) * 0x85EBCA77u ^ uint(l + 4201) * 0xC2B2AE3Du);
      uint q = bits(h ^ 0x68E31DA4u);
      vec2 d = f - (vec2(float(i), float(j)) + 0.5 + uCurlLook.y * (vec2(float(h & 0xFFFFu), float(h >> 16)) * (1.0 / 65536.0) - 0.5));
      float fall = max(1.0 - dot(d, d) / (uCurlLook.x * uCurlLook.x), 0.0);
      float most = use * uCurl.w * (float(q & 0xFFFFu) * (2.0 / 65536.0) - 1.0);
      float a = most * fall * fall;
      moved += vec2(cos(a) * d.x - sin(a) * d.y, sin(a) * d.x + cos(a) * d.y) - d;
      strain += abs(most) * 4.0 * fall * (1.0 - fall);
    }
    y += size * moved;
  }
  return vec3(y, strain);
}
vec2 billowAt(vec3 y, float least, vec4 law, int seed, float turn) {
  vec2 sum = vec2(0.0);
  for (int k = 0; k < int(law.z); k++) {
    float wave = law.x * exp2(-float(k));
    float use = smoothstep(least, uCloudCell.w * least, wave * y.z);
    if (use <= 0.0) break;
    float n = uSilk.y * gnoise(y.xy / wave + uCloudShift.xy * float(k) + uCloudShift.zw * float(seed), k + ${OCTAVES} * seed, turn);
    sum += use * wave * exp2(-law.w * float(k)) * vec2(min(sqrt(n * n + uSilk.w * uSilk.w) - uSilk.w, 1.0), 1.0);
  }
  return y.z * sum;
}
vec3 frontAt(vec3 y, float least, vec4 law, int seed) {
  vec3 sum = vec3(0.0);
  for (int k = 0; k < int(law.z); k++) {
    float wave = law.x * exp2(-float(k));
    float use = smoothstep(least, uCloudCell.w * least, wave * y.z);
    if (use <= 0.0) break;
    float n = gnoise(y.xy / wave + uCloudShift.xy * float(k) + uCloudShift.zw * float(seed), k + ${OCTAVES} * seed, 0.0);
    float soft = max(law.y, uRopeFront.y * least / (wave * y.z));
    float side = n * inversesqrt(n * n + soft * soft);
    sum += use * exp2(-law.w * float(k)) * vec3(wave * side, wave, 2.598 * max(side, 0.0) * (1.0 - side * side));
  }
  return vec3(y.z * sum.xy, sum.z);
}
vec2 cellsAt(vec3 y, float least, vec4 law, int seed, float turn) {
  vec2 sum = vec2(0.0);
  float ride = 1.0;
  for (int k = 0; k < int(law.z); k++) {
    float wave = law.x * exp2(-float(k));
    float use = smoothstep(least, uCloudCell.w * least, wave * y.z);
    if (use <= 0.0) break;
    vec2 p = y.xy / wave + uCloudShift.xy * float(k) + uCloudShift.zw * float(seed);
    vec2 base = floor(p);
    ivec2 cell = ivec2(base);
    vec2 f = p - base;
    float top = 0.0;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      ivec2 c = cell + ivec2(i, j);
      uint h = bits(uint(c.x) * 0x9E3779B1u ^ uint(c.y) * 0x85EBCA77u ^ uint(k + ${OCTAVES} * seed + 7919) * 0xC2B2AE3Du);
      uint q = bits(h ^ 0x68E31DA4u);
      vec2 d = vec2(float(i), float(j)) + 0.5 + uCell.x * (vec2(float(h & 0xFFFFu), float(h >> 16)) * (1.0 / 65536.0) - 0.5) - f;
      float a = float(q) * (6.283185307179586 / 4294967296.0) + turn * (0.5 + float(q & 0xFFFFu) * (0.5 / 65536.0)) * (float((q >> 16) & 1u) * 2.0 - 1.0);
      float r = uCell.y * mix(uCell.z, 1.0, float((q >> 17) & 0x7FFFu) * (1.0 / 32768.0)) * (1.0 - uCell.w * (0.5 + 0.5 * cos(a)));
      float dome = r * pow(max(1.0 - dot(d, d) / (r * r), 0.0), uCellLook.y);
      float gap = max(uCellLook.x - abs(top - dome), 0.0);
      top = max(top, dome) + gap * gap * (0.25 / uCellLook.x);
    }
    float part = min(top / uCell.y, 1.0);
    float share = k == 0 ? law.y : 1.0;
    sum += share * use * wave * exp2(-law.w * float(k)) * vec2(ride * part, 1.0);
    ride *= mix(1.0, part, uCellLook.z * share);
  }
  return y.z * sum;
}
float fibreAt(vec3 y, float least) {
  float sum = 0.0;
  for (int k = 0; k < int(uFibre.z); k++) {
    float wave = uFibre.x * exp2(-float(k));
    float use = smoothstep(least, uCloudCell.w * least, wave * y.z);
    if (use <= 0.0) break;
    sum += use * smoothstep(uShade.x * uBakeAt.z, uShade.y * uBakeAt.z, wave * y.z) * gnoise(vec2(y.x * uFibre.y, y.y) / wave + uCloudShift.zw * float(k), ${OCTAVES * AGES + 4} + k, uFlowTime * uLife.y);
  }
  return sum;
}
float threadAt(vec3 y, float least) {
  float none = 1.0;
  float mean = 1.0;
  for (int k = 0; k < int(uThread.w); k++) {
    float wave = uThreadLook.z * exp2(-float(k));
    float real = uThread.z * wave * y.z;
    float under = 1.0 - smoothstep(uThreadLook.w, 2.0 * uThreadLook.w, real);
    float use = smoothstep(least, uCloudCell.w * least, real);
    float line = uThread.y;
    for (int i = 0; i < (use * under > 0.0 ? 1 : 0); i++) {
      float n = gnoise(vec2(y.x * uFibre.y, y.y) / wave + uCloudShift.zw * float(k), ${OCTAVES * AGES + 20} + k, uFlowTime * uLife.y) / uThread.x;
      line = mix(uThread.y, exp(-n * n), use);
    }
    none *= 1.0 - under * line;
    mean *= 1.0 - under * uThread.y;
  }
  return mean - none;
}
vec3 sheetAt(vec3 y, float least, float wave, int seed, float turn) {
  vec3 sum = vec3(0.0);
  float weight = 0.0;
  for (int k = 0; k < int(uSilk.z); k++) {
    float w = wave * exp2(-float(k));
    float use = smoothstep(least, uCloudCell.w * least, w * y.z);
    if (use <= 0.0) break;
    float n = gnoise(y.xy / w + uCloudShift.xy * float(k) + uCloudShift.zw * float(seed), k + ${OCTAVES} * seed, turn);
    float part = use * exp2(-uSheetLook.x * float(k));
    sum += n * vec3(use * w * exp2(-uSilkFall * float(k)), part, part * smoothstep(uShade.x * uBakeAt.z, uShade.y * uBakeAt.z, w * y.z));
    weight += part * part;
  }
  return vec3(y.z * sum.x, sum.yz * inversesqrt(max(weight, uSheetLook.y)));
}
`

const VERT = /* glsl */ `
uniform vec3 uS;
uniform vec3 uEx;
uniform vec3 uEy;
uniform vec3 uEn;
uniform float uOwn;
uniform vec3 uEye;
uniform mat3 uAxes;
out vec3 vDir;
out vec3 vEye;
out vec2 vNdc;
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
  vNdc = position.xy;
  vec4 v = inverse(projectionMatrix) * vec4(position.xy, -1.0, 1.0);
  mat3 toLocal = transpose(mat3(modelViewMatrix));
  vec3 d = toLocal * (v.xyz / v.w);
  vec3 q = -toLocal * modelViewMatrix[3].xyz - uS;
  vDir = uOwn > 0.5 ? uAxes * (v.xyz / v.w) : vec3(dot(d, uEx), dot(d, uEy), dot(d, uEn));
  vEye = uOwn > 0.5 ? uEye : vec3(dot(q, uEx), dot(q, uEy), dot(q, uEn));
}`

const HEAD_GLSL = /* glsl */ `
precision highp float;
uniform sampler2D uHeightNear;
uniform sampler2D uHeightMid;
uniform sampler2D uRoughNear;
uniform sampler2D uRoughMid;
uniform sampler2D uDarkNear;
uniform sampler2D uDarkMid;
uniform vec4 uCloudRough;
uniform float uCloudObey[${AGES}];
uniform sampler2D uGuideFore;
uniform sampler2D uGuideNear;
uniform sampler2D uGuideMid;
uniform sampler2D uPlateFar;
uniform vec2 uJoin;
uniform vec4 uFore;
uniform vec4 uNear;
uniform vec4 uMid;
uniform vec4 uFar;
uniform vec4 uGuideTexel;
uniform vec2 uHeightRange;
uniform float uHeightTexel;
uniform float uRadius;
uniform vec2 uShell;
uniform vec3 uMarch;
uniform float uRefine;
uniform float uPixel;
uniform float uGrad;
uniform float uFrame;
uniform vec3 uFoot;
uniform vec2 uSunAz;
uniform sampler2D uLimb;
uniform vec4 uLimbKnots;
uniform vec4 uLimbShape;
uniform sampler2D uAir;
uniform sampler2D uAirThrough;
uniform vec4 uAirKnots;
uniform vec2 uAirTurn;
uniform vec2 uAirLift;
uniform vec3 uAboveGain[${ABOVE_KNOTS}];
uniform vec3 uAboveAir[${ABOVE_KNOTS}];
uniform vec2 uAboveMix;
uniform vec3 uSunCurve[${CURVE_KNOTS}];
uniform vec3 uSunChart;
uniform vec4 uShadow;
uniform vec4 uMedium;
uniform vec4 uMediumStep;
uniform float uSkinTop;
uniform vec4 uMediumSun;
uniform vec2 uMediumWide;
uniform vec4 uOrders;
uniform vec4 uLean;
uniform float uThrough;
uniform vec4 uFill;
uniform float uFillOpen;
uniform vec4 uGas;
uniform vec3 uGasDepth;
uniform vec4 uSky;
uniform vec3 uSkyRing;
uniform float uBounce;
uniform vec3 uLayer;
uniform vec3 uRim;
uniform vec3 uDepth;
uniform vec4 uJet;
uniform vec4 uHazeBand[2];
uniform vec4 uHazeSeed[2];
uniform vec4 uHazeShape;
uniform vec4 uHazeFibre;
uniform vec4 uHazeFine;
uniform vec4 uHazeWarp;
uniform vec4 uHazeOctave;
uniform vec3 uHazeFade;
uniform vec2 uHazeForward;
uniform vec4 uFlash[${FLASHES}];
uniform vec4 uFlashLook;
uniform float uFlashShare;
uniform vec3 uFlashGlow;
uniform vec3 uFlashCore;
uniform vec2 uFlashSteady;
uniform vec2 uFlashDeep;
uniform vec2 uFlashHalo;
uniform vec4 uHazeSpan[2];
uniform vec4 uHazeLight;
uniform vec3 uHazeLit;
uniform vec3 uHazeGlow;
uniform vec3 uHazeShade;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform vec4 uCloud;
uniform vec4 uCloudCell;
uniform vec4 uCloudShift;
uniform vec2 uCloudTurn;
uniform vec3 uCloudTop;
uniform vec3 uCloudDeep;
uniform vec2 uCloudSat;
uniform float uCloudTaps;
uniform float uCloudWave[${AGES}];
uniform float uCloudRise[${AGES}];
uniform vec4 uCloudGeo;
uniform vec3 uCloudCalm;
uniform float uCloudMarch[${AGES}];
uniform float uCloudCap[${AGES}];
uniform float uCloudEdge[${AGES}];
uniform float uCloudTint[${AGES}];
uniform float uSilkWave[${AGES}];
uniform vec4 uSilk;
uniform float uSilkFall;
uniform float uSilkMost[${AGES}];
uniform vec4 uWarp;
uniform vec4 uWarpOld;
uniform vec4 uFibre;
uniform vec4 uFibreLook;
uniform vec4 uCumPatch;
uniform vec4 uCumCover;
uniform vec4 uOrder;
uniform vec3 uLife;
uniform vec2 uCloudSoft;
uniform vec4 uPass;
uniform vec4 uSheet;
uniform vec2 uSheetLook;
uniform vec2 uShade;
uniform vec4 uTall;
uniform vec2 uCumField;
uniform vec4 uThread;
uniform vec4 uCurl;
uniform vec4 uCurlLook;
uniform vec4 uRope;
uniform vec4 uRopeLook;
uniform vec2 uRopeFront;
uniform vec4 uThreadLook;
uniform vec4 uCumOwn;
uniform vec4 uCumLift;
uniform vec3 uCumPack;
uniform vec4 uCell;
uniform vec4 uCellLook;
uniform vec3 uCellPatch;
uniform float uCellFirst;
uniform vec4 uCellCover;
uniform vec2 uCellDrive;
uniform vec2 uCellOwn;
uniform vec2 uCellEye;
uniform float uOrderTint;
uniform vec3 uStride;
uniform sampler2D uBaked;
uniform vec4 uBakeAt;
uniform vec4 uBakeTurn;
uniform vec4 uBakeSize;
uniform vec2 uBakeLeast;
`

const RELIEF_GLSL = /* glsl */ `vec4 reliefAt(vec2 g, float low, float least, float colour) {
  float raw = unrest(g);
  float guard = least * (1.0 + max(max(uWarp.y / uWarp.x, uWarp.w / uWarp.z), max(uWarpOld.y / uWarpOld.x, uWarpOld.w / uWarpOld.z)) * uFibreLook.z);
  vec3 fresh = woundAt(g, 0);
  vec3 rolled = curled(g, least);
  float slack = guard * (1.0 + uCurlLook.z * rolled.z);
  vec3 old = woundAt(rolled.xy, ${AGES - 1});
  vec2 young = warped(fresh.xy, uWarp);
  vec3 aged = vec3(lain(warped(old.xy, uWarpOld), ${AGES - 1}), old.z);
  float order = smoothstep(uOrder.x, uOrder.y, 1.0 / old.z);
  float deep = darkAt(g);
  float rough = mix(uCloudRough.z, 1.0, smoothstep(uCloudRough.x, uCloudRough.y, deep));
  float tall = smoothstep(uTall.x, uTall.y, deep);
  float h = 0.0;
  float pale = 0.0;
  float crest = 0.0;
  float drawn = max(rough, uOrder.w * order);
  float ridge = 0.0;
  float top = 0.0;
  for (int i = 0; i < (slack < uSilkWave[${AGES - 1}] ? 1 : 0); i++) {
    vec3 s = sheetAt(aged, slack, uSilkWave[${AGES - 1}], ${AGES - 1}, uFlowTime * uLife.y);
    h += uSheet.x * mix(1.0, uTall.z, tall) * drawn * s.x;
    pale += uCloudTint[${AGES - 1}] * s.z;
    crest += uSheet.y * s.y;
    ridge = s.y;
  }
  for (int i = 0; i < (slack < uRope.x ? 1 : 0); i++) {
    vec3 b = uRopeFront.x > 0.0 ? frontAt(aged, slack, vec4(uRope.x, uRopeFront.x, uRope.y, uRopeLook.x), ${AGES + 3}) : vec3(billowAt(aged, slack, vec4(uRope.x, 0.0, uRope.y, uRopeLook.x), ${AGES + 3}, 0.0), 0.0);
    float rope = (b.x - uRopeLook.y * b.y) / uRopeLook.z;
    h += uRope.z * drawn * rope;
    pale += drawn * (uRope.w * rope / uRope.x + uRopeLook.w * b.z);
    ridge = mix(ridge, b.z, step(1e-9, uRopeFront.x));
  }
  float patchy = smoothstep(uCellPatch.x, uCellPatch.y, uCellDrive.x * raw + uCellDrive.y * ridge + uCellCover.z * gnoise(aged.xy / uCellPatch.z, ${OCTAVES * AGES + 13}, 0.0));
  float wild = rough * mix(1.0, uOrder.z, order) * smoothstep(uCellEye.x, uCellEye.y, length(g - uFlow.xy) * uFlow.z) * mix(uCellOwn.x, 1.0, patchy);
  float spread = mix(uCellCover.x, uCellCover.y, patchy);
  for (int i = 0; i < (guard < uSilkWave[0] ? 1 : 0); i++) {
    vec2 s = cellsAt(vec3(young, fresh.z), guard, vec4(uSilkWave[0], mix(uCellFirst, 1.0, tall), uSilk.z, uSilkFall), 0, uFlowTime * uLife.x);
    float over = s.x - (1.0 - spread) * s.y;
    float edge = uCellCover.w * s.y;
    float up = 0.5 * (over + sqrt(over * over + edge * edge) - edge) / spread;
    float lift = (up - uCellLook.w * spread * s.y) / uSilkMost[0];
    h += uSilk.x * mix(1.0, uTall.w, tall) * wild * up;
    pale += uCloudTint[0] * wild * lift;
    crest += wild * lift;
    top = clamp(uCellOwn.y * wild * lift, 0.0, 1.0);
  }
  for (int i = 0; i < (slack < uFibre.x ? 1 : 0); i++) {
    float streak = fibreAt(aged, slack);
    h += uFibreLook.x * uFibre.x * streak;
    pale += uFibreLook.y * streak;
  }
  for (int i = 0; i < (colour > 0.0 ? 1 : 0); i++) pale += drawn * (uThreadLook.x * threadAt(aged, slack) - uThreadLook.y);
  float still = smoothstep(uCloudCalm.y, uCloudCalm.z, low);
  float street = gnoise(aged.xy / uCumPatch.y, ${OCTAVES * AGES + 12}, 0.0);
  float cover = smoothstep(uCumCover.x, uCumCover.y, raw) * smoothstep(uCumField.x, uCumField.y, uCumPatch.x * street + uSheet.z * crest) * mix(uSheet.w, 1.0, still) * mix(1.0, uCumLift.w, order) * rough;
  cover = max(cover, tall * uCumPack.x * smoothstep(uCumPack.y, uCumPack.z, street));
  return vec4(h * mix(uCloudCalm.x, 1.0, still), pale, cover, top);
}
`

const BAKE_FRAG = /* glsl */ `${HEAD_GLSL}out vec4 outColor;
${FLOW_GLSL}${STORED_GLSL}${DETAIL_GLSL}${RELIEF_GLSL}void main() {
  float turn = uBakeTurn.x - uBakeTurn.y + (gl_FragCoord.x - 0.5) / uBakeTurn.w;
  float e = exp(uBakeTurn.z + (gl_FragCoord.y - 0.5) / uBakeAt.w);
  float rho = 0.5 * uBakeAt.z * (e - 1.0 / e);
  float way = 0.5 * uBakeAt.z * (e + 1.0 / e);
  vec2 g = carried(uBakeAt.xy + rho * vec2(cos(turn), sin(turn)));
  float low = stored(g);
  vec4 rel = reliefAt(g, low, max(uBakeLeast.x * way, uBakeLeast.y * rho), 1.0);
  outColor = vec4(low + rel.x, rel.y, rel.w, rel.z);
}`

const BAKE_VERT = /* glsl */ `void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`

const FRAG = /* glsl */ `${HEAD_GLSL}in vec3 vDir;
in vec3 vEye;
in vec2 vNdc;
out vec4 outColor;
${DIAG_GLSL}${FLOW_GLSL}float hash(ivec2 p) {
  uint h = uint(p.x) * 0x9E3779B1u ^ uint(p.y) * 0x85EBCA77u;
  h ^= h >> 15;
  h *= 0x2C1B3C6Du;
  h ^= h >> 12;
  h *= 0x297A2D39u;
  h ^= h >> 15;
  return float(h) * (1.0 / 4294967296.0);
}
float vnoise(vec2 p) {
  vec2 f = floor(p);
  ivec2 i = ivec2(f);
  f = p - f;
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + ivec2(1, 0)), u.x), mix(hash(i + ivec2(0, 1)), hash(i + ivec2(1, 1)), u.x), u.y);
}
${ABOVE_GLSL}vec3 unfilm(vec3 y) {
  y = min(y, vec3(0.985));
  vec3 k = 0.59 * y - 0.03;
  vec3 q = 2.43 * y - 2.51;
  return (-k - sqrt(max(k * k - 0.56 * q * y, 0.0))) / (2.0 * q);
}
${STORED_GLSL}vec3 guideAt(vec2 g, vec2 dx, vec2 dy, out float size) {
  vec2 a = abs(g - uNear.xy) * (2.0 * uNear.z);
  vec2 b = abs(g - uMid.xy) * (2.0 * uMid.z);
  vec2 f = abs(g - uFore.xy) * (2.0 * uFore.z);
  float wf = 1.0 - smoothstep(uJoin.x, uJoin.y, max(f.x, f.y));
  float wn = (1.0 - wf) * (1.0 - smoothstep(uJoin.x, uJoin.y, max(a.x, a.y)));
  float wm = (1.0 - wf - wn) * (1.0 - smoothstep(uJoin.x, uJoin.y, max(b.x, b.y)));
  float wr = 1.0 - wf - wn - wm;
  vec3 c = vec3(0.0);
  for (int k = 0; k < (wf > 0.0 ? 1 : 0); k++) c += wf * unfilm(textureGrad(uGuideFore, (g - uFore.xy) * uFore.z + 0.5, dx * uFore.z, dy * uFore.z).rgb);
  for (int k = 0; k < (wn > 0.0 ? 1 : 0); k++) c += wn * unfilm(textureGrad(uGuideNear, (g - uNear.xy) * uNear.z + 0.5, dx * uNear.z, dy * uNear.z).rgb);
  for (int k = 0; k < (wm > 0.0 ? 1 : 0); k++) c += wm * unfilm(textureGrad(uGuideMid, (g - uMid.xy) * uMid.z + 0.5, dx * uMid.z, dy * uMid.z).rgb);
  for (int k = 0; k < (wr > 0.0 ? 1 : 0); k++) c += wr * unfilm(textureGrad(uPlateFar, (g - uFar.xy) * uFar.z + 0.5, dx * uFar.z, dy * uFar.z).rgb);
  size = exp2(wf * log2(uGuideTexel.w) + wn * log2(uGuideTexel.x) + wm * log2(uGuideTexel.y) + wr * log2(uGuideTexel.z));
  return c;
}
vec2 layered(vec2 p, int octaves, float size) {
  float f = 0.0;
  float total = 0.0;
  float gain = 1.0;
  float lost = 0.0;
  for (int n = 0; n < octaves; n++) {
    float keep = 1.0 - smoothstep(uHazeFade.x, uHazeFade.y, size);
    float v = 0.5;
    for (int m = 0; m < (keep > 0.0 ? 1 : 0); m++) v += keep * (vnoise(p + uHazeOctave.xy * float(n)) - 0.5);
    f += gain * v;
    lost += gain * gain * (1.0 - keep * keep);
    total += gain;
    p *= uHazeOctave.z;
    size *= uHazeOctave.z;
    gain *= uHazeOctave.w;
  }
  return vec2(f / total, lost / (total * total));
}
float hazeOne(vec2 g, int k, float foot, vec2 stride) {
  vec2 o = g - uFlow.xy;
  float across = dot(o, uJet.zw);
  float w = smoothstep(uHazeSpan[k].x, uHazeSpan[k].y, uHazeBand[k].y * across) * (1.0 - smoothstep(uHazeSpan[k].z, uHazeSpan[k].w, length(o)));
  float dense = 0.0;
  for (int i = 0; i < (w > 0.0 ? 1 : 0); i++) {
    vec2 lie = vec2(dot(stride, uJet.xy), dot(stride, uJet.zw));
    float coarse = max(foot * uFrame / uHazeShape.y, length(lie / uHazeShape.xy));
    vec2 at = vec2(dot(o, uJet.xy) - uHazeBand[k].z, across);
    vec2 p = at / uHazeShape.xy + uHazeSeed[k].xy;
    vec2 q = vec2(layered(p + uHazeWarp.xy, 2, coarse).x, layered(p + uHazeWarp.zw, 2, coarse).x) - 0.5;
    vec2 bank = layered(p + uHazeFine.x * q, 3, coarse);
    vec2 fibre = layered((at + uHazeFine.w * q * uHazeShape.xy) / uHazeFibre.xy + uHazeSeed[k].yx, int(uHazeFibre.z), max(foot / uHazeFibre.y, length(lie / uHazeFibre.xy)));
    float lost = (1.0 - uHazeFibre.w) * (1.0 - uHazeFibre.w) * bank.y + uHazeFibre.w * uHazeFibre.w * fibre.y;
    float wide = 0.5 * sqrt((uHazeShape.w - uHazeShape.z) * (uHazeShape.w - uHazeShape.z) + uHazeSeed[k].w * lost);
    float mid = 0.5 * (uHazeShape.z + uHazeShape.w);
    dense = w * smoothstep(mid - wide, mid + wide, mix(bank.x, fibre.x, uHazeFibre.w));
  }
  return dense;
}
float hazeAt(vec2 g, int k, float foot, vec2 run) {
  float dense = 0.0;
  for (int j = 0; j < ${HAZE_TAPS}; j++) dense += hazeOne(g + run * ((float(j) + 0.5) / ${HAZE_TAPS}.0 - 0.5), k, foot, run);
  return dense / ${HAZE_TAPS}.0;
}
vec3 flashAt(vec2 g, vec3 c) {
  float s = 0.0;
  float t = 0.0;
  float still = 0.0;
  for (int i = 0; i < ${FLASHES}; i++) {
    vec2 d = g - uFlash[i].xy;
    float q = dot(d, d) * uFlash[i].z;
    s += uFlash[i].w * exp(-q);
    t += uFlash[i].w * exp(-q * uFlashCore.x);
    still += exp(-q * uFlashSteady.y) + uFlashHalo.x * exp(-q * uFlashHalo.y);
  }
  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
  return vec3(s * smoothstep(uFlashLook.x, uFlashLook.y, (c.b - c.r) / max(c.b + c.r, uFlashCore.z)) * mix(uFlashShare, 1.0, smoothstep(uFlashLook.z, uFlashLook.w, lum)), (t + uFlashCore.y * s) * sqrt(max(lum, 0.0)), uFlashSteady.x * still);
}
vec3 deepAt(vec2 g, float clear) {
  float still = 0.0;
  for (int i = 0; i < ${FLASHES}; i++) {
    vec2 d = g - uFlash[i].xy;
    float q = dot(d, d) * uFlash[i].z;
    still += exp(-q * uFlashSteady.y) + uFlashHalo.x * exp(-q * uFlashHalo.y);
  }
  return uFlashGlow * (uFlashSteady.x * still * exp(-max(clear, 0.0) / uFlashDeep.y));
}
vec4 sunAt(vec2 g) {
  vec3 low = unfilm(textureLod(uGuideMid, (g - uMid.xy) * uMid.z + 0.5, uHazeLight.w).rgb);
  return vec4(low, smoothstep(uHazeLit.x, uHazeLit.y, (low.r - low.b) / max(low.r + low.b, 1e-4)));
}
vec4 bakedAt(vec2 x) {
  vec2 d = x - uBakeAt.xy;
  float rho = length(d) / uBakeAt.z;
  float turn = (rho > 0.0 ? atan(d.y, d.x) : 0.0) - uBakeTurn.x;
  turn -= 6.283185307179586 * floor(turn * 0.15915494309189535 + 0.5);
  vec2 at = vec2((turn + uBakeTurn.y) * uBakeTurn.w, (log(rho + sqrt(rho * rho + 1.0)) - uBakeTurn.z) * uBakeAt.w);
  return textureLod(uBaked, (clamp(at, vec2(0.0), uBakeSize.zw) + 0.5) * uBakeSize.xy, 0.0);
}
float skyAt(vec2 x, float here) {
  float open = 0.0;
  for (int k = 0; k < int(uSky.x); k++) {
    float a = (float(k) + uSky.w) * (6.283185307179586 / uSky.x);
    vec2 d = vec2(cos(a), sin(a));
    float rise = 0.0;
    float r = uSkyRing.x;
    for (int m = 0; m < int(uSky.y); m++) {
      rise = max(rise, (bakedAt(x + d * r).x - here) / r);
      r *= uSkyRing.y;
    }
    open += 1.0 / (1.0 + rise * rise);
  }
  return open / uSky.x;
}
vec3 sunLit(float ndl) {
  float knotAt = clamp(sign(ndl) * sqrt(abs(ndl)) * 0.5 + 0.5, 0.0, 1.0) * ${CURVE_KNOTS - 1}.0;
  int knotLow = int(min(floor(knotAt), ${CURVE_KNOTS - 2}.0));
  return mix(uSunCurve[knotLow], uSunCurve[knotLow + 1], knotAt - float(knotLow));
}
float crossing(vec3 E, vec3 D, float over, float under) {
  for (int i = 0; i < int(uRefine); i++) {
    float tm = 0.5 * (over + under);
    vec3 p = E + D * tm;
    if (above(p) - bakedAt(p.xy).x >= 0.0) over = tm;
    else under = tm;
  }
  return under;
}
float skinned(float u, float s) {
  return u <= 0.0 ? 0.0 : (u < s ? 0.5 * u * u / s : u - 0.5 * s);
}
float sunDepth(vec3 from, float under, float skin, out float first) {
  float tau = 0.0;
  first = uShell.y;
  float r = uMediumSun.x;
  for (int j = 0; j < int(uMediumSun.z); j++) {
    vec3 p = from + uSunChart * r;
    float gap = above(p);
    if (gap > uShell.y) break;
    vec4 b = bakedAt(p.xy);
    gap -= b.x;
    for (int k = 0; k < (j == 0 ? 1 : 0); k++) {
      first = gap;
      float end = mix(under, -gap, uMediumWide.y);
      float run = under - end;
      tau += (abs(run) > 1e-7 ? (skinned(under, skin) - skinned(end, skin)) / run : clamp(under / skin, 0.0, 1.0)) * r * uMediumWide.y;
    }
    tau += clamp(-gap / mix(uMedium.x, uSkinTop, b.z), 0.0, 1.0) * r * uMediumWide.x;
    r *= uMediumSun.y;
  }
  return tau * uMedium.y;
}
void main() {
  vec3 D = normalize(vDir);
  vec3 E = vEye;
  float bD = dot(D, E) + uRadius * D.z;
  float e2 = dot(E, E);
  float high = e2 + 2.0 * uRadius * E.z;
  float cTop = high - 2.0 * uRadius * uShell.y - uShell.y * uShell.y;
  float cLow = high - 2.0 * uRadius * uShell.x - uShell.x * uShell.x;
  float dTop = bD * bD - cTop;
  float dLow = bD * bD - cLow;
  float tangent = bD < 0.0 ? sqrt(max(high + uRadius * uRadius - bD * bD, 0.0)) - uRadius : high / (sqrt(uRadius * uRadius + high) + uRadius);
  bool inside = dTop > 0.0 && (cTop < 0.0 || bD < 0.0);
  float t0 = inside ? max(-bD - sqrt(max(dTop, 0.0)), 0.0) : 0.0;
  float t1 = inside ? (dLow > 0.0 && -bD - sqrt(max(dLow, 0.0)) > 0.0 ? -bD - sqrt(max(dLow, 0.0)) : -bD + sqrt(max(dTop, 0.0))) : 0.0;
  float pix = uPixel * uGrad;
  float t = t0;
  float tPrev = t0;
  float gap = 1.0;
  float gapPrev = 1.0;
  bool hit = false;
  int steps = 0;
  for (int i = 0; i < (inside ? int(uMarch.z) : 0); i++) {
    vec3 p = E + D * t;
    gap = above(p) - bakedAt(p.xy).x;
    steps = i;
    if (gap < 0.0) { hit = true; break; }
    if (t > t1) break;
    tPrev = t;
    gapPrev = gap;
    float fall = max(-(D.z + (D.x * p.x + D.y * p.y) / uRadius), 0.0);
    t += max(gap / (fall + uMarch.x), uMarch.y * t * pix);
  }
  float approach = t > tPrev ? max((gapPrev - gap) / (t - tPrev), uMediumWide.y * 1e-3) : 1.0;
  for (int i = 0; i < (hit && t > tPrev ? 1 : 0); i++) t = crossing(E, D, tPrev, t);
  vec2 q = vNdc * 0.5 * vec2(uAspect, 1.0);
  float vig = 1.0 / mix(1.0, 1.0 / pow(1.0 + dot(q, q) * 0.9, 2.0), uVignette);
  vec3 col = vec3(0.0);
  float alpha = 0.0;
  float texels = 0.0;
  vec3 tint = vec3(float(steps) / uMarch.z, 0.0, 0.0);
  for (int k = 0; k < (hit ? 1 : 0); k++) {
    vec3 there = E + D * t;
    vec2 g = carried(there.xy);
    float foot = t * pix;
    float hs = foot;
    vec2 gE = carried(there.xy + vec2(hs, 0.0));
    vec2 gW = carried(there.xy - vec2(hs, 0.0));
    vec2 gN = carried(there.xy + vec2(0.0, hs));
    vec2 gS = carried(there.xy - vec2(0.0, hs));
    float low = stored(g);
    mat2 drift = mat2(gE - gW, gN - gS) * (0.5 / hs);
    float wide = max(foot, uHeightTexel);
    vec2 slope = transpose(drift) * vec2(stored(g + vec2(wide, 0.0)) - stored(g - vec2(wide, 0.0)), stored(g + vec2(0.0, wide)) - stored(g - vec2(0.0, wide))) / (2.0 * wide);
    vec3 n = normalize(vec3(there.xy / uRadius - slope, 1.0));
    float facing = min(dot(D, n), -uFoot.x);
    vec3 sx = dFdx(vDir);
    vec3 sy = dFdy(vDir);
    sx = normalize(sx - D * dot(D, sx));
    sy = normalize(sy - D * dot(D, sy));
    vec2 dx = foot * (sx - D * (dot(sx, n) / facing)).xy;
    vec2 dy = foot * (sy - D * (dot(sy, n) / facing)).xy;
    vec2 cx = drift * dx;
    vec2 cy = drift * dy;
    float major = sqrt(0.5 * (dot(cx, cx) + dot(cy, cy)) + sqrt(0.25 * (dot(cx, cx) - dot(cy, cy)) * (dot(cx, cx) - dot(cy, cy)) + dot(cx, cy) * dot(cx, cy)));
    float sizeGuide;
    vec3 guide = guideAt(g, cx, cy, sizeGuide);
    float on = 1.0;
    vec3 through = vec3(1.0);
    vec3 added = vec3(0.0);
    float sine = max(-dot(D, normalize(there + vec3(0.0, 0.0, uRadius))), 1e-6);
    for (int i = 0; i < (sine < uAirKnots.z ? 1 : 0); i++) {
      float row = clamp(log(sine / uAirKnots.x) * uAirKnots.y, 0.0, 1.0) * uAirTurn.x + uAirTurn.y;
      float column = acos(clamp(dot(D.xy / max(length(D.xy), 1e-6), uSunAz), -1.0, 1.0)) * uAirKnots.w + 0.5 * (1.0 - 3.14159265 * uAirKnots.w);
      through = vec3(texture(uAirThrough, vec2(0.5, row)).r, texture(uAirThrough, vec2(0.5, row + 1.0 / 3.0)).r, texture(uAirThrough, vec2(0.5, row + 2.0 / 3.0)).r);
      added = vec3(texture(uAir, vec2(column, row)).r, texture(uAir, vec2(column, row + 1.0 / 3.0)).r, texture(uAir, vec2(column, row + 2.0 / 3.0)).r);
    }
    vec2 out2 = abs(there.xy - uFar.xy) * (2.0 * uFar.z);
    float thin = smoothstep(uAirLift.x, uAirLift.y, max(out2.x, out2.y));
    vec3 throughLow = through;
    vec3 addedLow = added;
    for (int i = 0; i < (thin > 0.0 ? 1 : 0); i++) {
      through = mix(through, vec3(1.0), thin);
      added *= 1.0 - thin;
    }
    vec3 amb = mix(uBounce * sunAt(g).rgb, uFill.rgb, skyAt(there.xy, above(there)));
    float sunUp = dot(normalize(vec3(there.xy / uRadius, 1.0)), uSunChart);
    float toSun = dot(D, uSunChart);
    float order[${ORDERS}];
    float forward = uOrders.w;
    float share = 1.0;
    float thinning = 1.0;
    float level = 0.0;
    for (int o = 0; o < ${ORDERS}; o++) {
      order[o] = share * (1.0 - forward * forward) / pow(1.0 + forward * forward - 2.0 * forward * toSun, 1.5);
      level += order[o] * max(sunUp, 0.0) / (max(sunUp, 0.0) + thinning * sine);
      share *= uOrders.y;
      forward *= uOrders.z;
      thinning *= uOrders.x;
    }
    vec3 sunny = max(sunLit(sunUp) - uFill.rgb, vec3(0.0)) / max(level, 1e-6);
    vec3 sum = vec3(0.0);
    vec3 last = vec3(0.0);
    vec3 srcPrev = vec3(0.0);
    float left = 1.0;
    float tm = t;
    float lenPrev = 0.0;
    float rhoPrev = 0.0;
    int taken = 0;
    float zetaPrev = 0.0;
    for (int i = 0; i < int(uMedium.z + uMediumStep.z); i++) {
      vec3 p = E + D * tm;
      vec4 b = bakedAt(p.xy);
      float zeta = above(p) - b.x;
      for (int k = 0; k < (i > 0 && zeta < 0.0 && zetaPrev >= 0.0 ? 1 : 0); k++) {
        float found = crossing(E, D, tm - lenPrev, tm);
        lenPrev -= tm - found;
        tm = found;
        p = E + D * tm;
        b = bakedAt(p.xy);
        zeta = above(p) - b.x;
      }
      zetaPrev = zeta;
      vec4 m = vec4(zeta, clamp(-zeta / mix(uMedium.x, uSkinTop, b.z), 0.0, 1.0), b.y, b.z);
      float rho = uMedium.y * m.y;
      vec3 src = srcPrev;
      for (int k = 0; k < (rho > 0.0 ? 1 : 0); k++) {
        vec2 at = carried(p.xy);
        float clear = above(p) - stored(at);
        float tap;
        float tau = sunDepth(p, -m.x, mix(uMedium.x, uSkinTop, b.z), tap);
        float lean = clamp((tap - m.x) / (uMediumSun.x * max(sunUp, uLean.z)), 0.0, uLean.y);
        float sizeAt;
        vec3 matter = guideAt(at, cx, cy, sizeAt);
        float weight = dot(matter, vec3(0.2126, 0.7152, 0.0722));
        vec3 hue = max(matter / max(weight, 1e-5), vec3(1e-3));
        vec3 stuff = mix(matter * exp(uCloudTop * max(m.z, 0.0) - uCloudDeep * max(-m.z, 0.0)) * pow(hue, vec3(-min(uCloudSat.x * m.z, uCloudSat.y))), uCumOwn.rgb * clamp(weight * uCumLift.x, uCumLift.y, uCumLift.z), m.w * uCumOwn.w);
        vec3 pass = pow(max(stuff / max(max(stuff.r, stuff.g), max(stuff.b, 1e-6)), vec3(1e-3)), vec3(uOrderTint));
        vec3 s = vec3(0.0);
        vec3 passed = vec3(1.0);
        float thin = 1.0;
        for (int o = 0; o < ${ORDERS}; o++) {
          s += order[o] * exp(-thin * tau) * passed * mix(1.0, lean, o == 0 ? uLean.x : uLean.w);
          thin *= uOrders.x;
          passed *= pass;
        }
        float under = max(uGas.x - above(p), 0.0);
        src = stuff * (sunny * s * exp(-uGasDepth * (under / max(sunUp, uGas.z))) + amb * exp(-uGasDepth * (under * uGas.y)) + deepAt(at, clear)) * exp(-uGasDepth * (under / max(sine, uGas.z)));
        last = src;
        taken++;
      }
      float dTau = 0.5 * (rho + rhoPrev) * lenPrev;
      for (int k = 0; k < (dTau > 0.0 ? 1 : 0); k++) {
        float w = left * (1.0 - exp(-dTau));
        sum += w * (rhoPrev * srcPrev + rho * src) / (rhoPrev + rho);
        left -= w;
      }
      if (left < uMediumStep.w || taken >= int(uMedium.z) || tm > t1) break;
      float len = 0.0;
      if (rho > 0.0) {
        float grow = lenPrev > 0.0 ? max((rho - rhoPrev) / lenPrev, 0.0) : uMedium.y / uMedium.x * approach;
        len = grow > 1e-6 ? (sqrt(rho * rho + 2.0 * grow * uMedium.w) - rho) / grow : uMedium.w / max(rho, 1e-6);
        len = clamp(len, uMediumStep.x, uMediumStep.y);
      } else {
        float fall = max(-(D.z + (D.x * p.x + D.y * p.y) / uRadius), 0.0);
        len = max(m.x / (fall + uMarch.x), uMarch.y * tm * pix);
      }
      rhoPrev = rho;
      srcPrev = src;
      lenPrev = len;
      tm += len;
    }
    if (taken == 0) { hit = false; break; }
    vec3 ground = sum + left * last;
    col = ground * through + added;
    for (int i = 0; i < (thin > 0.0 ? 1 : 0); i++) {
      float knot = sqrt(clamp(sine, 0.0, 1.0)) * ${ABOVE_KNOTS - 1}.0;
      int low = int(min(floor(knot), ${ABOVE_KNOTS - 2}.0));
      float part = knot - float(low);
      vec3 byGain = mix(uAboveGain[low], uAboveGain[low + 1], part);
      vec3 byAir = mix(uAboveAir[low], uAboveAir[low + 1], part);
      col = mix(col, col * byGain + byAir, thin);
      for (int j = 0; j < (thin < 1.0 && uAboveMix.x > 0.0 ? 1 : 0); j++) col = mix(col, exp(mix(log(max(ground * throughLow + addedLow, vec3(uAboveMix.y))), log(max(ground * byGain + byAir, vec3(uAboveMix.y))), thin)), uAboveMix.x);
    }
    vec3 flash = flashAt(g, col);
    col = col * exp(flash.x) + uFlashGlow * flash.y;
    for (int i = 0; i < (uHazeLit.z > 0.0 ? 1 : 0); i++) {
      float zg = above(there);
      float shadow = 0.0;
      for (int b = 0; b < 2; b++) shadow += uHazeSeed[b].z * smoothstep(0.0, uHazeFade.z, uHazeBand[b].x - zg) * hazeAt(there.xy + uSunAz * (max(uHazeBand[b].x - zg, 0.0) * uHazeLight.x), b, major, uSunAz * (uHazeLight.y * uHazeLight.x));
      for (int j = 0; j < (shadow > 0.0 ? 1 : 0); j++) col *= 1.0 - uHazeLit.z * sunAt(there.xy).a * (1.0 - exp(-shadow)) * uHazeShade;
      for (int b = 0; b < 2; b++) {
        float hb = uHazeBand[b].x;
        float cb = high - 2.0 * uRadius * hb - hb * hb;
        float db = bD * bD - cb;
        float tb = -bD - sqrt(max(db, 0.0));
        for (int j = 0; j < (cb > 0.0 && db > 0.0 && tb > 0.0 && tb < t ? 1 : 0); j++) {
          vec3 pb = E + D * tb;
          float cosine = max(-dot(D, normalize(pb + vec3(0.0, 0.0, uRadius))), uHazeLight.z);
          float ha = hb + 0.5 * uHazeLight.y;
          float ca = high - 2.0 * uRadius * ha - ha * ha;
          float ta = ca > 0.0 ? max(-bD - sqrt(max(bD * bD - ca, 0.0)), 0.0) : 0.0;
          float hc = hb - 0.5 * uHazeLight.y;
          float dc = bD * bD - high + 2.0 * uRadius * hc + hc * hc;
          float tc = dc > 0.0 ? min(-bD - sqrt(dc), t) : t;
          float dense = hazeAt(E.xy + D.xy * (0.5 * (ta + tc)), b, tb * pix / cosine, D.xy * (tc - ta));
          for (int m = 0; m < (dense > 0.0 ? 1 : 0); m++) {
            vec4 sun = sunAt(pb.xy);
            float toward = min(uHazeForward.y * pow((1.0 - uHazeForward.x) * inversesqrt(max(1.0 + uHazeForward.x * uHazeForward.x - 2.0 * uHazeForward.x * dot(D, normalize(vec3(uSunAz * uHazeLight.x, 1.0))), 1e-4)), 3.0), 1.0);
            col = mix(col, sun.rgb * uHazeGlow, uHazeLit.z * sun.a * toward * smoothstep(0.0, uHazeFade.z, hb - zg) * (1.0 - exp(-uHazeBand[b].w * dense / cosine)));
          }
        }
      }
    }
    texels = max(major / sizeGuide, on * 2.0 / (uCloudCell.w * uCloud.y)) / uGrad;
    alpha = 1.0;
    for (int i = 0; i < (uLayer.z > 0.5 ? 1 : 0); i++) {
      vec2 r = abs(there.xy - uFar.xy) * (2.0 * uFar.z);
      alpha = smoothstep(uDepth.x, uDepth.y, uDepth.z / (t * uPixel * uFrame)) * (1.0 - smoothstep(uJoin.x, uJoin.y, max(r.x, r.y)));
      col *= alpha;
    }
    tint.g = on;
  }
  for (int k = 0; k < (hit ? 0 : 1); k++) {
    float rise = max(bD < 0.0 ? tangent : tangent + bD * bD / (2.0 * uRadius), 0.0);
    vec3 up = normalize(E + vec3(0.0, 0.0, uRadius));
    vec3 level = normalize(D - dot(D, up) * up);
    float u = dot(E.xy + level.xy * sqrt(max(high, 0.0)), uSunAz);
    vec2 at = vec2(clamp((u - uLimbKnots.x) * uLimbKnots.y, uLimbShape.y, 1.0 - uLimbShape.y), clamp(sqrt(rise * uLimbShape.x), 0.0, 1.0) * uLimbKnots.z + uLimbKnots.w);
    for (int i = 0; i < (rise < 1.0 / uLimbShape.x ? 1 : 0); i++) col = vec3(texture(uLimb, at).r, texture(uLimb, at + vec2(0.0, 1.0 / 3.0)).r, texture(uLimb, at + vec2(0.0, 2.0 / 3.0)).r);
    alpha = 1.0 - smoothstep(uLimbShape.z, uLimbShape.w, rise);
    for (int i = 0; i < (uLayer.z > 0.5 ? 1 : 0); i++) {
      vec3 q = E + D * max(-bD, 0.0) + vec3(0.0, 0.0, uRadius);
      float stands = 1.0 - smoothstep(uLayer.x, uLayer.y, length(q * (uRadius / length(q)) - vec3(uFar.xy, sqrt(max(uRadius * uRadius - dot(uFar.xy, uFar.xy), 0.0)))));
      stands *= smoothstep(uRim.x, uRim.y, uRim.z / max(max(-bD, 0.0) * uPixel * uFrame, 1e-9));
      col *= stands;
      alpha *= stands;
    }
  }
  outColor = diagOut(vec4(col * uGain * vig, alpha), texels, 1.0, tint, vec2(0.0), t / uRadius);
  if (!hit && (uDiag >= 2 || alpha + col.r + col.g + col.b <= 0.0)) discard;
}`

type Level = { centre: number[]; size: number; pixels: Record<string, number>; paint?: Record<string, number> }
type Plate = { centre: number[]; size: number[]; pixels: Record<string, number[]> }

async function heightMap(ctx: SetContext, path: string, size: number): Promise<THREE.DataTexture> {
  const raw = new Uint16Array(await ctx.buffer(path))
  if (raw.length !== size * size) throw new Error('deck height size mismatch: ' + path)
  const data = new Float32Array(raw.length)
  for (let i = 0; i < raw.length; i++) data[i] = raw[i]! / 65535
  return ctx.floatTexture(data, size, size)
}

export class CloudDeck {
  readonly mesh: THREE.Mesh
  readonly layer: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly baker: THREE.ShaderMaterial
  private readonly stage = new THREE.Scene()
  private readonly lens = new THREE.Camera()
  private readonly held = new THREE.WebGLRenderTarget(1, 1, { type: THREE.FloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false })
  private readonly through = new THREE.Matrix4()
  private readonly eye = new THREE.Vector3()
  private readonly ray = new THREE.Vector3()
  private readonly turns: number[] = []
  private readonly was = new Float64Array(12)
  private readonly now = new Float64Array(12)

  private constructor(uniforms: Record<string, THREE.IUniform>) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      transparent: true,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      depthTest: false,
      depthWrite: false,
    })
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material)
    this.mesh.frustumCulled = false
    this.layer = new THREE.Mesh(this.mesh.geometry, this.material)
    this.layer.frustumCulled = false
    this.layer.renderOrder = 1
    this.baker = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: BAKE_VERT, fragmentShader: BAKE_FRAG, uniforms, depthTest: false, depthWrite: false })
    const quad = new THREE.Mesh(this.mesh.geometry, this.baker)
    quad.frustumCulled = false
    this.stage.add(quad)
    this.held.scissorTest = true
    uniforms.uBaked!.value = this.held.texture
    this.mesh.onBeforeRender = (renderer, _scene, camera) => this.bake(renderer, camera, this.mesh)
    this.layer.onBeforeRender = (renderer, _scene, camera) => this.bake(renderer, camera, this.layer)
  }

  private bake(renderer: THREE.WebGLRenderer, camera: THREE.Camera, drawn: THREE.Mesh): void {
    const u = this.material.uniforms
    const bk = deck.look.bake
    const own = (u.uOwn!.value as number) > 0.5
    const m = this.through.multiplyMatrices(camera.matrixWorldInverse, drawn.matrixWorld).elements
    const ex = u.uEx!.value as THREE.Vector3
    const ey = u.uEy!.value as THREE.Vector3
    const en = u.uEn!.value as THREE.Vector3
    const axes = (u.uAxes!.value as THREE.Matrix3).elements
    const eye = this.eye
    const ray = this.ray
    if (own) eye.copy(u.uEye!.value as THREE.Vector3)
    else {
      const s = u.uS!.value as THREE.Vector3
      ray.set(-(m[0]! * m[12]! + m[1]! * m[13]! + m[2]! * m[14]!) - s.x, -(m[4]! * m[12]! + m[5]! * m[13]! + m[6]! * m[14]!) - s.y, -(m[8]! * m[12]! + m[9]! * m[13]! + m[10]! * m[14]!) - s.z)
      eye.set(ray.dot(ex), ray.dot(ey), ray.dot(en))
    }
    const radius = u.uRadius!.value as number
    const shell = u.uShell!.value as THREE.Vector2
    const over = eye.lengthSq() + 2 * radius * eye.z
    const height = over / (Math.sqrt(radius * radius + over) + radius)
    if (!(height > shell.y)) throw new Error('deck bake: the camera is inside the deck')
    const turns = this.turns
    turns.length = 0
    let near = Infinity
    for (let k = 0; k < 4 * bk.rays; k++) {
      const side = Math.floor(k / bk.rays)
      const along = 2 * (k % bk.rays) / bk.rays - 1
      ray.set(side === 0 ? along : side === 1 ? 1 : side === 2 ? -along : -1, side === 0 ? -1 : side === 1 ? along : side === 2 ? 1 : -along, -1).applyMatrix4(camera.projectionMatrixInverse)
      let dx: number, dy: number, dz: number
      if (own) {
        dx = axes[0]! * ray.x + axes[3]! * ray.y + axes[6]! * ray.z
        dy = axes[1]! * ray.x + axes[4]! * ray.y + axes[7]! * ray.z
        dz = axes[2]! * ray.x + axes[5]! * ray.y + axes[8]! * ray.z
      } else {
        const lx = m[0]! * ray.x + m[1]! * ray.y + m[2]! * ray.z
        const ly = m[4]! * ray.x + m[5]! * ray.y + m[6]! * ray.z
        const lz = m[8]! * ray.x + m[9]! * ray.y + m[10]! * ray.z
        dx = lx * ex.x + ly * ex.y + lz * ex.z
        dy = lx * ey.x + ly * ey.y + lz * ey.z
        dz = lx * en.x + ly * en.y + lz * en.z
      }
      if (dz >= 0) continue
      near = Math.min(near, (height - shell.y) * Math.hypot(dx, dy) / -dz)
      turns.push(Math.atan2(dy, dx))
    }
    if (turns.length === 0) return
    turns.sort((a, b) => a - b)
    let gap = turns[0]! + 2 * Math.PI - turns[turns.length - 1]!
    let after = turns[0]!
    for (let i = 1; i < turns.length; i++) if (turns[i]! - turns[i - 1]! > gap) { gap = turns[i]! - turns[i - 1]!; after = turns[i]! }
    const under = gap < Math.PI
    if (under) near = 0
    const md = deck.look.medium.sun
    const sk = deck.look.sun.sky
    const reach = bk.reach * Math.max(md.firstUnits * md.ratio ** (md.taps - 1), sk.firstUnits * sk.ratio ** (sk.rings - 1))
    const margin = reach < near ? Math.asin(reach / near) : Math.PI
    const whole = under || gap <= 2 * margin + bk.wholeDeg * Math.PI / 180
    const most = Math.min(bk.mostPixels, renderer.capabilities.maxTextureSize)
    const far = Math.min(Math.sqrt((radius + height) ** 2 - (radius + shell.x) ** 2) + Math.sqrt((radius + shell.y) ** 2 - (radius + shell.x) ** 2), Math.hypot(eye.x, eye.y) + radius) + reach
    const first = Math.asinh(Math.max(near - reach, 0) / height)
    const last = Math.asinh(far / height)
    const step = Math.max(bk.masterFeet * (u.uPixel!.value as number) * frameUniform.value, (last - first) / (most - 2))
    const rows = Math.ceil((last - first) / step) + 2
    let half = Math.PI
    let across = step
    let columns = 0
    if (whole) {
      const round = Math.min(Math.ceil(2 * Math.PI / step), most - 3)
      across = 2 * Math.PI / round
      half = Math.PI + across
      columns = round + 3
    } else {
      half = Math.PI - 0.5 * gap + margin
      across = Math.max(step, 2 * half / (most - 1))
      columns = Math.ceil(2 * half / across) + 1
    }
    const middle = after + Math.PI - 0.5 * gap
    const seen = under || (whole && gap <= bk.wholeDeg * Math.PI / 180) ? Math.PI : Math.PI - 0.5 * gap
    const now = this.now
    now.set([eye.x, eye.y, height, step, middle, half, first, across, columns, rows, u.uFlowTime!.value as number, seen])
    let same = true
    for (let i = 0; i < now.length; i++) same &&= now[i] === this.was[i]
    if (same) return
    this.was.set(now)
    if (columns > this.held.width || rows > this.held.height) this.held.setSize(Math.max(columns, this.held.width), Math.max(rows, this.held.height))
    this.held.viewport.set(0, 0, columns, rows)
    ;(u.uBakeAt!.value as THREE.Vector4).set(eye.x, eye.y, height, 1 / step)
    ;(u.uBakeTurn!.value as THREE.Vector4).set(middle, half, first, 1 / across)
    ;(u.uBakeSize!.value as THREE.Vector4).set(1 / this.held.width, 1 / this.held.height, columns - 1, rows - 1)
    ;(u.uBakeLeast!.value as THREE.Vector2).set(bk.cellTexels * step, bk.cellTexels * across)
    const target = renderer.getRenderTarget()
    const face = renderer.getActiveCubeFace()
    const level = renderer.getActiveMipmapLevel()
    for (let k = 0; k < bk.bands; k++) {
      const from = Math.floor(rows * k / bk.bands)
      const to = Math.floor(rows * (k + 1) / bk.bands)
      const closest = height * Math.sinh(first + Math.max(from - bk.guard, 0) * step)
      const wide = Math.min(half, seen + (reach < closest ? Math.asin(reach / closest) : Math.PI))
      const left = Math.max(Math.floor((half - wide) / across) - bk.guard, 0)
      const right = Math.min(Math.ceil((half + wide) / across) + bk.guard + 1, columns)
      this.held.scissor.set(left, from, right - left, to - from)
      renderer.setRenderTarget(this.held)
      renderer.render(this.stage, this.lens)
    }
    renderer.setRenderTarget(target, face, level)
  }

  static async load(ctx: SetContext, base: string): Promise<CloudDeck> {
    const maps = fields.maps as Record<string, Level>
    const uniforms: Record<string, THREE.IUniform> = {}
    const l = deck.look
    const guides = deck.guide.levels as Record<string, Level>
    const texel: number[] = []
    for (const [name, key] of [['near', 'Near'], ['mid', 'Mid']] as const) {
      const m = maps[name]!
      const gl = guides[name]!
      if (gl.centre[0] !== m.centre[0] || gl.centre[1] !== m.centre[1] || gl.size !== m.size) throw new Error('deck guide box mismatch: ' + name)
      uniforms['uGuide' + key] = { value: await ctx.texture(base + 'guide-' + name + '.png', { srgb: true, anisotropy: l.anisotropy }) }
      uniforms['uHeight' + key] = { value: await heightMap(ctx, base + 'guide-' + name + '-height.bin', gl.pixels[ctx.assets]!) }
      uniforms['uRough' + key] = { value: await heightMap(ctx, base + 'guide-' + name + '-rough.bin', deck.guide.rough.pixels) }
      uniforms['uDark' + key] = { value: await heightMap(ctx, base + 'guide-' + name + '-dark.bin', deck.guide.rough.pixels) }
      uniforms['u' + key] = { value: new THREE.Vector4(m.centre[0], m.centre[1], 1 / m.size, m.size / m.pixels[ctx.assets]!) }
      texel.push(gl.size / (gl.paint ?? gl.pixels)[ctx.assets]!)
    }
    const gf = guides.fore!
    uniforms.uGuideFore = { value: await ctx.texture(base + 'guide-fore.png', { srgb: true, anisotropy: l.anisotropy }) }
    uniforms.uFore = { value: new THREE.Vector4(gf.centre[0], gf.centre[1], 1 / gf.size, gf.size / gf.pixels[ctx.assets]!) }
    const pf = (fields.plates as unknown as Record<string, Plate>).far!
    uniforms.uPlateFar = { value: await ctx.texture(base + 'plate-far.png', { srgb: true, anisotropy: l.anisotropy }) }
    uniforms.uFar = { value: new THREE.Vector4(pf.centre[0], pf.centre[1], 1 / pf.size[0]!, pf.size[0]! / pf.pixels[ctx.assets]![0]!) }
    texel.push(pf.size[0]! / pf.pixels[ctx.assets]![0]!)
    const fw = deck.life.flow
    const wd = fw.wound
    const [wc, wr] = (wd.pixels as Record<string, number[]>)[ctx.assets] as [number, number]
    const woundRaw = new Uint16Array(await ctx.buffer(base + 'deck-wound.bin'))
    if (woundRaw.length !== 3 * AGES * wc * wr || woundJson.ranges.length !== AGES) throw new Error('deck wound size mismatch')
    const wound = new Float32Array(woundRaw.length)
    for (let i = 0; i < woundRaw.length; i++) wound[i] = woundRaw[i]! / 65535
    const speed = fw.unitsPerSecond
    const cl = l.cloud
    if (cl.cell.reach > 1 - 0.5 * cl.cell.jitter) throw new Error('deck cloud cell reach too wide for two cells a side')
    if (cl.cells.radius > 1.5 - 0.5 * cl.cells.jitter) throw new Error('deck cloud tops too wide for three cells a side')
    const waves = cl.ageWaves.slice(0, AGES).map((a) => a * cl.waveUnits)
    const sum = (w: number, octaves: number, fall: number) => { let t = 0; for (let k = 0; k < octaves; k++) t += w * 2 ** (-k * (1 + fall)); return Math.max(t, 1e-9) }
    const silkMost = cl.silk.waveUnits.slice(0, AGES).map((w) => sum(w, cl.silk.octaves, cl.silk.fall))
    const fb = cl.fibre
    const th = cl.thread
    const ropeMost = sum(1, cl.rope.octaves, cl.rope.fall)
    const cu = cl.cumulus
    const reach = [0, 1, 2, 3].map((k) => { let s = 0; for (let i = 0; i < cu.levels - k; i++) s += cu.ratio ** i; return Math.max(s, 1) })
    const far = 1.5 - 0.5 * cl.cell.jitter - cu.radius * reach[0]!
    if (far < cu.cull) throw new Error('deck cumulus reach too wide for three cells a side')
    const ballMost = cu.waveUnits * cu.squash * cu.radius * (reach[0]! - cu.sink)
    const most = cl.silk.aspect * Math.max(1, cl.tall.silk) * silkMost[0]! + cl.sheet.aspect * Math.max(1, cl.tall.sheet) * Math.SQRT1_2 * silkMost[AGES - 1]! + fb.aspect * fb.waveUnits * fb.octaves + cl.rope.aspect * cl.rope.waveUnits + ballMost
    const md = l.medium
    const ownWeight = 0.2126 * cu.own[0]! + 0.7152 * cu.own[1]! + 0.0722 * cu.own[2]!
    const c = fields.chart
    const az = THREE.MathUtils.degToRad(deck.light.azimuthDeg)
    const lk = fields.limb.knots
    const lr = fields.limb.rows
    const glow = new Float32Array(3 * lr * lk[2]!)
    for (let ch = 0; ch < 3; ch++) for (let j = 0; j < lr; j++) for (let i = 0; i < lk[2]!; i++) glow[(ch * lr + j) * lk[2]! + i] = fields.limb.table[j]![i]![ch]!
    const hz = deck.life.haze
    const fl = deck.life.flash
    const pn = place.solved.n
    const east = new THREE.Vector3(pn[2]!, 0, -pn[0]!).normalize()
    const jet = new THREE.Vector2(east.dot(new THREE.Vector3().fromArray(place.solved.e)), east.dot(new THREE.Vector3().fromArray(place.solved.u))).normalize()
    const air = fields.air
    const [as, ad] = air.knots as [number, number]
    const added = new Float32Array(3 * as * ad)
    const through = new Float32Array(3 * as)
    for (let ch = 0; ch < 3; ch++) for (let j = 0; j < as; j++) {
      through[ch * as + j] = air.through[j]![ch]!
      for (let i = 0; i < ad; i++) added[(ch * as + j) * ad + i] = air.added[j]![i]![ch]!
    }
    Object.assign(uniforms, {
      uGuideTexel: { value: new THREE.Vector4(texel[0]!, texel[1]!, texel[2]!, gf.size / gf.pixels[ctx.assets]!) },
      uJoin: { value: new THREE.Vector2().fromArray(l.join) },
      uS: { value: new THREE.Vector3().fromArray(c.origin) }, uEx: { value: new THREE.Vector3().fromArray(c.ex) }, uEy: { value: new THREE.Vector3().fromArray(c.ey) }, uEn: { value: new THREE.Vector3().fromArray(c.en) },
      uRadius: { value: c.radius },
      uHeightRange: { value: new THREE.Vector2(fields.heightRange[0]!, fields.heightRange[1]! - fields.heightRange[0]!) },
      uHeightTexel: { value: texel[0]! },
      uShell: { value: new THREE.Vector2().fromArray(l.shell) },
      uDepth: { value: new THREE.Vector3(place.scene.depth[0], place.scene.depth[1], l.shell[1]! - l.shell[0]!) },
      uMarch: { value: new THREE.Vector3().fromArray(l.march) },
      uRefine: { value: l.refine },
      uPixel: { value: 0.001 },
      uCloud: { value: new THREE.Vector4(cl.waveUnits, cl.leastFeet, cl.fall, cl.lifeSeconds) },
      uCloudCell: { value: new THREE.Vector4(1 / (cl.cell.reach * cl.cell.reach), 0.5 - 0.5 * cl.cell.jitter, cl.cell.jitter, cl.fade) },
      uCloudShift: { value: new THREE.Vector4(cl.octaveShift[0]!, cl.octaveShift[1]!, cl.ageShift[0]!, cl.ageShift[1]!) },
      uCloudTurn: { value: new THREE.Vector2(cl.octaveTurn, cl.ageTurn) },
      uCloudTop: { value: new THREE.Vector3().fromArray(cl.top) },
      uCloudDeep: { value: new THREE.Vector3().fromArray(cl.deep) },
      uCloudSat: { value: new THREE.Vector2(cl.saturate, cl.pale) },
      uCloudWave: { value: waves },
      uCloudRise: { value: cl.ages.slice(0, AGES).map((a) => a * cl.rise) },
      uCloudGeo: { value: new THREE.Vector4(Math.max(cu.waveUnits, fb.waveUnits, ...cl.silk.waveUnits), 0, most, 0) },
      uCloudMarch: { value: cl.marchOctaves.slice(0, AGES) },
      uCloudCap: { value: cl.capUnits.slice(0, AGES) },
      uCloudEdge: { value: cl.dome.profile.slice(0, AGES) },
      uCloudTint: { value: cl.tint.slice(0, AGES) },
      uCloudCalm: { value: new THREE.Vector3().fromArray(cl.calm) },
      uSilkWave: { value: cl.silk.waveUnits.slice(0, AGES) },
      uSilk: { value: new THREE.Vector4(cl.silk.aspect, cl.silk.gain, cl.silk.octaves, cl.silk.crease) },
      uCloudSoft: { value: new THREE.Vector2(cl.soft.units, cl.soft.share) },
      uSilkFall: { value: cl.silk.fall },
      uSilkMost: { value: silkMost },
      uWarp: { value: new THREE.Vector4(cl.warp.units[0]!, cl.warp.reach[0]!, cl.warp.units[1]!, cl.warp.reach[1]!) },
      uWarpOld: { value: new THREE.Vector4(cl.warp.oldUnits[0]!, cl.warp.oldReach[0]!, cl.warp.oldUnits[1]!, cl.warp.oldReach[1]!) },
      uFibre: { value: new THREE.Vector4(fb.waveUnits, 1 / fb.long, fb.octaves, 0) },
      uFibreLook: { value: new THREE.Vector4(fb.aspect, fb.tint, cl.warp.guard, 0) },
      uCumPatch: { value: new THREE.Vector4(cu.patch.share, cu.patch.units, cu.pale, cu.paleUnits) },
      uCumCover: { value: new THREE.Vector4(cu.cover[0]!, cu.cover[1]!, cu.soft, cu.rootUnits) },
      uMedium: { value: new THREE.Vector4(md.skinUnits, 1 / md.freeUnits, md.samples, md.stepDepth) },
      uSkinTop: { value: md.skinTopUnits },
      uMediumStep: { value: new THREE.Vector4(md.stepShare[0]! * md.skinUnits, md.stepShare[1]! * md.skinUnits, md.search, md.cut) },
      uMediumSun: { value: new THREE.Vector4(md.sun.firstUnits, md.sun.ratio, md.sun.taps, md.sun.coarse) },
      uMediumWide: { value: new THREE.Vector2(Math.sqrt(md.sun.ratio) - 1 / Math.sqrt(md.sun.ratio), 1 / Math.sqrt(md.sun.ratio)) },
      uOrders: { value: new THREE.Vector4(md.orders.depth, md.orders.gain, md.orders.narrow, md.orders.forward) },
      uLean: { value: new THREE.Vector4(md.lean.first, md.lean.most, md.lean.leastSine, md.lean.later) },
      uOrder: { value: new THREE.Vector4(cl.order.drawn[0]!, cl.order.drawn[1]!, cl.order.billows, cl.order.ridges) },
      uLife: { value: new THREE.Vector3(2 * Math.PI / cl.life.billowSeconds, 2 * Math.PI / cl.life.ridgeSeconds, 2 * Math.PI / cl.life.curdSeconds) },
      uSheet: { value: new THREE.Vector4(cl.sheet.aspect, cl.sheet.crest, cu.crest, cu.calm) },
      uSheetLook: { value: new THREE.Vector2(cl.sheet.tintFall, cl.sheet.tintLeast) },
      uShade: { value: new THREE.Vector2(cl.shade.first, cl.shade.full) },
      uTall: { value: new THREE.Vector4(cl.tall.range[0]!, cl.tall.range[1]!, cl.tall.sheet, cl.tall.silk) },
      uCumField: { value: new THREE.Vector2(cu.field[0]!, cu.field[1]!) },
      uThread: { value: new THREE.Vector4(th.thin, th.mean, th.wide, th.octaves) },
      uThreadLook: { value: new THREE.Vector4(th.tint, th.lane, th.waveUnits, th.mostUnits) },
      uCurl: { value: new THREE.Vector4(cl.curl.units, cl.curl.ratio, cl.curl.levels, cl.curl.winding) },
      uCurlLook: { value: new THREE.Vector4(cl.curl.radius, cl.curl.jitter, cl.curl.guard, cl.curl.least) },
      uRope: { value: new THREE.Vector4(cl.rope.waveUnits, cl.rope.octaves, cl.rope.aspect, cl.rope.tint) },
      uRopeLook: { value: new THREE.Vector4(cl.rope.fall, cl.rope.mean, ropeMost, cl.rope.rimTint) },
      uRopeFront: { value: new THREE.Vector2(cl.rope.front, cl.rope.frontFeet) },
      uCumOwn: { value: new THREE.Vector4(cu.own[0]! / ownWeight, cu.own[1]! / ownWeight, cu.own[2]! / ownWeight, cu.ownShare) },
      uCumLift: { value: new THREE.Vector4(cu.lift, cu.least, cu.most, cu.drawn) },
      uCumPack: { value: new THREE.Vector3(cu.pack.share, cu.pack.lane[0]!, cu.pack.lane[1]!) },
      uCell: { value: new THREE.Vector4(cl.cells.jitter, cl.cells.radius, cl.cells.least, cl.cells.breath) },
      uCellLook: { value: new THREE.Vector4(cl.cells.blend, cl.cells.power, cl.cells.ride, cl.cells.mean) },
      uCellFirst: { value: cl.cells.first },
      uCellPatch: { value: new THREE.Vector3(cl.cells.patch.range[0]!, cl.cells.patch.range[1]!, cl.cells.patch.units) },
      uCellOwn: { value: new THREE.Vector2(cl.cells.patch.least, cl.cells.ownGain) },
      uCellDrive: { value: new THREE.Vector2(cl.cells.patch.unrest, cl.cells.patch.ridge) },
      uCellCover: { value: new THREE.Vector4(cl.cells.cover.sparse, cl.cells.cover.dense, cl.cells.patch.share, cl.cells.cover.soft) },
      uCellEye: { value: new THREE.Vector2(cl.cells.eye[0]!, cl.cells.eye[1]!) },
      uOrderTint: { value: md.orders.tint },
      uStride: { value: new THREE.Vector3(cu.waveUnits * Math.min(1, cu.squash) * cu.stride, far * cu.waveUnits * Math.min(1, cu.squash), cu.stride) },
      uPass: { value: new THREE.Vector4(l.sun.pass.share, 1 / l.sun.pass.units, l.sun.pass.cut * l.sun.pass.units, l.sun.pass.coarse * l.sun.shadow.soft) },
      uCloudRough: { value: new THREE.Vector4(cl.rough.range[0]!, cl.rough.range[1]!, cl.rough.least, cl.rough.soft) },
      uCloudObey: { value: cl.rough.obey.slice(0, AGES) },
      uShadow: { value: new THREE.Vector4(l.sun.shadow.startFeet, l.sun.shadow.soft, l.sun.shadow.closing, l.sun.shadow.steps) },
      uFill: { value: new THREE.Vector4(l.sun.fill[0]!, l.sun.fill[1]!, l.sun.fill[2]!, l.sun.open[0]!) },
      uFillOpen: { value: l.sun.open[1]! },
      uGas: { value: new THREE.Vector4(l.gas.levelUnits, l.gas.sky, l.gas.leastSine, 0) },
      uGasDepth: { value: new THREE.Vector3(l.gas.perUnit[0]!, l.gas.perUnit[1]!, l.gas.perUnit[2]!) },
      uSky: { value: new THREE.Vector4(l.sun.sky.dirs, l.sun.sky.rings, 0, l.sun.sky.phase) },
      uSkyRing: { value: new THREE.Vector3(l.sun.sky.firstUnits, l.sun.sky.ratio, l.sun.sky.coarse) },
      uBounce: { value: l.sun.bounce },
      uThrough: { value: l.sun.shadow.through },
      uCloudTaps: { value: cl.taps },
      uFoot: { value: new THREE.Vector3().fromArray(l.foot) },
      uSunAz: { value: new THREE.Vector2(Math.cos(az), Math.sin(az)) },
      uLimb: { value: ctx.floatTexture(glow, lk[2]!, 3 * lr) },
      uLimbKnots: { value: new THREE.Vector4(lk[0]! - 0.5 * lk[1]!, 1 / (lk[2]! * lk[1]!), (lr - 1) / (3 * lr), 0.5 / (3 * lr)) },
      uLimbShape: { value: new THREE.Vector4(1 / fields.limb.top, 0.5 / lk[2]!, fields.limb.cover[0]!, fields.limb.cover[1]!) },
      uAir: { value: ctx.floatTexture(added, ad, 3 * as) },
      uAirThrough: { value: ctx.floatTexture(through, 1, 3 * as) },
      uAirKnots: { value: new THREE.Vector4(air.sinRange[0]!, 1 / Math.log(air.sinRange[1]! / air.sinRange[0]!), air.sinRange[1]!, (ad - 1) / (ad * Math.PI)) },
      uAirTurn: { value: new THREE.Vector2((as - 1) / (3 * as), 0.5 / (3 * as)) },
      uAirLift: { value: new THREE.Vector2().fromArray(place.scene.air) },
      uAboveGain: { value: deck.above.gain.map((v) => new THREE.Vector3().fromArray(v)) },
      uAboveAir: { value: deck.above.air.map((v) => new THREE.Vector3().fromArray(v)) },
      uAboveMix: { value: new THREE.Vector2(deck.above.even, deck.above.floor) },
      uSunCurve: { value: curve.curve.map((c) => new THREE.Vector3(c[0]! / place.solved.light[0]!, c[1]! / place.solved.light[1]!, c[2]! / place.solved.light[2]!)) },
      uSunChart: { value: new THREE.Vector3().fromArray(place.solved.sun) },
      uFlow: { value: new THREE.Vector4(deck.life.storm.centre[0]!, deck.life.storm.centre[1]!, 1 / fw.scaleUnits, speed) },
      uFlowJet: { value: new THREE.Vector2(fw.jets.share * speed, 2 * Math.PI / fw.jets.acrossUnits) },
      uFlowPart: { value: new THREE.Vector4(fw.jets.partUnits[0]!, 1 / (fw.jets.partUnits[1]! - fw.jets.partUnits[0]!), fw.fadeUnits[0]!, fw.fadeUnits[1]!) },
      uEddy: { value: fw.eddies.map((e) => new THREE.Vector4(e.centre[0]!, e.centre[1]!, 1 / e.scaleUnits, e.share * speed)) },
      uEddyFade: { value: fw.eddies.map((e) => new THREE.Vector2(e.fadeUnits[0]!, e.fadeUnits[1]!)) },
      uFlowTime: { value: 0 },
      uWound: { value: ctx.floatTexture(wound, wc, 3 * AGES * wr, true) },
      uWoundDrawn: { value: woundJson.ranges.map((r) => r[4]!) },
      uWoundLong: { value: fw.wound.longAtBirth.slice(0, AGES).map((v) => 1 / v) },
      uWoundCode: { value: woundJson.ranges.map((r) => new THREE.Vector4(r[0]!, r[1]! - r[0]!, r[2]!, r[3]! - r[2]!)) },
      uWoundAge: { value: wd.turnDeg.map((t) => THREE.MathUtils.degToRad(t) * fw.jets.share * fw.scaleUnits / (1.5 * 3 ** -0.25)) },
      uWoundShape: { value: new THREE.Vector4(1 / wd.reachUnits, 0.5 / wr, wd.closedUnits[0]!, wd.closedUnits[1]!) },
      uJet: { value: new THREE.Vector4(jet.x, jet.y, -jet.y, jet.x) },
      uHazeBand: { value: hz.bands.map((b) => new THREE.Vector4(b.heightUnits, b.side, 0, b.depth)) },
      uHazeSeed: { value: hz.bands.map((b) => new THREE.Vector4(b.seed[0]!, b.seed[1]!, b.shadowDepth, 20 * hz.thick.spread * hz.thick.spread)) },
      uHazeShape: { value: new THREE.Vector4(hz.bankUnits[0]!, hz.bankUnits[1]!, hz.cover[0]!, hz.cover[1]!) },
      uHazeFibre: { value: new THREE.Vector4(hz.fibreUnits[0]!, hz.fibreUnits[1]!, hz.fibreOctaves, hz.fibreShare) },
      uHazeFine: { value: new THREE.Vector4(hz.warp, 0, 0, hz.fibreWarp) },
      uHazeWarp: { value: new THREE.Vector4().fromArray(hz.warpSeed) },
      uHazeOctave: { value: new THREE.Vector4(hz.octaveShift[0]!, hz.octaveShift[1]!, hz.lacunarity, hz.octaveGain) },
      uHazeFade: { value: new THREE.Vector3(hz.octaveFade[0]!, hz.octaveFade[1]!, hz.softUnits) },
      uHazeForward: { value: new THREE.Vector2(hz.forward[0]!, hz.forward[1]!) },
      uFlash: { value: fl.sites.map((f) => new THREE.Vector4(f.at[0]!, f.at[1]!, 1 / (f.radiusUnits * f.radiusUnits), 0)) },
      uFlashLook: { value: new THREE.Vector4(fl.cold[0]!, fl.cold[1]!, fl.bright[0]!, fl.bright[1]!) },
      uFlashShare: { value: fl.surround },
      uFlashGlow: { value: new THREE.Vector3().fromArray(fl.glow) },
      uFlashSteady: { value: new THREE.Vector2(fl.steady.gain, fl.steady.tight) },
      uFlashDeep: { value: new THREE.Vector2(fl.steady.deepUnits[0]!, fl.steady.deepUnits[1]!) },
      uFlashHalo: { value: new THREE.Vector2(fl.steady.halo[0]!, fl.steady.halo[1]!) },
      uFlashCore: { value: new THREE.Vector3(fl.core.tight, fl.core.spill, fl.core.floor) },
      uHazeSpan: { value: hz.bands.map((b) => new THREE.Vector4(b.edgeUnits[0]!, b.edgeUnits[1]!, b.reachUnits[0]!, b.reachUnits[1]!)) },
      uHazeLight: { value: new THREE.Vector4(Math.hypot(place.solved.sun[0]!, place.solved.sun[1]!) / place.solved.sun[2]!, hz.thick.units, hz.minCosine, Math.log2(hz.lightBlurUnits / texel[1]!)) },
      uHazeLit: { value: new THREE.Vector3(hz.lit[0]!, hz.lit[1]!, 1) },
      uHazeGlow: { value: new THREE.Vector3().fromArray(hz.glow) },
      uHazeShade: { value: new THREE.Vector3().fromArray(hz.shadowTint) },
      uBaked: { value: null }, uBakeAt: { value: new THREE.Vector4(0, 0, 1, 1) }, uBakeTurn: { value: new THREE.Vector4(0, 1, 0, 1) }, uBakeSize: { value: new THREE.Vector4(1, 1, 0, 0) }, uBakeLeast: { value: new THREE.Vector2(1, 1) },
      uOwn: { value: 0 }, uEye: { value: new THREE.Vector3() }, uAxes: { value: new THREE.Matrix3() }, uLayer: { value: new THREE.Vector3(1, 1, 0) }, uRim: { value: new THREE.Vector3(0, 1, 1) }, uToChart: { value: new THREE.Matrix3() },
      uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uDiag: diagUniform, uGrad: gradUniform, uFrame: frameUniform,
    })
    return new CloudDeck(uniforms)
  }

  update(gain: number, vignette: number, view: RenderView): void {
    const u = this.material.uniforms
    u.uGain!.value = gain
    u.uVignette!.value = vignette
    u.uAspect!.value = view.format.width / view.format.height
    u.uPixel!.value = 2 * Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2) / view.format.height
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
    this.baker.dispose()
    this.held.dispose()
  }
}
