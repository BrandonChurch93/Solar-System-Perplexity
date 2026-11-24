import * as THREE from 'three'
import { diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { GRADE_GLSL } from './grade'
import { STAGE_GLSL, stage } from './stage'
import arcade from './arcade.json'

export interface LoopsLook {
  grid: [number, number]
  lean: { outerDeg: number; innerDeg: number; from: number; to: number; late: [number, number] }
  gain: number
  trim: [number, number]
  pinCut: [number, number]
  far: number
  pin: { from: number; soft: number; lowDeg: number; highDeg: number }
  flow: { amount: number; lanes: number; along: number; speed: number; back: number; floor: number; inside: [number, number]; from: [number, number] }
  swell: { amount: number; speed: number; width: number; lanes: number; calm: number }
  burst: { surge: number; floor: number; reach: [number, number]; other: number; white: number; from: number }
}

export interface KnotsLook {
  knots: { amount: number; speed: number; every: number; width: number; jitter: number; white: number; inside: [number, number]; lanes: [number, number]; lead: number; pick: [number, number, number, number]; ends: [number, number] }
  feet: { amount: number; reach: number; over: number; lane: number; ground: number }
  surge: { from: number; land: number; lead: number; rise: number; fade: number; amount: number; width: number; tail: number; ragged: number; white: number; halo: number; level: number; lanes: [number, number, number]; glow: [number, number, number]; core: [number, number]; inner: [number, number, number]; crest: [number, number]; launch: number; flare: number; peak: number; early: number; end: number; settle: number; ground: number; reach: number; knee: number; bloom: number; veil: [number, number, number]; most: number; keep: number; hold: [number, number, number]; ends: [number, number]; grow: [number, number]; kick: number }
  erupt: { from: number; top: number; time: number; lean: number; far: number; lanes: number; pick: [number, number]; outer: [number, number, number]; gate: [number, number, number, number]; gain: [number, number]; erode: number; thin: number; fade: [number, number]; tear: [number, number, number]; flash: { at: number; peak: number; ease: number; amount: number; width: number; white: number; wide: number; haze: number; level: number; lane: [number, number]; tint: [number, number, number]; ground: number; veil: number; span: number } }
}

const VERT = /* glsl */ `
in vec3 aLate;
in vec3 aGrow;
in float aPin;
uniform float uLate;
uniform float uGrow;
uniform float uShear;
out vec3 vStage;
out vec3 vClip;
out float vPin;
void main() {
  vStage = position;
  vPin = aPin;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(mix(position, aLate, uLate) + aGrow * uGrow + vec3(aGrow.y, -aGrow.x, 0.0) * uShear, 1.0);
  vClip = gl_Position.xyw;
}`

const frag = (knots: boolean): string => /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform sampler2D uNoise;
uniform int uDiag;
uniform float uGrad;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform float uTime;
uniform vec4 uBox;
uniform vec4 uFeet;
uniform vec4 uFlow;
uniform vec2 uFlowMore;
uniform vec4 uFlowMask;
uniform vec4 uSwell;
uniform float uCalm;
uniform vec4 uBurst;
uniform vec3 uBurstMore;
uniform float uCut;
uniform vec3 uTrim;
uniform vec2 uPinCut;${knots ? `
uniform vec4 uKnot;
uniform vec4 uKnotMore;
uniform vec4 uKnotLane;
uniform vec4 uKnotPick;
uniform vec2 uKnotEnds;
uniform vec4 uSurge;
uniform vec4 uSurgeMore;
uniform vec3 uSurgeLane;
uniform vec3 uSurgeGlow;
uniform vec2 uSurgeCore;
uniform vec3 uSurgeInner;
uniform vec2 uSurgeCrest;
uniform vec2 uFoot;
uniform vec4 uFlare;
uniform vec3 uHold;
uniform vec2 uHoldEnds;
uniform vec4 uFlash;
uniform vec4 uFlashGlow;
uniform vec3 uFlashTint;
uniform vec2 uPeel;
uniform vec3 uPeelPick;
uniform vec3 uPeelOuter;
uniform vec4 uPeelGate;
uniform vec3 uPeelTear;
uniform vec4 uGap;
uniform vec4 uGapMore;
uniform float uThrownMost;
// light the release throws on a foot lifts it toward uThrownMost and no further; where the foot is brighter
// than that already it adds nothing, so a lit foot glows gold round its white cores and does not grow wider
vec3 thrownOn(vec3 base, vec3 lit) {
  float b = dot(base, vec3(0.3, 0.5, 0.2));
  float d = dot(lit, vec3(0.3, 0.5, 0.2)) - b;
  if (uThrownMost <= 0.0 || d <= 0.0) return lit;
  float room = max(uThrownMost - b, 0.0);
  return mix(base, lit, room / (d + room));
}` : ''}
uniform float uSince;
uniform float uLifeOn;
uniform vec4 uSway;
uniform vec4 uSwayRate;
uniform vec4 uSwayLane;
uniform vec4 uRing;
uniform vec4 uRingRest;
uniform float uRingRound;
uniform vec4 uStream;
uniform vec4 uStreamEnds;
uniform vec4 uStreamLayer[2];
uniform vec4 uStreamMix[2];
uniform vec4 uLead;
uniform vec2 uLeadMore;
uniform vec4 uLight[8];
uniform vec3 uLightMore;
uniform vec2 uLightKnee;
uniform float uBound;
uniform vec4 uRain;
uniform vec4 uRainMore;
uniform vec4 uRainLane;
uniform vec3 uGusts[4];
uniform vec4 uRace;
uniform vec4 uRaceMore;
uniform vec4 uRaceGust;
uniform vec2 uRaceGlow;
uniform float uRaceThin;
uniform vec2 uRaceLow;
uniform vec4 uFootLife;
uniform vec4 uCore;
in vec3 vStage;
in vec3 vClip;
in float vPin;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
${STAGE_GLSL}
${GRADE_GLSL}
// The life of the arcade (mail 228). Time is the only input; the numbers are in arcade.json.
float lh(float a, float b) {
  vec3 q = fract(vec3(a, b, a + b) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yxz + 33.33);
  return fract((q.x + q.y) * q.z);
}
// The arcade breathes and sways: the place the picture is read from moves across the strands, by a wave
// that runs over the strands, so neighbours move against each other. Nothing moves at the feet.
float sway(float t, float arc, float along) {
  return uSway.x * sin(uSwayRate.x * t + uSwayLane.x * arc + 2.1 * along)
    + uSway.y * sin(uSwayRate.y * t - uSwayLane.y * arc + 0.7)
    + uSway.z * sin(uSwayRate.z * t + uSwayLane.z * arc + 4.4 * along + 1.9)
    + uSwayRate.w * sin(uSwayLane.w * t + 0.5);
}
vec2 swayed(vec2 p, float t) {
  vec2 ab = uFeet.zw - uFeet.xy;
  float apart = length(ab);
  ab /= apart;
  vec2 up = vec2(-ab.y, ab.x);
  vec2 pa = uFeet.xy - p;
  vec2 pb = uFeet.zw - p;
  float la = length(pa);
  float lb = length(pb);
  float arc = acos(clamp(dot(pa, pb) / max(la * lb, 1e-6), -1.0, 1.0));
  float along = la / max(la + lb, 1e-6);
  vec2 mid = 0.5 * (uFeet.xy + uFeet.zw);
  vec2 centre = mid + up * (0.5 * apart * cos(arc) / max(sin(arc), 0.05));
  vec2 n = p - centre;
  n /= max(length(n), 1e-6);
  float above = smoothstep(0.0, 0.03, dot(p - uFeet.xy, up));
  float env = pow(clamp(4.0 * along * (1.0 - along), 0.0, 1.0), uSway.w) * above;
  // The strands do not rest at the calm moment (mail 327 point 1): they pass through the pose of the picture there at
  // their full speed. What they would be away from that pose at the calm moment is taken off, all of it at that
  // moment and none of it outside the calm (uRingRest.z: 1 at the moment, 0 outside; uRingRest.w: the moment).
  float pin = uRingRest.z;
  float w = sway(t, arc, along) - pin * sway(uRingRest.w, arc, along);
  // struck by the release and again by the thrown arc that falls back, the arcade rings (mail 327 point 1): a wave runs
  // from the crown down both legs, bundle against bundle, and dies away. uRing: the two parts of the swing at this time,
  // how far the wave is behind at a foot, and how far one bundle is behind the next.
  float turn = uRing.w * arc - uRing.z * sqrt((2.0 * along - 1.0) * (2.0 * along - 1.0) + uRingRound * uRingRound);
  float ring = (uRing.x - pin * uRingRest.x) * sin(turn) + (uRing.y - pin * uRingRest.y) * cos(turn);
  return p + n * (apart * env * (w + ring));
}
// The flow along the strands (mail 241). The light of a strand is carried by clumps of plasma that run from
// one foot over the top to the other: a clump is a bright head with a tail behind it, and every lane of
// strands has a spacing, a length and a speed of its own; a few lanes run the other way. Between the clumps
// the strand is dim, and the mean over time is the picture as it was.
// The clumps of one lane at the place x along the strand (from the left foot, span the whole length, both
// in the distance between the feet). layer: lanes, spacing, length, seed. speeds: low, slowest, fastest, amount.
float clumps(float lane, float x, float span, float t, vec4 layer, vec4 speeds) {
  float h1 = lh(lane, layer.w);
  float h2 = lh(lane, layer.w + 3.1);
  float xd = lh(lane, layer.w + 5.9) < uStream.w ? span - x : x;
  float ph = (xd - mix(speeds.y, speeds.z, h1) * t) / layer.y + h2 * 37.0;
  float n = floor(ph);
  float f = ph - n;
  float sum = 0.0;
  for (int i = 0; i < 2; i++) {
    float c = n + float(i);
    float len = layer.z / layer.y * (0.6 + 0.8 * lh(c, lane + 4.1));
    float d = 0.3 + 0.5 * lh(c, lane + 2.9) + float(i) - f;
    sum += step(lh(lane + 0.5, c), uStreamEnds.z) * (0.5 + 0.5 * lh(c, lane + 7.3)) * smoothstep(-uStream.z * len, 0.0, d) * exp(-max(d, 0.0) / len);
  }
  return sum;
}
// One layer of the flow as a factor on the light: two sets of lanes half a lane apart, each lane seen through
// a window, and the two windows add up to one, so no seam between lanes can show.
float stream(float high, float x, float span, float t, vec4 layer, vec4 speeds) {
  float y = high * layer.x + layer.w;
  float lane = floor(y);
  float w = sin(3.14159265 * (y - lane));
  w *= w;
  float c = w * clumps(lane, x, span, t, layer, speeds) + (1.0 - w) * clumps(floor(y + 0.5) + 0.31, x, span, t, layer, speeds);
  return mix(1.0, speeds.x + speeds.w * c, 1.0 - smoothstep(0.35, 0.8, fwidth(y)));
}
// A few strands lead, thick and bright, and the many others are faint (mail 250): 1 on a leading lane.
// Lanes are equal steps of the height of a strand's top, two sets half a lane apart as in the flow.
float leadPick(float lane) {
  return 1.0 - smoothstep(uLead.y - 0.04, uLead.y + 0.04, lh(lane, 8.77));
}
float leading(float high) {
  float y = high * uLead.x + 0.63;
  float lane = floor(y);
  float w = sin(3.14159265 * (y - lane));
  w *= w;
  return mix(w * leadPick(lane) + (1.0 - w) * leadPick(floor(y + 0.5) + 0.31), uLead.y, smoothstep(0.35, 0.8, fwidth(y)));
}
// How bright the drop is that left the top of its lane at this time: the rain comes in gusts.
// race: the knots that the release sends down both legs (mail 327 point 2); they leave in one volley of their own.
float dropAt(float lane, float n, float launch, float side, float race) {
  float g = uRainLane.w;
  for (int i = 0; i < 4; i++) {
    float q = (launch - uGusts[i].x) / uGusts[i].y;
    g += uGusts[i].z * exp(-q * q);
  }
  float v = (launch - uRaceGust.x) / uRaceGust.y;
  g = mix(g, uRaceGust.z * exp(-v * v), race);
  return step(lh(lane + side * 3.0 + 0.5, n), clamp(mix(uRainLane.z, 1.0, race) * g, 0.0, 1.0)) * (0.5 + 0.5 * lh(n, lane + 1.7 + side)) * (0.6 + 0.4 * min(g, 1.5)) * mix(1.0, min(g, 1.0), race);
}
// Rain: drops that leave the top of a strand and fall down its leg, faster and longer as they fall.
float rainFall(float arc, float s, float t, float lanes, float seed, vec4 fall, vec4 more, float race) {
  float u = abs(2.0 * s - 1.0);
  float side = step(0.5, s);
  float x = arc * lanes + seed;
  float lane = floor(x);
  float fx = x - lane;
  float win = smoothstep(0.0, 0.3, fx) * (1.0 - smoothstep(0.7, 1.0, fx)) * (1.0 - smoothstep(0.35, 0.8, fwidth(x)));
  float h1 = lh(lane, seed + side * 11.0);
  float h2 = lh(lane, seed + 2.3 + side * 11.0);
  float period = mix(more.x, more.y, h1);
  float fell = sqrt(2.0 * max(u - fall.w, 0.0) / fall.z);
  float d = (t - fell) / period + h2;
  float n = floor(d);
  float e = (d - n) * period;
  float streak = dropAt(lane, n, (n - h2) * period, side, race) * exp(-e / more.w)
    + dropAt(lane, n + 1.0, (n + 1.0 - h2) * period, side, race) * exp(-(period - e) * (period - e) / (more.z * more.z));
  return win * smoothstep(fall.w, fall.w + 0.12, u) * (1.0 - smoothstep(0.96, 1.0, u)) * streak * (0.55 + 0.75 * u);
}
float packets(vec2 q, float t) {
  float a = textureLod(uNoise, vec2(q.x - t * uFlow.w, fract(q.y)), 0.0).r;
  float b = textureLod(uNoise, vec2(q.x * 2.3 - t * uFlow.w * 1.9, fract(q.y * 1.7 + 0.37)), 0.0).r;
  float c = textureLod(uNoise, vec2(q.x * 1.4 + t * uFlowMore.x, fract(q.y * 1.3 + 0.61)), 0.0).r;
  return a * a * a * 2.6 + b * b * b * 1.6 + c * c * c * 1.2;
}
void main() {
  if (uDiag >= 2 && uDiag != 5) discard;
  vec2 a = stImage(vStage);
  vec2 p = swayed(vec2((a.x - 0.5) * 2.0 * ST_TAN.x, (0.5 - a.y) * 2.0 * ST_TAN.y), uTime);
  a = vec2(0.5 + 0.5 * p.x / ST_TAN.x, 0.5 - 0.5 * p.y / ST_TAN.y);
  vec2 uv = vec2((a.x - uBox.x) / (uBox.z - uBox.x), 1.0 - (a.y - uBox.y) / (uBox.w - uBox.y));
  vec2 dx = dFdx(uv) * uGrad;
  vec2 dy = dFdy(uv) * uGrad;
  vec3 lin = inverseFilmic(grade(textureGrad(uMap, uv, dx, dy).rgb, 1.0));
  // the brightest this sample may get: what the picture has here, or the bound of the life, whichever is more
  float most = max(uBound, max(lin.r, max(lin.g, lin.b)));
  vec2 pa = uFeet.xy - p;
  vec2 pb = uFeet.zw - p;
  float la = length(pa);
  float lb = length(pb);
  float arc = acos(clamp(dot(pa, pb) / max(la * lb, 1e-6), -1.0, 1.0));
  float along = la / max(la + lb, 1e-6);
  vec2 q = vec2(along * uFlow.z, arc * uFlow.y);
  float run = packets(q, uTime) - packets(q, 0.0);
  float lane = textureLod(uNoise, vec2(arc * uSwell.w, 0.37), 0.0).r;
  float ds = fract(along - uTime * uSwell.y * (0.75 + 0.5 * lane) - lane * 3.0) - 0.5;
  float swell = exp(-ds * ds / (uSwell.z * uSwell.z)) * smoothstep(0.0, 0.14, along) * (1.0 - smoothstep(0.86, 1.0, along)) * (1.0 - exp(-uTime * uTime / (uCalm * uCalm)));
  float strand = (1.0 - smoothstep(uFlowMask.x, uFlowMask.y, arc)) * smoothstep(uFlowMask.z, uFlowMask.w, dot(lin, vec3(0.3, 0.5, 0.2)));
  float wave = strand * (uFlow.x * run + uSwell.x * swell);
  lin *= 1.0 + (wave < 0.0 ? -uFlowMore.y * (1.0 - exp(wave / uFlowMore.y)) : wave);
  vec2 abL = (uFeet.zw - uFeet.xy) / length(uFeet.zw - uFeet.xy);
  float sL = acos(clamp(dot(pb, abL) / max(lb, 1e-6), -1.0, 1.0)) / max(3.14159265 - arc, 1e-3);
  float shineL = dot(lin, vec3(0.3, 0.5, 0.2));
  float onL = smoothstep(0.0, 0.02, abL.x * (p.y - uFeet.y) - abL.y * (p.x - uFeet.x)) * smoothstep(0.75, 1.0, arc) * smoothstep(uFlowMask.z, uFlowMask.w, shineL);
  // the flow view of the diagnostics shows where each strand runs: which strand, how far along it, and whether it is lit
  if (uDiag == 5) {${knots ? `
    if (uPeel.x < 0.5) discard;` : ''}
    outColor = vec4(arc / 3.14159265, sL, onL, 1.0);
    return;
  }
  float ends = smoothstep(uStreamEnds.x, uStreamEnds.y, sL) * (1.0 - smoothstep(1.0 - uStreamEnds.y, 1.0 - uStreamEnds.x, sL)) * (1.0 - smoothstep(uStreamEnds.w, uStreamEnds.w + 0.3, arc));
  float highL = 0.5 / tan(0.5 * clamp(arc, 0.05, 3.1));
  float spanL = (3.14159265 - arc) / max(sin(arc), 0.2);
  float streamL = stream(highL, sL * spanL, spanL, uSince, uStreamLayer[0], uStreamMix[0]) * stream(highL, sL * spanL, spanL, uSince, uStreamLayer[1], uStreamMix[1]);
  float flowL = mix(1.0, streamL, onL * ends);
  float leadL = leading(highL);
  float rainL = uRain.x * (rainFall(arc, sL, uSince, uRainLane.x, 2.71, uRain, uRainMore, 0.0) + rainFall(arc, sL, uSince, uRainLane.y, 6.13, uRain, uRainMore, 0.0));
  float raceL = 0.0;
  for (int k = 0; k < (uRaceGust.w > 0.0 ? 1 : 0); k++) raceL = rainFall(arc, sL, uSince, uRace.y, 4.17, uRace, uRaceMore, 1.0) + rainFall(arc, sL, uSince, uRaceGust.w, 8.9, uRace, uRaceMore, 1.0);
  // the loops of the arcade light up one after another: each from its feet to its top, then it cools
  float litL = 0.0;
  for (int k = 0; k < (uLightMore.z > 0.0 ? 1 : 0); k++) {
    float fromFoot = abs(2.0 * sL - 1.0);
    for (int i = 0; i < 8; i++) {
      float q = (arc - uLight[i].x) / uLight[i].y;
      litL += uLight[i].z * exp(-q * q) * smoothstep(uLight[i].w - 0.2, uLight[i].w + 0.05, fromFoot);
    }
    litL *= 0.4 + 1.2 * textureLod(uNoise, vec2(highL * uLightMore.y, 0.83), 0.0).r;
  }
  float footL = uFootLife.x * exp(-sL / uFootLife.z) + uFootLife.y * exp(-(1.0 - sL) / uFootLife.z);${knots ? `
  for (int k = 0; k < (uKnot.x > 0.0 ? 1 : 0); k++) {
    vec2 ab = uFeet.zw - uFeet.xy;
    float apart = length(ab);
    ab /= apart;
    float s = acos(clamp(dot(pb, ab) / max(lb, 1e-6), -1.0, 1.0)) / max(3.14159265 - arc, 1e-3);
    float span = apart * (3.14159265 - arc) / max(sin(arc), 0.2);
    float bundle = 0.5 + 0.5 * sin(arc * uKnotLane.z + 1.3) * cos(arc * uKnotLane.w + 0.4);
    float gap = uKnot.y * uKnot.z;
    float phase = uKnotMore.x / uKnot.z - bundle * uKnotMore.y - s * span / gap;
    float nth = floor(phase + 0.5);
    float ds = (phase - nth) * gap;
    float pick = uKnotPick.w + (1.0 - uKnotPick.w) * smoothstep(uKnotPick.y, uKnotPick.z, textureLod(uNoise, vec2(arc * uKnotPick.x, fract(nth * 0.3183 + 0.17)), 0.0).r);
    float above = smoothstep(0.0, 0.02, ab.x * (p.y - uFeet.y) - ab.y * (p.x - uFeet.x));
    float shine = dot(lin, vec3(0.3, 0.5, 0.2));
    float seen = above * smoothstep(0.75, 1.0, arc) * smoothstep(uFlowMask.z, uFlowMask.w, shine);
    float knot = uKnot.x * pick * exp(-ds * ds / (uKnot.w * uKnot.w)) * smoothstep(uKnotEnds.x, uKnotEnds.y, s) * (1.0 - smoothstep(1.0 - uKnotEnds.y, 1.0 - uKnotEnds.x, s)) * (1.0 - smoothstep(uKnotLane.x, uKnotLane.y, arc)) * seen;
    knot += seen * (uFoot.x * exp(-s / uKnotMore.w) + uFoot.y * exp(-(1.0 - s) / uKnotMore.w));
    // a knot or a lit foot cannot burn a strand out: what it adds is bent over where the strand is bright already
    knot /= 1.0 + uFlare.z * knot * shine;
    lin = lin * (1.0 + knot) + shine * knot * uKnotMore.z * vec3(1.0, 0.9, 0.66);
    for (int j = 0; j < (uSurge.y + uFlare.x + uFlare.y + uFlash.x > 0.0 ? 1 : 0); j++) {
      float strandLag = textureLod(uNoise, vec2(arc * uSurgeLane.x, 0.83), 0.0).r;
      float lead = s - uSurge.x + uSurgeMore.x * (bundle + strandLag - 1.0);
      float ahead = max(lead, 0.0);
      float passed = exp(-ahead * ahead / (uSurge.z * uSurge.z));
      float trail = exp(min(lead, 0.0) / uSurge.w);
      float front = passed * trail + uSurgeCore.x * exp(-lead * lead / (uSurgeCore.y * uSurgeCore.y));
      float held = passed * (1.0 - trail) * uHold.x * smoothstep(uHoldEnds.x, uHoldEnds.y, min(s, 1.0 - s));
      float shaped = uSurge.y * above * smoothstep(0.75, 1.0, arc) * (1.0 - uSurgeInner.z * smoothstep(uSurgeInner.x, uSurgeInner.y, arc)) * (uSurgeCrest.x + uSurgeCrest.y * 4.0 * clamp(s * (1.0 - s), 0.0, 0.25));
      float onStrand = smoothstep(uFlowMask.z, uFlowMask.w, shine) * (uSurgeLane.y + uSurgeLane.z * strandLag);
      float wide = dot(inverseFilmic(grade(textureLod(uMap, uv, uSurgeMore.w).rgb, 1.0)), vec3(0.3, 0.5, 0.2));
      float pushed = shaped * front * onStrand;
      pushed /= 1.0 + uFlare.z * pushed * dot(lin, vec3(0.3, 0.5, 0.2));
      float kept = shaped * held * onStrand;
      vec3 surged = lin * (1.0 + pushed + kept) + shine * (pushed + kept * uHold.z) * uSurgeMore.y * vec3(1.0, 0.9, 0.66) + wide * uSurgeMore.z * uSurgeGlow * shaped * (front + held * uHold.y);
      // near a foot the wave is thrown light like the flare: bound there, free along the arc
      lin = mix(surged, thrownOn(lin, surged), min(exp(-s / uKnotMore.w) + exp(-(1.0 - s) / uKnotMore.w), 1.0));
      float foot = uFlare.x * exp(-s / uKnotMore.w) + uFlare.y * exp(-(1.0 - s) / uKnotMore.w);
      float flared = seen * foot;
      flared /= 1.0 + uFlare.z * flared * dot(lin, vec3(0.3, 0.5, 0.2));
      lin = thrownOn(lin, lin * (1.0 + flared) + shine * flared * uKnotMore.z * vec3(1.0, 0.9, 0.66) + wide * uFlare.w * uSurgeGlow * foot);
      float inKnot = exp(-(arc - uFlashGlow.z) * (arc - uFlashGlow.z) / (uFlashGlow.w * uFlashGlow.w));
      float crest = uFlash.x * exp(-(s - 0.5) * (s - 0.5) / (uFlash.y * uFlash.y)) * inKnot;
      float burnt = seen * crest;
      burnt /= 1.0 + uFlare.z * burnt * dot(lin, vec3(0.3, 0.5, 0.2));
      float haze = dot(inverseFilmic(grade(textureLod(uMap, uv, uFlashGlow.y).rgb, 1.0)), vec3(0.3, 0.5, 0.2));
      lin = lin * (1.0 + burnt) + shine * burnt * uFlash.z * vec3(1.0, 0.9, 0.66) + (wide * uFlash.w + haze * uFlashGlow.x) * uFlashTint * (crest * above);
    }
  }` : ''}
  // beads and drops sit on the cores of the strands: where the picture is brighter than its own surroundings
  vec3 wideC = inverseFilmic(grade(textureLod(uMap, uv, uCore.z).rgb, 1.0));
  float wideL = dot(wideC, vec3(0.3, 0.5, 0.2));
  float coreL = smoothstep(uCore.x, uCore.y, (shineL - wideL) / max(wideL, 0.03));
  // a clump cannot burn the strand out: what it adds is bent over where the strand is bright already
  float carried = max(flowL - 1.0, 0.0);
  carried /= 1.0 + uStream.y * carried * shineL;
  // a racing knot is a clump of strands, not one strand: it lights their cores and, softer, the strands themselves
  // on the lower leg, where the strands run together toward the foot, a knot is its bright cores only: no veil over the foot
  float raceLow = smoothstep(uRaceLow.x, uRaceLow.y, min(sL, 1.0 - sL));
  float dropL = coreL * rainL + uRace.x * raceL * (uRaceGlow.y * raceLow + (1.0 - uRaceGlow.y) * coreL);
  float warm = dropL + footL + litL;
  float bent = 1.0 / (1.0 + uLightKnee.x * warm * shineL);
  warm *= bent;
  float lifeL = onL * warm;
  // the leading strands: brighter, and with a soft body from the picture seen wide, which runs with the clumps
  float bodyOn = ends * smoothstep(0.0, 0.02, abL.x * (p.y - uFeet.y) - abL.y * (p.x - uFeet.x)) * smoothstep(0.75, 1.0, arc) * smoothstep(uFlowMask.z, uFlowMask.w, wideL);
  float bodyL = leadL * bodyOn;
  // and it has a soft body from the picture seen wide, so that it reads as matter and not as a spark
  vec3 raceBody = wideC * (uRaceGlow.x * bodyOn * raceLow * min(raceL, 1.5));
  vec3 plain = lin;
  // the rain does not rest at the calm moment (mail 327 point 1): there its drops fall on the picture itself
  float bentD = onL * dropL / (1.0 + uLightKnee.x * dropL * shineL);
  vec3 wet = plain * (1.0 + bentD) + shineL * (bentD * uRain.y) * vec3(1.0, 0.9, 0.66) + raceBody;
  lin = lin * mix(1.0, mix(uLead.z, uLead.w, leadL), onL * ends) * (min(flowL, 1.0) + carried - uCore.w * onL * coreL + lifeL) + shineL * (carried * uStream.x + onL * bent * (dropL * uRain.y + footL * uRain.y + litL * uLightMore.x)) * vec3(1.0, 0.9, 0.66)
    + wideC * (uLeadMore.x * bodyL * min(streamL, uLeadMore.y) * (1.0 + uLightKnee.y * bent * litL)) + raceBody;
  // the life's own light falls to nil round the moment named in life.json (calm): there the strands are the picture itself
  lin = mix(wet, lin, uLifeOn);
  // the knots are gathered from the strands: while the volley is on its way the strands between the knots are thinner,
  // so the arcade as a whole is no brighter for it (frame 60 is judged beside the approved image)
  lin *= 1.0 - uRaceThin * onL * (1.0 - min(raceL, 1.0));
  float climb = exp(-along / uBurst.z) + uBurstMore.x * exp(-(1.0 - along) / uBurst.z);
  float glow = dot(lin, vec3(0.3, 0.5, 0.2));
  for (int k = 0; k < (uCut > 0.0 ? 1 : 0); k++) lin *= clamp((glow - uCut) / (3.0 * uCut), 0.0, 1.0) * (1.0 - uTrim.z * (1.0 - smoothstep(uTrim.x, uTrim.y, arc))) * (1.0 - uTrim.z * smoothstep(uPinCut.x, uPinCut.y, vPin));
  float lit = uBurst.x * uBurst.y * (uBurst.w + (1.0 - uBurst.w) * min(climb, 1.0)) * smoothstep(uBurstMore.z, uBurstMore.z * 6.0, glow);
  lin = lin * (1.0 + lit) + glow * lit * uBurstMore.y * vec3(1.0, 0.9, 0.66);${knots ? `
  for (int k = 0; k < (uPeel.y != 0.0 ? 1 : 0); k++) {
    float band = textureLod(uNoise, vec2(arc * uPeelPick.z, 0.59), 0.0).r + uPeelOuter.z * (1.0 - smoothstep(uPeelOuter.x, uPeelOuter.y, arc)) + uPeelTear.x * (textureLod(uNoise, vec2(along * uPeelTear.y, 0.31 + arc * uPeelTear.z), 0.0).r - 0.5);
    lin *= uPeel.x + uPeel.y * smoothstep(uPeelPick.x, uPeelPick.y, band) * smoothstep(uPeelGate.x, uPeelGate.y, arc) * (1.0 - smoothstep(uPeelGate.z, uPeelGate.w, arc));
  }
  // the thrown arc opens at its top and falls back down both legs, each strand at its own pace, the falling ends bright
  for (int k = 0; k < (uGap.x > 0.0 ? 1 : 0); k++) {
    float fromTop = abs(2.0 * sL - 1.0);
    float edge = uGap.x * (0.55 + 0.9 * textureLod(uNoise, vec2(arc * 7.0, 0.47), 0.0).r);
    // No strand ends in a cut (mail 260 point 2). Below the opening a strand breaks up over a stretch that grows
    // as it falls: first gaps, then clumps, then single drops, dimmer the nearer the opening. The drops run down
    // the leg with the opening (uGapMore.z times as fast), so they fall and do not stand.
    float s = clamp((fromTop - edge) / (uGap.y + uGapMore.x * uGap.x), 0.0, 1.0);
    float n = textureLod(uNoise, vec2((fromTop - uGapMore.z * uGap.x) * uGapMore.y, fract(arc * 0.66 + 0.21)), 0.0).r;
    float thr = (1.0 - s) * 1.25 - 0.25;
    float drop = smoothstep(thr, thr + 0.25, n);
    lin *= drop * mix(uGapMore.w, 1.0, s * s) * (1.0 + uGap.z * (1.0 - s) * smoothstep(0.55, 0.9, n) * exp(-max(fromTop - edge, 0.0) / uGap.w));
  }` : ''}
  // no single sample outshines the picture's own white (mail 260 point 5): bound before the samples are added up
  lin *= min(1.0, most / max(max(lin.r, max(lin.g, lin.b)), 1e-6));
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  lin *= uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = vec4(lin, 0.0);
}`

function noise(size: number): Float32Array {
  const data = new Float32Array(size * size)
  let seed = 0x2f6e2b1
  const next = (): number => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  const knots = 24
  const row = new Float32Array(knots)
  for (let y = 0; y < size; y++) {
    for (let k = 0; k < knots; k++) row[k] = next()
    const shift = next()
    for (let x = 0; x < size; x++) {
      const at = ((x / size + shift) % 1) * knots
      const i = Math.floor(at)
      const t = at - i
      const s = t * t * (3 - 2 * t)
      data[y * size + x] = row[i % knots]! * (1 - s) + row[(i + 1) % knots]! * s
    }
  }
  return data
}

export class Loops {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly gain: number
  private readonly reach: [number, number]
  private readonly knots: KnotsLook | undefined
  private readonly across: number
  private readonly peel: THREE.Mesh | undefined
  private readonly shed: THREE.ShaderMaterial | undefined

  constructor(map: THREE.Texture, grade: THREE.Texture, noiseTexture: (data: Float32Array, size: number) => THREE.Texture, look: LoopsLook, knots?: KnotsLook) {
    this.gain = look.gain
    this.reach = look.burst.reach
    this.knots = knots
    const [fa, fb] = stage.feet as [[number, number], [number, number]]
    const tan = (f: [number, number]): THREE.Vector2 => new THREE.Vector2((f[0] - 0.5) * 2 * stage.tan[0], (0.5 - f[1]) * 2 * stage.tan[1])
    const ta = tan(fa)
    const tb = tan(fb)
    const footA = stage.onGround(fa[0], fa[1])
    const footB = stage.onGround(fb[0], fb[1])
    const axis = footB.clone().sub(footA).normalize()
    const mid = footA.clone().add(footB).multiplyScalar(0.5)
    const up = mid.clone().sub(stage.centre).normalize()
    const toward = up.clone().cross(axis).normalize()
    if (toward.dot(mid) > 0) toward.negate()
    const box = stage.loopsBox
    const [nx, ny] = look.grid
    const positions = new Float32Array((nx + 1) * (ny + 1) * 3)
    const late = new Float32Array((nx + 1) * (ny + 1) * 3)
    const grow = new Float32Array((nx + 1) * (ny + 1) * 3)
    const pinned = new Float32Array((nx + 1) * (ny + 1))
    const lineDir = tb.clone().sub(ta).normalize()
    const lineNormal = new THREE.Vector2(-lineDir.y, lineDir.x)
    const feetApart = ta.distanceTo(tb)
    this.across = knots ? (feetApart * (Math.PI - knots.feet.lane)) / Math.sin(knots.feet.lane) : 0
    const horizon = Math.sqrt((stage.radius + 1) ** 2 - stage.radius ** 2)
    const smooth = (x: number, lo: number, hi: number): number => {
      const t = Math.min(Math.max((x - lo) / (hi - lo), 0), 1)
      return t * t * (3 - 2 * t)
    }
    const normal = new THREE.Vector3()
    const lift = new THREE.Vector3()
    for (let j = 0; j <= ny; j++) {
      for (let i = 0; i <= nx; i++) {
        const ax = box[0] + ((box[2] - box[0]) * i) / nx
        const ay = box[1] + ((box[3] - box[1]) * j) / ny
        const r = stage.ray(ax, ay)
        const p = new THREE.Vector2(r.x, r.y)
        const pa = ta.clone().sub(p)
        const pb = tb.clone().sub(p)
        const arc = Math.acos(Math.min(Math.max(pa.dot(pb) / Math.max(pa.length() * pb.length(), 1e-9), -1), 1))
        const share = smooth(arc, look.lean.from, look.lean.to)
        const hit = stage.groundDistance(ax, ay)
        const tGround = (hit > 0 ? hit : look.far) / r.length()
        const under = smooth(-(p.clone().sub(ta).dot(lineNormal)), 0.0, 0.05)
        const span = p.clone().sub(ta).dot(lineDir) / feetApart
        const above = THREE.MathUtils.radToDeg(Math.acos(Math.min(Math.max(r.clone().normalize().dot(stage.down), -1), 1)) - stage.alpha)
        const pin = smooth(span, look.pin.from, look.pin.from + look.pin.soft) * (1 - smooth(span, 1 - look.pin.from - look.pin.soft, 1 - look.pin.from)) * (1 - smooth(above, look.pin.lowDeg, look.pin.highDeg))
        pinned[j * (nx + 1) + i] = pin
        const place = (outerDeg: number, innerDeg: number, into: Float32Array): number => {
          const lean = THREE.MathUtils.degToRad(outerDeg + (innerDeg - outerDeg) * share)
          lift.copy(up).multiplyScalar(Math.cos(lean)).addScaledVector(toward, Math.sin(lean))
          normal.copy(axis).cross(lift).normalize()
          const denom = r.dot(normal)
          let t = Math.abs(denom) > 1e-5 ? footA.dot(normal) / denom : tGround
          if (!(t > 0.3)) t = tGround
          t = Math.min(t, hit > 0 ? tGround * 1.15 : tGround)
          const held = t + ((hit > 0 ? tGround : horizon / r.length()) - t) * pin
          const k = held + (tGround - held) * under
          r.clone().multiplyScalar(k).toArray(into, (j * (nx + 1) + i) * 3)
          return k
        }
        const high = Math.max(p.clone().sub(ta).dot(lineNormal), 0) * place(look.lean.outerDeg, look.lean.innerDeg, positions)
        grow[(j * (nx + 1) + i) * 3] = lineNormal.x * high
        grow[(j * (nx + 1) + i) * 3 + 1] = lineNormal.y * high
        place(look.lean.late[0], look.lean.late[1], late)
      }
    }
    const index: number[] = []
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const a = j * (nx + 1) + i
        index.push(a, a + nx + 1, a + 1, a + 1, a + nx + 1, a + nx + 2)
      }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aLate', new THREE.BufferAttribute(late, 3))
    geometry.setAttribute('aGrow', new THREE.BufferAttribute(grow, 3))
    geometry.setAttribute('aPin', new THREE.BufferAttribute(pinned, 1))
    geometry.setIndex(index)
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: frag(knots !== undefined),
      uniforms: {
        uMap: { value: map }, uGrade: { value: grade }, uNoise: { value: noiseTexture(noise(256), 256) }, uDiag: diagUniform, uGrad: gradUniform,
        uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uTime: { value: 0 },
        uBox: { value: new THREE.Vector4(box[0], box[1], box[2], box[3]) },
        uFeet: { value: new THREE.Vector4(ta.x, ta.y, tb.x, tb.y) },
        uFlow: { value: new THREE.Vector4(look.flow.amount, look.flow.lanes, look.flow.along, look.flow.speed) },
        uFlowMore: { value: new THREE.Vector2(look.flow.back, look.flow.floor) },
        uFlowMask: { value: new THREE.Vector4(look.flow.inside[0], look.flow.inside[1], look.flow.from[0], look.flow.from[1]) },
        uSwell: { value: new THREE.Vector4(look.swell.amount, look.swell.speed, look.swell.width, look.swell.lanes) }, uCalm: { value: look.swell.calm },
        uBurst: { value: new THREE.Vector4(0, look.burst.surge, look.burst.reach[0], look.burst.floor) }, uBurstMore: { value: new THREE.Vector3(look.burst.other, look.burst.white, look.burst.from) }, uCut: { value: 0 }, uTrim: { value: new THREE.Vector3(look.trim[0], look.trim[1], 0) }, uPinCut: { value: new THREE.Vector2(look.pinCut[0], look.pinCut[1]) }, uLate: { value: 0 }, uGrow: { value: 0 },
        uSince: { value: 0 },
        uSway: { value: new THREE.Vector4(arcade.sway.amount[0]!, arcade.sway.amount[1]!, arcade.sway.amount[2]!, arcade.sway.shape) },
        uSwayRate: { value: new THREE.Vector4(arcade.sway.rate[0]!, arcade.sway.rate[1]!, arcade.sway.rate[2]!, arcade.sway.breath[0]!) },
        uSwayLane: { value: new THREE.Vector4(arcade.sway.lanes[0]!, arcade.sway.lanes[1]!, arcade.sway.lanes[2]!, arcade.sway.breath[1]!) },
        uStream: { value: new THREE.Vector4(arcade.flow.white, arcade.flow.knee, arcade.flow.head, arcade.flow.back) },
        uStreamEnds: { value: new THREE.Vector4(arcade.flow.ends[0]!, arcade.flow.ends[1]!, arcade.flow.share, arcade.flow.inside) },
        uStreamLayer: { value: arcade.flow.layers.map((l) => new THREE.Vector4(l[0]!, l[1]!, l[2]!, l[3]!)) },
        // the amount of a layer follows from its low level: the mean of the factor over time is one, times lift
        uStreamMix: { value: arcade.flow.layers.map((l, i) => new THREE.Vector4(arcade.flow.low[i]!, arcade.flow.speed[i]![0]!, arcade.flow.speed[i]![1]!, (arcade.flow.lift * (1 - arcade.flow.low[i]!)) / ((arcade.flow.share * 0.75 * l[2]! * (1 + 0.5 * arcade.flow.head)) / l[1]!))) },
        uLead: { value: new THREE.Vector4(arcade.lead.lanes, arcade.lead.share, arcade.lead.faint, arcade.lead.bright) },
        uLeadMore: { value: new THREE.Vector2(arcade.lead.body, arcade.lead.most) },
        uLight: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 1, 0, 2)) },
        uLightMore: { value: new THREE.Vector3(arcade.lights.white, arcade.lights.lanes, 0) },
        uLightKnee: { value: new THREE.Vector2(arcade.lights.knee, arcade.lights.body) },
        uBound: { value: arcade.core.most },
        uLifeOn: { value: 1 },
        uRing: { value: new THREE.Vector4(0, 0, arcade.ring.behind, arcade.ring.lanes) },
        uRingRest: { value: new THREE.Vector4(0, 0, 0, 0) },
        uRingRound: { value: arcade.ring.round },
        uRain: { value: new THREE.Vector4(arcade.rain.amount, arcade.rain.white, (2 * (1 - arcade.rain.from)) / (arcade.rain.fall * arcade.rain.fall), arcade.rain.from) },
        uRainMore: { value: new THREE.Vector4(arcade.rain.period[0]!, arcade.rain.period[1]!, arcade.rain.head, arcade.rain.tail) },
        uRainLane: { value: new THREE.Vector4(arcade.rain.lanes[0]!, arcade.rain.lanes[1]!, arcade.rain.share, arcade.rain.base) },
        uGusts: { value: arcade.rain.gusts.map((g) => new THREE.Vector3(g[0]!, g[1]!, g[2]!)) },
        uRace: { value: new THREE.Vector4(arcade.race.amount, arcade.race.lanes[0]!, (2 * (1 - arcade.race.from)) / (arcade.race.fall * arcade.race.fall), arcade.race.from) },
        uRaceMore: { value: new THREE.Vector4(arcade.race.period[0]!, arcade.race.period[1]!, arcade.race.head, arcade.race.tail) },
        uRaceGust: { value: new THREE.Vector4(arcade.race.at, arcade.race.width, arcade.race.share, 0) },
        uRaceGlow: { value: new THREE.Vector2(arcade.race.body, arcade.race.strand) },
        uRaceThin: { value: 0 },
        uRaceLow: { value: new THREE.Vector2(arcade.race.low[0]!, arcade.race.low[1]!) },
        uFootLife: { value: new THREE.Vector4(0, 0, arcade.feet.reach, 0) },
        uCore: { value: new THREE.Vector4(arcade.core.from[0]!, arcade.core.from[1]!, arcade.core.level, arcade.core.dim) },
      },
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    })
    if (knots) {
      const k = knots.knots
      this.material.uniforms.uKnot = { value: new THREE.Vector4(0, k.speed, k.every, k.width) }
      this.material.uniforms.uKnotMore = { value: new THREE.Vector4(0, k.jitter, k.white, knots.feet.reach) }
      this.material.uniforms.uKnotLane = { value: new THREE.Vector4(k.inside[0], k.inside[1], k.lanes[0], k.lanes[1]) }
      this.material.uniforms.uKnotPick = { value: new THREE.Vector4(k.pick[0], k.pick[1], k.pick[2], k.pick[3]) }
      this.material.uniforms.uKnotEnds = { value: new THREE.Vector2(k.ends[0], k.ends[1]) }
      this.material.uniforms.uFoot = { value: new THREE.Vector2() }
      this.material.uniforms.uHold = { value: new THREE.Vector3(...knots.surge.hold) }
      this.material.uniforms.uHoldEnds = { value: new THREE.Vector2(...knots.surge.ends) }
      this.material.uniforms.uFlare = { value: new THREE.Vector4(0, 0, knots.surge.knee, knots.surge.bloom) }
      this.material.uniforms.uThrownMost = { value: knots.surge.most }
      const g = knots.surge
      this.material.uniforms.uSurge = { value: new THREE.Vector4(0, 0, g.width, g.tail) }
      this.material.uniforms.uSurgeMore = { value: new THREE.Vector4(g.ragged, g.white, g.halo, g.level) }
      this.material.uniforms.uSurgeLane = { value: new THREE.Vector3(g.lanes[0], g.lanes[1], g.lanes[2]) }
      this.material.uniforms.uSurgeGlow = { value: new THREE.Vector3(g.glow[0], g.glow[1], g.glow[2]) }
      this.material.uniforms.uSurgeCore = { value: new THREE.Vector2(g.core[0], g.core[1]) }
      this.material.uniforms.uSurgeInner = { value: new THREE.Vector3(g.inner[0], g.inner[1], g.inner[2]) }
      this.material.uniforms.uSurgeCrest = { value: new THREE.Vector2(g.crest[0], g.crest[1]) }
    }
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.renderOrder = 5
    this.mesh.frustumCulled = false
    if (knots) {
      const e = knots.erupt
      const u = this.material.uniforms
      u.uShear = { value: 0 }
      u.uFlash = { value: new THREE.Vector4(0, e.flash.width, e.flash.white, e.flash.wide) }
      u.uFlashGlow = { value: new THREE.Vector4(e.flash.haze, e.flash.level, e.flash.lane[0], e.flash.lane[1]) }
      u.uFlashTint = { value: new THREE.Vector3(...e.flash.tint) }
      u.uPeel = { value: new THREE.Vector2(1, 0) }
      u.uPeelPick = { value: new THREE.Vector3(e.pick[0], e.pick[1], e.lanes) }
      u.uPeelOuter = { value: new THREE.Vector3(...e.outer) }
      u.uPeelGate = { value: new THREE.Vector4(...e.gate) }
      u.uPeelTear = { value: new THREE.Vector3(...e.tear) }
      u.uGap = { value: new THREE.Vector4(0, arcade.thrown.soft, arcade.thrown.ends[0]!, arcade.thrown.ends[1]!) }
      u.uGapMore = { value: new THREE.Vector4(arcade.thrown.break, arcade.thrown.drops, arcade.thrown.drift, arcade.thrown.dim) }
      this.shed = this.material.clone()
      this.shed.uniforms = { ...u, uGrow: { value: 0 }, uShear: { value: 0 }, uPeel: { value: new THREE.Vector2(0, 0) }, uPeelPick: { value: new THREE.Vector3(e.pick[0], e.pick[1], e.lanes) }, uGap: { value: new THREE.Vector4(0, arcade.thrown.soft, arcade.thrown.ends[0]!, arcade.thrown.ends[1]!) } }
      this.peel = new THREE.Mesh(geometry, this.shed)
      this.peel.renderOrder = 5
      this.peel.frustumCulled = false
      this.peel.visible = false
      this.mesh.add(this.peel)
    }
  }

  pulse(since: number): [number, number] {
    const k = this.knots
    if (!k) return [0, 0]
    const beat = (x: number): number => {
      const d = ((x - Math.floor(x + 0.5)) * k.knots.every) / k.feet.over
      return Math.exp(-d * d)
    }
    const phase = (since + k.knots.lead) / k.knots.every - 0.5 * k.knots.jitter
    return [beat(phase), beat(phase - this.across / (k.knots.speed * k.knots.every))]
  }

  surge(since: number, open: number): [number, number, number, number, number] {
    const g = this.knots?.surge
    if (!g || open <= 0 || since <= g.from || since >= g.end) return [0, 0, 0, 0, 0]
    const ease = (x: number): number => {
      const t = Math.min(Math.max(x, 0), 1)
      return t * t * (3 - 2 * t)
    }
    const bump = (t: number): number => (t > 0 ? (t / g.peak) * Math.exp(1 - t / g.peak) : 0)
    const gone = open * (1 - ease((since - g.end + g.settle) / g.settle))
    const head = -g.lead + (1 + 2 * g.lead) * Math.min((since - g.from) / (g.land - g.from), 1)
    const amount = g.amount * ease((since - g.from) / g.rise) * (1 - ease((since - g.land - g.keep) / g.fade))
    const grow = g.grow[0] * (since < g.grow[1] ? ease((since - g.from) / (g.grow[1] - g.from)) : 1 - ease((since - g.grow[1]) / (g.end - g.grow[1])))
    return [head, amount * gone, g.launch * bump(since - g.from) * gone, g.flare * bump(since - g.land + g.early) * gone, grow]
  }

  erupt(since: number, open: number): [number, number, number] {
    const e = this.knots?.erupt
    const g = this.knots?.surge
    if (!e || !g || open <= 0 || since >= g.end) return [0, 0, 0]
    const x = Math.min(Math.max((since - g.end + g.settle) / g.settle, 0), 1)
    const gone = open * (1 - x * x * (3 - 2 * x))
    const after = since - e.from
    const thrown = Math.max(after, 0) / e.time
    const lifted = e.top * (1 - Math.exp(-thrown * thrown / (1 + thrown)))
    const t = since - e.flash.at
    return [lifted, after > 0 ? gone : 0, t > 0 ? (t / e.flash.peak) * Math.exp(1 - t / e.flash.peak) * (1 - Math.exp(-t * t / (e.flash.ease * e.flash.ease))) * gone : 0]
  }

  /**
   * The flash of the eruption as the ground under it takes it. The same light as the flare's own flash, but it comes
   * up over arcade.flash.ground seconds: the flare's flash rises inside one film frame, and on the wide ground that
   * was a step of the whole picture from one frame to the next.
   */
  flashGround(since: number, open: number): number {
    const e = this.knots?.erupt
    const g = this.knots?.surge
    if (!e || !g || open <= 0 || since >= g.end) return 0
    const x = Math.min(Math.max((since - g.end + g.settle) / g.settle, 0), 1)
    const gone = open * (1 - x * x * (3 - 2 * x))
    const t = since - e.flash.at
    const ease = arcade.flash.ground
    return t > 0 ? arcade.flash.gain * (t / e.flash.peak) * Math.exp(1 - t / e.flash.peak) * (1 - Math.exp((-t * t) / (ease * ease))) * gone : 0
  }

  /** The swing of the ringing arcade at this time, as the two parts of one wave (shares of the distance between the feet). */
  ring(since: number): [number, number] {
    const r = arcade.ring
    const ease = (x: number): number => {
      const t = Math.min(Math.max(x, 0), 1)
      return t * t * (3 - 2 * t)
    }
    const out = 1 - ease((since - r.end[0]!) / (r.end[1]! - r.end[0]!))
    let a = 0
    let b = 0
    for (const hit of r.hits) {
      const t = since - hit[0]!
      if (t <= 0 || out <= 0) continue
      const size = hit[1]! * ease(t / r.rise) * Math.exp(-Math.max(t - r.rise, 0) / r.fade) * out
      const at = (2 * Math.PI * t) / r.period
      a += size * Math.cos(at)
      b += size * Math.sin(at)
    }
    return [a, b]
  }

  /** How hard the rain lands on the two feet at this time (left, right): the gusts, later by the fall. */
  landed(since: number): [number, number] {
    const r = arcade.rain
    const f = arcade.feet
    const at = (t: number, k: number): number => {
      let sum = f.base
      for (const g of r.gusts) {
        const q = (t - g[0]! - r.fall) / g[1]!
        sum += g[2]! * Math.exp(-q * q)
      }
      const v = (t - arcade.race.at - arcade.race.fall) / arcade.race.width
      sum += arcade.race.land * Math.exp(-v * v)
      return sum * (1 + f.flicker[0]! * (0.6 * Math.sin(f.flicker[1]! * t + k) + 0.4 * Math.sin(f.flicker[1]! * 1.83 * t + 2.2 * k)))
    }
    return [at(since + f.lag[0]!, 0.4), at(since + f.lag[1]!, 2.9)]
  }

  /** How bright a loop of the arcade is this long after it lit up: a quick rise, a short stay, a slow cooling. */
  lamp(t: number): number {
    const l = arcade.lights
    if (t <= 0) return 0
    if (t < l.rise) return (t / l.rise) * (t / l.rise) * (3 - (2 * t) / l.rise)
    return t < l.rise + l.keep ? 1 : Math.exp(-(t - l.rise - l.keep) / l.fall)
  }

  /** How far out the thrown shell is at this time, past the lift that shapes it: it keeps travelling at a steady pace (mail 327 point 2). */
  gone(since: number): number {
    const e = this.knots?.erupt
    if (!e) return 0
    const t = Math.max(since - e.from, 0)
    return arcade.thrown.go * ((t * t) / (e.time + t))
  }

  /** The light the thrown shell throws on the ground under it: it rises as the shell leaves and falls as it breaks up. */
  shell(since: number, open: number): number {
    const e = this.knots?.erupt
    if (!e || open <= 0 || since <= e.from) return 0
    const after = (since - e.from) / e.time
    const rest = 1 - this.fallen(since)
    return arcade.thrown.ground * (1 - Math.exp((-after * after) / (1 + after))) * rest * Math.sqrt(rest)
  }

  /** How much thinner the strands between the racing knots are at this time: from the launch of the volley to its landing. */
  thinned(since: number): number {
    const r = arcade.race
    const ease = (x: number): number => {
      const t = Math.min(Math.max(x, 0), 1)
      return t * t * (3 - 2 * t)
    }
    return r.thin * ease((since - r.at + r.width) / (2 * r.width)) * (1 - ease((since - r.at - r.fall + r.width) / (2 * r.width)))
  }

  /** How far the thrown arc has fallen back at this time: 0 while it is whole, 1 when its ends are down. */
  fallen(since: number): number {
    const f = arcade.thrown
    return Math.min(Math.max((since - f.open) / (f.down - f.open), 0), 1)
  }

  /** The light of the landing rain and of the loops that light up on the ground round the feet, as a share added to the glow. */
  lit(since: number): number {
    const [a, b] = this.landed(since)
    let lamps = 0
    for (const e of arcade.lights.list) lamps += e[3]! * this.lamp(since - e[0]!)
    return arcade.feet.ground * 0.5 * (a + b) + arcade.lights.ground * lamps
  }

  update(time: number, gain: number, vignette: number, aspect: number, burst: number, cut = 0, late = 0, open = 0, since = 0, live = false, calm = 1, calmAt = 0): void {
    const u = this.material.uniforms
    u.uLifeOn!.value = calm
    u.uSince!.value = since
    const ring = this.ring(live ? since : -1)
    ;(u.uRing!.value as THREE.Vector4).x = ring[0]
    ;(u.uRing!.value as THREE.Vector4).y = ring[1]
    const rest = this.ring(live ? since - time + calmAt : -1)
    ;(u.uRingRest!.value as THREE.Vector4).set(rest[0], rest[1], 1 - calm, calmAt)
    const landed = this.landed(since)
    const foot = u.uFootLife!.value as THREE.Vector4
    foot.x = arcade.feet.amount * landed[0]
    foot.y = arcade.feet.amount * landed[1]
    const lights = arcade.lights
    const lamps = u.uLight!.value as THREE.Vector4[]
    let any = 0
    lights.list.forEach((e, i) => {
      const level = this.lamp(since - e[0]!)
      lamps[i]!.set(e[1]!, e[2]!, e[3]! * level, 1 - 1.25 * Math.min(Math.max((since - e[0]!) / lights.climb, 0), 1))
      any += level
    })
    ;(u.uLightMore!.value as THREE.Vector3).z = any
    ;(u.uRaceGust!.value as THREE.Vector4).w = live ? arcade.race.lanes[1]! : 0
    u.uRaceThin!.value = live ? this.thinned(since) : 0
    if (this.knots) {
      const k = this.knots
      const [a, b] = this.pulse(since)
      const [head, amount, launch, flare, grow] = this.surge(since, open)
      u.uGrow!.value = grow
      ;(u.uKnot!.value as THREE.Vector4).x = k.knots.amount * open
      ;(u.uKnotMore!.value as THREE.Vector4).x = since + k.knots.lead
      ;(u.uFoot!.value as THREE.Vector2).set(k.feet.amount * open * a, k.feet.amount * open * b)
      const f = u.uFlare!.value as THREE.Vector4
      f.x = launch
      f.y = flare
      const v = u.uSurge!.value as THREE.Vector4
      v.x = head
      v.y = amount
      const [, shown, flash] = this.erupt(since, open)
      ;(u.uFlash!.value as THREE.Vector4).x = k.erupt.flash.amount * flash
      ;(u.uPeel!.value as THREE.Vector2).set(1, -k.erupt.erode * shown)
      if (this.peel && this.shed) {
        const w = this.shed.uniforms
        const e = k.erupt
        const fall = this.fallen(since)
        const after = (since - e.from) / e.time
        const up = live && after > 0 ? e.top * (1 - Math.exp((-after * after) / (1 + after))) : 0
        const there = live && after > 0 && fall < 1 ? 1 : 0
        this.peel.visible = there > 0
        const out = up + (live ? this.gone(since) : 0)
        w.uGrow!.value = grow + out
        w.uShear!.value = e.lean * out
        ;(w.uPeel!.value as THREE.Vector2).set(0, there * (e.gain[0] + (e.gain[1] - e.gain[0]) * Math.min(up / e.far, 1)) * (1 - THREE.MathUtils.smoothstep(up, e.fade[0], e.fade[1])) * (1 - arcade.thrown.thin * fall))
        ;(w.uPeelPick!.value as THREE.Vector3).set(e.pick[0] + e.thin * up + arcade.thrown.fray * fall, e.pick[1] + e.thin * up + arcade.thrown.fray * fall, e.lanes)
        ;(w.uGap!.value as THREE.Vector4).x = fall * fall * arcade.thrown.reach
      }
    }
    const lit = u.uBurst!.value as THREE.Vector4
    lit.x = burst
    lit.z = this.reach[0] + (this.reach[1] - this.reach[0]) * burst
    u.uCut!.value = cut
    u.uLate!.value = late
    u.uTime!.value = time
    u.uGain!.value = this.gain * gain
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
  }

  trim(amount: number): void {
    ;(this.material.uniforms.uTrim!.value as THREE.Vector3).z = amount
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
    this.shed?.dispose()
  }
}
