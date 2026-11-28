import * as THREE from 'three'
import type { Ending } from './ending'
import type { LimbField } from './field'
import { AIR_GLSL, airUniforms, type AirParams } from './air'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { EQUIRECT_GLSL } from '../../space/sky'
import { ownTrig } from './trig'

export const KNOTS = 33
export const MAX_LEVELS = 8

export interface CloudParams {
  height: number
  shadow: number
  shadowSoft: number
  soft: number
  shear: number
  shearBands: number
  relief: number
}

export interface StormParams {
  axis: THREE.Vector3
  radiusDeg: number
}

export interface LimbParams {
  rim: [number, number, number]
  rimWidth: number
  rimFrom: number
  rimTo: number
  rimAim: [number, number, number]
  rimMu: number
  edge: { amount: number; core: [number, number, number]; fall: number; cut: [number, number]; wide: [number, number, number]; wideDeg: number; wideEdge: [number, number]; mu: [number, number, number, number]; width: [number, number]; near: [number, number, number, number]; far: [number, number, number, number] }
  melt: [number, number, number]
  cut: number
  cutMu: [number, number]
  cutFrom: number
  cutTo: number
  cutAim: [number, number, number]
  dark: number
  darkMu: [number, number]
  darkFrom: number
  darkTo: number
  darkAim: [number, number, number]
  veil: [number, number, number]
  veilAmount: number
  veilMu: [number, number]
  veilSun: [number, number, number]
  veilAim: [number, number, number]
  twilight: [number, number, number]
  twilightSun: [number, number, number, number]
  shade: [number, number, number]
  forward: [number, number, number]
  forwardWidth: number
  forwardPower: number
}

export interface PatchSet {
  textures: THREE.Texture[]
  widthsDeg: number[]
  counts: number[]
  spot: THREE.Vector3
  feather: number
  featherOwn?: number
  fade: [number, number]
  clearDeg?: [number, number]
  shownFrom?: number
  home?: THREE.Vector3
  plainDeg?: [number, number]
  vivid?: [number, number]
  offsetsDeg?: [number, number][]
  tone?: THREE.Texture
}

export interface NeptuneOptions {
  map: THREE.Texture
  mapWidth: number
  mapCount: number
  code: number
  deck: number[][]
  cloud: number[][]
  air: AirParams
  limb: LimbParams
  clouds: CloudParams
  storm: StormParams
  field: LimbField
  near: { power: number; saturation: number; pivot: number; tint: number[] }
  night: { flat: number; edge: [number, number]; texels: number }
  patches?: PatchSet
  hold?: { map: THREE.Texture; box: number[]; head: number }
  mend?: { map: THREE.Texture; box: number[] }
  flow?: THREE.Texture
  far?: THREE.Texture
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

const SAMPLERS = Array.from({ length: MAX_LEVELS }, (_, i) => 'uniform sampler2D uPatch' + i + ';').join('\n')

// Two counts (decision d253 b, 25 Nov). The count that brings a level in (parent) is the FULL set's texels in both sets, from
// patches.json (texels, mapTexels), so the web set's levels arrive at the same height as the full set's and are only softer; until
// 25 Nov it was the loaded picture's own width, half in the web set, so its levels arrived at twice the height.
// The texel count of the texels view (diag only, no colour depends on it) stays the loaded picture's own. A level of the globe's own pyramid counts where its weight is
// at least a half. A shown plate counts by what is drawn of it, its weight times its alpha, summed from the deepest plate up: the plate at
// which half of the pixel is reached sets the count. Until 23 Nov 15:50 a shown plate counted by its weight alone, also where its alpha had
// ended (the corners of the widest plate's square), so the view called ground sharp that only the globe's own levels drew.
const weights = (shownFrom: number): string => Array.from({ length: MAX_LEVELS }, (_, i) => i < shownFrom ? `    if (uPatchCount > ${i}.5) {
      vec2 q = g * uPatchScale[${i}];
      w${i} = front * smoothstep(0.5, 0.5 - uFeatherOwn, max(abs(q.x), abs(q.y))) * (1.0 - smoothstep(uPatchFade.x, uPatchFade.y, parent * uLine));
      parent = gd * uPatchScale[${i}] * uPatchFull[${i}];
      texels = mix(texels, gd * uPatchScale[${i}] * uPatchSize[${i}], step(0.5, w${i}));
    }` : `    if (uPatchCount > ${i}.5) {
      vec2 q = (g - uPatchOff[${i}]) * uPatchScale[${i}];
      w${i} = shown * front * smoothstep(0.5, 0.5 - uFeather, max(abs(q.x), abs(q.y)))${i === shownFrom ? '' : ' * (1.0 - smoothstep(uPatchFade.x, uPatchFade.y, parent * uLine))'};
      parent = gd * uPatchScale[${i}] * uPatchFull[${i}];
      t${i} = gd * uPatchScale[${i}] * uPatchSize[${i}];
    }`).join('\n')

const fetches = (shownFrom: number): string => Array.from({ length: MAX_LEVELS }, (_, n) => MAX_LEVELS - 1 - n).map((i) => i < shownFrom ? `  float k${i} = w${i} * rest;
  rest *= 1.0 - w${i};
  for (int k = 0; k < (k${i} > 0.0 ? 1 : 0); k++) c += k${i} * textureGrad(uPatch${i}, g * uPatchScale[${i}] + 0.5, gx * uPatchScale[${i}], gy * uPatchScale[${i}]);` : `  float k${i} = w${i} * (1.0 - gShown.a);
  for (int k = 0; k < (k${i} > 0.0 ? 1 : 0); k++) {
    vec4 plate = textureGrad(uPatch${i}, (g - uPatchOff[${i}]) * uPatchScale[${i}] + 0.5, gx * uPatchScale[${i}], gy * uPatchScale[${i}]);
    gShown += vec4(plate.rgb, 1.0) * (k${i} * plate.a);
  }
  texels = mix(texels, t${i}, step(0.5, gShown.a) * (1.0 - counted));
  counted = max(counted, step(0.5, gShown.a));`).join('\n')

// The globe's own map as functions: the turn of the deck and of the cloud layer, and the reading of the wrap and of the levels round the
// place at a direction of the body. The globe draws with them, and the scene from code (deep.ts) reads the same map by the same lines, so
// what the scene shows from afar is the globe's own picture and no second one. MAP_UNIFORMS: the uniforms these lines read.
// The grade of the fall (deep.json, globe.fall), one text for the globe and for the far look of the scene (deep.ts). A colour on
// the line from black to the pivot is drawn as pivot times (colour over pivot) to the power, channel by channel, unchanged over
// the pivot. A colour off that line was drawn so too, and its distance from the line was raised to the powers with it: the dim
// white cloud of the night side and of the twilight came out orange and lilac (its red stands over the red of the pivot and was
// left, its green and blue were taken down). So the level of a colour is its green over the pivot's, and red and blue go no
// further from the line toward white and warm than that level carries them: red is the smaller of its own channel's value and
// the colour times what the grade does at that level, blue the larger. A colour bluer than the line (red under it, blue over
// it: the deck) is drawn channel by channel as it was, to the bit. A white keeps its hue: what the grade does at a level
// differs by channel for the pivot's own red against blue and for bluer, and is the green's for a neutral colour and for
// warmer. blueMost: the most blue the graded colour keeps as a multiple of its green, with a soft knee (the pale band stands
// far under it and is not touched).
export const FALL_GLSL = /* glsl */ `vec3 fallGrade(vec3 colour, vec3 pivot, vec3 power, float blueMost) {
  vec3 c = max(colour, vec3(0.0));
  vec3 x = c / pivot;
  vec3 own = pivot * mix(pow(abs(x), power), x, smoothstep(0.6, 1.2, x));
  float level = max(x.g, 1e-6);
  vec3 by = max(mix(pow(abs(vec3(level)), power), vec3(level), smoothstep(0.6, 1.2, level)) / level, vec3(1e-9));
  float whiteAt = pivot.b / pivot.r;
  float hue = clamp((whiteAt - x.r / max(x.b, 1e-6)) / max(whiteAt - 1.0, 1e-6), 0.0, 1.0);
  vec3 led = c * pow(by, vec3(hue)) * pow(by.g, 1.0 - hue);
  vec3 graded = vec3(min(led.r, own.r), own.g, max(led.b, own.b));
  float most = blueMost * graded.g + 1e-5;
  float over = graded.b / most;
  graded.b = most * (over < 0.75 ? over : 0.75 + 0.25 * (1.0 - exp(-(over - 0.75) / 0.25)));
  return graded;
}
`

export const mapGlsl = (shownFrom: number): string => /* glsl */ `vec4 gShown;
vec2 gToneUv;
vec3 spinY(vec3 d, float a) {
  float c = cos(a), s = sin(a);
  return vec3(c * d.x - s * d.z, d.y, s * d.x + c * d.z);
}
vec3 turnAbout(vec3 d, vec3 axis, float a) {
  float c = cos(a), s = sin(a);
  return d * c + cross(axis, d) * s + axis * dot(axis, d) * (1.0 - c);
}
// The light curves by the Sun's angle. Each reads its own uniform array where it lives. An array handed to a function as a
// parameter is drawn wrong by Direct3D (Chrome on Windows): the value between two knots is held at the lower knot and the
// terminator comes out in hard steps (handoff/reports/windows-rtx5080.md). The sums are the same as before, to the bit.
vec3 knotDeck(float ndl) {
  float x = clamp(ndl * 0.5 + 0.5, 0.0, 1.0) * ${KNOTS - 1}.0;
  int i = int(min(floor(x), ${KNOTS - 2}.0));
  return mix(uDeck[i], uDeck[i + 1], x - float(i));
}
vec3 knotCloud(float ndl) {
  float x = clamp(ndl * 0.5 + 0.5, 0.0, 1.0) * ${KNOTS - 1}.0;
  int i = int(min(floor(x), ${KNOTS - 2}.0));
  return mix(uCloud[i], uCloud[i + 1], x - float(i));
}
float stormTurn(vec3 d) {
  float ang = acos(clamp(dot(d, uStormAxis), -1.0, 1.0)) / uStormRadius;
  return uStormAngle / (1.0 + ang * ang * ang * ang);
}
vec3 deckDir(vec3 p) {
  vec3 d = spinY(p, uSpin);
  return turnAbout(d, uStormAxis, stormTurn(d));
}
vec3 cloudDir(vec3 p) {
  float lat = asin(clamp(p.y, -1.0, 1.0));
  vec3 d = spinY(p, uSpin + uStream * (1.0 + uShear.x * sin(lat * uShear.y)));
  return turnAbout(d, uStormAxis, stormTurn(d));
}
vec3 bend(vec3 d, float a) {
  float c0 = sqrt(max(1.0 - d.y * d.y, 1e-6));
  float y1 = clamp(d.y + a * c0, -1.0, 1.0);
  float s = sqrt(max(1.0 - y1 * y1, 0.0)) / c0;
  return vec3(d.x * s, y1, d.z * s);
}
float endHash(vec2 p) {
  uvec2 q = uvec2(p);
  uint h = q.x * 1664525u + q.y * 22695477u + 1013904223u;
  h ^= h >> 16u;
  h *= 2246822519u;
  h ^= h >> 13u;
  h *= 3266489917u;
  h ^= h >> 16u;
  return float(h >> 8u) / 16777216.0;
}
// A run (a step of the map's direction from dd) in footprints of a read at dd: its length over the length of that read's
// footprint along it, from the same derivatives the read uses. Both are measured in the map's texels (u counts twice v).
// The scene from code asks it for the ray's run through the cloud layer (deep.ts); the globe does not.
float runFeet(vec3 dd, float soft, vec3 run) {
  float u = atan(dd.x, dd.z) / (2.0 * PI) + 0.5;
  float v = asin(clamp(dd.y, -1.0, 1.0)) / PI + 0.5;
  float u2 = fract(u + 0.5) - 0.5;
  vec2 mx = vec2(abs(dFdx(u)) < abs(dFdx(u2)) ? dFdx(u) : dFdx(u2), dFdx(v)) * uGrad * soft;
  vec2 my = vec2(abs(dFdy(u)) < abs(dFdy(u2)) ? dFdy(u) : dFdy(u2), dFdy(v)) * uGrad * soft;
  float level = max(dd.x * dd.x + dd.z * dd.z, 1e-8);
  vec2 r = vec2((dd.z * run.x - dd.x * run.z) / (PI * level), run.y / (PI * sqrt(level)));
  float len = length(r);
  vec2 e = r / max(len, 1e-12);
  float ax = dot(vec2(2.0 * mx.x, mx.y), e);
  float ay = dot(vec2(2.0 * my.x, my.y), e);
  return len / max(sqrt(ax * ax + ay * ay), 1e-12);
}
// The eye of the place's storm (deep.json, storm) as one body at every height: what the deck's colour keeps at a direction p of the
// body. uEyeAt: the eye's middle as a direction of the body and its radius as an angle; uEyeMake: the share of its light the deck
// loses on the eye's floor, the shares of the radius between which the wall falls, and how far the deck's structure (field) moves
// the wall in and out. The globe reads it with field 0, the mean of the ragged wall the scene from code shows: the coarser level
// is the finer one filtered. By the place alone: nothing reads the eye's height or the clock.
float eyeShade(vec3 p, float field) {
  float x = length(p - uEyeAt.xyz) / uEyeAt.w;
  return 1.0 - uEyeMake.x * (1.0 - smoothstep(uEyeMake.y, uEyeMake.z, x * (1.0 + uEyeMake.w * field)));
}
// The same shade by colour (deep.json, storm.hue: a power for red, green and blue). One share for all three keeps the hue of the
// deck round it, and the eye was a smoky grey oval on the blue (4860: 21 36 58 on a surround of 72 126 183, where the approved
// close image has 10 34 67 on 90 139 184): a deep deck loses its red first and its blue last. All 1: the one share, to the bit.
vec3 eyeDark(vec3 p, float field) {
  float s = eyeShade(p, field);
  return any(notEqual(uEyeHue, vec3(1.0))) ? pow(abs(vec3(s)), uEyeHue) : vec3(s);
}
vec4 layerAt(vec3 dd, float soft, float shown, out float texels) {
  float u = atan(dd.x, dd.z) / (2.0 * PI) + 0.5;
  float v = asin(clamp(dd.y, -1.0, 1.0)) / PI + 0.5;
  float u2 = fract(u + 0.5) - 0.5;
  vec2 mx = vec2(abs(dFdx(u)) < abs(dFdx(u2)) ? dFdx(u) : dFdx(u2), dFdx(v)) * uGrad * soft;
  vec2 my = vec2(abs(dFdy(u)) < abs(dFdy(u2)) ? dFdy(u) : dFdy(u2), dFdy(v)) * uGrad * soft;
  texels = diagTexelsDir(dd, uMapWidth);
  float dn = dot(dd, uSpotN);
  vec2 g = vec2(dot(dd, uSpotE), dot(dd, uSpotU)) / max(dn, 0.05);
  vec2 gx = dFdx(g);
  vec2 gy = dFdy(g);
  float gd = sqrt(max(dot(gx, gx), dot(gy, gy)));
  gx *= uGrad * soft;
  gy *= uGrad * soft;
  float front = step(0.3, dn);
  float parent = diagTexelsDir(dd, uMapFull);
${Array.from({ length: MAX_LEVELS }, (_, i) => '  float w' + i + ' = 0.0;\n  float t' + i + ' = 0.0;').join('\n')}
${weights(shownFrom)}
  float rest = 1.0;
  float counted = 0.0;
  vec4 c = vec4(0.0);
  gShown = vec4(0.0);
  gToneUv = (g - uPatchOff[${Math.min(shownFrom, MAX_LEVELS - 1)}]) * uPatchScale[${Math.min(shownFrom, MAX_LEVELS - 1)}] + 0.5;
${fetches(shownFrom)}
  for (int k = 0; k < (rest > 0.0 ? 1 : 0); k++) {
    vec4 base = textureGrad(uMap, vec2(u, v), mx, my);
    vec2 hq = (vec2(u, v) - uHoldBox.xy) * uHoldBox.zw;
    float hw = uHold.x * step(0.0, min(min(hq.x, hq.y), min(1.0 - hq.x, 1.0 - hq.y)));
    for (int j = 0; j < (hw > 0.0 ? 1 : 0); j++) {
      vec4 held = textureGrad(uHoldMap, hq, mx * uHoldBox.zw, my * uHoldBox.zw);
      base = mix(base, vec4(held.rgb, held.a * uHold.y), hw);
    }
    for (int j = 0; j < (uEnd.x > 0.0 ? 1 : 0); j++) {
      vec2 mq = (vec2(u, v) - uMendBox.xy) * uMendBox.zw;
      vec4 mend = textureGrad(uMendMap, mq, mx * uMendBox.zw, my * uMendBox.zw);
      base.rgb = mix(base.rgb, mend.rgb, uEnd.x * mend.a * step(0.0, min(min(mq.x, mq.y), min(1.0 - mq.x, 1.0 - mq.y))));
    }
    c += rest * base;
  }
  return c;
}`

export const MAP_UNIFORMS = ['uMap', 'uMapWidth', 'uGrad', 'uSpotN', 'uSpotE', 'uSpotU', 'uPatchCount', 'uPatchScale', 'uPatchSize', 'uPatchFull', 'uMapFull', 'uFeather', 'uFeatherOwn', 'uPatchFade', 'uLine', 'uPatchOff', 'uHoldMap', 'uHoldBox', 'uHold', 'uMendMap', 'uMendBox', 'uEnd', 'uSpin', 'uStream', 'uShear', 'uStormAxis', 'uStormRadius', 'uStormAngle', 'uEyeAt', 'uEyeMake', 'uEyeHue', 'uCloudHeight', 'uCloudSoft', 'uCirrusPx', 'uFarMap', 'uCirrus', 'uClump', 'uCode', 'uShadow', 'uTint', 'uDeck', 'uCloud', ...Array.from({ length: MAX_LEVELS }, (_, i) => 'uPatch' + i)]
export const MAP_DECL = /* glsl */ `
uniform sampler2D uMap;
${SAMPLERS}
uniform float uPatchScale[${MAX_LEVELS}];
uniform float uPatchSize[${MAX_LEVELS}];
uniform float uPatchFull[${MAX_LEVELS}];
uniform float uMapFull;
uniform float uPatchCount;
uniform float uFeather;
uniform float uFeatherOwn;
uniform vec2 uPatchFade;
uniform float uLine;
uniform vec3 uSpotN;
uniform vec3 uSpotE;
uniform vec3 uSpotU;
uniform vec2 uPatchOff[${MAX_LEVELS}];
uniform float uMapWidth;
uniform float uGrad;
uniform float uCode;
uniform float uSpin;
uniform float uStream;
uniform vec2 uShear;
uniform vec3 uStormAxis;
uniform float uStormRadius;
uniform float uStormAngle;
uniform vec4 uEyeAt;
uniform vec4 uEyeMake;
uniform vec3 uEyeHue;
uniform float uCloudHeight;
uniform float uCloudSoft;
uniform sampler2D uHoldMap;
uniform vec4 uHoldBox;
uniform vec2 uHold;
uniform sampler2D uMendMap;
uniform vec4 uMendBox;
uniform sampler2D uFarMap;
uniform vec4 uCirrus;
uniform vec3 uClump;
uniform vec3 uEnd;
uniform float uCirrusPx;
uniform vec3 uShadow;
uniform vec3 uTint;
uniform vec3 uDeck[${KNOTS}];
uniform vec3 uCloud[${KNOTS}];
`

const frag = (shownFrom: number): string => /* glsl */ `
precision highp float;
uniform sampler2D uMap;
${SAMPLERS}
uniform float uPatchScale[${MAX_LEVELS}];
uniform float uPatchSize[${MAX_LEVELS}];
uniform float uPatchFull[${MAX_LEVELS}];
uniform float uMapFull;
uniform float uPatchCount;
uniform float uFeather;
uniform float uFeatherOwn;
uniform vec2 uPatchFade;
uniform float uLine;
uniform vec3 uSpotN;
uniform vec3 uSpotE;
uniform vec3 uSpotU;
uniform vec3 uPlace;
uniform vec2 uPatchOff[${MAX_LEVELS}];
uniform float uShown;
uniform vec3 uHomeN;
uniform vec3 uPlain;
uniform sampler2D uTone;
uniform float uToneAmt;
uniform float uMapWidth;
uniform float uGrad;
uniform float uCode;
uniform float uSpin;
uniform float uStream;
uniform vec2 uShear;
uniform vec3 uStormAxis;
uniform float uStormRadius;
uniform float uStormAngle;
uniform vec4 uEyeAt;
uniform vec4 uEyeMake;
uniform vec3 uEyeHue;
uniform float uCloudHeight;
uniform vec3 uShadow;
uniform float uCloudSoft;
uniform float uGain;
uniform float uWeight;
uniform vec3 uTint;
uniform vec3 uDeck[${KNOTS}];
uniform vec3 uCloud[${KNOTS}];
uniform float uExtinction;
uniform mat3 uBodyToWorld;
uniform float uVignette;
uniform vec3 uFallPivot;
uniform vec3 uFallPower;
uniform float uFallBlue;
uniform float uAspect;
uniform vec3 uRim;
uniform vec3 uRimShape;
uniform vec3 uRimDir;
uniform float uRimMu;
uniform vec3 uEdgeCore;
uniform vec3 uEdgeWide;
uniform vec3 uEdgeSun;
uniform vec3 uEdgeSide;
uniform vec3 uEdgeWideDir;
uniform vec4 uEdgeMu;
uniform vec4 uEdgeShape;
uniform vec4 uEdgeWidth;
uniform vec4 uEdgeNear;
uniform vec4 uEdgeFar;
uniform vec4 uCut;
uniform vec2 uCutEdge;
uniform vec3 uCutDir;
uniform vec3 uLimbDark;
uniform vec3 uVeilDir;
uniform vec3 uTwi;
uniform vec4 uTwiSun;
uniform vec4 uAirShade;
uniform float uAirGround;
uniform sampler2D uHoldMap;
uniform vec4 uHoldBox;
uniform vec2 uHold;
uniform sampler2D uMendMap;
uniform vec4 uMendBox;
uniform sampler2D uFlowMap;
uniform float uFlow;
uniform sampler2D uFarMap;
uniform vec4 uCirrus;
uniform vec3 uClump;
uniform sampler2D uField;
uniform vec4 uFieldRange;
uniform vec4 uFieldSide;
uniform vec4 uFieldEye;
uniform vec2 uDarkEdge;
uniform vec3 uEnd;
uniform vec2 uEndCloud;
uniform vec4 uEndNight;
uniform vec4 uEndShine;
uniform vec3 uEndRingN;
uniform vec4 uEndDusk;
uniform vec3 uEndBreak;
uniform vec2 uEndLimb;
uniform vec2 uEndBoost;
uniform vec2 uEndCresc;
uniform vec4 uEndStruct;
uniform vec3 uEndPole;
uniform vec3 uDarkDir;
uniform vec4 uVeil;
uniform vec2 uVeilMu;
uniform vec3 uVeilSun;
uniform vec3 uForward;
uniform vec2 uForwardShape;
uniform vec4 uNear;
uniform vec4 uNearTint;
uniform vec3 uNearFall;
uniform vec2 uMelt;
uniform vec4 uNight;
uniform vec2 uVivid;
uniform vec4 uDistant;
uniform float uCirrusPx;
uniform vec4 uDistantAir;
in vec3 vClip;
in vec3 vLocal;
in vec3 vWorldN;
in vec3 vPos;
in vec3 vView;
out vec4 outColor;
${EQUIRECT_GLSL}
${DIAG_GLSL}
${AIR_GLSL}
${INVERSE_FILMIC_GLSL}
${mapGlsl(shownFrom)}
${FALL_GLSL}void main() {
  vec3 p = normalize(vLocal);
  vec3 n = normalize(vWorldN);
  vec3 dir = normalize(vPos);
  float mu = clamp(dot(n, -dir), 0.0, 1.0);
  float ndl = dot(n, uSunW);
  mat3 toBody = transpose(uBodyToWorld);
  vec3 camL = toBody * uCam;
  vec3 sunL = toBody * uSunW;
  vec3 rd = normalize(p - camL);
  float rc = 1.0 + uCloudHeight;
  float b = dot(camL, rd);
  float disc = b * b - dot(camL, camL) + rc * rc;
  vec3 pc = normalize(camL + rd * (-b - sqrt(max(disc, 0.0))));
  float texels;
  float texelsCloud;
  float texelsShadow;
  vec3 dd = deckDir(p);
  vec3 dcl = cloudDir(pc);
  float placed = uPlace.z * smoothstep(uPlace.y, uPlace.x, dot(dd, uSpotN));
  vec4 deckTexel = layerAt(dd, 1.0, uShown, texels);
  vec4 shown = gShown;
  vec2 toneUv = gToneUv;
  float reach = uCloudHeight / max(ndl, uShadow.z);
  vec3 dsa = cloudDir(normalize(p + sunL * reach));
  vec3 dsb = cloudDir(normalize(p + sunL * reach * 1.6));
  float keep = 1.0;
  float deepen = 1.0;
  vec2 cq = vec2(atan(dcl.x, dcl.z) / (2.0 * PI) + 0.5, asin(clamp(dcl.y, -1.0, 1.0)) / PI + 0.5);
  float cq2 = fract(cq.x + 0.5) - 0.5;
  vec2 cx = vec2(abs(dFdx(cq.x)) < abs(dFdx(cq2)) ? dFdx(cq.x) : dFdx(cq2), dFdx(cq.y)) * uGrad;
  vec2 cy = vec2(abs(dFdy(cq.x)) < abs(dFdy(cq2)) ? dFdy(cq.x) : dFdy(cq2), dFdy(cq.y)) * uGrad;
  for (int k = 0; k < (uCirrus.x > 0.0 ? 1 : 0); k++) {
    float turn = uCirrus.x * uCirrus.y * (textureGrad(uFarMap, cq, cx, cy).g * (255.0 / 127.0) - 1.0) * sqrt(max(1.0 - dcl.y * dcl.y, 0.0));
    dcl = bend(dcl, turn);
    dsa = bend(dsa, turn);
    dsb = bend(dsb, turn);
    vec4 far = textureGrad(uFarMap, cq + vec2(0.0, turn / PI), cx, cy);
    keep = mix(1.0, far.r * smoothstep(uClump.x, uClump.y, far.b) * mix(uCirrus.w, 1.0, smoothstep(uClump.y, uClump.z, far.b)), uCirrus.x);
    deepen = 1.0 + uCirrus.x * uCirrus.z * (1.0 - smoothstep(0.9, 1.0, far.b));
  }
  float softCloud = max(uCloudSoft, uCirrusPx);
  float alpha = layerAt(dcl, softCloud, 0.0, texelsCloud).a * (1.0 - placed);
  float shadow = 0.6 * min(layerAt(dsa, uShadow.y, 0.0, texelsShadow).a, 1.0) + 0.4 * min(layerAt(dsb, uShadow.y * 1.8, 0.0, texelsShadow).a, 1.0);
  for (int k = 0; k < (uCirrus.x > 0.0 ? 1 : 0); k++) {
    alpha *= keep;
    shadow = min(shadow * keep * deepen, 1.0);
  }
  float lit = smoothstep(0.0, 0.2, ndl);
  vec3 albedo = deckTexel.rgb / uCode;
  vec2 fq = vec2(atan(dd.x, dd.z) / (2.0 * PI) + 0.5, asin(clamp(dd.y, -1.0, 1.0)) / PI + 0.5);
  float fq2 = fract(fq.x + 0.5) - 0.5;
  vec2 fx = vec2(abs(dFdx(fq.x)) < abs(dFdx(fq2)) ? dFdx(fq.x) : dFdx(fq2), dFdx(fq.y)) * uGrad;
  vec2 fy = vec2(abs(dFdy(fq.x)) < abs(dFdy(fq2)) ? dFdy(fq.x) : dFdy(fq2), dFdy(fq.y)) * uGrad;
  for (int k = 0; k < (uFlow > 0.0 ? 1 : 0); k++) {
    albedo *= 1.0 + uFlow * (textureGrad(uFlowMap, fq, fx, fy).r - 0.5);
  }
  float flatten = uNight.x * (1.0 - smoothstep(uNight.y, uNight.z, ndl));
  for (int k = 0; k < (flatten > 0.0 ? 1 : 0); k++) {
    albedo = mix(albedo, textureLod(uMap, vec2(atan(dd.x, dd.z) / (2.0 * PI) + 0.5, asin(clamp(dd.y, -1.0, 1.0)) / PI + 0.5), uNight.w).rgb / uCode, flatten);
  }
  float ndd = ndl;
  float shade = 1.0;
  float detail = 1.0;
  for (int k = 0; k < (uEnd.x > 0.0 ? 1 : 0); k++) {
    vec2 muv = vec2(atan(dd.x, dd.z) / (2.0 * PI) + 0.5, asin(clamp(dd.y, -1.0, 1.0)) / PI + 0.5);
    vec4 mid = textureLod(uMap, muv, uEndNight.y);
    vec2 mq = (muv - uMendBox.xy) * uMendBox.zw;
    vec4 mend = textureLod(uMendMap, mq, uEndNight.y);
    mid.rgb = mix(mid.rgb, mend.rgb, uEnd.x * mend.a * step(0.0, min(min(mq.x, mq.y), min(1.0 - mq.x, 1.0 - mq.y))));
    vec3 wide = textureLod(uMap, muv, uEndNight.z).rgb;
    vec3 lum = vec3(0.2, 0.5, 0.3);
    float rel = dot(mid.rgb, lum) / max(dot(wide, lum), 1e-4);
    ndd = ndl + uEnd.x * uEndBreak.x * (rel - 1.0 + uEndBreak.z * mid.a) + uEnd.x * uEndCresc.x;
    float dark = uEnd.x * (1.0 - smoothstep(uNight.y, uNight.z, ndd));
    float polar = smoothstep(uEndPole.x, uEndPole.y, abs(dd.y));
    float fineRel = clamp(dot(deckTexel.rgb, lum) / max(dot(mid.rgb, lum), 1e-4), 0.5, 1.7);
    float thread = textureGrad(uFlowMap, fq, fx, fy).r - 0.5;
    float calm = 1.0 - uEndPole.z * polar;
    albedo *= mix(1.0, mix(1.0, mix(pow(abs(rel), uEndStruct.x), 1.0, polar), uEndNight.x) * pow(abs(fineRel), uEndStruct.y * calm) * (1.0 + uEndStruct.z * calm * thread), dark);
    shade = mix(1.0, (uEndShine.x + uEndShine.y * smoothstep(uEndShine.z, uEndShine.w, dot(n, uEndRingN))) * pow(abs(mu), uEndNight.w), dark);
    float own = clamp(dot(deckTexel.rgb, lum) / max(dot(wide, lum), 1e-4), 0.4, 1.8);
    detail = mix(1.0, own, uEnd.x * uEndBreak.y);
    albedo *= mix(1.0, pow(abs(own), uEndBoost.x), uEnd.x - dark);
    alpha = mix(alpha, min(alpha * uEndBoost.y, 1.0), uEnd.x);
  }
  vec3 deck = albedo * eyeDark(p, 0.0) * knotDeck(ndd) * shade * (1.0 - uShadow.x * (1.0 - placed) * shadow * lit * (1.0 - min(alpha, 1.0)));
  for (int k = 0; k < (shown.a > 0.0 ? 1 : 0); k++) {
    vec3 plate = min(shown.rgb / shown.a * exp2(uToneAmt * (textureLod(uTone, toneUv, 0.0).rgb - 0.5)), vec3(0.98));
    vec3 seen = inverseFilmic(plate) / (uNearTint.rgb * uNear.y);
    float grey = dot(seen, vec3(0.3, 0.5, 0.2));
    float want = (grey - min(seen.r, min(seen.g, seen.b))) / max(grey, 1e-5) * mix(1.0 / uNear.w, 1.0, uNear.x);
    float got = uVivid.x + (uVivid.y - uVivid.x) * (1.0 - exp(-max(want - uVivid.x, 0.0) / (uVivid.y - uVivid.x)));
    deck = mix(deck, mix(vec3(grey), seen, (want > uVivid.x ? got / want : 1.0) / uNear.w) / uTint, shown.a);
  }
  float ndlc = dot(normalize(uBodyToWorld * pc), uSunW) + uEnd.x * uEndCresc.x;
  vec3 col = mix(deck, knotCloud(ndlc), alpha * smoothstep(-0.09, -0.03, ndlc)) * uTint;
  for (int k = 0; k < (uDistant.x > 0.0 ? 1 : 0); k++) {
    vec4 coarse = textureLod(uMap, fq, uDistant.w);
    vec3 soft = mix(coarse.rgb / uCode * knotDeck(ndd), knotCloud(ndlc), min(coarse.a, 1.0) * (1.0 - placed) * keep * smoothstep(-0.09, -0.03, ndlc)) * uTint;
    col = mix(col, mix(soft, uDistantAir.rgb * knotCloud(ndlc) * uTint, uDistantAir.a), uDistant.x * (1.0 - smoothstep(uDistant.y, uDistant.z, mu)));
  }
  for (int k = 0; k < (uNear.x > 0.0 ? 1 : 0); k++) {
    vec3 nearCol = mix(vec3(dot(col, vec3(0.3, 0.5, 0.2))), col, uNear.w);
    float far = length(uCam);
    float under = asin(min(1.0 / far, 1.0)) - asin(min(sqrt(1.0 - mu * mu) / far, 1.0));
    col = mix(col, uNearTint.rgb * uNearTint.a * pow(max(nearCol / uNearTint.a, 0.0), vec3(uNear.z)) * uNear.y * mix(1.0, uNearFall.z, smoothstep(uNearFall.x, uNearFall.y, under)), uNear.x);
  }
  for (int k = 0; k < (shown.a > 0.0 ? 1 : 0); k++) {
    col = max(col, 0.0);
  }
  vec3 plainCol = col;
  float fwd = pow(max(dot(dir, uSunW), 0.0), uForwardShape.y);
  float graze = exp(-mu / uForwardShape.x);
  col = mix(col, mix(deck * uTint, col, smoothstep(uEndCloud.x, uEndCloud.y, mu)), uEnd.x);
  col += uEnd.x * uEndDusk.rgb * detail * exp(min(ndd, 0.0) / uEndDusk.w) * (1.0 - smoothstep(0.0, 0.3, ndd));
  col = mix(col, uVeil.rgb, uVeil.a * uAirGround * (1.0 - smoothstep(uVeilMu.x, uVeilMu.y, mu)) * pow(smoothstep(uVeilSun.x, uVeilSun.y, dot(n, uVeilDir)), uVeilSun.z));
  col *= 1.0 - uTwi.x * (1.0 - smoothstep(uTwi.y, uTwi.z, mu)) * smoothstep(uTwiSun.x, uTwiSun.y, ndl) * (1.0 - smoothstep(uTwiSun.z, uTwiSun.w, ndl));
  col *= 1.0 - uCut.x * uCut.w * smoothstep(uCutEdge.x, uCutEdge.y, dot(n, uCutDir)) * (1.0 - smoothstep(uCut.y - uCut.z, uCut.y + uCut.z, mu));
  col += uForward * uAirGround * graze * fwd * mix(smoothstep(-0.25, 0.1, ndl), smoothstep(uEnd.y, uEnd.z, ndd) * detail, uEnd.x);
  col *= 1.0 + uEnd.x * uEndCresc.y * smoothstep(-0.1, 0.3, ndd);
  col *= 1.0 - uEnd.x * uEndLimb.x * (1.0 - smoothstep(0.0, uEndLimb.y, mu));
  vec4 sky = air(dir, true);
  sky.rgb *= mix(1.0, smoothstep(uAirShade.x, uAirShade.y, ndl), uAirShade.w * smoothstep(0.0, uAirShade.z, mu));
  col = col * exp(-sky.a * uExtinction * uAirGround) + sky.rgb * uAirGround;
  float dw = smoothstep(uDarkEdge.x, uDarkEdge.y, dot(n, uDarkDir));
  float dm = 0.6 + 0.4 * dw;
  col *= 1.0 - uLimbDark.x * pow(abs(dw), 0.7) * (1.0 - smoothstep(uLimbDark.y * dm, uLimbDark.z * dm, mu));
  // The held field lies on the body. In the hold it is read by the eye's own angle to the ground (mu). From the dive's first moment
  // on it is read by the angle of the eye the dive began at, which is carried with the body (uFieldEye: its place from the body's
  // middle in the world's axes; w says that it is set): every point of the ground keeps the share the hold gave it, so the field's
  // bands near the limb do not run over the ground with the closing horizon (the Builder's MAIL 1207, point 3).
  float muField = uFieldEye.w > 0.0 ? clamp(dot(n, normalize(uFieldEye.xyz - n)), 0.0, 1.0) : mu;
  vec2 fuv = vec2(clamp(muField / uFieldRange.x, 0.5 / uFieldRange.z, 1.0 - 0.5 / uFieldRange.z) * 0.5, (ndl - uFieldRange.y) / (1.0 - uFieldRange.y));
  vec3 fa = textureLod(uField, fuv, 0.0).rgb;
  vec3 fb = textureLod(uField, fuv + vec2(0.5, 0.0), 0.0).rgb;
  vec3 field = exp2((mix(fa, fb, smoothstep(-0.06, 0.06, dot(n, uFieldSide.xyz))) - 0.5) * uFieldRange.w);
  col *= mix(vec3(1.0), field, uFieldSide.w);
  for (int k = 0; k < (uPlain.z > 0.0 ? 1 : 0); k++) {
    col = mix(col, plainCol, shown.a * uPlain.z * smoothstep(uPlain.y, uPlain.x, dot(dd, uHomeN)));
  }
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain * uWeight / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  float melt = uMelt.y * uAirGround * (1.0 - smoothstep(0.0, uMelt.x, mu));
  for (int k = 0; k < (melt > 0.0 ? 1 : 0); k++) {
    vec3 ax = -normalize(uCam);
    vec3 side = normalize(dir - ax * dot(dir, ax));
    float st = min(1.0006 / length(uCam), 1.0);
    col = mix(col, air(ax * sqrt(1.0 - st * st) + side * st, false).rgb * uGain * uWeight, melt);
  }
  col += uRim * uAirGround * (1.0 - uEdgeShape.w) * exp(-abs(mu - uRimMu * uCut.w) / uRimShape.x) * smoothstep(uRimShape.y, uRimShape.z, dot(n, uRimDir)) * uGain * uWeight;
  for (int k = 0; k < (uEdgeShape.w > 0.0 && mu < 0.4 ? 1 : 0); k++) {
    vec3 ax = normalize(uCam);
    vec3 q = normalize(n - ax * dot(n, ax));
    float cs = dot(q, uEdgeSun);
    float sn = dot(q, uEdgeSide);
    float x = mu - clamp(uEdgeMu.x + (sn < 0.0 ? uEdgeMu.y : uEdgeMu.z) * sn, uEdgeFar.w, uEdgeMu.w);
    vec3 line = uEdgeCore * exp(-acos(clamp(cs, -1.0, 1.0)) / uEdgeShape.x) * smoothstep(uEdgeShape.y, uEdgeShape.z, cs) + uEdgeWide * smoothstep(uEdgeWidth.z, uEdgeWidth.w, dot(q, uEdgeWideDir));
    float turn = smoothstep(uEdgeNear.z, uEdgeNear.w, sn);
    col += line * exp(-abs(x) / (x > 0.0 ? mix(uEdgeNear.x, uEdgeWidth.x, turn) : mix(mix(uEdgeNear.y, uEdgeWidth.y, turn), uEdgeFar.x, smoothstep(uEdgeFar.y, uEdgeFar.z, sn)))) * uEdgeShape.w * uGain * uWeight;
  }
  for (int k = 0; k < (uEnd.x > 0.0 ? 1 : 0); k++) {
    col = max(col + uEnd.x * uEndStruct.w * uWeight * (endHash(gl_FragCoord.xy) - 0.5), vec3(0.0));
  }
  float moved = uStream + stormTurn(spinY(p, uSpin)) * 4.0;
  // The grade of the fall (deep.json, globe.fall): none where the power is 1, so the hold keeps its bytes.
  if (any(notEqual(uFallPower, vec3(1.0)))) {
    col = fallGrade(col, uFallPivot, uFallPower, uFallBlue);
  }
  outColor = diagOut(vec4(col, 1.0), texels, 1.0, mix(vec3(0.1, 0.3, 0.9), vec3(0.95, 0.95, 0.9), min(alpha, 1.0)), vec2(moved * 8.0 * min(alpha, 1.0), shadow), length(vView));
}`

function knots(rows: number[][]): THREE.Vector3[] {
  if (rows.length !== KNOTS) throw new Error('light curve needs ' + KNOTS + ' knots')
  return rows.map((r) => new THREE.Vector3(r[0], r[1], r[2]))
}

export class NeptunePlanet {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly bodyToWorld = new THREE.Matrix3()
  private readonly m4 = new THREE.Matrix4()

  constructor(o: NeptuneOptions) {
    const p = o.patches
    if ((p?.textures.length ?? 0) > MAX_LEVELS) throw new Error('too many patch levels')
    const levels = Array.from({ length: MAX_LEVELS }, (_, i) => i)
    const tex = (i: number): THREE.Texture | null => p?.textures[i] ?? p?.textures[0] ?? o.map
    const scale = (i: number): number => {
      const w = p?.widthsDeg[i]
      return w ? 1 / (2 * Math.tan(THREE.MathUtils.degToRad(w) / 2)) : 1
    }
    const size = (i: number): number => (p?.textures[i]?.image as unknown as { width: number } | undefined)?.width ?? 1
    const full = (i: number): number => p?.counts[i] ?? size(i)
    const shownFrom = Math.min(p?.shownFrom ?? MAX_LEVELS, MAX_LEVELS)
    const offset = (i: number): THREE.Vector2 => new THREE.Vector2(Math.tan(THREE.MathUtils.degToRad(p?.offsetsDeg?.[i]?.[0] ?? 0)), Math.tan(THREE.MathUtils.degToRad(p?.offsetsDeg?.[i]?.[1] ?? 0)))
    const spot = p?.spot.clone().normalize() ?? new THREE.Vector3(0, 0, 1)
    const east = new THREE.Vector3(0, 1, 0).cross(spot).normalize()
    const north = spot.clone().cross(east)
    const l = o.limb
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: frag(shownFrom),
      uniforms: {
        ...airUniforms(o.air),
        uMap: { value: o.map }, uMapWidth: { value: o.mapWidth }, uCode: { value: o.code },
        uHoldMap: { value: o.hold?.map ?? o.map }, uHoldBox: { value: o.hold ? new THREE.Vector4(o.hold.box[0], o.hold.box[1], 1 / (o.hold.box[2]! - o.hold.box[0]!), 1 / (o.hold.box[3]! - o.hold.box[1]!)) : new THREE.Vector4(0, 0, 1, 1) }, uHold: { value: new THREE.Vector2(0, o.hold?.head ?? 1) },
        uMendMap: { value: o.mend?.map ?? o.map }, uMendBox: { value: o.mend ? new THREE.Vector4(o.mend.box[0], o.mend.box[1], 1 / (o.mend.box[2]! - o.mend.box[0]!), 1 / (o.mend.box[3]! - o.mend.box[1]!)) : new THREE.Vector4(2, 2, 1, 1) },
        uFlowMap: { value: o.flow ?? o.map }, uFlow: { value: 0 },
        uFarMap: { value: o.far ?? o.map }, uCirrus: { value: new THREE.Vector4(0, 0, 0, 1) }, uClump: { value: new THREE.Vector3(0, 0.5, 1) },
        ...Object.fromEntries(levels.map((i) => ['uPatch' + i, { value: tex(i) }])),
        uPatchScale: { value: levels.map(scale) }, uPatchSize: { value: levels.map(size) }, uPatchFull: { value: levels.map(full) }, uMapFull: { value: o.mapCount },
        uPatchCount: { value: p?.textures.length ?? 0 },
        uFeather: { value: p?.feather ?? 0.12 }, uFeatherOwn: { value: p?.featherOwn ?? p?.feather ?? 0.12 }, uPatchFade: { value: new THREE.Vector2(p?.fade[0] ?? 1.1, p?.fade[1] ?? 1.7) }, uLine: { value: 1 },
        uSpotN: { value: spot }, uSpotE: { value: east }, uSpotU: { value: north },
        uPlace: { value: new THREE.Vector3(Math.cos(THREE.MathUtils.degToRad(p?.clearDeg?.[0] ?? 0)), Math.cos(THREE.MathUtils.degToRad(p?.clearDeg?.[1] ?? 1)), 0) },
        uPatchOff: { value: levels.map(offset) }, uShown: { value: 0 }, uTone: { value: p?.tone ?? o.map }, uToneAmt: { value: 0 }, uVivid: { value: new THREE.Vector2(p?.vivid?.[0] ?? 1e9, p?.vivid?.[1] ?? 2e9) }, uCirrusPx: { value: 0 }, uHomeN: { value: p?.home ?? new THREE.Vector3(0, 0, 1) }, uPlain: { value: new THREE.Vector3(Math.cos(THREE.MathUtils.degToRad(p?.plainDeg?.[0] ?? 0)), Math.cos(THREE.MathUtils.degToRad(p?.plainDeg?.[1] ?? 1)), 0) },
        uSpin: { value: 0 }, uStream: { value: 0 }, uShear: { value: new THREE.Vector2(o.clouds.shear, o.clouds.shearBands) },
        uStormAxis: { value: o.storm.axis.clone().normalize() }, uStormRadius: { value: THREE.MathUtils.degToRad(o.storm.radiusDeg) }, uStormAngle: { value: 0 }, uEyeAt: { value: new THREE.Vector4(0, 1, 0, 1) }, uEyeMake: { value: new THREE.Vector4(0, 0.3, 1, 0) }, uEyeHue: { value: new THREE.Vector3(1, 1, 1) },
        uCloudHeight: { value: o.clouds.height }, uCloudSoft: { value: o.clouds.soft }, uShadow: { value: new THREE.Vector3(o.clouds.shadow, o.clouds.shadowSoft, 0.12) },
        uGain: { value: 1 }, uWeight: { value: 1 }, uFallPivot: { value: new THREE.Vector3(1, 1, 1) }, uFallPower: { value: new THREE.Vector3(1, 1, 1) }, uFallBlue: { value: 1e6 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uTint: { value: new THREE.Vector3(1, 1, 1) },
        uDeck: { value: knots(o.deck) }, uCloud: { value: knots(o.cloud) },
        uExtinction: { value: o.air.extinction },
        uRim: { value: new THREE.Vector3().fromArray(l.rim) }, uRimShape: { value: new THREE.Vector3(l.rimWidth, l.rimFrom, l.rimTo) }, uRimDir: { value: new THREE.Vector3(1, 0, 0) },
        uRimMu: { value: l.rimMu },
        uEdgeCore: { value: new THREE.Vector3().fromArray(l.edge.core) }, uEdgeWide: { value: new THREE.Vector3().fromArray(l.edge.wide) }, uEdgeSun: { value: new THREE.Vector3(1, 0, 0) }, uEdgeSide: { value: new THREE.Vector3(0, 1, 0) }, uEdgeWideDir: { value: new THREE.Vector3(1, 0, 0) },
        uEdgeMu: { value: new THREE.Vector4().fromArray(l.edge.mu) }, uEdgeShape: { value: new THREE.Vector4(THREE.MathUtils.degToRad(l.edge.fall), Math.cos(THREE.MathUtils.degToRad(l.edge.cut[1])), Math.cos(THREE.MathUtils.degToRad(l.edge.cut[0])), 0) },
        uEdgeNear: { value: new THREE.Vector4().fromArray(l.edge.near) }, uEdgeFar: { value: new THREE.Vector4().fromArray(l.edge.far) },
        uEdgeWidth: { value: new THREE.Vector4(l.edge.width[0], l.edge.width[1], Math.cos(THREE.MathUtils.degToRad(l.edge.wideEdge[1])), Math.cos(THREE.MathUtils.degToRad(l.edge.wideEdge[0]))) },
        uCut: { value: new THREE.Vector4(l.cut, l.cutMu[0], l.cutMu[1], 0) }, uCutEdge: { value: new THREE.Vector2(l.cutFrom, l.cutTo) }, uCutDir: { value: new THREE.Vector3(1, 0, 0) },
        uLimbDark: { value: new THREE.Vector3(l.dark, l.darkMu[0], l.darkMu[1]) }, uDarkEdge: { value: new THREE.Vector2(l.darkFrom, l.darkTo) }, uDarkDir: { value: new THREE.Vector3(1, 0, 0) },
        uVeil: { value: new THREE.Vector4(l.veil[0], l.veil[1], l.veil[2], l.veilAmount) }, uVeilMu: { value: new THREE.Vector2().fromArray(l.veilMu) }, uVeilSun: { value: new THREE.Vector3().fromArray(l.veilSun) }, uVeilDir: { value: new THREE.Vector3(1, 0, 0) },
        uTwi: { value: new THREE.Vector3().fromArray(l.twilight) }, uTwiSun: { value: new THREE.Vector4().fromArray(l.twilightSun) }, uAirShade: { value: new THREE.Vector4(l.shade[0], l.shade[1], l.shade[2], 1) }, uAirGround: { value: 1 }, uDistant: { value: new THREE.Vector4(0, 0.1, 0.5, 4) }, uDistantAir: { value: new THREE.Vector4(1, 1, 1, 0) },
        uForward: { value: new THREE.Vector3().fromArray(l.forward) }, uForwardShape: { value: new THREE.Vector2(l.forwardWidth, l.forwardPower) },
        uNear: { value: new THREE.Vector4(0, 1, o.near.power, o.near.saturation) }, uNearTint: { value: new THREE.Vector4(o.near.tint[0], o.near.tint[1], o.near.tint[2], o.near.pivot) }, uNearFall: { value: new THREE.Vector3(0, 1, 1) },
        uField: { value: o.field.texture }, uFieldRange: { value: new THREE.Vector4(o.field.muMax, o.field.ndlMin, o.field.width, o.field.span) }, uFieldSide: { value: new THREE.Vector4(1, 0, 0, 0) }, uFieldEye: { value: new THREE.Vector4(0, 0, 0, 0) }, uMelt: { value: new THREE.Vector2(l.melt[0], l.melt[2]) }, uNight: { value: new THREE.Vector4(0, o.night.edge[0], o.night.edge[1], Math.log2(o.mapWidth / o.night.texels)) },
        uBodyToWorld: { value: this.bodyToWorld },
        uDiag: diagUniform, uGrad: gradUniform,
      },
    })
    ownTrig(this.material)
    const seg = o.segments ?? 320
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, seg, seg / 2), this.material)
    this.material.uniforms.uEnd = { value: new THREE.Vector3(0, 0, 0.2) }
    this.material.uniforms.uEndCloud = { value: new THREE.Vector2(0.2, 0.5) }
    this.material.uniforms.uEndNight = { value: new THREE.Vector4(0, 0, 0, 1) }
    this.material.uniforms.uEndShine = { value: new THREE.Vector4(1, 0, 0, 1) }
    this.material.uniforms.uEndRingN = { value: new THREE.Vector3(0, 1, 0) }
    this.material.uniforms.uEndDusk = { value: new THREE.Vector4(0, 0, 0, 1) }
    this.material.uniforms.uEndBreak = { value: new THREE.Vector3(0, 0, 0) }
    this.material.uniforms.uEndLimb = { value: new THREE.Vector2(0, 1) }
    this.material.uniforms.uEndBoost = { value: new THREE.Vector2(0, 1) }
    this.material.uniforms.uEndCresc = { value: new THREE.Vector2(0, 0) }
    this.material.uniforms.uEndStruct = { value: new THREE.Vector4(1, 0, 0, 0) }
    this.material.uniforms.uEndPole = { value: new THREE.Vector3(2, 3, 0) }
  }

  update(spin: number, stream: number, storm: number, gain: number, weight: number, near = 0, nearGain = 1): void {
    const u = this.material.uniforms
    ;(u.uNear!.value as THREE.Vector4).x = near
    ;(u.uNear!.value as THREE.Vector4).y = nearGain
    u.uSpin!.value = spin
    u.uStream!.value = stream
    u.uStormAngle!.value = storm
    u.uGain!.value = gain
    u.uWeight!.value = weight
    this.mesh.updateWorldMatrix(true, false)
    this.bodyToWorld.setFromMatrix4(this.m4.extractRotation(this.mesh.matrixWorld))
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }

  ending(end: number, limb: LimbParams, cloud: number[][], deck: number[][], night: { edge: [number, number]; texels: number }, ringLit: THREE.Vector3, shine: number, e: Ending['limb'], crescent: number): void {
    const u = this.material.uniforms
    const width = u.uMapWidth!.value as number
    const texels = night.texels
    const dim = u.uNight!.value as THREE.Vector4
    dim.w = Math.log2(width / texels) + (Math.log2(width / e.night) - Math.log2(width / texels)) * end
    dim.y = night.edge[0] + (e.nightEdge[0]! - night.edge[0]) * end
    dim.z = night.edge[1] + (e.nightEdge[1]! - night.edge[1]) * end
    ;(u.uEndNight!.value as THREE.Vector4).set(e.nightDetail, Math.log2(width / e.nightMid), Math.log2(width / e.night), e.nightLimb)
    ;(u.uEndShine!.value as THREE.Vector4).set(e.shine[0]! * shine, e.shine[1]! * shine, e.shine[2]!, e.shine[3]!)
    ;(u.uEndRingN!.value as THREE.Vector3).copy(ringLit)
    ;(u.uEndDusk!.value as THREE.Vector4).set(e.dusk[0]!, e.dusk[1]!, e.dusk[2]!, e.duskWidth)
    ;(u.uEndBreak!.value as THREE.Vector3).set(e.breakUp, e.detail, e.breakCloud)
    ;(u.uEndLimb!.value as THREE.Vector2).set(e.limbDark[0]!, e.limbDark[1]!)
    ;(u.uEndBoost!.value as THREE.Vector2).set(e.deckBoost, e.cloudGain)
    ;(u.uEndStruct!.value as THREE.Vector4).set(e.nightBand, e.nightFine, e.nightFlow, e.dither)
    ;(u.uEndPole!.value as THREE.Vector3).set(e.nightPole[0]!, e.nightPole[1]!, e.nightPole[2]!)
    const melt = u.uMelt!.value as THREE.Vector2
    melt.x += (e.melt - melt.x) * end
    ;(u.uRim!.value as THREE.Vector3).fromArray(limb.rim).multiplyScalar(1 - end)
    ;(u.uTwi!.value as THREE.Vector3).x = limb.twilight[0]! * (1 - end)
    ;(u.uForward!.value as THREE.Vector3).fromArray(limb.forward).multiplyScalar(1 - end * (1 - e.forward))
    ;(u.uEnd!.value as THREE.Vector3).set(end, e.lit[0]!, e.lit[1]!)
    ;(u.uEndCloud!.value as THREE.Vector2).set(e.cloudLimb[0]! + (e.crescent.cloudLimb[0]! - e.cloudLimb[0]!) * crescent, e.cloudLimb[1]! + (e.crescent.cloudLimb[1]! - e.cloudLimb[1]!) * crescent)
    ;(u.uEndCresc!.value as THREE.Vector2).set(e.crescent.bias * crescent, e.crescent.gain * crescent)
    ;(u.uForwardShape!.value as THREE.Vector2).x = limb.forwardWidth + (e.forwardWidth - limb.forwardWidth) * end
    const knots = u.uCloud!.value as THREE.Vector3[]
    for (let i = 0; i < KNOTS; i++) {
      const c = cloud[i]!
      const d = deck[i]!.map((v, k) => v * e.albedo[k]!)
      const x = Math.min(Math.max((i / (KNOTS - 1) * 2 - 1) / e.cloudTo, 0), 1)
      const t = x * x * (3 - 2 * x)
      const ratio = (c[0]! + c[1]! + c[2]!) / Math.max(d[0]! + d[1]! + d[2]!, 1e-6)
      const want = Math.min(1 + (e.cloudRatio - 1) * t, ratio)
      knots[i]!.set(c[0]!, c[1]!, c[2]!)
      for (let k = 0; k < 3; k++) {
        const flat = d[k]! * want
        const own = c[k]! * want / ratio
        knots[i]!.setComponent(k, c[k]! + (flat + (own - flat) * t - c[k]!) * end)
      }
    }
  }
}
