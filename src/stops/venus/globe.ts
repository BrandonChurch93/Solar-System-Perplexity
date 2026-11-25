import * as THREE from 'three'
import { HAZE_GLSL, hazeUniforms, type HazeParams } from '../../bodies/haze'
import { frameUniform } from '../../core/frame'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { EQUIRECT_GLSL } from '../../space/sky'
import { place as placeDef, wrap } from './assets'
import holdJson from './hold.json'
import { HOLD_RIM_GLSL, LIMB, LIMB_GLSL, type HoldRim } from './rim'

// Sixteen samplers is all a browser has to give a fragment shader: six of the globe, these two, five place plates and the wide ring of the place.
// Two are left.
export const MAX_PATCHES = 2
export const MAX_CELLS = 16

export interface GlobePatches {
  textures: THREE.Texture[]
  widthsDeg: number[]
  // The width of each level in the full set, in texels: the exchange of the levels counts these in both sets, so the set does not move
  // the moment at which a level arrives (decision d253; plates.json, texelsNote). exact: this is the full set, the widths must be these.
  full: number[]
  exact: boolean
  spot: THREE.Vector3
  feather: number
  fade: [number, number]
}

export const PLACE_LEVELS = 5
if (placeDef.levels.length !== PLACE_LEVELS) throw new Error('the globe shader is written for ' + PLACE_LEVELS + ' levels of the place')

export interface GlobePlace {
  textures: THREE.Texture[]
  rim: number
  widthsDeg: number[]
  // The width of each plate in the full set, in texels (as GlobePatches.full).
  full: number[]
  centre: THREE.Vector3
  feather: number
  fade: [number, number]
  // The border of the widest plate follows its own cloud forms: amount (share of the plate width) and the two mip levels whose ratio gives the forms.
  // The levels are levels of the full set's plate; a smaller set reads the levels that cover the same ground.
  forms: [number, number, number]
  // The wide ring (plates.json, wide): one channel of forms about the same centre, drawn over the globe's own colour.
  wide: { texture: THREE.Texture; widthDeg: number; full: number; rim: number; forms: number; formsDeg: [number, number]; own: number }
  // The look of the place from above (plates.json, tone): the light of the plates, not below floor, raised to the power of the tone map
  // times its factor, less so the nearer the line of sight is to the one of the camera at T. widthDeg: the width of the map; cos: the
  // cosines between which that nearness goes from 0 to 1; power: the curve of that ramp.
  tone: { cos: [number, number]; power: number; air: number; live: { sigmaDeg: number; contrast: number; colour: number; gain: number; most: number } }
  // One ground for every height (plates.json, show). sigmaDeg: the size under which a form is fine. discDeg: the disc of the place,
  // whole inside the first angle from the centre of the place and ended by the second. minCos: the least cosine between the line of
  // sight and the normal of the deck that the footprint of a pixel counts.
  show: { sigmaDeg: number; discDeg: [number, number]; minCos: number }
}

export interface GlobeFlow {
  map: THREE.Texture
  strength: number
  shadow: number
  shadowOffset: number
}

export interface GlobeBolts {
  map: THREE.Texture
  center: THREE.Vector3
  widthDeg: number
  gain: number
  cells: { dir: THREE.Vector3; radiusDeg: number; painted: boolean }[]
  color: [number, number, number]
}

export interface GlobeOptions {
  map: THREE.Texture
  mapWidth: number
  // The width of the map in the full set (wrap.json, color.full): what the first patch counts for its arrival.
  mapFull: number
  curve: number[][]
  haze: HazeParams
  patches: GlobePatches
  place: GlobePlace
  air: { deck: THREE.Vector3[]; deckSpanDeg: number }
  flow: GlobeFlow
  bolts: GlobeBolts
  limb: THREE.Texture
  graze: { most: number; from: number; to: number }
  lift: { floor: number; stops: number; from: number; to: number }
  shade: { far: number; grad: number; cap: number }
  mauve: { from: number; to: number; rest: number }
  weave: { camera: THREE.Vector3; ring: [number, number, number, number]; shift: number; gain: number; lit: number; lod: number; cap: number }
  rim: HoldRim
  hold: { map: THREE.Texture; right: THREE.Vector3; up: THREE.Vector3; forward: THREE.Vector3; centre: [number, number]; half: number; lod: number; stops: number; back: [number, number]; weight: number; margin: number }
  swirl: { axis: THREE.Vector3; wideDeg: number }
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

const PATCH_SAMPLERS = Array.from({ length: MAX_PATCHES }, (_, i) => 'uniform sampler2D uPatch' + i + ';').join('\n')

const PATCH_LEVELS = Array.from({ length: MAX_PATCHES }, (_, i) => `    if (uPatchCount > ${i}.5) {
      vec2 q = g * uPatchScale[${i}];
      float w = front * smoothstep(0.5, 0.5 - uFeather, max(abs(q.x), abs(q.y))) * (1.0 - smoothstep(uPatchFade.x, uPatchFade.y, parent * uFrame));
      wl[${i}] = w;
      for (int k = 0; k < (w > 0.0 && uPatchCount > ${i}.5 && uTaps == 0 ? 1 : 0); k++) albedo = mix(albedo, textureGrad(uPatch${i}, q + 0.5, gx * uPatchScale[${i}], gy * uPatchScale[${i}]).rgb, w);
      parent = gd * uPatchScale[${i}] * uPatchFull[${i}];
      texels = mix(texels, gd * uPatchScale[${i}] * uPatchSize[${i}], step(0.5, w));
      near = max(near, w * step(${i}.5, 2.0));
    }`).join('\n')

const PLACE_SAMPLERS = Array.from({ length: PLACE_LEVELS }, (_, i) => 'uniform sampler2D uPlace' + i + ';').join('\n')

// A level with colourOf holds its light alone, as a share of the light of the plate of the level colourOf at the same ground point
// (plates.json, lightNote): the film shows that plate times the channel. That plate was sampled just before where it shows; where
// it does not, it is sampled here.
const COLOUR_GIVERS = [...new Set(placeDef.levels.map((l) => l.colourOf).filter((j) => j >= 0))]
const PLACE_COLOURS = COLOUR_GIVERS.map((j) => `    vec3 hue${j} = vec3(0.0);\n    float got${j} = 0.0;`).join('\n')
const placeSample = (i: number): string => `textureGrad(uPlace${i}, pg * uPlaceScale[${i}] + 0.5, pgx * (uPlaceScale[${i}] * uGrad * uFoot.z), pgy * (uPlaceScale[${i}] * uGrad * uFoot.z))`
const placeColour = (i: number): string => {
  const j = placeDef.levels[i]?.colourOf ?? -1
  if (j < 0) return `vec3 c = ${placeSample(i)}.rgb;${COLOUR_GIVERS.includes(i) ? `\n        hue${i} = c;\n        got${i} = 1.0;` : ''}`
  return `for (int m = 0; m < (got${j} < 0.5 ? 1 : 0); m++) {
          hue${j} = ${placeSample(j)}.rgb;
          got${j} = 1.0;
        }
        vec3 c = (hue${j} + 1e-4) * (${placeSample(i)}.r * ${placeDef.levels[i]!.most.toFixed(4)});`
}

const PLACE_GLSL = Array.from({ length: PLACE_LEVELS }, (_, i) => `    {
      vec2 q = pg * uPlaceScale[${i}];
      float w = ${i > 0 ? 'smoothstep(0.5, 0.5 - uPlaceLook.x, max(abs(q.x), abs(q.y))) * (1.0 - smoothstep(uPlaceLook.y, uPlaceLook.z, parentPlace))' : 'smoothstep(0.5, 0.5 - uPlaceLook.w, length(q) + uPlaceForms.x * clamp(0.5 + dot(textureLod(uPlace0, q + 0.5, uPlaceForms.y).rgb, vec3(0.2126, 0.7152, 0.0722)) / max(dot(textureLod(uPlace0, q + 0.5, uPlaceForms.z).rgb, vec3(0.2126, 0.7152, 0.0722)), 1e-3) - 1.0, 0.0, 1.0))'};
      for (int k = 0; k < (w > 0.0 ? 1 : 0); k++) {
        ${placeColour(i)}
        laid = laid * (1.0 - w) + c * w;
        cover = cover * (1.0 - w) + w;
        placeTexels = mix(placeTexels, pgd * uFoot.z * uPlaceScale[${i}] * uPlaceSize[${i}], w);
      }
      parentPlace = pgd * uPlaceScale[${i}] * uPlaceFull[${i}];
    }`).join('\n')

const TAP_LEVELS = Array.from({ length: MAX_PATCHES }, (_, i) => `    for (int k = 0; k < (wl[${i}] > 0.0 ? 1 : 0); k++) a = mix(a, textureGrad(uPatch${i}, gm * uPatchScale[${i}] + 0.5, major * uPatchScale[${i}], minor * uPatchScale[${i}]).rgb, wl[${i}]);`).join('\n')

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform sampler2D uFlow;
uniform sampler2D uBolt;
${PATCH_SAMPLERS}
uniform float uPatchScale[${MAX_PATCHES}];
uniform float uPatchSize[${MAX_PATCHES}];
uniform float uPatchFull[${MAX_PATCHES}];
uniform float uMapPerFull;
uniform float uPatchCount;
${PLACE_SAMPLERS}
uniform vec3 uPlaceN;
uniform vec3 uPlaceE;
uniform vec3 uPlaceU;
uniform float uPlaceScale[${PLACE_LEVELS}];
uniform float uPlaceSize[${PLACE_LEVELS}];
uniform float uPlaceFull[${PLACE_LEVELS}];
uniform vec4 uPlaceLook;
uniform vec3 uPlaceForms;
uniform float uPlaceOn;
uniform vec2 uShow;
uniform vec3 uFoot;
uniform vec2 uDisc;
uniform float uShowMap;
uniform vec3 uToneEye;
uniform vec3 uHeldEye;
uniform float uOver;
uniform vec4 uToneLook;
uniform float uTonePower;
uniform vec4 uDusk;
uniform vec4 uPlaceDusk;
uniform vec4 uLive;
uniform vec3 uLiveLook;
uniform sampler2D uWide;
uniform vec4 uWideLook;
uniform vec4 uWideForms;
uniform vec3 uAirDeck[10];
uniform vec3 uAirFwd;
uniform vec3 uAirRight;
uniform vec4 uAirHaze;
uniform vec3 uAirField;
uniform float uFeather;
uniform vec2 uPatchFade;
uniform float uFrame;
uniform vec3 uSpotN;
uniform vec3 uSpotE;
uniform vec3 uSpotU;
uniform float uMapWidth;
uniform float uGrad;
uniform float uSpin;
uniform float uGain;
uniform vec4 uCarry;
uniform vec3 uCarryTint;
uniform float uCarryOn;
uniform float uWeight;
uniform vec3 uTint;
uniform vec3 uCurve[33];
uniform float uExtinction;
uniform float uVignette;
uniform float uAspect;
uniform vec3 uDrift;
uniform vec4 uFlowLook;
uniform vec3 uSunBody;
uniform vec3 uBoltN;
uniform vec3 uBoltE;
uniform vec3 uBoltU;
uniform vec2 uBoltLook;
uniform vec3 uBoltColor;
uniform vec4 uCell[${MAX_CELLS}];
uniform vec2 uCellAmp[${MAX_CELLS}];
uniform float uCellCount;
uniform float uLimbK;
uniform int uTaps;
uniform float uSmear;
uniform vec3 uCamObj;
uniform vec3 uNextCam;
uniform mat3 uNextRot;
uniform vec2 uJitter;
uniform vec3 uGraze;
uniform vec4 uLift;
uniform vec3 uShade;
uniform vec3 uMauve;
uniform vec3 uWeaveCam;
uniform vec4 uWeaveRing;
uniform vec4 uWeave;
uniform float uWeaveLit;
uniform vec4 uWeaveRise;
uniform sampler2D uHold;
uniform vec3 uHoldR;
uniform vec3 uHoldU;
uniform vec3 uHoldF;
uniform vec4 uHoldMap;
uniform vec4 uHoldLook;
uniform vec4 uSwirl;
uniform float uSwirlWide;
in vec3 vClip;
in vec3 vLocal;
in vec3 vWorldN;
in vec3 vPos;
in vec3 vView;
out vec4 outColor;
${EQUIRECT_GLSL}
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
${HAZE_GLSL}
${LIMB_GLSL}
${HOLD_RIM_GLSL}
vec3 spinY(vec3 d, float a) {
  float c = cos(a), s = sin(a);
  return vec3(c * d.x - s * d.z, d.y, s * d.x + c * d.z);
}
vec3 curl(vec3 v) {
  for (int once = 0; once < (uSwirl.w != 0.0 ? 1 : 0); once++) {
    float c = clamp(dot(v, uSwirl.xyz), -1.0, 1.0);
    float away = acos(c);
    float a = uSwirl.w * exp(-away * away * uSwirlWide);
    v = v * cos(a) + cross(uSwirl.xyz, v) * sin(a) + uSwirl.xyz * (c * (1.0 - cos(a)));
  }
  return v;
}
vec3 onSphere(vec3 from, vec3 ray) {
  float b = dot(from, ray);
  float h = max(b * b - dot(from, from) + 1.0, 0.0);
  return from + ray * (-b - sqrt(h));
}
vec2 lonLat(vec3 d) {
  return vec2(atan(d.x, d.z) / (2.0 * PI) + 0.5, asin(clamp(d.y, -1.0, 1.0)) / PI + 0.5);
}
vec2 spotPlane(vec3 d) {
  return vec2(dot(d, uSpotE), dot(d, uSpotU)) / max(dot(d, uSpotN), 0.05);
}
void stretch(vec2 jx, vec2 jy, vec2 along, out vec2 major, out vec2 minor) {
  float det = jx.x * jy.y - jy.x * jx.y;
  det = det < 0.0 ? min(det, -1e-24) : max(det, 1e-24);
  vec2 m = vec2(jy.y * along.x - jy.x * along.y, jx.x * along.y - jx.y * along.x) / det;
  float len = length(m);
  vec2 mh = len > 1e-4 ? m / len : vec2(1.0, 0.0);
  major = (jx * mh.x + jy * mh.y) * clamp(len, 1.0, 24.0);
  minor = jy * mh.x - jx * mh.y;
}

vec3 curveAt(float ndl) {
  float x = clamp(ndl * 0.5 + 0.5, 0.0, 1.0) * 32.0;
  int i = int(min(floor(x), 31.0));
  return mix(uCurve[i], uCurve[i + 1], x - float(i));
}
void main() {
  vec3 d = spinY(normalize(vLocal), uSpin);
  float band = 1.0 - d.y * d.y;
  float drift = uDrift.x * (band - uDrift.z);
  vec3 dc = curl(spinY(d, drift));
  vec3 df = curl(spinY(d, drift + uDrift.y * band));
  vec3 n = normalize(vWorldN);
  vec3 dir = normalize(vPos);
  float mu = clamp(dot(n, -dir), 0.0, 1.0);
  float ndl = dot(n, uSunW);
  float grad = uGrad * uSmear * (1.0 + uGraze.x * smoothstep(uGraze.y, uGraze.z, mu));
  vec3 albedo = equirectGrad(uMap, dc, grad).rgb;
  float texels = diagTexelsDir(uSwirl.w != 0.0 ? dc : d, uMapWidth);
  float dn = dot(dc, uSpotN);
  float near = 0.0;
  float wl[${MAX_PATCHES}];
  for (int i = 0; i < ${MAX_PATCHES}; i++) wl[i] = 0.0;
  vec2 gx = vec2(0.0);
  vec2 gy = vec2(0.0);
  if (uPatchCount > 0.5) {
    float inv = 1.0 / max(dn, 0.05);
    vec2 g = vec2(dot(dc, uSpotE), dot(dc, uSpotU)) * inv;
    gx = dFdx(g);
    gy = dFdy(g);
    float gd = sqrt(max(dot(gx, gx), dot(gy, gy)));
    gx *= grad;
    gy *= grad;
    float front = step(0.3, dn);
    // What the exchange of the levels counts: texels of the full set a pixel of the master frame (uFrame), in every set and at every
    // size of the frame. texels itself stays what this set shows, for the diagnostics.
    float parent = texels * uMapPerFull;
${PATCH_LEVELS}
  }
  float eu = atan(dc.x, dc.z) / (2.0 * PI) + 0.5;
  float ev = asin(clamp(dc.y, -1.0, 1.0)) / PI + 0.5;
  float eu2 = fract(eu + 0.5) - 0.5;
  vec2 eux = vec2(dFdx(eu), dFdx(eu2));
  vec2 euy = vec2(dFdy(eu), dFdy(eu2));
  vec2 ex = vec2(abs(eux.x) < abs(eux.y) ? eux.x : eux.y, dFdx(ev)) * grad;
  vec2 ey = vec2(abs(euy.x) < abs(euy.y) ? euy.x : euy.y, dFdy(ev)) * grad;
  vec3 sx = dFdx(vLocal);
  vec3 sy = dFdy(vLocal);
  for (int once = 0; once < (uTaps > 0 ? 1 : 0); once++) {
    vec3 p0 = normalize(vLocal - uJitter.x * sx + uJitter.y * sy);
    vec3 move = onSphere(uNextCam, normalize(uNextRot * normalize(p0 - uCamObj))) - p0;
    vec3 acc = vec3(0.0);
    vec3 da = curl(spinY(spinY(normalize(p0 - 0.5 * move), uSpin), drift));
    vec2 ua = lonLat(da);
    vec2 ga = spotPlane(da);
    for (int t = 0; t < uTaps; t++) {
      vec3 db = curl(spinY(spinY(normalize(p0 + move * (float(t + 1) / float(uTaps) - 0.5)), uSpin), drift));
      vec2 ub = lonLat(db);
      vec2 gb = spotPlane(db);
      vec2 du = ub - ua;
      du.x -= floor(du.x + 0.5);
      vec2 major;
      vec2 minor;
      stretch(ex, ey, du, major, minor);
      vec3 a = textureGrad(uMap, ua + 0.5 * du, major, minor).rgb;
      vec2 gm = 0.5 * (ga + gb);
      stretch(gx, gy, gb - ga, major, minor);
${TAP_LEVELS}
      acc += a;
      ua = ub;
      ga = gb;
    }
    albedo = acc / float(uTaps);
  }
  vec3 hv = dc - uWeaveCam;
  vec2 hq = (vec2(dot(hv, uHoldR), dot(hv, uHoldU)) / max(dot(hv, uHoldF), 1e-3) - uHoldMap.xy) * uHoldMap.z + 0.5;
  vec2 hx = dFdx(hq);
  vec2 hy = dFdy(hq);
  float held = uHoldLook.x * (1.0 - uLimbFar) * smoothstep(uHoldLook.z, uHoldLook.w, dot(dc, normalize(-hv)));
  vec3 fine = vec3(1.0);
  for (int pass = 0; pass < (held > 0.0 ? 1 : 0); pass++) {
    albedo = mix(albedo, textureLod(uMap, lonLat(dc), uHoldMap.w).rgb, held);
    fine = exp2((textureGrad(uHold, hq, hx, hy).rgb - ${(128 / 255).toFixed(6)}) * uHoldLook.y * held);
  }
  vec3 lin = albedo * albedo * ${wrap.top.toFixed(1)};
  float k = uFlowLook.x * (1.0 - near);
  vec4 fl = equirect(uFlow, dc);
  lin *= exp2(max(fl.g - uLift.x, 0.0) * uLift.y * smoothstep(uLift.z, uLift.w, max(albedo.r, max(albedo.g, albedo.b))));
  float f0 = fl.r - 0.5;
  float f1 = equirect(uFlow, df).r - 0.5;
  vec3 lean = uSunBody * uFlowLook.z;
  float s0 = equirect(uFlow, normalize(dc - lean)).r;
  float s1 = equirect(uFlow, normalize(df - lean)).r;
  float veil = (1.0 + k * f1) / (1.0 + k * f0) * (1.0 - uFlowLook.y * (1.0 - near) * s1) / (1.0 - uFlowLook.y * (1.0 - near) * s0);
  for (int pass = 0; pass < (uLimbFar > 0.0 ? 1 : 0); pass++) {
    float pink = lin.r * lin.b / max(lin.g * lin.g, 1e-5);
    lin.b *= mix(1.0, uMauve.z / max(pink, 1e-3), uLimbFar * smoothstep(uMauve.x, uMauve.y, pink));
  }
  vec3 col = lin * curveAt(ndl) * veil * uTint;
  // The globe's own colour as it is lit in this frame, without the forms of its map smaller than uLive.y and without the drift of its
  // flow: the place seen from above is a region of this cloud deck, so its tone and its colour are these (plates.json, tone.live). It goes
  // through the same air, limb light and exposure as the globe below.
  vec3 under = col;
  // The same colour with the forms of the map between the two sizes left in it (the map at the level uShowMap), over under.
  vec3 mapMid = vec3(1.0);
  for (int pass = 0; pass < (uPlaceOn > 0.0 ? 1 : 0); pass++) {
    vec3 wideMap = textureLod(uMap, lonLat(dc), uLive.y).rgb;
    vec3 midMap = textureLod(uMap, lonLat(dc), uShowMap).rgb;
    mapMid = clamp((midMap * midMap) / max(wideMap * wideMap, vec3(1e-6)), vec3(0.125), vec3(8.0));
    // Where the hold look stands (held), the globe's own colour is that look: the map at the hold's level in place of the level of
    // uLive.y, and below the picture of the hold over it (fine), as on the globe about the place. The place seen from the hold is
    // then a region of the approved globe and not of the bare map.
    vec3 baseMap = mix(wideMap, textureLod(uMap, lonLat(dc), max(uHoldMap.w, uLive.y)).rgb, held);
    float wideLift = max(textureLod(uFlow, lonLat(dc), uLiveLook.y).g - uLift.x, 0.0) * uLift.y * smoothstep(uLift.z, uLift.w, max(baseMap.r, max(baseMap.g, baseMap.b)));
    under = baseMap * baseMap * ${wrap.top.toFixed(1)} * exp2(wideLift) * curveAt(ndl) * uTint;
  }
  for (int pass = 0; pass < (uShade.x * uLimbFar > 0.0 ? 1 : 0); pass++) {
    vec3 wide = equirectGrad(uMap, dc, max(uShade.y, grad)).rgb;
    float ratio = dot(albedo * albedo, vec3(0.2126, 0.7152, 0.0722)) / max(dot(wide * wide, vec3(0.2126, 0.7152, 0.0722)), 1e-4);
    col *= pow(clamp(ratio, 1.0 / uShade.z, uShade.z), uShade.x * uLimbFar * (1.0 - smoothstep(-0.05, 0.3, ndl)) * (1.0 - near));
  }
  for (int pass = 0; pass < (uWeave.y * uLimbFar > 0.0 ? 1 : 0); pass++) {
    float seen = dot(dc, normalize(uWeaveCam - dc));
    float ring = (1.0 - smoothstep(uWeaveRing.x, uWeaveRing.y, seen)) * smoothstep(uWeaveRing.z, uWeaveRing.w, seen);
    vec3 axis = normalize(uWeaveCam);
    vec3 from = normalize(dc - uWeave.x * axis);
    for (int fold = 0; fold < (uWeaveRise.x > 0.0 ? 1 : 0); fold++) {
      float along = dot(dc, axis);
      float to = uWeaveRise.x - acos(clamp(along, -1.0, 1.0));
      from = axis * cos(to) + normalize(dc - axis * along) * sin(to);
    }
    vec3 narrow = equirect(uMap, from).rgb;
    vec3 wide = textureLod(uMap, lonLat(from), uWeave.z).rgb;
    float ratio = dot(narrow * narrow, vec3(0.2126, 0.7152, 0.0722)) / max(dot(wide * wide, vec3(0.2126, 0.7152, 0.0722)), 1e-4);
    vec3 tone = mix(vec3(ratio), narrow * narrow / max(wide * wide, vec3(1e-4)), uWeaveRise.z);
    float amount = uLimbFar * ring * (1.0 - near) / uSmear;
    col *= pow(clamp(tone, vec3(1.0 / uWeave.w), vec3(uWeave.w)), vec3(uWeave.y * amount * mix(1.0, uWeaveLit, smoothstep(-0.05, 0.3, ndl))));
    for (int calm = 0; calm < (uWeaveRise.w > 0.0 ? 1 : 0); calm++) {
      vec3 own = textureLod(uMap, lonLat(dc), uWeaveRise.y).rgb;
      col *= pow(clamp(own * own / max(albedo * albedo, vec3(1e-4)), vec3(1.0 / uWeave.w), vec3(uWeave.w)), vec3(uWeaveRise.w * amount));
    }
  }
  for (int pass = 0; pass < (uCellCount > 0.5 ? 1 : 0); pass++) {
    float night = 1.0 - smoothstep(-0.05, 0.3, ndl);
    float lum = dot(lin, vec3(0.2126, 0.7152, 0.0722));
    vec3 soft = equirectGrad(uMap, dc, 40.0).rgb;
    float lift = lum / max(dot(soft * soft * ${wrap.top.toFixed(1)}, vec3(0.2126, 0.7152, 0.0722)), 0.02);
    lift = min(lift, 1.7);
    float lit = 0.015 + 1.5 * min(lum, 1.2) * lift * lift * lift;
    float bn = dot(dc, uBoltN);
    vec2 bq = vec2(dot(dc, uBoltE), dot(dc, uBoltU)) / max(bn, 0.05) * uBoltLook.x;
    vec2 bqx = dFdx(bq) * uGrad;
    vec2 bqy = dFdy(bq) * uGrad;
    vec3 painted = bn > 0.3 && max(abs(bq.x), abs(bq.y)) < 0.5 ? inverseFilmic(textureGrad(uBolt, bq + 0.5, bqx, bqy).rgb) * uBoltLook.y : vec3(0.0);
    vec3 glow = vec3(0.0);
    for (int i = 0; i < ${MAX_CELLS}; i++) {
      if (float(i) >= uCellCount) break;
      float x = clamp((1.0 - dot(dc, uCell[i].xyz)) / (1.0 - uCell[i].w), 0.0, 1.0);
      float core = (1.0 - x) * (1.0 - x);
      glow += uCellAmp[i].y > 0.5 ? painted * uCellAmp[i].x * smoothstep(1.0, 0.8, x) : uBoltColor * uCellAmp[i].x * core * core * lit * night;
    }
    col += glow;
    under += glow;
  }
  vec3 at;
  float tau = hazeDepth(dir, true, at);
  col = col * exp(-tau * uExtinction) + hazeLight(n, dir) * (1.0 - exp(-tau));
  for (int pass = 0; pass < (uPlaceOn > 0.0 ? 1 : 0); pass++) under = under * exp(-tau * uExtinction) + hazeLight(n, dir) * (1.0 - exp(-tau));
  float b = sqrt(max(1.0 - mu * mu, 0.0));
  float gb = b;
  vec3 gat = normalize(n + dir * mu);
  // In a dive and a rise the glow of the limb lies on the ground where the far end of the move sees it (set.ts, uLimbEye): it goes
  // over the horizon with its ground on the way down and comes over it on the way up, and no height sets its weight.
  for (int fix = 0; fix < (uLimbHeld > 0.5 ? 1 : 0); fix++) {
    vec3 hd = normalize(n - uLimbEye);
    float hc = dot(n, hd);
    gb = hc > 0.0 ? 1.0 : sqrt(max(1.0 - hc * hc, 0.0));
    gat = normalize(n - hd * hc);
  }
  if (gb > ${(1 - LIMB.inside).toFixed(3)}) {
    vec4 lg = limbGlow(gat, gb) * uLimbK;
    for (int fix = 0; fix < (uLimbHeld > 0.5 ? 1 : 0); fix++) lg = limbInside(gat, gb) * uLimbK;
    col = col * (1.0 - lg.a) + max(lg.rgb, 0.0) / uDusk.xyz;
    under = under * (1.0 - lg.a) + max(lg.rgb, 0.0) / uDusk.xyz;
  }
  vec3 past = uCam - dir * dot(uCam, dir);
  for (int pass = 0; pass < (uHoldRimMap.w > 0.0 && b > ${(holdJson.rim.from - 0.02).toFixed(3)} ? 1 : 0); pass++) fine *= holdRim(past, false);
  col *= fine;
  under *= fine;
  for (int k = 0; k < (uCarryOn > 0.0 ? 1 : 0); k++) {
    float cl = max(dot(col, vec3(0.2126, 0.7152, 0.0722)), 1e-5);
    col = mix(col, mix(vec3(cl), col, uCarry.x) * pow(cl / uCarry.z, uCarry.y - 1.0) * uCarry.w * uCarryTint, uCarryOn);
    float ul = max(dot(under, vec3(0.2126, 0.7152, 0.0722)), 1e-5);
    under = mix(under, mix(vec3(ul), under, uCarry.x) * pow(ul / uCarry.z, uCarry.y - 1.0) * uCarry.w * uCarryTint, uCarryOn);
  }
  col *= uDusk.xyz;
  under *= uDusk.xyz;
  vec3 dp = spinY(onSphere(uCamObj, normalize(vLocal - uCamObj)), uSpin);
  float pn = dot(dp, uPlaceN);
  float pnn = max(pn, 0.05);
  vec2 pg = vec2(dot(dp, uPlaceE), dot(dp, uPlaceU)) / pnn;
  // The footprint of the pixel on the deck (plates.json, show): what one pixel of the master frame covers of the ground at this point.
  // It follows from the distance of the eye to the ground point and from the angle of the line of sight to the deck alone: across the
  // line of sight the distance times the angle of a pixel (uFoot.x, less toward the border of the frame), along it that over the cosine
  // between the line of sight and the normal of the deck (not under uFoot.y). It is not read from the derivatives of the screen: those
  // are wrong in single pixels along a line of the globe's mesh and turn with the screen. Every level of the place is read through
  // this footprint, the long axis first, and the levels give way to one another by it (uFoot.z: pixels of the master frame a pixel
  // of this buffer, for the reading alone).
  vec3 eyeP = spinY(uCamObj, uSpin);
  vec3 ray = dp - eyeP;
  float eyeL = max(length(ray), 1e-9);
  vec3 los = ray / eyeL;
  float sink = dot(los, dp);
  vec3 alongDeck = normalize(los - dp * sink + 1e-7 * uPlaceE);
  vec3 acrossDeck = cross(dp, alongDeck);
  float offAxis = clamp(-vView.z / max(length(vView), 1e-9), 0.0, 1.0);
  float footMin = eyeL * uFoot.x * offAxis * sqrt(offAxis);
  float footMaj = footMin / max(-sink, uFoot.y);
  vec3 gMaj = alongDeck * footMaj;
  vec3 gMin = acrossDeck * footMin;
  vec2 pgx = (vec2(dot(gMaj, uPlaceE), dot(gMaj, uPlaceU)) - pg * dot(gMaj, uPlaceN)) / pnn;
  vec2 pgy = (vec2(dot(gMin, uPlaceE), dot(gMin, uPlaceU)) - pg * dot(gMin, uPlaceN)) / pnn;
  float pgd = sqrt(max(dot(pgx, pgx), dot(pgy, pgy)));
  float heldShare = 0.0;
  for (int pass = 0; pass < (uPlaceOn > 0.0 && pn > 0.3 ? 1 : 0); pass++) {
    // Two approved pictures show this ground: the hold picture from the eyes of the hold and the close picture from the eye of T
    // (uToneEye). They do not show the same forms (proofs D1 and D2 in the notes: the plates seen from the hold are not the hold
    // picture), so one must give way to the other on the way between the two. The share of the close picture (arrive) is the place
    // of the eye's distance to the ground point between the distance of the nearest eye of the hold (uHeldEye, its last) and the
    // distance of the eye of T, counted in octaves: each halving of the distance gives the same share (plates.json, show). None of
    // it stands at the hold's distances and beyond, so the whole hold shows the hold picture alone; all of it stands at the
    // distance of T and nearer. Every form of the plates and of the ring comes by this one weight. No clock and no height is read,
    // and the law has no number of its own: its two ends are two eyes.
    float heldLen = length(dp - uHeldEye);
    float arrive = clamp(log(heldLen / eyeL) / max(log(heldLen / max(length(dp - uToneEye), 1e-6)), 1e-3), 0.0, 1.0);
    // The disc of the place (plates.json, show.discDeg): a region of the ground about the centre of the place, whole inside the first
    // angle and ended by the second. Inside it the forms of the place stand at every height and every distance.
    float inner = 1.0 - smoothstep(uDisc.x, uDisc.y, length(pg));
    // The wide ring (plates.json, wide): the forms of the place carried on round its widest plate, as light over that colour. Its
    // border follows its own cloud forms and eases out over uWideLook.y.
    for (int ring = 0; ring < (uWideLook.x > 0.0 ? 1 : 0); ring++) {
      vec2 q = pg * uWideLook.x;
      float m = uPlaceOn * smoothstep(0.5, 0.5 - uWideLook.y, length(q) + uWideForms.x * clamp(0.5 + textureLod(uWide, q + 0.5, uWideForms.y).r / max(textureLod(uWide, q + 0.5, uWideForms.z).r, 1e-3) - 1.0, 0.0, 1.0));
      for (int k = 0; k < (m * arrive > 0.0 ? 1 : 0); k++) {
        float ringOwn = inverseFilmic(vec3(textureGrad(uWide, q + 0.5, pgx * (uWideLook.x * uGrad * uFoot.z), pgy * (uWideLook.x * uGrad * uFoot.z)).r)).r;
        float ringLow = inverseFilmic(vec3(textureLod(uWide, q + 0.5, uShow.y).r)).r;
        col = mix(col, under * mapMid * (uLiveLook.x * pow(clamp(ringOwn / max(ringLow, 1e-5), 1.0 / uLiveLook.z, uLiveLook.z), uLive.z)), m * arrive);
        texels = mix(texels, pgd * uFoot.z * uWideLook.x * uWideLook.w, m * arrive);
      }
    }
    // One exchange at a pixel (uOver). In a move the close side is laid whole: the plates here at their full share wherever any of
    // them has come (uOver 1), and the ground of the surface view over them (relief.ts). The hold's picture is then drawn over the
    // whole of it by the share it still has, 1 - arrive (uOver 2, the mesh over): the same picture as the plates alone give by arrive
    // where no ground stands, and under the ground no second, flat picture of what the ground shows in relief. The air below and
    // the gain are the same in both, so the sum is the sum under them. Out of a move uOver is 0 and nothing here differs.
    heldShare = 1.0 - arrive;
    if (uOver > 1.5) break;
    vec3 laid = vec3(0.0);
    float cover = 0.0;
    float parentPlace = 0.0;
    float placeTexels = texels;
${PLACE_COLOURS}
${PLACE_GLSL}
    for (int k = 0; k < (cover * arrive > 0.0 ? 1 : 0); k++) {
      // From above the place has the tones of the globe about it. The tones of the close view (the far deck pale under its haze, the near
      // towers dark against the Sun) belong to the line of sight of the close view: they come in as the line of sight nears the one of T.
      vec3 own = inverseFilmic(laid / cover);
      vec3 light = own;
      // Drawn dimmer than they are held, the bright parts of the plates would turn red: in scene light a highlight that the film curve
      // pressed has far more colour than it shows. So by the share uPlaceDusk.w the colour is that of the display value, at the luminance
      // of the light. At the handover the share is 0 and the plates show as they are.
      vec3 shown = laid / cover;
      light = mix(light, shown * (dot(light, vec3(0.2126, 0.7152, 0.0722)) / max(dot(shown, vec3(0.2126, 0.7152, 0.0722)), 1e-5)), uPlaceDusk.w);
      // How far the camera sees a ground point as the camera at T does (same): by the angle between the two lines of sight, and by the air
      // on the line of sight, which goes with one over the sine of the camera's elevation above the ground point. The pale haze over the far
      // deck of the close view belongs to the low line of sight of T; a camera that stands steeper over that deck sees less air there.
      // The share by the air leaves the eye of T with no rate: q + q * q - q * q * q of the ratio q of the two sines, the one cubic
      // that is 1 with no slope at the eye of T and is the ratio itself far from it. The plain ratio stood at 1 for every eye of the
      // surface view and fell at the full rate of the eye's rise from the first frame past T (MAIL 1181).
      vec3 toEye = -los;
      vec3 toT = normalize(uToneEye - dp);
      float thin = clamp(dot(toT, dp) / max(dot(toEye, dp), 1e-4), 0.0, 1.0);
      float same = pow(clamp((dot(toEye, toT) - uToneLook.z) / (uToneLook.w - uToneLook.z), 0.0, 1.0), uTonePower) * pow(thin * (1.0 + thin * (1.0 - thin)), uToneLook.x);
      vec3 seen = light * uPlaceDusk.xyz;
      for (int t = 0; t < 1; t++) {
        // One ground for every height and every line of sight (plates.json, show). The forms of the ground are, by their size on the
        // ground: over the level uLive.x the globe's own; between the levels uLive.x and uShow.x the globe's own outside the disc
        // of the place and the plates' inside it; under the level uShow.x the plates'. All of them come by the one share of the close picture
        // (arrive, below). Nothing here reads a height. The share by
        // the line of sight (same) moves the tone at the level uLive.x alone, from the globe's (under) to the plates', and no form.
        vec3 low = inverseFilmic(textureLod(uPlace0, pg * uPlaceScale[0] + 0.5, uLive.x).rgb);
        vec3 mid = inverseFilmic(textureLod(uPlace0, pg * uPlaceScale[0] + 0.5, uShow.x).rgb);
        float lowLum = max(dot(low, vec3(0.2126, 0.7152, 0.0722)), 1e-5);
        float midLum = max(dot(mid, vec3(0.2126, 0.7152, 0.0722)), 1e-5);
        float ownLum = max(dot(own, vec3(0.2126, 0.7152, 0.0722)), 1e-5);
        vec3 fineHue = clamp((own / ownLum) / max(mid / midLum, vec3(1e-3)), vec3(0.25), vec3(4.0));
        vec3 midHue = clamp((mid / midLum) / max(low / lowLum, vec3(1e-3)), vec3(0.25), vec3(4.0));
        vec3 fineForms = pow(clamp(ownLum / midLum, 1.0 / uLiveLook.z, uLiveLook.z), uLive.z) * pow(fineHue, vec3(uLive.w));
        vec3 outside = under * mapMid;
        // Inside the disc the forms between the two sizes are the place's own.
        vec3 inside = under * pow(clamp(midLum / lowLum, 1.0 / uLiveLook.z, uLiveLook.z), uLive.z) * pow(midHue, vec3(uLive.w));
        vec3 above = mix(outside, inside, inner) * fineForms * uLiveLook.x;
        float aboveForms = max(dot(above, vec3(0.2126, 0.7152, 0.0722)), 1e-5) / max(dot(under, vec3(0.2126, 0.7152, 0.0722)), 1e-5);
        seen *= clamp(aboveForms * lowLum / ownLum, 1.0 / uLiveLook.z, uLiveLook.z);
        seen = mix(above, seen, same);
      }
      col = mix(col, seen, cover * uPlaceOn * (uOver > 0.5 ? 1.0 : arrive));
      texels = mix(texels, placeTexels, uPlaceOn * arrive);
    }
  }
  for (int pass = 0; pass < (uAirHaze.x > 0.0 ? 1 : 0); pass++) {
    vec3 airUp = normalize(uCam);
    vec3 level = dir - airUp * dot(dir, airUp);
    float az = atan(dot(level, uAirRight), dot(level, uAirFwd));
    float at = (1.0 - abs(mod(az / uAirHaze.w * 0.5 + 0.5, 2.0) - 1.0)) * 9.0;
    int i = int(min(floor(at), 8.0));
    // The air is a field of the place (plates.json, air.field): it lies over the ground about the foot of the camera of T, whole inside
    // the first angle from that foot and gone at the second, and a ground point takes it by the line of sight to it: the lower the
    // line of sight over the ground point, the more air lies on it. Over the cosine uAirField.z the line of sight is too steep to
    // show any. Nothing here reads the height of the camera.
    float fx = clamp((acos(clamp(dot(dp, normalize(uToneEye)), -1.0, 1.0)) - uAirField.x) / (uAirField.y - uAirField.x), 0.0, 1.0);
    float field = 1.0 - fx * fx * fx * (fx * (fx * 6.0 - 15.0) + 10.0);
    float steep = exp(-uAirField.z / uAirHaze.y);
    col = mix(col, inverseFilmic(mix(uAirDeck[i], uAirDeck[i + 1], at - float(i))) * uAirHaze.z * uDusk.w, uAirHaze.x * field * max(exp(-mu / uAirHaze.y) - steep, 0.0) / (1.0 - steep));
  }
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain * uWeight / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = diagOut(vec4(col, 1.0), texels, 1.0, vec3(0.9, 0.75, 0.3), vec2(drift + uDrift.y * band, 0.0) * 8.0, length(vView));
  if (dot(past, past) >= 1.0) discard;
  if (uOver > 1.5) {
    if (heldShare <= 0.0 || uDiag >= 2) discard;
    outColor.a = heldShare;
  }
}`

// The place of the mesh over in the order of the globe side: after every layer of the ground (relief.ts, 7 and up).
const OVER_ORDER = 40

export class Globe {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  // The hold's picture over the close side in a move (FRAG, uOver): the same sphere and the same uniforms, drawn after the ground.
  readonly over: THREE.Mesh
  private readonly cells: THREE.Vector4[]
  private readonly amps: THREE.Vector2[]
  private readonly inverse = new THREE.Quaternion()
  private readonly count: number
  private readonly r0 = new THREE.Quaternion()
  private readonly r1 = new THREE.Quaternion()
  private readonly m0 = new THREE.Matrix4()
  private readonly m1 = new THREE.Matrix4()
  private readonly lens = new THREE.Matrix4()

  constructor(o: GlobeOptions) {
    const p = o.patches
    if (p.textures.length > MAX_PATCHES) throw new Error('too many patch levels')
    if (o.bolts.cells.length > MAX_CELLS) throw new Error('too many lightning cells')
    const levels = Array.from({ length: MAX_PATCHES }, (_, i) => i)
    const tex = (i: number): THREE.Texture | null => p.textures[i] ?? p.textures[0] ?? o.map
    const scale = (i: number): number => {
      const w = p.widthsDeg[i]
      return w ? 1 / (2 * Math.tan(THREE.MathUtils.degToRad(w) / 2)) : 1
    }
    const size = (i: number): number => (p.textures[i]?.image as unknown as { width: number } | undefined)?.width ?? 1
    // The full set's width of each picture that an exchange counts (decision d253). In the full set the pictures must have these widths.
    const placeSize = (i: number): number => (o.place.textures[i]?.image as unknown as { width: number } | undefined)?.width ?? 1
    const fullOf = (name: string, full: number | undefined, loaded: number): number => {
      if (!(full !== undefined && full >= loaded)) throw new Error('venus: ' + name + ' has no width of the full set at least its own (' + String(full) + ', ' + loaded + ')')
      if (p.exact && full !== loaded) throw new Error('venus: ' + name + ' is ' + loaded + ' wide in the full set, plates.json says ' + full)
      return full
    }
    const patchFull = levels.map((i) => (p.textures[i] ? fullOf('patch ' + i, p.full[i], size(i)) : 1))
    const placeFull = Array.from({ length: PLACE_LEVELS }, (_, i) => (o.place.textures[i] ? fullOf('plate ' + i, o.place.full[i], placeSize(i)) : 1))
    const mapPerFull = fullOf('the map', o.mapFull, o.mapWidth) / o.mapWidth
    // The mip levels of forms are levels of the full set's widest plate: this set reads the levels that cover the same ground.
    const formsUnder = Math.log2(placeFull[0]! / placeSize(0))
    const frame = (c: THREE.Vector3): [THREE.Vector3, THREE.Vector3, THREE.Vector3] => {
      const nrm = c.clone().normalize()
      const east = new THREE.Vector3(0, 1, 0).cross(nrm).normalize()
      return [nrm, east, nrm.clone().cross(east)]
    }
    const [spot, east, north] = frame(p.spot)
    const [bn, be, bu] = frame(o.bolts.center)
    const [placeN, placeE, placeU] = frame(o.place.centre)
    const wideSize = (o.place.wide.texture.image as unknown as { width: number } | undefined)?.width ?? 1
    fullOf('the wide ring', o.place.wide.full, wideSize)
    const wideScale = 1 / (2 * Math.tan(THREE.MathUtils.degToRad(o.place.wide.widthDeg) / 2))
    const widePerDeg = THREE.MathUtils.degToRad(1) * wideSize * wideScale
    this.count = o.bolts.cells.length
    this.cells = levels.concat(Array.from({ length: MAX_CELLS - MAX_PATCHES }, (_, i) => i + MAX_PATCHES)).map((i) => {
      const c = o.bolts.cells[i]
      return c ? new THREE.Vector4(c.dir.x, c.dir.y, c.dir.z, Math.cos(THREE.MathUtils.degToRad(c.radiusDeg))) : new THREE.Vector4(0, 1, 0, 0.99)
    })
    this.amps = this.cells.map((_, i) => new THREE.Vector2(0, o.bolts.cells[i]?.painted ? 1 : 0))
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        ...hazeUniforms(o.haze),
        uMap: { value: o.map }, uFlow: { value: o.flow.map }, uBolt: { value: o.bolts.map },
        ...Object.fromEntries(levels.map((i) => ['uPatch' + i, { value: tex(i) }])),
        uPatchScale: { value: levels.map(scale) }, uPatchSize: { value: levels.map(size) }, uPatchFull: { value: patchFull }, uMapPerFull: { value: mapPerFull },
        uPatchCount: { value: p.textures.length },
        uFeather: { value: p.feather }, uPatchFade: { value: new THREE.Vector2(p.fade[0], p.fade[1]) }, uFrame: frameUniform,
        uSpotN: { value: spot }, uSpotE: { value: east }, uSpotU: { value: north },
        ...Object.fromEntries(Array.from({ length: PLACE_LEVELS }, (_, i) => ['uPlace' + i, { value: o.place.textures[i] ?? o.place.textures[0] ?? o.map }])),
        uPlaceN: { value: placeN }, uPlaceE: { value: placeE }, uPlaceU: { value: placeU },
        uPlaceScale: { value: Array.from({ length: PLACE_LEVELS }, (_, i) => 1 / (2 * Math.tan(THREE.MathUtils.degToRad(o.place.widthsDeg[i] ?? 90) / 2))) },
        uPlaceSize: { value: Array.from({ length: PLACE_LEVELS }, (_, i) => placeSize(i)) }, uPlaceFull: { value: placeFull },
        uPlaceLook: { value: new THREE.Vector4(o.place.feather, o.place.fade[0], o.place.fade[1], o.place.rim * 0.5) },
        uPlaceForms: { value: new THREE.Vector3(o.place.forms[0], Math.max(o.place.forms[1] - formsUnder, 0), Math.max(o.place.forms[2] - formsUnder, 0)) },
        uPlaceOn: { value: 0 },
        uShow: { value: new THREE.Vector2(Math.log2(Math.max(THREE.MathUtils.degToRad(o.place.show.sigmaDeg) * ((o.place.textures[0]?.image as unknown as { width: number } | undefined)?.width ?? 1) / (2 * Math.tan(THREE.MathUtils.degToRad(o.place.widthsDeg[0] ?? 90) / 2)), 1)), Math.log2(Math.max(o.place.show.sigmaDeg * widePerDeg, 1))) },
        uFoot: { value: new THREE.Vector3(1e-3, o.place.show.minCos, 1) },
        uShowMap: { value: Math.log2(Math.max(o.place.show.sigmaDeg * o.mapWidth / 360, 1)) },
        uDisc: { value: new THREE.Vector2(Math.tan(THREE.MathUtils.degToRad(o.place.show.discDeg[0])), Math.tan(THREE.MathUtils.degToRad(o.place.show.discDeg[1]))) },
        uToneEye: { value: new THREE.Vector3(0, 0, 5) },
        uHeldEye: { value: new THREE.Vector3(0, 0, 5) },
        uOver: { value: 0 },
        uToneLook: { value: new THREE.Vector4(o.place.tone.air, 0, o.place.tone.cos[0], o.place.tone.cos[1]) },
        uTonePower: { value: o.place.tone.power },
        uAirDeck: { value: o.air.deck }, uAirFwd: { value: new THREE.Vector3(0, 0, -1) }, uAirRight: { value: new THREE.Vector3(1, 0, 0) }, uAirHaze: { value: new THREE.Vector4(0, 0.05, 1, THREE.MathUtils.degToRad(o.air.deckSpanDeg)) }, uAirField: { value: new THREE.Vector3(1e3, 2e3, 1) },
        uDusk: { value: new THREE.Vector4(1, 1, 1, 1) }, uPlaceDusk: { value: new THREE.Vector4(1, 1, 1, 0) },
        uLive: { value: new THREE.Vector4(Math.log2(Math.max(THREE.MathUtils.degToRad(o.place.tone.live.sigmaDeg) * ((o.place.textures[0]?.image as unknown as { width: number } | undefined)?.width ?? 1) / (2 * Math.tan(THREE.MathUtils.degToRad(o.place.widthsDeg[0] ?? 90) / 2)), 1)), Math.log2(Math.max(o.place.tone.live.sigmaDeg * o.mapWidth / 360, 1)), o.place.tone.live.contrast, o.place.tone.live.colour) },
        uLiveLook: { value: new THREE.Vector3(o.place.tone.live.gain, Math.log2(Math.max(o.place.tone.live.sigmaDeg * ((o.flow.map.image as unknown as { width: number } | undefined)?.width ?? 1) / 360, 1)), o.place.tone.live.most) },
        uWide: { value: o.place.wide.texture },
        uWideLook: { value: new THREE.Vector4(wideScale, o.place.wide.rim * 0.5, Math.log2(Math.max(o.place.tone.live.sigmaDeg * widePerDeg, 1)), wideSize) },
        uWideForms: { value: new THREE.Vector4(o.place.wide.forms, Math.log2(Math.max(o.place.wide.formsDeg[0] * widePerDeg, 1)), Math.log2(Math.max(o.place.wide.formsDeg[1] * widePerDeg, 1)), o.place.wide.own) },
        uMapWidth: { value: o.mapWidth },
        uSpin: { value: 0 }, uGain: { value: 1 }, uCarry: { value: new THREE.Vector4(1, 1, 1, 1) }, uCarryTint: { value: new THREE.Vector3(1, 1, 1) }, uCarryOn: { value: 0 }, uWeight: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uTint: { value: new THREE.Vector3(1, 1, 1) },
        uCurve: { value: o.curve.map((c) => new THREE.Vector3(c[0], c[1], c[2])) },
        uExtinction: { value: o.haze.extinction },
        uDrift: { value: new THREE.Vector3(0, 0, 1 - spot.y * spot.y) },
        uFlowLook: { value: new THREE.Vector4(o.flow.strength, o.flow.shadow, o.flow.shadowOffset, 0) },
        uSunBody: { value: new THREE.Vector3(1, 0, 0) },
        uBoltN: { value: bn }, uBoltE: { value: be }, uBoltU: { value: bu },
        uBoltLook: { value: new THREE.Vector2(1 / (2 * Math.tan(THREE.MathUtils.degToRad(o.bolts.widthDeg) / 2)), o.bolts.gain) },
        uBoltColor: { value: new THREE.Vector3().fromArray(o.bolts.color) },
        uCell: { value: this.cells }, uCellAmp: { value: this.amps }, uCellCount: { value: o.bolts.cells.length },
        uLimb: { value: o.limb }, uLimbS: { value: new THREE.Vector3(1, 0, 0) }, uLimbT: { value: new THREE.Vector3(0, 1, 0) }, uLimbK: { value: 1 }, uLimbFar: { value: 0 }, uLimbHeld: { value: 0 }, uLimbEye: { value: new THREE.Vector3(0, 0, 3) },
        uTaps: { value: 0 }, uSmear: { value: 1 }, uCamObj: { value: new THREE.Vector3(0, 0, 5) }, uNextCam: { value: new THREE.Vector3(0, 0, 5) }, uNextRot: { value: new THREE.Matrix3() }, uJitter: { value: new THREE.Vector2() },
        uGraze: { value: new THREE.Vector3(o.graze.most, o.graze.from, o.graze.to) },
        uLift: { value: new THREE.Vector4(o.lift.floor, o.lift.stops, o.lift.from, o.lift.to) }, uShade: { value: new THREE.Vector3(o.shade.far, o.shade.grad, o.shade.cap) }, uMauve: { value: new THREE.Vector3(o.mauve.from, o.mauve.to, o.mauve.rest) },
        uWeaveCam: { value: o.weave.camera }, uWeaveRing: { value: new THREE.Vector4().fromArray(o.weave.ring) }, uWeave: { value: new THREE.Vector4(o.weave.shift, o.weave.gain, o.weave.lod, o.weave.cap) }, uWeaveLit: { value: o.weave.lit }, uWeaveRise: { value: new THREE.Vector4(0, 0, 0, 0) },
        ...o.rim.uniforms,
        uHold: { value: o.hold.map }, uHoldR: { value: o.hold.right }, uHoldU: { value: o.hold.up }, uHoldF: { value: o.hold.forward },
        uHoldMap: { value: new THREE.Vector4(o.hold.centre[0], o.hold.centre[1], 0.5 / o.hold.half, o.hold.lod) }, uHoldLook: { value: new THREE.Vector4(o.hold.weight, o.hold.stops, o.hold.back[0], o.hold.back[1]) },
        uSwirl: { value: new THREE.Vector4(o.swirl.axis.x, o.swirl.axis.y, o.swirl.axis.z, 0) }, uSwirlWide: { value: 1 / Math.pow(THREE.MathUtils.degToRad(o.swirl.wideDeg), 2) },
        uDiag: diagUniform, uGrad: gradUniform,
      },
    })
    const seg = o.segments ?? 320
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1 / Math.cos(Math.PI / seg) + 2e-4, seg, seg / 2), this.material)
    this.over = new THREE.Mesh(this.mesh.geometry, new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG, uniforms: { ...this.material.uniforms, uOver: { value: 2 } }, transparent: true, depthTest: false, depthWrite: false }))
    this.over.renderOrder = OVER_ORDER
    this.over.visible = false
    this.mesh.add(this.over)
  }

  update(camera: THREE.Vector3, sun: THREE.Vector3, world: THREE.Quaternion, spin: number, drift: number, flow: number, amps: number[], gain: number, weight: number): void {
    const u = this.material.uniforms
    ;(u.uCam!.value as THREE.Vector3).copy(camera)
    ;(u.uSunW!.value as THREE.Vector3).copy(sun)
    this.inverse.copy(world).multiply(this.mesh.quaternion).invert()
    const s = (u.uSunBody!.value as THREE.Vector3).copy(sun).applyQuaternion(this.inverse)
    const c = Math.cos(spin)
    const sn = Math.sin(spin)
    s.set(c * s.x - sn * s.z, s.y, sn * s.x + c * s.z)
    u.uSpin!.value = spin
    ;(u.uDrift!.value as THREE.Vector3).x = drift
    ;(u.uDrift!.value as THREE.Vector3).y = flow
    let lit = 0
    for (let i = 0; i < this.amps.length; i++) {
      const a = amps[i] ?? 0
      this.amps[i]!.x = a
      if (i < this.count && a > 0) lit = this.count
    }
    u.uCellCount!.value = lit
    u.uGain!.value = gain
    u.uWeight!.value = weight
  }

  motion(taps: number, smear: number, camera: THREE.Vector3, view: THREE.Quaternion, shift: THREE.Vector3, turn: THREE.Quaternion, zoom: number, jitterX: number, jitterY: number): void {
    const u = this.material.uniforms
    u.uTaps!.value = taps
    u.uSmear!.value = smear
    ;(u.uJitter!.value as THREE.Vector2).set(jitterX, jitterY)
    const from = (u.uCamObj!.value as THREE.Vector3).copy(camera).applyQuaternion(this.inverse)
    if (taps === 0) return
    this.r0.copy(this.inverse).multiply(view)
    this.r1.copy(this.r0).multiply(turn)
    ;(u.uNextCam!.value as THREE.Vector3).copy(shift).applyQuaternion(this.r0).add(from)
    this.m0.makeRotationFromQuaternion(this.r0).transpose()
    this.m1.makeRotationFromQuaternion(this.r1).multiply(this.m0.premultiply(this.lens.makeScale(zoom, zoom, 1)))
    ;(u.uNextRot!.value as THREE.Matrix3).setFromMatrix4(this.m1)
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
    ;(this.over.material as THREE.Material).dispose()
  }
}
