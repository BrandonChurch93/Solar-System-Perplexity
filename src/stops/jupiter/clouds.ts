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
float rough(vec2 g) {
  vec2 a = abs(g - uNear.xy) * (2.0 * uNear.z);
  vec2 b = abs(g - uMid.xy) * (2.0 * uMid.z);
  float wn = 1.0 - smoothstep(uJoin.x, uJoin.y, max(a.x, a.y));
  float wm = (1.0 - wn) * (1.0 - smoothstep(uJoin.x, uJoin.y, max(b.x, b.y)));
  float r = 0.0;
  for (int k = 0; k < (wn > 0.0 ? 1 : 0); k++) r += wn * textureLod(uRoughNear, (g - uNear.xy) * uNear.z + 0.5, 0.0).r;
  for (int k = 0; k < (wm > 0.0 ? 1 : 0); k++) r += wm * textureLod(uRoughMid, (g - uMid.xy) * uMid.z + 0.5, 0.0).r;
  return mix(uCloudRough.z, 1.0, smoothstep(uCloudRough.x, uCloudRough.y, r));
}
`

const DETAIL_GLSL = /* glsl */ `
uniform vec4 uCloud;
uniform vec4 uCloudLook;
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
uniform vec3 uCloudDome;
uniform float uCloudMarch[${AGES}];
uniform float uCloudCap[${AGES}];
uniform float uCloudEdge[${AGES}];
uniform float uCloudTint[${AGES}];
vec3 puffs(vec2 q, int seed, float life, float edge) {
  vec2 base = floor(q);
  ivec2 cell = ivec2(base);
  vec2 f = q - base;
  vec3 best = vec3(0.0);
  ivec2 first = ivec2(f.x < 0.5 ? -1 : 0, f.y < 0.5 ? -1 : 0);
  for (int j = first.y; j <= first.y + 1; j++) for (int i = first.x; i <= first.x + 1; i++) {
    ivec2 c = cell + ivec2(i, j);
    uint h = uint(c.x) * 0x9E3779B1u ^ uint(c.y) * 0x85EBCA77u ^ uint(seed) * 0xC2B2AE3Du;
    h ^= h >> 15;
    h *= 0x2C1B3C6Du;
    h ^= h >> 12;
    h *= 0x297A2D39u;
    h ^= h >> 15;
    vec2 r = vec2(float(i), float(j)) + uCloudCell.y + uCloudCell.z * vec2(float(h & 0xFFFFu), float(h >> 16)) * (1.0 / 65536.0) - f;
    float d = 1.0 - dot(r, r) * uCloudCell.x;
    for (int m = 0; m < (d > 0.0 ? 1 : 0); m++) {
      uint k = h * 0x9E3779B1u;
      k ^= k >> 16;
      float p = fract(uFlowTime / (life * (1.0 + float(k & 0xFFFFu) * (1.0 / 65536.0))) + float(k >> 16) * (1.0 / 65536.0));
      k *= 0x85EBCA77u;
      k ^= k >> 13;
      float up = 16.0 * p * p * (1.0 - p) * (1.0 - p) * mix(uCloudDome.x, 1.0, float(k & 0xFFFFu) * (1.0 / 65536.0));
      float t = min(d / edge, 1.0);
      float v = up * t * t * (3.0 - 2.0 * t);
      for (int n = 0; n < (v > best.z ? 1 : 0); n++) best = vec3(r * (12.0 * uCloudCell.x * up * t * (1.0 - t) / edge), v);
    }
  }
  return best;
}
float bumpAt(vec3 y, float least, int age, int most) {
  float sum = 0.0;
  float gate = 1.0;
  for (int k = 0; k < most; k++) {
    float wave = uCloudWave[age] * exp2(-float(k));
    float use = smoothstep(least, uCloudCell.w * least, wave) * exp2(-float(k) * uCloud.z);
    if (use <= 0.0) break;
    float a = uCloudTurn.x * float(k) + uCloudTurn.y * float(age);
    mat2 turn = mat2(cos(a), sin(a), -sin(a), cos(a));
    float b = puffs((turn * y.xy) / wave + uCloudShift.xy * float(k) + uCloudShift.zw * float(age), k + ${OCTAVES} * age, uCloud.w * (1.0 + wave * uCloudLook.z), uCloudEdge[age]).z;
    sum += use * gate * min(uCloudRise[age] * wave * y.z, uCloudCap[age]) * b;
    gate *= mix(uCloudDome.y, 1.0, smoothstep(0.0, uCloudDome.z, b));
  }
  return sum;
}
vec4 cloudAt(vec2 y, float drawn, float least, int age, int from) {
  int k1 = min(int(ceil(log2(uCloudWave[age] / least))), ${OCTAVES - 1});
  vec4 sum = vec4(0.0);
  float gate = 1.0;
  for (int k = 0; k <= k1; k++) {
    float wave = uCloudWave[age] * exp2(-float(k));
    float use = smoothstep(least, uCloudCell.w * least, wave) * exp2(-float(k) * uCloud.z);
    float a = uCloudTurn.x * float(k) + uCloudTurn.y * float(age);
    mat2 turn = mat2(cos(a), sin(a), -sin(a), cos(a));
    vec3 b = puffs((turn * y) / wave + uCloudShift.xy * float(k) + uCloudShift.zw * float(age), k + ${OCTAVES} * age, uCloud.w * (1.0 + wave * uCloudLook.z), uCloudEdge[age]);
    sum += use * gate * vec4(k < from ? vec2(0.0) : (min(uCloudRise[age] * wave * drawn, uCloudCap[age]) / wave) * (b.xy * turn), b.z - uCloudLook.w, use);
    gate *= mix(uCloudDome.y, 1.0, smoothstep(0.0, uCloudDome.z, b.z));
  }
  return sum;
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

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uHeightNear;
uniform sampler2D uHeightMid;
uniform sampler2D uRoughNear;
uniform sampler2D uRoughMid;
uniform vec3 uCloudRough;
uniform float uCloudObey[${AGES}];
uniform sampler2D uGuideNear;
uniform sampler2D uGuideMid;
uniform sampler2D uPlateFar;
uniform vec2 uJoin;
uniform vec4 uNear;
uniform vec4 uMid;
uniform vec4 uFar;
uniform vec3 uGuideTexel;
uniform vec2 uHeightRange;
uniform float uHeightTexel;
uniform float uRadius;
uniform vec2 uShell;
uniform vec4 uMarch;
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
uniform float uThrough;
uniform vec4 uFill;
uniform float uFillOpen;
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
uniform vec4 uHazeSpan[2];
uniform vec4 uHazeLight;
uniform vec3 uHazeLit;
uniform vec3 uHazeGlow;
uniform vec3 uHazeShade;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
in vec3 vDir;
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
  float wn = 1.0 - smoothstep(uJoin.x, uJoin.y, max(a.x, a.y));
  float wm = (1.0 - wn) * (1.0 - smoothstep(uJoin.x, uJoin.y, max(b.x, b.y)));
  float wr = 1.0 - wn - wm;
  vec3 c = vec3(0.0);
  for (int k = 0; k < (wn > 0.0 ? 1 : 0); k++) c += wn * unfilm(textureGrad(uGuideNear, (g - uNear.xy) * uNear.z + 0.5, dx * uNear.z, dy * uNear.z).rgb);
  for (int k = 0; k < (wm > 0.0 ? 1 : 0); k++) c += wm * unfilm(textureGrad(uGuideMid, (g - uMid.xy) * uMid.z + 0.5, dx * uMid.z, dy * uMid.z).rgb);
  for (int k = 0; k < (wr > 0.0 ? 1 : 0); k++) c += wr * unfilm(textureGrad(uPlateFar, (g - uFar.xy) * uFar.z + 0.5, dx * uFar.z, dy * uFar.z).rgb);
  size = exp2(wn * log2(uGuideTexel.x) + wm * log2(uGuideTexel.y) + wr * log2(uGuideTexel.z));
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
vec2 flashAt(vec2 g, vec3 c) {
  float s = 0.0;
  float t = 0.0;
  for (int i = 0; i < ${FLASHES}; i++) {
    vec2 d = g - uFlash[i].xy;
    float q = dot(d, d) * uFlash[i].z;
    s += uFlash[i].w * exp(-q);
    t += uFlash[i].w * exp(-q * uFlashCore.x);
  }
  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
  return vec2(s * smoothstep(uFlashLook.x, uFlashLook.y, (c.b - c.r) / max(c.b + c.r, uFlashCore.z)) * mix(uFlashShare, 1.0, smoothstep(uFlashLook.z, uFlashLook.w, lum)), (t + uFlashCore.y * s) * sqrt(max(lum, 0.0)));
}
vec4 sunAt(vec2 g) {
  vec3 low = unfilm(textureLod(uGuideMid, (g - uMid.xy) * uMid.z + 0.5, uHazeLight.w).rgb);
  return vec4(low, smoothstep(uHazeLit.x, uHazeLit.y, (low.r - low.b) / max(low.r + low.b, 1e-4)));
}
${DETAIL_GLSL}
float bumpsOn(vec2 g, float low, float least) {
  float h = 0.0;
  float wild = rough(g);
  for (int j = 0; j < ${AGES}; j++) for (int i = 0; i < (least < uCloudWave[j] && uCloudMarch[j] > 0.0 ? 1 : 0); i++) {
    h += mix(1.0, wild, uCloudObey[j]) * bumpAt(woundAt(g, j), least, j, int(uCloudMarch[j]));
  }
  return h * mix(uCloudCalm.x, 1.0, smoothstep(uCloudCalm.y, uCloudCalm.z, low));
}
vec3 sunLit(float ndl) {
  float knotAt = clamp(sign(ndl) * sqrt(abs(ndl)) * 0.5 + 0.5, 0.0, 1.0) * ${CURVE_KNOTS - 1}.0;
  int knotLow = int(min(floor(knotAt), ${CURVE_KNOTS - 2}.0));
  return mix(uSunCurve[knotLow], uSunCurve[knotLow + 1], knotAt - float(knotLow));
}
float shadowAt(vec3 from, float least, float start) {
  float lit = 1.0;
  float tau = start;
  for (int i = 0; i < int(uShadow.w); i++) {
    vec3 p = from + uSunChart * tau;
    float gap = above(p);
    if (gap > uShell.y) break;
    vec2 at = carried(p.xy);
    float low = stored(at);
    gap -= low;
    float most = least < uCloudGeo.x ? uCloudGeo.z : 0.0;
    for (int k = 0; k < (most > 0.0 && gap - most < uShadow.y * tau ? 1 : 0); k++) {
      gap -= bumpsOn(at, low, least);
      most = 0.0;
    }
    gap -= most;
    lit = min(lit, gap / (uShadow.y * tau));
    if (lit <= -uThrough) break;
    tau += max(abs(gap) / uShadow.z, start);
  }
  lit = clamp((lit + uThrough) / (1.0 + uThrough), 0.0, 1.0);
  return lit * lit * (3.0 - 2.0 * lit);
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
  for (int i = 0; i < (inside ? int(uMarch.w) : 0); i++) {
    vec3 p = E + D * t;
    vec2 at = carried(p.xy);
    float low = stored(at);
    float least = uCloud.y * t * pix;
    gap = above(p) - low;
    float most = least < uCloudGeo.x ? uCloudGeo.z : 0.0;
    for (int k = 0; k < (most > 0.0 && gap - most < uMarch.z * t * pix ? 1 : 0); k++) {
      gap -= bumpsOn(at, low, least);
      most = 0.0;
    }
    gap -= most;
    steps = i;
    if (gap < uMarch.z * t * pix) { hit = true; break; }
    if (t > t1) break;
    tPrev = t;
    gapPrev = gap;
    float fall = max(-(D.z + (D.x * p.x + D.y * p.y) / uRadius), 0.0);
    t += max(gap / (fall + uMarch.x), uMarch.y * t * pix);
  }
  for (int i = 0; i < (hit ? 3 : 0); i++) {
    float tm = gapPrev > 0.0 && gap < gapPrev ? tPrev + (t - tPrev) * gapPrev / (gapPrev - gap) : 0.5 * (t + tPrev);
    vec3 p = E + D * tm;
    vec2 at = carried(p.xy);
    float low = stored(at);
    float gm = above(p) - low - bumpsOn(at, low, uCloud.y * tm * pix);
    if (gm > 0.0) { tPrev = tm; gapPrev = gm; } else { t = tm; gap = gm; }
  }
  vec2 q = vNdc * 0.5 * vec2(uAspect, 1.0);
  float vig = 1.0 / mix(1.0, 1.0 / pow(1.0 + dot(q, q) * 0.9, 2.0), uVignette);
  vec3 col = vec3(0.0);
  float alpha = 0.0;
  float texels = 0.0;
  vec3 tint = vec3(float(steps) / uMarch.w, 0.0, 0.0);
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
    float fine = uCloud.y * foot;
    mat2 drift = mat2(gE - gW, gN - gS) * (0.5 / hs);
    float wide = max(foot, uHeightTexel);
    vec2 slope = transpose(drift) * vec2(stored(g + vec2(wide, 0.0)) - stored(g - vec2(wide, 0.0)), stored(g + vec2(0.0, wide)) - stored(g - vec2(0.0, wide))) / (2.0 * wide);
    vec2 steep = vec2(stored(gE) + bumpsOn(gE, stored(gE), fine) - stored(gW) - bumpsOn(gW, stored(gW), fine), stored(gN) + bumpsOn(gN, stored(gN), fine) - stored(gS) - bumpsOn(gS, stored(gS), fine)) / (2.0 * hs);
    float calm = mix(uCloudCalm.x, 1.0, smoothstep(uCloudCalm.y, uCloudCalm.z, low));
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
    float tall = 0.0;
    float on = 0.0;
    float wild = rough(g);
    for (int j = 0; j < ${AGES}; j++) {
      vec3 wound = woundAt(g, j);
      vec2 y = wound.xy;
      mat2 strain = mat2(woundAt(g + vec2(hs, 0.0), j).xy - y, woundAt(g + vec2(0.0, hs), j).xy - y) * drift * (1.0 / hs);
      vec2 wx = strain * dx;
      vec2 wy = strain * dy;
      float m00 = wx.x * wx.x + wy.x * wy.x;
      float m11 = wx.y * wx.y + wy.y * wy.y;
      float m01 = wx.x * wx.y + wy.x * wy.y;
      float mean = 0.5 * (m00 + m11);
      float diff = sqrt(0.25 * (m00 - m11) * (m00 - m11) + m01 * m01);
      float wide = sqrt(mean + diff);
      float narrow = sqrt(max(mean - diff, 1e-14));
      vec2 lie = normalize(m00 > m11 ? vec2(mean + diff - m11, m01) : vec2(m01, mean + diff - m00 + 1e-20));
      float taps = clamp(ceil(wide / (uFoot.y * narrow)), 1.0, uCloudTaps);
      float least = uCloud.y * max(narrow, wide / taps);
      vec4 sum = vec4(0.0);
      for (int i = 0; i < (least < uCloudWave[j] ? int(taps) : 0); i++) sum += cloudAt(y + lie * (wide * ((float(i) + 0.5) / taps - 0.5)), wound.z, least, j, int(uCloudMarch[j]));
      sum /= taps;
      float obey = mix(1.0, wild, uCloudObey[j]);
      tall += obey * uCloudTint[j] * sum.z;
      steep += obey * calm * (transpose(strain) * sum.xy);
      on = max(on, smoothstep(least, uCloudCell.w * least, uCloudWave[j]));
    }
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
    vec3 lit = sunLit(dot(normalize(vec3(there.xy / uRadius - steep, 1.0)), uSunChart)) * shadowAt(there, fine, uShadow.x * hs);
    vec3 hue = max(guide / max(dot(guide, vec3(0.2126, 0.7152, 0.0722)), 1e-5), vec3(1e-3));
    vec3 ground = guide * exp(uCloudTop * max(tall, 0.0) - uCloudDeep * max(-tall, 0.0)) * pow(hue, vec3(-min(uCloudSat.x * tall, uCloudSat.y))) * (lit + uFill.rgb * clamp(uFill.w + uFillOpen * tall, 0.0, 1.0));
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
    vec2 flash = flashAt(g, col);
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

type Level = { centre: number[]; size: number; pixels: Record<string, number> }
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
      uniforms['u' + key] = { value: new THREE.Vector4(m.centre[0], m.centre[1], 1 / m.size, m.size / m.pixels[ctx.assets]!) }
      texel.push(gl.size / gl.pixels[ctx.assets]!)
    }
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
    const waves = cl.ageWaves.slice(0, AGES).map((a) => a * cl.waveUnits)
    let most = 0
    for (let j = 0; j < AGES; j++) for (let k = 0; k < cl.marchOctaves[j]!; k++) most += Math.min(cl.ages[j]! * cl.rise * waves[j]! * 2 ** -k, cl.capUnits[j]!) * 2 ** (-k * cl.fall)
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
      uGuideTexel: { value: new THREE.Vector3().fromArray(texel) },
      uJoin: { value: new THREE.Vector2().fromArray(l.join) },
      uS: { value: new THREE.Vector3().fromArray(c.origin) }, uEx: { value: new THREE.Vector3().fromArray(c.ex) }, uEy: { value: new THREE.Vector3().fromArray(c.ey) }, uEn: { value: new THREE.Vector3().fromArray(c.en) },
      uRadius: { value: c.radius },
      uHeightRange: { value: new THREE.Vector2(fields.heightRange[0]!, fields.heightRange[1]! - fields.heightRange[0]!) },
      uHeightTexel: { value: texel[0]! },
      uShell: { value: new THREE.Vector2().fromArray(l.shell) },
      uDepth: { value: new THREE.Vector3(place.scene.depth[0], place.scene.depth[1], l.shell[1]! - l.shell[0]!) },
      uMarch: { value: new THREE.Vector4().fromArray(l.march) },
      uPixel: { value: 0.001 },
      uCloud: { value: new THREE.Vector4(cl.waveUnits, cl.leastFeet, cl.fall, cl.lifeSeconds) },
      uCloudLook: { value: new THREE.Vector4(0, 0, 1 / cl.lifeWaveUnits, cl.field.mean) },
      uCloudCell: { value: new THREE.Vector4(1 / (cl.cell.reach * cl.cell.reach), 0.5 - 0.5 * cl.cell.jitter, cl.cell.jitter, cl.fade) },
      uCloudShift: { value: new THREE.Vector4(cl.octaveShift[0]!, cl.octaveShift[1]!, cl.ageShift[0]!, cl.ageShift[1]!) },
      uCloudTurn: { value: new THREE.Vector2(cl.octaveTurn, cl.ageTurn) },
      uCloudTop: { value: new THREE.Vector3().fromArray(cl.top) },
      uCloudDeep: { value: new THREE.Vector3().fromArray(cl.deep) },
      uCloudSat: { value: new THREE.Vector2(cl.saturate, cl.pale) },
      uCloudWave: { value: waves },
      uCloudRise: { value: cl.ages.slice(0, AGES).map((a) => a * cl.rise) },
      uCloudGeo: { value: new THREE.Vector4(Math.max(...waves), 0, most, 0) },
      uCloudMarch: { value: cl.marchOctaves.slice(0, AGES) },
      uCloudCap: { value: cl.capUnits.slice(0, AGES) },
      uCloudDome: { value: new THREE.Vector3(cl.dome.least, cl.dome.bare, cl.dome.edge) },
      uCloudEdge: { value: cl.dome.profile.slice(0, AGES) },
      uCloudTint: { value: cl.tint.slice(0, AGES) },
      uCloudCalm: { value: new THREE.Vector3().fromArray(cl.calm) },
      uCloudRough: { value: new THREE.Vector3(cl.rough.range[0]!, cl.rough.range[1]!, cl.rough.least) },
      uCloudObey: { value: cl.rough.obey.slice(0, AGES) },
      uShadow: { value: new THREE.Vector4(l.sun.shadow.startFeet, l.sun.shadow.soft, l.sun.shadow.closing, l.sun.shadow.steps) },
      uFill: { value: new THREE.Vector4(l.sun.fill[0]!, l.sun.fill[1]!, l.sun.fill[2]!, l.sun.open[0]!) },
      uFillOpen: { value: l.sun.open[1]! },
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
      uFlashCore: { value: new THREE.Vector3(fl.core.tight, fl.core.spill, fl.core.floor) },
      uHazeSpan: { value: hz.bands.map((b) => new THREE.Vector4(b.edgeUnits[0]!, b.edgeUnits[1]!, b.reachUnits[0]!, b.reachUnits[1]!)) },
      uHazeLight: { value: new THREE.Vector4(Math.hypot(place.solved.sun[0]!, place.solved.sun[1]!) / place.solved.sun[2]!, hz.thick.units, hz.minCosine, Math.log2(hz.lightBlurUnits / texel[1]!)) },
      uHazeLit: { value: new THREE.Vector3(hz.lit[0]!, hz.lit[1]!, 1) },
      uHazeGlow: { value: new THREE.Vector3().fromArray(hz.glow) },
      uHazeShade: { value: new THREE.Vector3().fromArray(hz.shadowTint) },
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
  }
}
