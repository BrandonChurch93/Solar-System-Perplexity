import * as THREE from 'three'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { EQUIRECT_GLSL } from '../../space/sky'

export interface GlobePatches {
  textures: THREE.Texture[]
  widthsDeg: number[]
  windows?: ({ raster: number; size: number; offset: number[] } | undefined)[]
  made?: number[]
  full?: number[]
  spot: THREE.Vector3
  feather: number
  fade: [number, number]
  place?: { centre: THREE.Vector3; from: number; tone: THREE.Texture; toneDeg: number; toneCloud: number[]; toneGrey: number[]; glint?: { at: number[]; win: number; feather: number; seenDeg: number[]; cloud: number[]; warm: number[]; glow: number[]; floor: number; light: THREE.Texture; sea: THREE.Texture }; earlyDeg: number; gain: number[]; day: number[]; low?: { map: THREE.Texture; eye: THREE.Vector3; fromDeg: number[]; window: { raster: number; size: number; offset: number[] }; feather: number; veil?: { map: THREE.Texture; times: number; feather: number } } }
}

export interface GlobeLook {
  curve: number[][]
  limb: { pale: number[]; night: number[]; depth: number[]; width: number; power: number; gamma: number; dayFrom: number; dayTo: number }
  drift: { degPerSecond: number; ease: number }
  storm: { lon: number; lat: number; degPerSecond: number; coreDeg: number; fadeDeg: number[] }
  shadow: { height: number; strength: number; lod: number; floor: number }
  night: number[]
  auroraGate: number[]
  auroraKeep: number[]
  calm: number[]
  bed: number[]
  twilight: number[]
  emissivePeak: number
  auroraColor: [number, number, number]
  twinkle: [number, number, number, number]
  bloomPre: [number, number, number]
  ripple: [number, number, number]
  dusk: { zone: number[]; fade: number; centre: number[] }
  away: { tone: number[]; land: number[]; landAt: number[]; landClamp: number[]; flat: number[]; soft: number; dim: number; gate: number[]; fine: number[]; far: { light: number[]; cap: number[]; rim: number[]; gold: number[]; ring: number[]; zone: number[]; east: number[] } }
}

export interface GlobeOptions {
  map: THREE.Texture
  mapWidth: number
  mapFull: number
  cloud: THREE.Texture
  emissive: THREE.Texture
  far: THREE.Texture
  farCloud: THREE.Texture
  look: GlobeLook
  sunHold: THREE.Vector3
  patches?: GlobePatches
  segments?: number
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

export const MAX_PATCHES = 6

export const VEIL_GLSL = /* glsl */ `
vec3 toCode(vec3 c) {
  return mix(12.92 * c, 1.055 * pow(max(c, vec3(0.0031308)), vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}
vec3 fromCode(vec3 c) {
  return mix(c / 12.92, pow((max(c, vec3(0.04045)) + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
}
`

const PATCH_SAMPLERS = Array.from({ length: MAX_PATCHES }, (_, i) => 'uniform sampler2D uPatch' + i + ';').join('\n')

const PATCH_LEVELS = Array.from({ length: MAX_PATCHES }, (_, i) => `    if (uPatchCount > ${i}.5) {
      float at = uPatchPlace[${i}];
      vec2 q = (mix(g, h, at) - uPatchShift[${i}]) * uPatchScale[${i}];
      float w = mix(front, frontH, at) * smoothstep(0.5, 0.5 - uFeather, max(abs(q.x), abs(q.y))) * (1.0 - smoothstep(uPatchFade.x, uPatchFade.y, shown * uPerLine));
      w = max(w, ${i === 0 ? 'early' : '0.0'});
      for (int k = 0; k < (w > 0.0 ? 1 : 0); k++) albedo = mix(albedo, textureGrad(uPatch${i}, q + 0.5, mix(gx, hx, at) * uPatchScale[${i}], mix(gy, hy, at) * uPatchScale[${i}]).rgb, w);
      float dens${i} = mix(gd, hd, at) * uPatchScale[${i}] * uPatchSize[${i}];
      shown = mix(shown, mix(gl, hl, at) * uPatchScale[${i}] * uPatchFull[${i}] * uPatchReal[${i}], w);
      texels = mix(texels, dens${i}, step(0.5, w));
      baked = max(baked, w);
      laid += w - laid * w;
    }`).join('\n')

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform sampler2D uCloud;
uniform sampler2D uEmissive;
${PATCH_SAMPLERS}
uniform float uPatchScale[${MAX_PATCHES}];
uniform float uPatchSize[${MAX_PATCHES}];
uniform float uPatchReal[${MAX_PATCHES}];
uniform float uPatchFull[${MAX_PATCHES}];
uniform vec2 uPatchShift[${MAX_PATCHES}];
uniform float uPatchCount;
uniform float uFeather;
uniform vec2 uPatchFade;
uniform float uPerLine;
uniform vec3 uSpotN;
uniform vec3 uSpotE;
uniform vec3 uSpotU;
uniform float uPatchPlace[${MAX_PATCHES}];
uniform vec3 uPlaceN;
uniform vec3 uPlaceE;
uniform vec3 uPlaceU;
uniform sampler2D uTone;
uniform sampler2D uLowPlate;
uniform vec3 uTwinEye;
uniform vec3 uEyeBody;
uniform sampler2D uLowVeil;
uniform float uLowAir;
uniform vec2 uLowVeilWin;
uniform vec2 uLowFrom;
uniform float uLowLook;
uniform float uLowSize;
uniform vec4 uLowWin;
uniform vec4 uGlint;
uniform vec2 uGlintSeen;
uniform vec4 uGlintCloud;
uniform vec3 uGlintGlow;
uniform sampler2D uGlintLight;
uniform sampler2D uGlintSea;
uniform float uToneScale;
uniform float uNear;
uniform float uGraze;
uniform float uPlaceScale;
uniform float uPlaceIn;
uniform float uEarlyScale;
uniform vec2 uToneCloud;
uniform vec2 uToneGrey;
uniform vec3 uPlaceGain;
uniform vec2 uPlaceDay;
uniform float uMapWidth;
uniform float uMapFull;
uniform float uGrad;
uniform float uSpin;
uniform float uGain;
uniform float uWeight;
uniform vec3 uTint;
uniform vec3 uCurve[33];
uniform mat3 uBodyToWorld;
uniform vec3 uEye;
uniform float uVignette;
uniform float uAspect;
uniform vec3 uSunW;
uniform float uFlow;
uniform float uDrift;
uniform vec3 uStormAxis;
uniform vec4 uStorm;
uniform vec4 uShadow;
uniform vec3 uLimbPale;
uniform vec3 uLimbNight;
uniform vec3 uLimbDepth;
uniform vec4 uLimbShape;
uniform vec2 uLimbDay;
uniform vec2 uNight;
uniform vec2 uAuroraGate;
uniform float uPeak;
uniform vec4 uBloomPre;
uniform vec3 uAuroraColor;
uniform vec2 uAuroraKeep;
uniform float uUnborn;
uniform vec4 uBedAt;
uniform vec2 uBedNight;
uniform float uCalm;
uniform vec4 uCalmAt[3];
uniform vec3 uTwilight;
uniform vec2 uTwilightAt;
uniform vec4 uTwinkle;
uniform vec4 uRipple;
uniform float uClock;
uniform float uCloudOn;
uniform vec3 uSunHold;
uniform vec3 uCentreHold;
uniform vec4 uDuskZone;
uniform float uDuskFade;
uniform float uAway;
uniform float uRise;
uniform float uLights;
uniform vec4 uFine;
uniform vec3 uFarRing;
uniform sampler2D uFarCloud;
uniform vec3 uNightTone;
uniform vec4 uNightFlat;
uniform vec2 uNightGate;
uniform sampler2D uFar;
uniform vec4 uFarLight;
uniform vec4 uFarCap;
uniform vec2 uFarRim;
uniform vec2 uFarZone;
uniform vec3 uFarEast;
uniform vec4 uFarEdge;
uniform vec3 uGold;
uniform vec3 uNightLand;
uniform vec4 uLandAt;
uniform vec2 uLandClamp;
in vec3 vClip;
in vec3 vLocal;
in vec3 vView;
out vec4 outColor;
${EQUIRECT_GLSL}
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
vec3 spinY(vec3 d, float a) {
  float c = cos(a), s = sin(a);
  return vec3(c * d.x - s * d.z, d.y, s * d.x + c * d.z);
}
vec3 turnAbout(vec3 d, vec3 axis, float a) {
  float c = cos(a), s = sin(a);
  return d * c + cross(axis, d) * s + axis * dot(axis, d) * (1.0 - c);
}
vec3 curveAt(float ndl) {
  float x = clamp(ndl * 0.5 + 0.5, 0.0, 1.0) * 32.0;
  int i = int(min(floor(x), 31.0));
  return mix(uCurve[i], uCurve[i + 1], x - float(i));
}
float twistOf(vec3 d) {
  float ang = acos(clamp(dot(d, uStormAxis), -1.0, 1.0));
  float k = ang / uStorm.y;
  return uStorm.x * (1.0 - smoothstep(uStorm.z, uStorm.w, ang)) / (1.0 + k * k);
}
vec3 cloudDir(vec3 d) {
  vec3 t = turnAbout(d, uStormAxis, -twistOf(d) * uFlow);
  float lat = asin(clamp(t.y, -1.0, 1.0));
  return spinY(t, -uDrift * cos(3.0 * lat) * uFlow);
}
${VEIL_GLSL}
float ramp(vec2 e, float x) {
  float t = clamp((x - e.x) / (e.y - e.x), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}
vec2 lonLat(vec3 d) {
  return vec2(atan(d.x, d.z) / (2.0 * PI) + 0.5, asin(clamp(d.y, -1.0, 1.0)) / PI + 0.5);
}
float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float shortAxis(float p, float q, float r) {
  return sqrt(max(0.5 * (p + q - sqrt((p - q) * (p - q) + 4.0 * r * r)), 0.0));
}
void main() {
  vec3 d = spinY(normalize(vLocal), uSpin);
  vec3 n = uBodyToWorld * normalize(vLocal);
  float mu = clamp(dot(n, normalize(uEye - n)), 0.0, 1.0);
  if (mu < uGraze) discard;
  float ndl = dot(n, uSunW);
  vec3 albedo = equirectGrad(uMap, d, uGrad).rgb;
  float held = dot(d, uSunHold);
  float bad = 0.0;
  float rim = 0.0;
  float swap = 0.0;
  float drift = 0.0;
  float farLights = 0.0;
  float past = 0.0;
  float fade = 0.0;
  vec3 ground = albedo;
  for (int k = 0; k < (uAway > 0.0 ? 1 : 0); k++) {
    vec4 far = equirectGrad(uFar, d, uGrad);
    float cc = dot(d, uCentreHold);
    float cap = smoothstep(uFarLight.z, uFarLight.w, dot(d, uFarCap.xyz));
    float cone = 1.0 - smoothstep(uFarZone.x, uFarZone.y, cc);
    float east = dot(d, uFarEast);
    past = mix(max(cone, smoothstep(uFarEdge.x, uFarEdge.y, east)), 1.0, uRise);
    float pastCloud = mix(max(cone, smoothstep(uFarEdge.z, uFarEdge.w, east)), 1.0, uRise);
    fade = mix(max(cone, smoothstep(uFarEdge.x, uFarEdge.w, east)), 1.0, uRise);
    bad = uAway * (1.0 - smoothstep(uFarLight.x, uFarLight.y, held - uFarCap.w * cap)) * max(past, cap);
    rim = uAway * (1.0 - smoothstep(uFarRim.x, uFarRim.y, cc));
    float ring = uRise * (1.0 - smoothstep(uFarRing.x, uFarRing.y, cc));
    swap = max(bad, ring);
    drift = max(uAway * (1.0 - smoothstep(uFarLight.x, uFarLight.y, held)) * pastCloud, ring);
    albedo = mix(albedo, far.rgb, swap);
    ground = far.rgb;
    farLights = far.a * far.a;
  }
  float texels = diagTexelsDir(d, uMapWidth);
  float dn = dot(d, uSpotN);
  float baked = 0.0;
  float place = 0.0;
  if (uPatchCount > 0.5) {
    float inv = 1.0 / max(dn, 0.05);
    vec2 g = vec2(dot(d, uSpotE), dot(d, uSpotU)) * inv;
    vec2 gx = dFdx(g);
    vec2 gy = dFdy(g);
    float gd = sqrt(max(dot(gx, gx), dot(gy, gy)));
    float gl = shortAxis(dot(gx, gx), dot(gy, gy), dot(gx, gy));
    gx *= uGrad;
    gy *= uGrad;
    float front = step(0.3, dn);
    float hn = dot(d, uPlaceN);
    vec2 h = vec2(dot(d, uPlaceE), dot(d, uPlaceU)) / max(hn, 0.05);
    vec2 hx = dFdx(h);
    vec2 hy = dFdy(h);
    float hd = sqrt(max(dot(hx, hx), dot(hy, hy)));
    float hl = shortAxis(dot(hx, hx), dot(hy, hy), dot(hx, hy));
    hx *= uGrad;
    hy *= uGrad;
    float frontH = step(0.3, hn);
    vec3 wx = dFdx(d);
    vec3 wy = dFdy(d);
    float shown = shortAxis(dot(wx, wx), dot(wy, wy), dot(wx, wy)) * uMapFull / 6.283185307;
    float laid = 0.0;
    vec2 qp = h * uPlaceScale;
    float inside = frontH * smoothstep(0.5, 0.5 - uFeather, max(abs(qp.x), abs(qp.y)));
    float early = front * frontH * smoothstep(0.5, 0.5 - uFeather, max(abs(qp.x), abs(qp.y)) * uEarlyScale) * uPlaceIn;
${PATCH_LEVELS}
    for (int k = 0; k < (uLowLook > 0.0 ? 1 : 0); k++) {
      vec2 lq = (qp - uLowWin.xy) * uLowWin.z;
      float lowHere = inside * smoothstep(0.5, 0.5 - uLowWin.w, max(abs(lq.x), abs(lq.y)));
      float lowOn = 1.0 - smoothstep(uLowFrom.x, uLowFrom.y, dot(d, normalize(uTwinEye)));
      float there = lowHere * lowOn;
      for (int j = 0; j < (there > 0.0 ? 1 : 0); j++) {
        vec3 lay = mix(albedo, textureGrad(uLowPlate, lq + 0.5, hx * uPlaceScale * uLowWin.z, hy * uPlaceScale * uLowWin.z).rgb, there);
        albedo = uLowLook < 1.0 ? fromCode(mix(toCode(albedo), toCode(lay), uLowLook)) : lay;
      }
      vec2 veilAt = qp * uLowVeilWin.x;
      float veilOn = frontH * smoothstep(0.5, 0.5 - uLowVeilWin.y, max(abs(veilAt.x), abs(veilAt.y)));
      for (int j = 0; j < (veilOn > 0.0 ? 1 : 0); j++) {
        vec4 haze = textureLod(uLowVeil, veilAt + 0.5, 0.0);
        float veilOwn = lowHere * haze.a;
        albedo = fromCode(clamp(toCode(albedo) + (veilOn * uLowAir * (1.0 - veilOwn) + lowOn * (uLowAir - uLowLook) * veilOwn) * haze.rgb, 0.0, 1.0));
      }
      texels = mix(texels, hd * uPlaceScale * uLowWin.z * uLowSize, step(0.5, there * uLowLook));
    }
    for (int k = 0; k < (uNear + uPlaceIn > 0.0 ? 1 : 0); k++) {
      vec4 tone = texture(uTone, h * uToneScale + 0.5);
      place = uNear * frontH * tone.a * ramp(uPlaceDay, ndl);
      vec3 code = toCode(albedo);
      vec2 gq = (qp - uGlint.xy) * uGlint.z;
      float unseen = inside * laid * smoothstep(0.5, 0.5 - uGlint.w, max(abs(gq.x), abs(gq.y))) * (1.0 - smoothstep(uGlintSeen.x, uGlintSeen.y, dot(normalize(uEyeBody - d), normalize(uTwinEye - d))));
      for (int j = 0; j < (unseen > 0.0 ? 1 : 0); j++) {
        vec3 still = textureLod(uGlintSea, gq + 0.5, 0.0).rgb;
        float water = 1.0 - smoothstep(uGlintCloud.x, uGlintCloud.y, min(code.r, min(code.g, code.b))) * (1.0 - smoothstep(uGlintCloud.z, uGlintCloud.w, code.r - code.b));
        float glow = smoothstep(uGlintGlow.x, uGlintGlow.y, (code.r - still.r) / max(code.g - still.g, uGlintGlow.z));
        code = mix(code, max(code - textureLod(uGlintLight, gq + 0.5, 0.0).rgb * (glow * water), min(code, still)), unseen);
      }
      float top = max(code.r, max(code.g, code.b));
      float sea = (1.0 - smoothstep(uToneCloud.x, uToneCloud.y, min(code.r, min(code.g, code.b)))) * smoothstep(uToneGrey.x, uToneGrey.y, (top - min(code.r, min(code.g, code.b))) / max(top, 1e-3));
      albedo = fromCode(clamp(code + (uNear * frontH - inside * laid) * sea * tone.rgb, 0.0, 1.0));
    }
  }
  float deep = uAway * ramp(uNightFlat.xy, ndl) * past;
  vec3 lin = inverseFilmic(albedo);
  vec3 soil = inverseFilmic(ground);
  float relief = clamp(1.0 + uLandAt.w * (dot(ground, vec3(1.0 / 3.0)) / uLandAt.z - 1.0), uLandClamp.x, uLandClamp.y);
  vec3 nightLin = inverseFilmic(mix(uNightTone, uNightLand * relief, smoothstep(uLandAt.x, uLandAt.y, soil.r / max(soil.b, 0.002))));
  lin = mix(lin, nightLin, deep);
  float dim = 1.0 - uNightFlat.w * uAway * ramp(uNightFlat.xy, ndl) * fade;
  float live = uCloudOn * (1.0 - baked);
  vec3 q = cloudDir(d);
  vec4 cloud = equirectGrad(uCloud, q, uGrad * (1.0 + uNightFlat.z * bad));
  cloud.rgb = mix(cloud.rgb, vec3(dot(cloud.rgb, vec3(1.0 / 3.0))), bad);
  float more = 1.0;
  for (int k = 0; k < (uAway > 0.0 ? 1 : 0); k++) {
    vec4 fc = equirectGrad(uFarCloud, q, uGrad);
    float fine = fc.a - textureLod(uFarCloud, lonLat(q), uFine.y).a;
    cloud = mix(cloud, fc, drift);
    more = min(1.0 + uAway * uFine.x * fine * (1.0 - drift), 1.0 / max(cloud.a, 0.001));
  }
  float a = cloud.a * more * live;
  vec3 sunM = spinY(uSunW * uBodyToWorld, uSpin);
  vec3 toward = sunM - d * ndl;
  vec3 p = normalize(d + toward * (uShadow.x / max(ndl, uShadow.w)));
  float thrown = textureLod(uCloud, lonLat(cloudDir(p)), uShadow.z - uFine.w * uAway).a * (1.0 - drift);
  float shadow = 1.0 - mix(uShadow.y, uFine.z, uAway) * thrown * smoothstep(-0.05, 0.1, ndl) * live;
  float band = (ndl - uTwilightAt.x) / uTwilightAt.y;
  vec3 shade = curveAt(ndl) * (1.0 + uTwilight * exp(-band * band));
  vec3 col = (lin * shadow * (1.0 - a) + inverseFilmic(cloud.rgb) * (more * live * dim)) * shade * uTint;
  vec3 wide = vec3(0.0);
  float reach = uBloomPre.y;
  for (int k = 0; k < 3; k++) {
    vec4 cw = equirectGrad(uCloud, q, reach);
    vec3 under = equirectGrad(uMap, d, reach).rgb;
    for (int j = 0; j < (uAway > 0.0 ? 1 : 0); j++) {
      under = mix(under, equirectGrad(uFar, d, reach).rgb, swap);
      cw = mix(cw, equirectGrad(uFarCloud, q, reach), drift);
    }
    wide += mix(inverseFilmic(under), nightLin, deep) * (1.0 - cw.a * uCloudOn) + inverseFilmic(cw.rgb) * uCloudOn * dim;
    reach *= uBloomPre.z;
  }
  col = max(col - wide * shade * uTint * (uBloomPre.x / 3.0) * mix(uBloomPre.w, 1.0, smoothstep(0.0, 0.5, mu)), 0.0) / (1.0 - uBloomPre.x);
  for (int k = 0; k < (place > 0.0 ? 1 : 0); k++) col = mix(col, lin * uPlaceGain, place);
  float f = exp(-pow(mu / uLimbShape.x, uLimbShape.y));
  vec3 through = exp(-uLimbDepth * f);
  float lit = pow(shade.g * 0.5, uLimbShape.z) * ramp(uLimbDay, ndl);
  col = col * through + (uLimbPale * lit + uLimbNight) * (1.0 - through);
  vec4 e = equirectGrad(uEmissive, d, uGrad);
  vec2 uv = lonLat(d);
  float phase = 6.2831853 * noise(uv * vec2(2.0, 1.0) * uTwinkle.z);
  float twinkle = 1.0 + uTwinkle.x * (sin(uTwinkle.y * uClock + phase) - sin(phase));
  float zone = smoothstep(uDuskZone.x, uDuskZone.y, held) * smoothstep(uDuskZone.z, uDuskZone.w, dot(d, uCentreHold));
  e.rgb = mix(e.rgb, uGold * farLights, max(rim, zone * uRise)) * mix(1.0, exp(-uFarRing.z * (1.0 / max(mu, 0.04) - 1.0)), uAway);
  float dusk = clamp(1.0 + (ndl - held) / uDuskFade, 0.0, 1.0);
  float gate = mix(ramp(uNight, ndl), ramp(uNightGate, ndl), uAway);
  col += e.rgb * (uPeak * uLights * mix(gate * twinkle * uTwinkle.w, dusk, zone * (1.0 - uRise)));
  float wave = uRipple.z * uv.x * 6.2831853 + 5.0 * noise(uv * vec2(2.0, 1.0) * uRipple.w);
  float ripple = 1.0 + uRipple.x * (sin(uRipple.y * uClock + wave) - sin(wave));
  float keep = smoothstep(uAuroraKeep.x, uAuroraKeep.y, d.y);
  col += uAuroraColor * (e.a * e.a * uPeak * ramp(uAuroraGate, ndl) * ripple * (1.0 - uAway) * keep);
  float calm = 0.0;
  for (int k = 0; k < 3; k++) calm = max(calm, 1.0 - smoothstep(0.6, 1.0, acos(clamp(dot(d, uCalmAt[k].xyz), -1.0, 1.0)) / uCalmAt[k].w));
  col.g = mix(col.g, min(col.g, max(col.r, col.b) * uCalm), calm * (1.0 - keep));
  for (int k = 0; k < (uUnborn > 0.0 ? 1 : 0); k++) col.g = mix(col.g, min(col.g, max(col.r, col.b) * uCalm), uUnborn * (1.0 - smoothstep(0.6, 1.0, acos(clamp(dot(d, uBedAt.xyz), -1.0, 1.0)) / uBedAt.w)) * (1.0 - smoothstep(uBedNight.x, uBedNight.y, ndl)));
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain * uWeight / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = diagOut(vec4(col, 1.0), texels, 1.0, vec3(0.15, 0.45, 0.9), vec2(twistOf(d) * uFlow * 8.0, uDrift * uFlow * 8.0), length(vView));
}`

export function direction(lonDeg: number, latDeg: number): THREE.Vector3 {
  const lon = THREE.MathUtils.degToRad(lonDeg)
  const lat = THREE.MathUtils.degToRad(latDeg)
  return new THREE.Vector3(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon))
}

export class Globe {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly bodyToWorld = new THREE.Matrix3()
  private readonly m4 = new THREE.Matrix4()
  private readonly q = new THREE.Quaternion()
  private readonly stormHome: THREE.Vector3
  private readonly look: GlobeLook

  constructor(o: GlobeOptions) {
    const p = o.patches
    const l = o.look
    this.look = l
    const tex = (i: number): THREE.Texture | null => p?.textures[i] ?? p?.textures[0] ?? null
    const plane = (i: number): number => {
      const w = p?.widthsDeg[i]
      return w ? 1 / (2 * Math.tan(THREE.MathUtils.degToRad(w) / 2)) : 1
    }
    const scale = (i: number): number => {
      const win = p?.windows?.[i]
      return plane(i) * (win ? win.raster / win.size : 1)
    }
    const shift = (i: number): THREE.Vector2 => {
      const win = p?.windows?.[i]
      return win ? new THREE.Vector2(win.offset[0]!, win.offset[1]!).divideScalar(win.raster * plane(i)) : new THREE.Vector2()
    }
    const size = (i: number): number => (p?.textures[i]?.image as unknown as { width: number } | undefined)?.width ?? 1
    const full = (i: number): number => p?.full?.[i] || size(i)
    const real = (i: number): number => {
      const made = p?.made?.[i]
      const win = p?.windows?.[i]
      return made ? Math.min(1, made * (win ? win.size / win.raster : 1) / full(i)) : 1
    }
    const levels = Array.from({ length: MAX_PATCHES }, (_, i) => i)
    if ((p?.textures.length ?? 0) > MAX_PATCHES) throw new Error('too many patch levels')
    const spot = p?.spot.clone().normalize() ?? new THREE.Vector3(0, 0, 1)
    const east = new THREE.Vector3(0, 1, 0).cross(spot).normalize()
    const north = spot.clone().cross(east)
    const centre = p?.place?.centre.clone().normalize() ?? spot
    const centreEast = new THREE.Vector3(0, 1, 0).cross(centre).normalize()
    const centreNorth = centre.clone().cross(centreEast)
    const from = p?.place?.from ?? MAX_PATCHES
    this.stormHome = direction(l.storm.lon, l.storm.lat)
    const rad = THREE.MathUtils.degToRad
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uMap: { value: o.map }, uCloud: { value: o.cloud }, uEmissive: { value: o.emissive }, uFar: { value: o.far }, uFarCloud: { value: o.farCloud }, uRise: { value: 0 }, uLights: { value: 1 }, uFine: { value: new THREE.Vector4().fromArray(l.away.fine) }, uFarRing: { value: new THREE.Vector3().fromArray(l.away.far.ring) },
        ...Object.fromEntries(levels.map((i) => ['uPatch' + i, { value: tex(i) }])),
        uPatchScale: { value: levels.map(scale) }, uPatchSize: { value: levels.map(size) }, uPatchReal: { value: levels.map(real) }, uPatchFull: { value: levels.map(full) }, uPatchShift: { value: levels.map(shift) },
        uPatchCount: { value: p?.textures.length ?? 0 },
        uFeather: { value: p?.feather ?? 0.12 }, uPatchFade: { value: new THREE.Vector2(p?.fade[0] ?? 1.1, p?.fade[1] ?? 1.7) }, uPerLine: { value: 1 },
        uSpotN: { value: spot }, uSpotE: { value: east }, uSpotU: { value: north },
        uPatchPlace: { value: levels.map((i) => (i >= from ? 1 : 0)) }, uPlaceN: { value: centre }, uPlaceE: { value: centreEast }, uPlaceU: { value: centreNorth },
        uTone: { value: p?.place?.tone ?? null }, uLowPlate: { value: p?.place?.low?.map ?? null }, uTwinEye: { value: p?.place?.low?.eye.clone() ?? new THREE.Vector3(0, 0, 2) }, uEyeBody: { value: new THREE.Vector3(0, 0, 4) }, uLowVeil: { value: p?.place?.low?.veil?.map ?? null }, uLowAir: { value: 0 }, uGraze: { value: 0 }, uLowVeilWin: { value: new THREE.Vector2(1 / (p?.place?.low?.veil?.times ?? 1), p?.place?.low?.veil?.feather ?? 0.01) }, uLowFrom: { value: new THREE.Vector2(Math.cos(rad(p?.place?.low?.fromDeg[1] ?? 5)), Math.cos(rad(p?.place?.low?.fromDeg[0] ?? 4))) }, uLowLook: { value: 0 }, uLowSize: { value: (p?.place?.low?.map.image as unknown as { width: number } | undefined)?.width ?? 1 }, uLowWin: { value: p?.place?.low ? new THREE.Vector4(p.place.low.window.offset[0]! / p.place.low.window.raster, p.place.low.window.offset[1]! / p.place.low.window.raster, p.place.low.window.raster / p.place.low.window.size, p.place.low.feather) : new THREE.Vector4(0, 0, 1, 0.01) }, uToneScale: { value: p?.place ? 1 / (2 * Math.tan(THREE.MathUtils.degToRad(p.place.toneDeg) / 2)) : 1 }, uNear: { value: 0 }, uPlaceScale: { value: from < MAX_PATCHES ? plane(from) : 1 }, uPlaceIn: { value: 0 }, uEarlyScale: { value: p?.place && from < MAX_PATCHES ? Math.tan(rad((p.widthsDeg[from] ?? p.place.earlyDeg) / 2)) / Math.tan(rad(p.place.earlyDeg / 2)) : 1 }, uToneCloud: { value: new THREE.Vector2().fromArray(p?.place?.toneCloud ?? [1, 2]) }, uToneGrey: { value: new THREE.Vector2().fromArray(p?.place?.toneGrey ?? [-2, -1]) }, uGlint: { value: new THREE.Vector4(p?.place?.glint?.at[0] ?? 0, p?.place?.glint?.at[1] ?? 0, p?.place?.glint?.win ?? 1, p?.place?.glint?.feather ?? 0.04) }, uGlintSeen: { value: p?.place?.glint ? new THREE.Vector2(Math.cos(rad(p.place.glint.seenDeg[0]!)), Math.cos(rad(p.place.glint.seenDeg[1]!))) : new THREE.Vector2(-3, -2) }, uGlintCloud: { value: new THREE.Vector4().fromArray([...(p?.place?.glint?.cloud ?? [254, 255]), ...(p?.place?.glint?.warm ?? [0, 1])]).multiplyScalar(1 / 255) }, uGlintGlow: { value: new THREE.Vector3(p?.place?.glint?.glow[0] ?? 0, p?.place?.glint?.glow[1] ?? 1, (p?.place?.glint?.floor ?? 1) / 255) }, uGlintLight: { value: p?.place?.glint?.light ?? null }, uGlintSea: { value: p?.place?.glint?.sea ?? null }, uPlaceGain: { value: new THREE.Vector3().fromArray(p?.place?.gain ?? [1, 1, 1]) }, uPlaceDay: { value: new THREE.Vector2().fromArray(p?.place?.day ?? [0, 1]) },
        uMapWidth: { value: o.mapWidth }, uMapFull: { value: o.mapFull },
        uSpin: { value: 0 }, uGain: { value: 1 }, uWeight: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uTint: { value: new THREE.Vector3(1, 1, 1) },
        uCurve: { value: l.curve.map((c) => new THREE.Vector3(c[0], c[1], c[2])) },
        uBodyToWorld: { value: this.bodyToWorld }, uEye: { value: new THREE.Vector3(0, 0, 4) },
        uSunW: { value: new THREE.Vector3(1, 0, 0) },
        uFlow: { value: 0 }, uDrift: { value: rad(l.drift.degPerSecond) },
        uStormAxis: { value: this.stormHome.clone() },
        uStorm: { value: new THREE.Vector4(rad(l.storm.degPerSecond), rad(l.storm.coreDeg), rad(l.storm.fadeDeg[0]!), rad(l.storm.fadeDeg[1]!)) },
        uShadow: { value: new THREE.Vector4(l.shadow.height, l.shadow.strength, l.shadow.lod + Math.log2(o.mapWidth / 8192), l.shadow.floor) },
        uLimbPale: { value: new THREE.Vector3().fromArray(l.limb.pale) }, uLimbNight: { value: new THREE.Vector3().fromArray(l.limb.night) }, uLimbDepth: { value: new THREE.Vector3().fromArray(l.limb.depth) },
        uLimbShape: { value: new THREE.Vector4(l.limb.width, l.limb.power, l.limb.gamma, 0) }, uLimbDay: { value: new THREE.Vector2(l.limb.dayFrom, l.limb.dayTo) },
        uNight: { value: new THREE.Vector2(l.night[0], l.night[1]) }, uAuroraGate: { value: new THREE.Vector2(l.auroraGate[0], l.auroraGate[1]) }, uAuroraKeep: { value: new THREE.Vector2(l.auroraKeep[0], l.auroraKeep[1]) }, uCalm: { value: l.calm[0] }, uCalmAt: { value: [0, 1, 2].map((k) => { const at = direction(l.calm[1 + k * 3]!, l.calm[2 + k * 3]!); return new THREE.Vector4(at.x, at.y, at.z, THREE.MathUtils.degToRad(l.calm[3 + k * 3]!)) }) }, uTwilight: { value: new THREE.Vector3(l.twilight[0], l.twilight[1], l.twilight[2]) }, uTwilightAt: { value: new THREE.Vector2(l.twilight[3], l.twilight[4]) },
        uPeak: { value: l.emissivePeak }, uBloomPre: { value: new THREE.Vector4(0, l.bloomPre[0], l.bloomPre[1], l.bloomPre[2]) }, uAuroraColor: { value: new THREE.Vector3().fromArray(l.auroraColor) }, uUnborn: { value: 0 }, uBedAt: { value: new THREE.Vector4(...direction(l.bed[0]!, l.bed[1]!).toArray(), THREE.MathUtils.degToRad(l.bed[2]!)) }, uBedNight: { value: new THREE.Vector2(l.bed[3]!, l.bed[4]!) },
        uTwinkle: { value: new THREE.Vector4().fromArray(l.twinkle) }, uRipple: { value: new THREE.Vector4(l.ripple[0], l.ripple[1], l.ripple[2], 40) },
        uClock: { value: 0 }, uCloudOn: { value: 1 },
        uSunHold: { value: o.sunHold.clone().normalize() }, uCentreHold: { value: direction(l.dusk.centre[0]!, l.dusk.centre[1]!) },
        uDuskZone: { value: new THREE.Vector4().fromArray(l.dusk.zone) }, uDuskFade: { value: l.dusk.fade },
        uAway: { value: 0 }, uNightTone: { value: new THREE.Vector3().fromArray(l.away.tone) }, uNightFlat: { value: new THREE.Vector4(l.away.flat[0], l.away.flat[1], l.away.soft, l.away.dim) }, uNightGate: { value: new THREE.Vector2(l.away.gate[0], l.away.gate[1]) },
        uFarLight: { value: new THREE.Vector4(l.away.far.light[0], l.away.far.light[1], Math.cos(rad(l.away.far.cap[4]!)), Math.cos(rad(l.away.far.cap[3]!))) },
        uFarCap: { value: new THREE.Vector4(...direction(l.away.far.cap[0]!, l.away.far.cap[1]!).toArray(), l.away.far.cap[2]) },
        uFarRim: { value: new THREE.Vector2(l.away.far.rim[0], l.away.far.rim[1]) }, uFarZone: { value: new THREE.Vector2(l.away.far.zone[0], l.away.far.zone[1]) }, uFarEast: { value: direction(l.away.far.east[0]! + 90, 0) }, uFarEdge: { value: new THREE.Vector4(l.away.far.east[1], l.away.far.east[2], l.away.far.east[3], l.away.far.east[4]) }, uGold: { value: new THREE.Vector3().fromArray(l.away.far.gold) },
        uNightLand: { value: new THREE.Vector3().fromArray(l.away.land) }, uLandAt: { value: new THREE.Vector4().fromArray(l.away.landAt) }, uLandClamp: { value: new THREE.Vector2().fromArray(l.away.landClamp) },
        uDiag: diagUniform, uGrad: gradUniform,
      },
    })
    const seg = o.segments ?? 320
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, seg, seg / 2), this.material)
  }

  update(sun: THREE.Vector3, eye: THREE.Vector3, rotation: THREE.Quaternion, spin: number, gain: number, weight: number, flow: number, clock: number, away: number, rise: number, perLine: number): void {
    const u = this.material.uniforms
    u.uPerLine!.value = perLine
    ;(u.uSunW!.value as THREE.Vector3).copy(sun)
    ;(u.uEye!.value as THREE.Vector3).copy(eye)
    u.uSpin!.value = spin
    u.uGain!.value = gain
    u.uWeight!.value = weight
    u.uFlow!.value = flow
    u.uClock!.value = clock
    u.uAway!.value = away
    u.uRise!.value = rise
    const home = this.stormHome
    const lat = Math.asin(Math.min(Math.max(home.y, -1), 1))
    const a = -THREE.MathUtils.degToRad(this.look.drift.degPerSecond) * -Math.cos(3 * lat) * flow
    const c = Math.cos(a)
    const s = Math.sin(a)
    ;(u.uStormAxis!.value as THREE.Vector3).set(c * home.x - s * home.z, home.y, s * home.x + c * home.z)
    this.bodyToWorld.setFromMatrix4(this.m4.makeRotationFromQuaternion(this.q.copy(rotation).multiply(this.mesh.quaternion)))
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
