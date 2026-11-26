import * as THREE from 'three'
import { config } from '../../config'
import type { RenderView, SetContext } from '../../core/types'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import body from './body.json'
import bodyFields from './body-fields.json'
import { ABOVE_GLSL, DETAIL_GLSL, STORED_GLSL } from './clouds'
import deck from './deck.json'
import fields from './deck-fields.json'
import { frameUniform } from '../../core/frame'
import place from './place.json'

const ABOVE_KNOTS = deck.above.gain.length
const FLASHES = deck.life.flash.sites.length

const EDDIES = deck.life.eddies.length
const SEAMS = deck.life.storm.rings.length

const BODY_GLSL = /* glsl */ `uniform vec4 uTall;
uniform float uTallScale;
uniform vec4 uTallFar;
float tall(vec2 g) {
  float d = length(g - uTall.xy);
  return 1.0 + uTall.w * (uTallFar.x * (1.0 - smoothstep(uTall.z, uTall.z + 1.0, d * uTallScale)) + uTallFar.y * (1.0 - smoothstep(uTallFar.z, uTallFar.z + 1.0, d * uTallFar.w)));
}
${STORED_GLSL.replace('float stored(', 'float deckStored(')}float stored(vec2 g, vec3 w) {
  return deckStored(g, w) * tall(g);
}
`

const FLOW_GLSL = /* glsl */ `
uniform vec4 uEddy[${EDDIES}];
uniform float uEddyTurn[${EDDIES}];
uniform vec3 uSeam[${SEAMS}];
uniform vec4 uShear;
uniform vec4 uShearFade;
vec2 calm(vec2 g, out vec2 cs) {
  cs = vec2(1.0, 0.0);
  vec2 moved = g;
  for (int i = 0; i < (uShearFade.z != 0.0 ? 1 : 0); i++) {
    vec2 o = g - uStorm.xy;
    float across = dot(o, uJet.zw);
    moved -= uJet.xy * (uShearFade.z * smoothstep(uShearFade.x, uShearFade.y, length(o)) * (sin(across * uShear.x + uShear.y) + uShearFade.w * sin(across * uShear.z + uShear.w)));
  }
  vec2 o = moved - uStorm.xy;
  float r2 = dot(o, o);
  for (int i = 0; i < (uStormTurn != 0.0 && r2 < uStorm.w * uStorm.w ? 1 : 0); i++) {
    float r = sqrt(r2);
    float a = -uStormTurn * (1.0 - smoothstep(uStorm.z, uStorm.w, r));
    for (int k = 0; k < ${SEAMS}; k++) a -= uSeam[k].z * (1.0 - smoothstep(uSeam[k].x, uSeam[k].y, r));
    float h = sin(0.5 * a);
    float less = -2.0 * h * h;
    cs = vec2(1.0 + less, sin(a));
    moved += vec2(less * o.x - cs.y * o.y, cs.y * o.x + less * o.y);
  }
  for (int e = 0; e < ${EDDIES}; e++) {
    vec2 oe = moved - uEddy[e].xy;
    float re = dot(oe, oe);
    for (int i = 0; i < (uEddyTurn[e] != 0.0 && re < uEddy[e].w * uEddy[e].w ? 1 : 0); i++) {
      float a = -uEddyTurn[e] * (1.0 - smoothstep(uEddy[e].z, uEddy[e].w, sqrt(re)));
      float h = sin(0.5 * a);
      float less = -2.0 * h * h;
      vec2 turn = vec2(1.0 + less, sin(a));
      moved += vec2(less * oe.x - turn.y * oe.y, turn.y * oe.x + less * oe.y);
      cs = vec2(cs.x * turn.x - cs.y * turn.y, cs.y * turn.x + cs.x * turn.y);
    }
  }
  return moved;
}
`

const LIGHT_GLSL = /* glsl */ `
uniform vec3 uSunNow;
uniform vec3 uSunOwn;
uniform vec4 uLightFill;
uniform vec4 uLightSun;
uniform vec4 uLightMarch;
uniform vec2 uLightBound;
uniform float uLightBase;
float openTo(vec3 p, vec3 sun) {
  float shade = 0.0;
  float s = uLightMarch.x;
  for (int i = 0; i < int(uLightMarch.w); i++) {
    vec3 q = p + sun * s;
    shade = max(shade, (stored(q.xy, levels(q.xy)) - above(q) - uLightMarch.z) / (uLightFill.w * s));
    s *= uLightMarch.y;
  }
  return 1.0 - smoothstep(0.0, 1.0, shade);
}
vec3 litBy(vec3 n, vec3 sun, float open) {
  return uLightFill.rgb + uLightSun.rgb * (open * max((dot(n, sun) + uLightSun.w) / (1.0 + uLightSun.w), 0.0));
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
uniform sampler2D uHeightFore;
uniform sampler2D uHeightNear;
uniform sampler2D uHeightMid;
uniform sampler2D uPlateFore;
uniform sampler2D uPlateNear;
uniform sampler2D uPlateMid;
uniform sampler2D uPlateFar;
uniform sampler2D uView;
uniform sampler2D uImageWide;
uniform sampler2D uImageCore;
uniform sampler2D uImageRange;
uniform vec4 uCore;
uniform vec4 uRangeShape;
uniform vec4 uRangeCode;
uniform vec2 uViewOrigin;
uniform vec4 uViewRange;
uniform vec4 uViewTexel;
uniform vec3 uFitEye;
uniform mat3 uFitAxes;
uniform vec4 uFitWindow;
uniform vec4 uTrust;
uniform vec2 uSteep;
uniform vec4 uStretch;
uniform vec2 uBlend;
uniform vec2 uJoin;
uniform vec4 uFore;
uniform vec4 uForeMap;
uniform vec4 uNear;
uniform vec4 uMid;
uniform vec4 uFar;
uniform vec4 uTexel;
uniform vec2 uHeightRange;
uniform float uRadius;
uniform vec2 uBodyShell;
uniform vec4 uBodyMarch;
uniform vec2 uShell;
uniform vec4 uMarch;
uniform vec2 uTallDeck;
uniform float uPixel;
uniform float uGrad;
uniform float uFrame;
uniform vec4 uDetail;
uniform vec4 uDetailLook;
uniform float uDetailTone;
uniform float uDetailHigh;
uniform vec3 uFoot;
uniform vec2 uSunAz;
uniform sampler2D uLimb;
uniform vec4 uLimbKnots;
uniform vec4 uLimbShape;
uniform sampler2D uAir;
uniform sampler2D uAirThrough;
uniform vec4 uAirKnots;
uniform vec2 uAirTurn;
uniform float uAirLift;
uniform vec3 uAboveGain[${ABOVE_KNOTS}];
uniform vec3 uAboveAir[${ABOVE_KNOTS}];
uniform vec2 uAboveMix;
uniform sampler2D uTone;
uniform vec4 uToneBox;
uniform vec3 uToneLift;
uniform vec4 uCalmBox;
uniform vec2 uToneRim;
uniform vec4 uToneRimNoise;
uniform vec3 uExpose;
uniform vec3 uLayer;
uniform vec4 uStorm;
uniform float uStormTurn;
uniform vec4 uDeep;
uniform vec3 uDeepGlow;
uniform float uDeepFloor;
uniform vec2 uLaid;
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
${DIAG_GLSL}
float hash(ivec2 p) {
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
vec4 seenAt(vec3 p, vec3 D, vec3 n, float foot, vec2 dx, vec2 dy, out vec2 size, out float count, out float wide, out float resolved) {
  vec2 o = p.xy - uViewOrigin;
  float d2 = max(dot(o, o), 1e-12);
  float d = sqrt(d2);
  float lift = 1.0 + d2 / (2.0 * uRadius);
  vec2 uv = vec2((atan(o.x, o.y) - uViewRange.x) * uViewRange.y, (atan(lift, d) - uViewRange.z) * uViewRange.w);
  float fall = (2.0 - lift) / (d2 + lift * lift);
  vec2 turn = vec2(o.y, -o.x) * (uViewRange.y / d2);
  vec2 drop = o * (-fall * uViewRange.w / d);
  vec2 gx = vec2(dot(turn, dx), dot(drop, dx));
  vec2 gy = vec2(dot(turn, dy), dot(drop, dy));
  size = vec2(d * uViewTexel.x, uViewTexel.y / max(fall, 1e-6));
  vec2 tx = gx / (uViewRange.yw * uViewTexel.xy);
  vec2 ty = gy / (uViewRange.yw * uViewTexel.xy);
  count = sqrt(max(dot(tx, tx), dot(ty, ty)));
  vec4 c = textureGrad(uView, uv, gx, gy);
  float len = uViewTexel.z * exp2(uViewTexel.w * (1.0 - c.a));
  vec3 fit = p - uFitEye;
  float range = length(fit);
  fit /= range;
  float turned = length(cross(D, fit)) / foot;
  float level = range / (uFitWindow.x * max(-dot(fit, normalize(p + vec3(0.0, 0.0, uRadius))), uStretch.w));
  float smear = min(len, level) * turned;
  resolved = sqrt(range / uFitWindow.x * len);
  bool inside = uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0 && c.a > 0.004;
  wide = clamp((1.0 + len * turned) / uStretch.x, 1.0, uStretch.z);
  for (int i = 0; i < (inside && wide > 1.0 ? 1 : 0); i++) c.rgb = textureGrad(uView, uv, gx * wide, gy * wide).rgb;
  size *= wide;
  count /= wide;
  vec3 q = uFitAxes * (p - uFitEye);
  float near = 1.0 / max(-q.z, 1e-6);
  vec2 at = uFitWindow.x * q.xy * near;
  float edge = q.z < 0.0 ? smoothstep(uFitWindow.w, uTrust.w, min(uFitWindow.y - abs(at.x), uFitWindow.z - abs(at.y))) : 0.0;
  float toned = smoothstep(uToneLift.x, uToneLift.y, above(vEye));
  for (int i = 0; i < (toned > 0.0 && edge > 0.0 ? 1 : 0); i++) {
    vec2 inner = atan(uFitWindow.yz / uFitWindow.x) - atan(abs(at) / uFitWindow.x);
    float moved = (vnoise(p.xy / uToneRimNoise.x) - 0.5) * uToneRimNoise.y + (vnoise(p.xy / uToneRimNoise.z + 37.0) - 0.5) * uToneRimNoise.w;
    edge *= mix(1.0, smoothstep(uToneRim.x, uToneRim.y, min(inner.x, inner.y) + moved), toned);
  }
  for (int i = 0; i < (inside && edge > 0.0 ? 1 : 0); i++) {
    vec2 spot = at + vec2(0.5, -0.5);
    vec2 cell = (uFitWindow.yz + spot) / uRangeShape.x - 0.5;
    ivec2 low = ivec2(floor(cell));
    ivec2 most = ivec2(uRangeShape.yz);
    float far = max(max(texelFetch(uImageRange, clamp(low, ivec2(0), most), 0).r, texelFetch(uImageRange, clamp(low + ivec2(1, 0), ivec2(0), most), 0).r), max(texelFetch(uImageRange, clamp(low + ivec2(0, 1), ivec2(0), most), 0).r, texelFetch(uImageRange, clamp(low + ivec2(1, 1), ivec2(0), most), 0).r));
    float shown = far > 0.99998 ? 1.0 : 1.0 - smoothstep(uRangeCode.z, uRangeCode.w, range * exp2(-uRangeCode.x - far * uRangeCode.y) - 1.0);
    float own = range / (uFitWindow.x * max(abs(dot(fit, n)), 1e-3));
    shown *= 1.0 - smoothstep(uSteep.x, uSteep.y, own * turned / uFrame);
    for (int j = 0; j < (shown > 0.0 ? 1 : 0); j++) {
      float open = uRangeShape.w * clamp((1.0 + own * turned) / uStretch.x, 1.0, uStretch.z);
      vec3 qx = uFitAxes * vec3(dx, -dot(n.xy, dx) / n.z);
      vec3 qy = uFitAxes * vec3(dy, -dot(n.xy, dy) / n.z);
      vec2 ax = open * near * (uFitWindow.x * qx.xy + at * qx.z);
      vec2 ay = open * near * (uFitWindow.x * qy.xy + at * qy.z);
      vec3 picture = textureGrad(uImageWide, 0.5 + 0.5 * spot / uFitWindow.yz, 0.5 * ax / uFitWindow.yz, 0.5 * ay / uFitWindow.yz).rgb;
      float core = smoothstep(uCore.z, uCore.w, min(uCore.x - abs(at.x), uCore.y - abs(at.y)));
      for (int k = 0; k < (core > 0.0 ? 1 : 0); k++) picture = mix(picture, textureGrad(uImageCore, 0.5 + 0.5 * spot / uCore.xy, 0.5 * ax / uCore.xy, 0.5 * ay / uCore.xy).rgb, core);
      c.rgb = mix(c.rgb, picture, shown);
    }
  }
  return vec4(unfilm(c.rgb), inside ? edge * (1.0 - uTrust.z) * (1.0 - smoothstep(uTrust.x, uTrust.y, smear / uFrame)) : 0.0);
}
${BODY_GLSL}vec4 plateAt(vec2 g, vec2 dx, vec2 dy, out float size) {
  vec2 f = abs(g - uFore.xy) * (2.0 * uFore.zw);
  vec2 a = abs(g - uNear.xy) * (2.0 * uNear.z);
  vec2 b = abs(g - uMid.xy) * (2.0 * uMid.z);
  float wf = 1.0 - smoothstep(uJoin.x, uJoin.y, max(f.x, f.y));
  float wn = (1.0 - wf) * (1.0 - smoothstep(uJoin.x, uJoin.y, max(a.x, a.y)));
  float wm = (1.0 - wf - wn) * (1.0 - smoothstep(uJoin.x, uJoin.y, max(b.x, b.y)));
  float wr = 1.0 - wf - wn - wm;
  vec4 c = vec4(0.0);
  for (int k = 0; k < (wf > 0.0 ? 1 : 0); k++) c += wf * textureGrad(uPlateFore, (g - uFore.xy) * uFore.zw + 0.5, dx * uFore.zw, dy * uFore.zw);
  for (int k = 0; k < (wn > 0.0 ? 1 : 0); k++) c += wn * textureGrad(uPlateNear, (g - uNear.xy) * uNear.z + 0.5, dx * uNear.z, dy * uNear.z);
  for (int k = 0; k < (wm > 0.0 ? 1 : 0); k++) c += wm * textureGrad(uPlateMid, (g - uMid.xy) * uMid.z + 0.5, dx * uMid.z, dy * uMid.z);
  for (int k = 0; k < (wr > 0.0 ? 1 : 0); k++) c += wr * textureGrad(uPlateFar, (g - uFar.xy) * uFar.z + 0.5, dx * uFar.z, dy * uFar.z);
  size = exp2(wf * log2(uTexel.x) + wn * log2(uTexel.y) + wm * log2(uTexel.z) + wr * log2(uTexel.w));
  return c;
}
float layered(vec2 p, int octaves, float size) {
  float f = 0.0;
  float total = 0.0;
  float gain = 1.0;
  for (int n = 0; n < octaves; n++) {
    f += gain * (0.5 + (1.0 - smoothstep(uHazeFade.x, uHazeFade.y, size)) * (vnoise(p + uHazeOctave.xy * float(n)) - 0.5));
    total += gain;
    p *= uHazeOctave.z;
    size *= uHazeOctave.z;
    gain *= uHazeOctave.w;
  }
  return f / total;
}
float hazeAt(vec2 g, int k, float foot) {
  vec2 o = g - uStorm.xy;
  float across = dot(o, uJet.zw);
  float w = smoothstep(uHazeSpan[k].x, uHazeSpan[k].y, uHazeBand[k].y * across) * (1.0 - smoothstep(uHazeSpan[k].z, uHazeSpan[k].w, length(o))) * (1.0 - smoothstep(uHazeFine.y, uHazeFine.z, foot * uFrame / uHazeFibre.y));
  float dense = 0.0;
  for (int i = 0; i < (w > 0.0 ? 1 : 0); i++) {
    vec2 at = vec2(dot(o, uJet.xy) - uHazeBand[k].z, across);
    vec2 p = at / uHazeShape.xy + uHazeSeed[k].xy;
    vec2 q = vec2(layered(p + uHazeWarp.xy, 2, 0.0), layered(p + uHazeWarp.zw, 2, 0.0)) - 0.5;
    float bank = layered(p + uHazeFine.x * q, 3, 0.0);
    float fibre = layered((at + uHazeFine.w * q * uHazeShape.xy) / uHazeFibre.xy + uHazeSeed[k].yx, int(uHazeFibre.z), foot / uHazeFibre.y);
    dense = w * smoothstep(uHazeShape.z, uHazeShape.w, mix(bank, fibre, uHazeFibre.w));
  }
  return dense;
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
vec3 toneAt(vec2 g) {
  vec2 uv = clamp(vec2(g.x - uToneBox.x, uToneBox.y - g.y) * uToneBox.z + 0.5, uToneLift.z, 1.0 - uToneLift.z) * vec2(0.5, 1.0);
  return uToneBox.w * vec3(texture(uTone, vec2(uv.x, uv.y / 3.0)).r, texture(uTone, vec2(uv.x, (uv.y + 1.0) / 3.0)).r, texture(uTone, vec2(uv.x, (uv.y + 2.0) / 3.0)).r);
}
vec3 calmAt(vec2 g) {
  vec2 uv = clamp(vec2(g.x - uCalmBox.x, uCalmBox.y - g.y) * uCalmBox.z + 0.5, uToneLift.z, 1.0 - uToneLift.z) * vec2(0.5, 1.0) + vec2(0.5, 0.0);
  return uCalmBox.w * vec3(texture(uTone, vec2(uv.x, uv.y / 3.0)).r, texture(uTone, vec2(uv.x, (uv.y + 1.0) / 3.0)).r, texture(uTone, vec2(uv.x, (uv.y + 2.0) / 3.0)).r);
}
vec4 sunAt(vec2 g) {
  vec3 low = unfilm(textureLod(uPlateMid, (g - uMid.xy) * uMid.z + 0.5, uHazeLight.w).rgb) * toneAt(g);
  return vec4(low, smoothstep(uHazeLit.x, uHazeLit.y, (low.r - low.b) / max(low.r + low.b, 1e-4)));
}
${FLOW_GLSL}
${LIGHT_GLSL}
${DETAIL_GLSL}
void main() {
  vec3 D = normalize(vDir);
  vec3 E = vEye;
  float bD = dot(D, E) + uRadius * D.z;
  float e2 = dot(E, E);
  float high = e2 + 2.0 * uRadius * E.z;
  vec2 shell = uBodyShell;
  vec4 march = uBodyMarch;
  float away = 0.0;
  for (int i = 0; i < (uLayer.z > 0.5 ? 1 : 0); i++) {
    float tIn = max(-bD - sqrt(max(bD * bD - high + 2.0 * uRadius * uBodyShell.y + uBodyShell.y * uBodyShell.y, 0.0)), 0.0);
    vec2 o = E.xy - uTall.xy;
    float tNear = max(-dot(o, D.xy) / max(dot(D.xy, D.xy), 1e-9), tIn);
    away = smoothstep(0.0, 1.0, (length(o + D.xy * tNear) - uTallDeck.x) * uTallDeck.y);
    shell = mix(uBodyShell, uShell, away);
    march = mix(uBodyMarch, uMarch, away);
  }
  float cTop = high - 2.0 * uRadius * shell.y - shell.y * shell.y;
  float cLow = high - 2.0 * uRadius * shell.x - shell.x * shell.x;
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
  bool gone = false;
  vec2 cs = vec2(1.0, 0.0);
  vec3 w = vec3(0.0);
  int steps = 0;
  for (int i = 0; i < (inside ? int(march.w) : 0); i++) {
    vec3 p = E + D * t;
    vec2 at = calm(p.xy, cs);
    w = levels(at);
    gap = above(p) - stored(at, w);
    steps = i;
    if (gap < march.z * t * pix) { hit = true; break; }
    if (t > t1) { gone = true; break; }
    tPrev = t;
    gapPrev = gap;
    float fall = max(-(D.z + (D.x * p.x + D.y * p.y) / uRadius), 0.0);
    t += max(gap / (fall + march.x * tall(at)), march.y * t * pix);
  }
  hit = hit || (inside && !gone && away < 1.0);
  for (int i = 0; i < (hit ? 3 : 0); i++) {
    float tm = gapPrev > 0.0 && gap < gapPrev ? tPrev + (t - tPrev) * gapPrev / (gapPrev - gap) : 0.5 * (t + tPrev);
    vec3 p = E + D * tm;
    float gm = above(p) - stored(calm(p.xy, cs), w);
    if (gm > 0.0) { tPrev = tm; gapPrev = gm; } else { t = tm; gap = gm; }
  }
  vec2 q = vNdc * 0.5 * vec2(uAspect, 1.0);
  float vig = 1.0 / mix(1.0, 1.0 / pow(1.0 + dot(q, q) * 0.9, 2.0), uVignette);
  vec3 col = vec3(0.0);
  float alpha = 0.0;
  float texels = 0.0;
  vec3 tint = vec3(float(steps) / uBodyMarch.w, 0.0, 0.0);
  for (int k = 0; k < (hit ? 1 : 0); k++) {
    vec3 there = E + D * t;
    vec2 g = calm(there.xy, cs);
    vec3 p = vec3(g, there.z + (dot(there.xy, there.xy) - dot(g, g)) / (2.0 * uRadius));
    vec3 V = vec3(cs.x * D.x - cs.y * D.y, cs.y * D.x + cs.x * D.y, D.z);
    vec2 sunAz = vec2(cs.x * uSunAz.x - cs.y * uSunAz.y, cs.y * uSunAz.x + cs.x * uSunAz.y);
    float foot = t * pix;
    float hs = max(foot, mix(uTexel.y, uForeMap.w, w.x));
    vec2 slope = vec2(stored(g + vec2(hs, 0.0), w) - stored(g - vec2(hs, 0.0), w), stored(g + vec2(0.0, hs), w) - stored(g - vec2(0.0, hs), w)) / (2.0 * hs);
    vec3 n = normalize(vec3(g / uRadius - slope, 1.0));
    float facing = min(dot(V, n), -uFoot.x);
    vec3 sx = dFdx(vDir);
    vec3 sy = dFdy(vDir);
    sx = vec3(cs.x * sx.x - cs.y * sx.y, cs.y * sx.x + cs.x * sx.y, sx.z);
    sy = vec3(cs.x * sy.x - cs.y * sy.y, cs.y * sy.x + cs.x * sy.y, sy.z);
    sx = normalize(sx - V * dot(V, sx));
    sy = normalize(sy - V * dot(V, sy));
    vec2 dx = foot * (sx - V * (dot(sx, n) / facing)).xy;
    vec2 dy = foot * (sy - V * (dot(sy, n) / facing)).xy;
    float m00 = dx.x * dx.x + dy.x * dy.x;
    float m11 = dx.y * dx.y + dy.y * dy.y;
    float m01 = dx.x * dx.y + dy.x * dy.y;
    float mean = 0.5 * (m00 + m11);
    float diff = sqrt(0.25 * (m00 - m11) * (m00 - m11) + m01 * m01);
    float major = sqrt(mean + diff);
    float minor = sqrt(max(mean - diff, 1e-14));
    vec2 axis = normalize(m00 > m11 ? vec2(mean + diff - m11, m01) : vec2(m01, mean + diff - m00));
    vec2 sizeView;
    float countView;
    float wide;
    float resolved;
    vec4 seen = seenAt(p, V, n, foot, dx, dy, sizeView, countView, wide, resolved);
    float sizePlate;
    vec4 plate = plateAt(g, dx, dy, sizePlate);
    float fine = 1.0;
    for (int i = 0; i < (seen.a > 0.0 && wide > 1.0 && uStretch.y > 1.0 ? 1 : 0); i++) {
      float sizeLow;
      vec3 low = unfilm(plateAt(g, dx * wide, dy * wide, sizeLow).rgb);
      fine = mix(1.0, clamp(dot(unfilm(plate.rgb), vec3(0.2126, 0.7152, 0.0722)) / max(dot(low, vec3(0.2126, 0.7152, 0.0722)), 1e-4), 1.0 / uStretch.y, uStretch.y), smoothstep(0.0, 1.0, wide - 1.0));
    }
    vec3 through = vec3(1.0);
    vec3 added = vec3(0.0);
    float sine = max(-dot(D, normalize(there + vec3(0.0, 0.0, uRadius))), 1e-6);
    for (int i = 0; i < (seen.a < 1.0 && sine < uAirKnots.z ? 1 : 0); i++) {
      float row = clamp(log(sine / uAirKnots.x) * uAirKnots.y, 0.0, 1.0) * uAirTurn.x + uAirTurn.y;
      float column = acos(clamp(dot(D.xy / max(length(D.xy), 1e-6), uSunAz), -1.0, 1.0)) * uAirKnots.w + 0.5 * (1.0 - 3.14159265 * uAirKnots.w);
      through = vec3(texture(uAirThrough, vec2(0.5, row)).r, texture(uAirThrough, vec2(0.5, row + 1.0 / 3.0)).r, texture(uAirThrough, vec2(0.5, row + 2.0 / 3.0)).r);
      added = vec3(texture(uAir, vec2(column, row)).r, texture(uAir, vec2(column, row + 1.0 / 3.0)).r, texture(uAir, vec2(column, row + 2.0 / 3.0)).r);
    }
    float thin = uAirLift;
    vec3 throughLow = through;
    vec3 addedLow = added;
    for (int i = 0; i < (thin > 0.0 ? 1 : 0); i++) {
      through = mix(through, vec3(1.0), thin);
      added *= 1.0 - thin;
    }
    float size = mix(sizePlate, resolved, seen.a);
    int taps = int(clamp(ceil(major / (uFoot.y * minor)), 1.0, uFoot.z));
    float span = max(minor, major / float(taps));
    float cut = uDetail.z * size;
    float toned = smoothstep(uToneLift.x, uToneLift.y, above(E));
    float least = mix(uDetail.w, uDetailHigh, toned) * span;
    float on = smoothstep(least, 2.0 * least, cut);
    vec3 fineSum = vec3(0.0);
    for (int i = 0; i < (on > 0.0 ? taps : 0); i++) fineSum += made(g + axis * (major * ((float(i) + 0.5) / float(taps) - 0.5)), cut, least);
    float shade = clamp(1.0 + on * max(plate.a, uDetailLook.z) * (uDetail.y * fineSum.z - uDetailTone * dot(fineSum.xy, sunAz)) / float(taps), 1.0 - uDetailLook.w, 1.0 + uDetailLook.w);
    vec3 ground = unfilm(plate.rgb);
    for (int i = 0; i < (toned > 0.0 && seen.a < 1.0 ? 1 : 0); i++) ground *= mix(vec3(1.0), toneAt(g) * calmAt(g), toned);
    vec3 relit = vec3(1.0);
    for (int i = 0; i < (cs.y != 0.0 || any(notEqual(uSunNow, uSunOwn)) ? 1 : 0); i++) {
      vec3 sun = vec3(cs.x * uSunNow.x - cs.y * uSunNow.y, cs.y * uSunNow.x + cs.x * uSunNow.y, uSunNow.z);
      vec2 broad = vec2(stored(g + vec2(uLightBase, 0.0), w) - stored(g - vec2(uLightBase, 0.0), w), stored(g + vec2(0.0, uLightBase), w) - stored(g - vec2(0.0, uLightBase), w)) / (2.0 * uLightBase);
      vec3 nb = normalize(vec3(g / uRadius - broad, 1.0));
      float openOwn = openTo(p, uSunOwn);
      float openNow = openOwn;
      for (int j = 0; j < (any(notEqual(uSunNow, uSunOwn)) ? 1 : 0); j++) openNow = openTo(p, sun);
      relit = clamp(litBy(nb, sun, openNow) / litBy(nb, uSunOwn, openOwn), vec3(uLightBound.x), vec3(uLightBound.y));
    }
    ground *= relit;
    seen.rgb *= relit;
    col = mix(ground * shade * through + added, seen.rgb * fine * shade, seen.a);
    for (int i = 0; i < (thin > 0.0 ? 1 : 0); i++) {
      float knot = sqrt(clamp(sine, 0.0, 1.0)) * ${ABOVE_KNOTS - 1}.0;
      int low = int(min(floor(knot), ${ABOVE_KNOTS - 2}.0));
      float part = knot - float(low);
      vec3 byGain = mix(uAboveGain[low], uAboveGain[low + 1], part);
      vec3 byAir = mix(uAboveAir[low], uAboveAir[low + 1], part);
      col = mix(col, col * byGain + byAir, thin);
      for (int j = 0; j < (thin < 1.0 && uAboveMix.x > 0.0 ? 1 : 0); j++) {
        vec3 shallow = mix(ground * shade * throughLow + addedLow, seen.rgb * fine * shade, seen.a);
        vec3 aloft = mix(ground * shade, seen.rgb * fine * shade, seen.a) * byGain + byAir;
        col = mix(col, exp(mix(log(max(shallow, vec3(uAboveMix.y))), log(max(aloft, vec3(uAboveMix.y))), thin)), uAboveMix.x);
      }
    }
    for (int i = 0; i < (thin < 1.0 ? 1 : 0); i++) {
      float deep = uDeep.y * max(uDeep.x - above(there), 0.0);
      vec3 from = normalize(p - uFitEye);
      float own = max(-dot(from, normalize(p + vec3(0.0, 0.0, uRadius))), uDeep.z);
      float sure = (1.0 - thin) * smoothstep(0.0, uDeep.w, -dot(from, n));
      col = max(col + sure * uDeepGlow * (exp(-deep / own) - exp(-deep / max(sine, uDeep.z))), uDeepFloor * col);
    }
    vec2 flash = flashAt(g, col);
    col = col * exp(flash.x) + uFlashGlow * flash.y;
    for (int i = 0; i < (uHazeLit.z > 0.0 ? 1 : 0); i++) {
      float zg = above(there) / tall(g);
      vec3 line = there - uFitEye;
      float sink = min(line.z + dot(line.xy, there.xy) / uRadius, -uLaid.x * length(line));
      vec2 laid = there.xy + line.xy * clamp((zg - above(there)) / sink, -uLaid.y, uLaid.y);
      float shadow = 0.0;
      for (int b = 0; b < 2; b++) shadow += uHazeSeed[b].z * smoothstep(0.0, uHazeFade.z, uHazeBand[b].x - zg) * hazeAt(laid + uSunAz * (max(uHazeBand[b].x - zg, 0.0) * uHazeLight.x), b, major);
      for (int j = 0; j < (shadow > 0.0 ? 1 : 0); j++) col *= 1.0 - uHazeLit.z * sunAt(laid).a * (1.0 - exp(-shadow)) * uHazeShade;
      for (int b = 0; b < 2; b++) {
        float hb = uHazeBand[b].x;
        float cb = high - 2.0 * uRadius * hb - hb * hb;
        float db = bD * bD - cb;
        float tb = -bD - sqrt(max(db, 0.0));
        for (int j = 0; j < (cb > 0.0 && db > 0.0 && tb > 0.0 && (tb < t || zg < hb) ? 1 : 0); j++) {
          vec3 pb = E + D * tb;
          float cosine = max(-dot(D, normalize(pb + vec3(0.0, 0.0, uRadius))), uHazeLight.z);
          float dense = hazeAt(pb.xy, b, tb * pix / cosine);
          for (int m = 0; m < (dense > 0.0 ? 1 : 0); m++) {
            vec4 sun = sunAt(pb.xy);
            float toward = min(uHazeForward.y * pow((1.0 - uHazeForward.x) * inversesqrt(max(1.0 + uHazeForward.x * uHazeForward.x - 2.0 * uHazeForward.x * dot(D, normalize(vec3(uSunAz * uHazeLight.x, 1.0))), 1e-4)), 3.0), 1.0);
            col = mix(col, sun.rgb * uHazeGlow, uHazeLit.z * sun.a * toward * smoothstep(0.0, uHazeFade.z, hb - zg) * (1.0 - exp(-uHazeBand[b].w * dense / cosine)));
          }
        }
      }
    }
    float kept = mix(major / sizePlate, countView, seen.a) / uGrad;
    texels = max(kept, on * 2.0 * span / (uGrad * 1.6 * least));
    col *= uExpose;
    alpha = 1.0;
    for (int i = 0; i < (uLayer.z > 0.5 ? 1 : 0); i++) {
      vec2 r = abs(there.xy - uFar.xy) * (2.0 * uFar.z);
      alpha = uLayer.x * (1.0 - smoothstep(uJoin.x, uJoin.y, max(r.x, r.y)));
      col *= alpha;
    }
    tint.b = seen.a;
    tint.g = on;
  }
  for (int k = 0; k < (hit ? 0 : 1); k++) {
    float rise = max(bD < 0.0 ? tangent : tangent + bD * bD / (2.0 * uRadius), 0.0);
    vec3 up = normalize(E + vec3(0.0, 0.0, uRadius));
    vec3 level = normalize(D - dot(D, up) * up);
    float u = dot(E.xy + level.xy * sqrt(max(high, 0.0)), uSunAz);
    vec2 at = vec2(clamp((u - uLimbKnots.x) * uLimbKnots.y, uLimbShape.y, 1.0 - uLimbShape.y), clamp(sqrt(rise * uLimbShape.x), 0.0, 1.0) * uLimbKnots.z + uLimbKnots.w);
    for (int i = 0; i < (rise < 1.0 / uLimbShape.x ? 1 : 0); i++) col = vec3(texture(uLimb, at).r, texture(uLimb, at + vec2(0.0, 1.0 / 3.0)).r, texture(uLimb, at + vec2(0.0, 2.0 / 3.0)).r) * uExpose;
    alpha = 1.0 - smoothstep(uLimbShape.z, uLimbShape.w, rise);
    for (int i = 0; i < (uLayer.z > 0.5 ? 1 : 0); i++) {
      col *= uLayer.y;
      alpha *= uLayer.y;
    }
  }
  outColor = diagOut(vec4(col * uGain * vig, alpha), texels, 1.0, tint, vec2(0.0), t);
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

export class ReliefDeck {
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

  static async load(ctx: SetContext, base: string): Promise<ReliefDeck> {
    const maps = fields.maps as Record<string, Level>
    const plates = fields.plates as Record<string, Plate>
    const uniforms: Record<string, THREE.IUniform> = {}
    const l = deck.look
    for (const [name, key] of [['fore', 'Fore'], ['near', 'Near'], ['mid', 'Mid']] as const) {
      const m = maps[name]!
      uniforms['uHeight' + key] = { value: await heightMap(ctx, base + 'deck-' + name + '-height.bin', m.pixels[ctx.assets]!) }
    }
    const im = fields.image
    const ir = (bodyFields.range.pixels as Record<string, number[]>)[ctx.assets]!
    const raw = new Uint16Array(await ctx.buffer(base + 'relief-image-range.bin'))
    if (raw.length !== ir[0]! * ir[1]!) throw new Error('deck range size mismatch')
    const ranges = new Float32Array(raw.length)
    for (let i = 0; i < raw.length; i++) ranges[i] = raw[i]! / 65535
    const fm = maps.fore!
    uniforms.uForeMap = { value: new THREE.Vector4(fm.centre[0], fm.centre[1], 1 / fm.size, fm.size / fm.pixels[ctx.assets]!) }
    const texel: number[] = []
    for (const [name, key] of [['fore', 'Fore'], ['near', 'Near'], ['mid', 'Mid'], ['far', 'Far']] as const) {
      const m = plates[name]!
      uniforms['uPlate' + key] = { value: await ctx.texture(base + 'plate-' + name + '.png', { srgb: true, anisotropy: l.anisotropy }) }
      texel.push(m.size[0]! / m.pixels[ctx.assets]![0]!)
      uniforms['u' + key] = { value: new THREE.Vector4(m.centre[0], m.centre[1], 1 / m.size[0]!, name === 'fore' ? 1 / m.size[1]! : m.size[0]! / m.pixels[ctx.assets]![0]!) }
    }
    const c = fields.chart
    const az = THREE.MathUtils.degToRad(deck.light.azimuthDeg)
    const v = bodyFields.view
    const lk = fields.limb.knots
    const lr = fields.limb.rows
    const glow = new Float32Array(3 * lr * lk[2]!)
    for (let ch = 0; ch < 3; ch++) for (let j = 0; j < lr; j++) for (let i = 0; i < lk[2]!; i++) glow[(ch * lr + j) * lk[2]! + i] = fields.limb.table[j]![i]![ch]!
    const vp = (v.pixels as Record<string, number[]>)[ctx.assets]!
    const tn = deck.tone
    const toneRaw = new Uint16Array(await ctx.buffer(base + 'deck-tone.bin'))
    const cm = deck.calm
    const calmRaw = new Uint16Array(await ctx.buffer(base + 'deck-calm.bin'))
    if (toneRaw.length !== 3 * tn.pixels * tn.pixels || calmRaw.length !== toneRaw.length || cm.pixels !== tn.pixels) throw new Error('deck tone size mismatch')
    const tone = new Float32Array(2 * toneRaw.length)
    for (let j = 0; j < 3 * tn.pixels; j++) for (let i = 0; i < tn.pixels; i++) {
      tone[2 * j * tn.pixels + i] = toneRaw[j * tn.pixels + i]! / 65535
      tone[(2 * j + 1) * tn.pixels + i] = calmRaw[j * tn.pixels + i]! / 65535
    }
    const hz = deck.life.haze
    const fl2 = body.flow
    const lt = body.light
    const sunAt = (turnDeg: number): THREE.Vector3 => {
      const a = THREE.MathUtils.degToRad(deck.light.azimuthDeg + turnDeg)
      const e = THREE.MathUtils.degToRad(lt.elevationDeg)
      return new THREE.Vector3(Math.cos(e) * Math.cos(a), Math.cos(e) * Math.sin(a), Math.sin(e))
    }
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
      uTexel: { value: new THREE.Vector4().fromArray(texel) },
      uView: { value: await ctx.texture(base + 'relief-view-color.png', { srgb: true, anisotropy: l.anisotropy }) },
      uImageWide: { value: await ctx.texture(base + 'deck-image-wide.jpg', { srgb: true, anisotropy: l.anisotropy }) },
      uImageCore: { value: await ctx.texture(base + 'deck-image-core.jpg', { srgb: true, anisotropy: l.anisotropy }) },
      uImageRange: { value: ctx.floatTexture(ranges, ir[0]!, ir[1]!) },
      uCore: { value: new THREE.Vector4(im.window[0]! / 2, im.window[1]! / 2, im.feather[0]!, im.feather[1]!) },
      uRangeShape: { value: new THREE.Vector4((im.range.shrink as Record<string, number>)[ctx.assets]!, ir[0]! - 1, ir[1]! - 1, deck.image.sharpen) },
      uRangeCode: { value: new THREE.Vector4(im.range.log2[0]!, (im.range.log2[1]! - im.range.log2[0]!) * 65535 / 65534, deck.image.hidden[0]!, deck.image.hidden[1]!) },
      uViewOrigin: { value: new THREE.Vector2().fromArray(v.origin) },
      uViewRange: { value: new THREE.Vector4(v.theta[0]!, 1 / (v.theta[1]! - v.theta[0]!), v.psi[0]!, 1 / (v.psi[1]! - v.psi[0]!)) },
      uViewTexel: { value: new THREE.Vector4((v.theta[1]! - v.theta[0]!) / vp[0]!, (v.psi[1]! - v.psi[0]!) / vp[1]!, v.lengthRange[0]!, Math.log2(v.lengthRange[1]! / v.lengthRange[0]!)) },
      uFitEye: { value: new THREE.Vector3().fromArray(v.eye) },
      uFitAxes: { value: new THREE.Matrix3().set(v.axes[0]![0]!, v.axes[1]![0]!, v.axes[2]![0]!, v.axes[0]![1]!, v.axes[1]![1]!, v.axes[2]![1]!, v.axes[0]![2]!, v.axes[1]![2]!, v.axes[2]![2]!) },
      uFitWindow: { value: new THREE.Vector4(v.focalPx, v.half[0]!, v.half[1]!, v.fade[0]!) },
      uSteep: { value: new THREE.Vector2().fromArray(deck.image.steep) },
      uTrust: { value: new THREE.Vector4(l.trust[0]!, l.trust[1]!, l.trust[2]!, v.fade[1]!) },
      uStretch: { value: new THREE.Vector4().fromArray(l.stretch) },
      uBlend: { value: new THREE.Vector2().fromArray(l.blend) },
      uJoin: { value: new THREE.Vector2().fromArray(l.join) },
      uS: { value: new THREE.Vector3().fromArray(c.origin) }, uEx: { value: new THREE.Vector3().fromArray(c.ex) }, uEy: { value: new THREE.Vector3().fromArray(c.ey) }, uEn: { value: new THREE.Vector3().fromArray(c.en) },
      uRadius: { value: c.radius },
      uHeightRange: { value: new THREE.Vector2(fields.heightRange[0]!, fields.heightRange[1]! - fields.heightRange[0]!) },
      uTall: { value: new THREE.Vector4(v.origin[0]!, v.origin[1]!, body.height.nearUnits[0]! / (body.height.nearUnits[1]! - body.height.nearUnits[0]!), 1) },
      uTallFar: { value: new THREE.Vector4(body.height.gain - body.height.farGain, body.height.farGain - 1, body.height.farUnits[0]! / (body.height.farUnits[1]! - body.height.farUnits[0]!), 1 / (body.height.farUnits[1]! - body.height.farUnits[0]!)) },
      uTallScale: { value: 1 / (body.height.nearUnits[1]! - body.height.nearUnits[0]!) },
      uShell: { value: new THREE.Vector2().fromArray(l.shell) },
      uMarch: { value: new THREE.Vector4().fromArray(l.march) },
      uBodyShell: { value: new THREE.Vector2().fromArray(body.height.shell) },
      uBodyMarch: { value: new THREE.Vector4().fromArray(body.height.march) },
      uTallDeck: { value: new THREE.Vector2(body.height.deckUnits[0]!, 1 / (body.height.deckUnits[1]! - body.height.deckUnits[0]!)) },
      uPixel: { value: 0.001 },
      uDetail: { value: new THREE.Vector4().fromArray(l.detail) },
      uDetailLook: { value: new THREE.Vector4().fromArray(l.detailLook) },
      uDetailTone: { value: l.detailTone },
      uDetailHigh: { value: l.detailHigh },
      uFoot: { value: new THREE.Vector3().fromArray(l.foot) },
      uSunAz: { value: new THREE.Vector2(Math.cos(az), Math.sin(az)) },
      uLimb: { value: ctx.floatTexture(glow, lk[2]!, 3 * lr) },
      uLimbKnots: { value: new THREE.Vector4(lk[0]! - 0.5 * lk[1]!, 1 / (lk[2]! * lk[1]!), (lr - 1) / (3 * lr), 0.5 / (3 * lr)) },
      uLimbShape: { value: new THREE.Vector4(1 / fields.limb.top, 0.5 / lk[2]!, fields.limb.cover[0]!, fields.limb.cover[1]!) },
      uAir: { value: ctx.floatTexture(added, ad, 3 * as) },
      uAirThrough: { value: ctx.floatTexture(through, 1, 3 * as) },
      uAirKnots: { value: new THREE.Vector4(air.sinRange[0]!, 1 / Math.log(air.sinRange[1]! / air.sinRange[0]!), air.sinRange[1]!, (ad - 1) / (ad * Math.PI)) },
      uAirTurn: { value: new THREE.Vector2((as - 1) / (3 * as), 0.5 / (3 * as)) },
      uAirLift: { value: 0 },
      uAboveGain: { value: deck.above.gain.map((v) => new THREE.Vector3().fromArray(v)) },
      uAboveAir: { value: deck.above.air.map((v) => new THREE.Vector3().fromArray(v)) },
      uAboveMix: { value: new THREE.Vector2(deck.above.even, deck.above.floor) },
      uTone: { value: ctx.floatTexture(tone, 2 * tn.pixels, 3 * tn.pixels) },
      uCalmBox: { value: new THREE.Vector4(cm.centre[0]!, cm.centre[1]!, 1 / cm.size, cm.scale) },
      uToneBox: { value: new THREE.Vector4(tn.centre[0]!, tn.centre[1]!, 1 / tn.size, tn.scale) },
      uToneLift: { value: new THREE.Vector3(tn.lift[0]!, tn.lift[1]!, 0.5 / tn.pixels) },
      uToneRim: { value: new THREE.Vector2(THREE.MathUtils.degToRad(tn.rim[0]!), THREE.MathUtils.degToRad(tn.rim[1]!)) },
      uToneRimNoise: { value: new THREE.Vector4(tn.rimNoise[0]!, THREE.MathUtils.degToRad(tn.rimNoise[1]!), tn.rimNoise[2]!, THREE.MathUtils.degToRad(tn.rimNoise[3]!)) },
      uExpose: { value: new THREE.Vector3(1, 1, 1) },
      uStorm: { value: new THREE.Vector4(deck.life.storm.centre[0]!, deck.life.storm.centre[1]!, fl2.storm.outerUnits[0]!, fl2.storm.outerUnits[1]!) },
      uStormTurn: { value: 0 },
      uEddy: { value: deck.life.eddies.map((e) => new THREE.Vector4(e.centre[0]!, e.centre[1]!, 0, e.rimUnits)) },
      uEddyTurn: { value: deck.life.eddies.map(() => 0) },
      uSeam: { value: deck.life.storm.rings.map((s, i) => i === 0 ? new THREE.Vector3(fl2.storm.innerUnits[0]!, fl2.storm.innerUnits[1]!, 0) : new THREE.Vector3(s.edgeUnits[0]!, s.edgeUnits[1]!, 0)) },
      uJet: { value: new THREE.Vector4(jet.x, jet.y, -jet.y, jet.x) },
      uShear: { value: new THREE.Vector4(2 * Math.PI / fl2.bands.waveUnits[0]!, fl2.bands.phase[0]!, 2 * Math.PI / fl2.bands.waveUnits[1]!, fl2.bands.phase[1]!) },
      uShearFade: { value: new THREE.Vector4(fl2.bands.fromUnits[0]!, fl2.bands.fromUnits[1]!, 0, fl2.bands.second) },
      uLightBase: { value: body.light.baseUnits },
      uSunNow: { value: sunAt(body.proof.sunTurnDeg) },
      uSunOwn: { value: sunAt(0) },
      uLightFill: { value: new THREE.Vector4(lt.fill[0]!, lt.fill[1]!, lt.fill[2]!, lt.penumbra) },
      uLightSun: { value: new THREE.Vector4(lt.sun[0]!, lt.sun[1]!, lt.sun[2]!, lt.wrap) },
      uLightMarch: { value: new THREE.Vector4(lt.march[0]!, lt.march[1]!, lt.march[2]!, lt.march[3]!) },
      uLightBound: { value: new THREE.Vector2().fromArray(lt.bound) },
      uDeep: { value: new THREE.Vector4(body.deep.levelUnits, body.deep.perUnit, body.deep.minSine, body.deep.facing) },
      uDeepFloor: { value: body.deep.floor },
      uLaid: { value: new THREE.Vector2().fromArray(body.height.laid) },
      uDeepGlow: { value: new THREE.Vector3().fromArray(body.deep.glow) },
      uHazeBand: { value: hz.bands.map((b) => new THREE.Vector4(b.heightUnits, b.side, 0, b.depth)) },
      uHazeSeed: { value: hz.bands.map((b) => new THREE.Vector4(b.seed[0]!, b.seed[1]!, b.shadowDepth, 0)) },
      uHazeShape: { value: new THREE.Vector4(hz.bankUnits[0]!, hz.bankUnits[1]!, hz.cover[0]!, hz.cover[1]!) },
      uHazeFibre: { value: new THREE.Vector4(hz.fibreUnits[0]!, hz.fibreUnits[1]!, hz.fibreOctaves, hz.fibreShare) },
      uHazeFine: { value: new THREE.Vector4(hz.warp, hz.footprint[0]!, hz.footprint[1]!, hz.fibreWarp) },
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
      uHazeLight: { value: new THREE.Vector4(1 / Math.tan(THREE.MathUtils.degToRad(hz.sunElevationDeg)), 0, hz.minCosine, Math.log2(hz.lightBlurUnits / texel[2]!)) },
      uHazeLit: { value: new THREE.Vector3(hz.lit[0]!, hz.lit[1]!, 0) },
      uHazeGlow: { value: new THREE.Vector3().fromArray(hz.glow) },
      uHazeShade: { value: new THREE.Vector3().fromArray(hz.shadowTint) },
      uOwn: { value: 0 }, uEye: { value: new THREE.Vector3() }, uAxes: { value: new THREE.Matrix3() }, uLayer: { value: new THREE.Vector3(1, 1, 0) }, uToChart: { value: new THREE.Matrix3() },
      uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uDiag: diagUniform, uGrad: gradUniform, uFrame: frameUniform,
    })
    return new ReliefDeck(uniforms)
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

function bounded(degPerSecond: number, boundDeg: number, seconds: number): number {
  const bound = THREE.MathUtils.degToRad(boundDeg)
  return bound * Math.tanh(THREE.MathUtils.degToRad(degPerSecond) * (seconds - config.shutterFraction / (2 * config.fps)) / bound)
}

export function windTurn(seconds: number): number {
  return bounded(body.flow.storm.degPerSecond, body.flow.storm.boundDeg, seconds)
}

export function eddyWind(eddy: number, seconds: number): number {
  const e = deck.life.eddies[eddy]!
  return bounded(e.degPerSecond * body.flow.eddyShare, e.boundDeg, seconds)
}

export function liftNow(seconds: number): number[] {
  return seconds < 0 ? body.handover.diveLiftUnits : deck.tone.lift
}

export function tallNow(height: number): number {
  const f = body.height.fadeHeights
  const x = Math.min(Math.max(Math.log(Math.max(height, 1e-9) / f[0]!) / Math.log(f[1]! / f[0]!), 0), 1)
  return 1 - x * x * (3 - 2 * x)
}

export function bandDrift(seconds: number, height: number): number {
  const f = body.flow.bands.fadeHeights
  const x = Math.min(Math.max(Math.log(Math.max(height, 1e-9) / f[0]!) / Math.log(f[1]! / f[0]!), 0), 1)
  return (1 - x * x * (3 - 2 * x)) * body.flow.bands.unitsPerSecond * (seconds - config.shutterFraction / (2 * config.fps))
}
