import * as THREE from 'three'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { EQUIRECT_GLSL } from '../../space/sky'
import patchJson from './patches.json'
import { frameUniform } from '../../core/frame'

export const SPHERE_VERT = /* glsl */ `
out vec3 vLocal;
out vec3 vRing;
uniform mat4 uToRing;
out vec3 vWorldN;
out vec3 vPos;
out vec3 vView;
out vec3 vClip;
flat out vec3 vCamL;
void main() {
  vLocal = position;
  vRing = (uToRing * vec4(position, 1.0)).xyz;
  vCamL = (inverse(modelMatrix) * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vWorldN = normalize(mat3(modelMatrix) * position);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz;
  vec4 mv = viewMatrix * wp;
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position.xyw;
}`

export const LIGHT_GLSL = /* glsl */ `
uniform sampler2D uLight;
uniform vec2 uLightSize;
vec3 lightAt(float ndl, float mu) {
  vec2 uv = vec2((clamp(ndl * 0.5 + 0.5, 0.0, 1.0) * (uLightSize.x - 1.0) + 0.5) / uLightSize.x, (clamp(mu, 0.0, 1.0) * (uLightSize.y - 1.0) + 0.5) / uLightSize.y);
  return textureLod(uLight, uv, 0.0).rgb;
}`

export const PATCH_COUNT = patchJson.levels.length

const PATCH_SAMPLERS = Array.from({ length: PATCH_COUNT }, (_, i) => 'uniform sampler2D uPatch' + i + ';').join('\n')

const PATCH_LEVELS = Array.from({ length: PATCH_COUNT }, (_, i) => `    {
      vec2 q = g * uPatchScale[${i}];
      float w = smoothstep(0.5, 0.5 - ${i === 0 ? 'uPatchRim.x' : 'uFeather'}, max(abs(q.x), abs(q.y))${i === 0 ? ' + uPatchRim.y * (0.5 + 0.25 * sin(q.x * 41.0 + 1.3) * sin(q.y * 33.0 + 0.7) + 0.25 * sin(q.x * 87.0 - q.y * 71.0 + 2.1))' : ''}) * (1.0 - smoothstep(uPatchFade.x, uPatchFade.y, parent * seen));
      for (int j = 0; j < (w > 0.0 ? 1 : 0); j++) enc = mix(enc, textureGrad(uPatch${i}, q + 0.5, gx * uPatchScale[${i}], gy * uPatchScale[${i}]).rgb, w);
      parent = gd * uPatchScale[${i}] * uPatchSize[${i}];
      texels = mix(texels, parent, step(0.5, w));
    }`).join('\n')

export const PLATE_COUNT = 4

export const PLATE_SAMPLERS = Array.from({ length: PLATE_COUNT }, (_, i) => 'uniform sampler2D uPlate' + i + ';').join('\n')

export const PLATE_LEVELS = Array.from({ length: PLATE_COUNT }, (_, i) => `    {
      vec2 q = pg * uPlateScale[${i}];
      float w = smoothstep(0.5, 0.5 - uPlace.x, max(abs(q.x), abs(q.y)));
      for (int j = 0; j < (w > 0.0 ? 1 : 0); j++) {
        vec4 s = textureGrad(uPlate${i}, q + 0.5, px * uPlateScale[${i}], py * uPlateScale[${i}]);
        aP = mix(aP, s.rgb * s.rgb * uPlace.y, ${i === 0 ? '1.0' : 'w'});
      }
      ${i === 0 ? 'field = textureLod(uPlaceField, q + 0.5, 0.0); wP = w * field.a;' : ''}
      texP = mix(texP, pgd * uPlateScale[${i}] * uPlateSize[${i}], step(0.5, w));
    }`).join('\n')

const TOP_LEVELS = Array.from({ length: PLATE_COUNT - 1 }, (_, i) => `    {
      vec2 q = pg * uPlateScale[${i + 1}];
      fibre = mix(fibre, textureGrad(uPlate${i + 1}, q + 0.5, px * uPlateScale[${i + 1}], py * uPlateScale[${i + 1}]).rgb, smoothstep(0.5, 0.5 - uPlace.x, max(abs(q.x), abs(q.y))));
    }`).join('\n')

export const TOP_PATH = 65

export const TOPS_GLSL = /* glsl */ `
uniform vec2 uTops;
uniform vec3 uTopWhite;
uniform vec2 uTopFine;
uniform vec3 uTopHaze;
uniform vec3 uTopSun;
uniform vec3 uTopPath[${TOP_PATH}];
float topsAt(vec2 pg, vec2 px, vec2 py) {
  vec2 q0 = pg * uPlateScale[0];
  float wq = smoothstep(0.5, 0.5 - uPlace.x, max(abs(q0.x), abs(q0.y))) * textureLod(uPlaceField, q0 + 0.5, 0.0).a;
  float share = 0.0;
  for (int k = 0; k < (wq > 0.0 ? 1 : 0); k++) {
    vec4 top = textureGrad(uPlate0, q0 + 0.5, px * uPlateScale[0], py * uPlateScale[0]);
    vec3 fibre = top.rgb;
${TOP_LEVELS}
    vec3 calm = textureGrad(uPlate0, q0 + 0.5, px * uPlateScale[0] + vec2(uTopFine.y, 0.0), py * uPlateScale[0] + vec2(0.0, uTopFine.y)).rgb;
    share = wq * clamp(top.a * (1.0 + uTopFine.x * (dot(fibre, vec3(1.0)) / max(dot(calm, vec3(1.0)), 1e-3) - 1.0)), 0.0, 1.0);
  }
  return share;
}
float topsSeen(vec3 p, vec3 n) {
  vec3 a = uTopPath[0] - p;
  float best = dot(n, a) / length(a);
  for (int i = 1; i < ${TOP_PATH}; i++) {
    vec3 c = uTopPath[i] - p;
    vec3 b = c - a;
    float na = dot(n, a);
    float nb = dot(n, b);
    float ab = dot(a, b);
    float den = nb * ab - na * dot(b, b);
    vec3 e = a + clamp((na * ab - nb * dot(a, a)) / (abs(den) > 1e-12 ? den : 1e-12), 0.0, 1.0) * b;
    best = max(best, max(dot(n, c) / length(c), dot(n, e) / length(e)));
    a = c;
  }
  return best;
}
vec3 topHaze(float mu) {
  return exp(-uTopHaze * (1.0 / max(mu, 1e-3) - 1.0));
}
vec3 topsLight(float share, float sun, float mu, float seen) {
  return uTopWhite * (share * smoothstep(uTops.x, uTops.y, sun)) * max(topHaze(mu) - topHaze(seen), vec3(0.0));
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
${PATCH_SAMPLERS}
${PLATE_SAMPLERS}
uniform float uPlateScale[${PLATE_COUNT}];
uniform float uPlateSize[${PLATE_COUNT}];
uniform vec2 uPlace;
uniform vec3 uRelit;
uniform vec2 uSteep;
uniform sampler2D uPlaceField;
uniform vec3 uPlaceEye;
uniform float uPlaceRef;
uniform float uCloudTime;
uniform mat3 uPlaceRot;
uniform vec3 uPlaceN;
uniform vec3 uPlaceE;
uniform vec3 uPlaceU;
uniform vec3 uDeckCentre;
uniform float uDeckRadius;
uniform vec3 uDeckF0;
uniform vec3 uDeckR0;
uniform vec4 uDeckFlow;
uniform vec2 uDeckFlowDir;
uniform float uDeckTime;
uniform sampler2D uDeckLight;
uniform vec3 uDeckLightSize;
uniform float uPatchScale[${PATCH_COUNT}];
uniform float uPatchSize[${PATCH_COUNT}];
uniform float uFeather;
uniform vec2 uPatchRim;
uniform vec2 uPatchFade;
uniform float uFrame;
uniform vec3 uSpotN;
uniform vec3 uSpotE;
uniform vec3 uSpotU;
uniform sampler2D uCloud;
uniform sampler2D uShadow;
uniform sampler2D uShade;
uniform float uMapWidth;
uniform float uGrad;
uniform float uSpin;
uniform float uTime;
uniform float uGain;
uniform float uWeight;
uniform vec3 uNear;
uniform float uSoft;
uniform vec2 uSharp;
uniform float uWrapSoft;
uniform float uShadeMix;
uniform float uVignette;
uniform sampler2D uFaceMap;
uniform vec4 uFace;
uniform float uFaceGain;
uniform vec3 uFaceN;
uniform vec3 uFaceE;
uniform vec3 uFaceU;
uniform float uAspect;
uniform vec3 uSunW;
uniform vec3 uCloudWhite;
uniform vec3 uShadowTint;
uniform vec4 uBandRate;
uniform vec4 uCloudRate;
uniform float uCloudFine;
uniform sampler2D uRingProfile;
uniform vec3 uRingShade;
uniform vec3 uRingN;
uniform vec3 uRingSun;
in vec3 vClip;
in vec3 vLocal;
in vec3 vRing;
in vec3 vWorldN;
in vec3 vPos;
in vec3 vView;
flat in vec3 vCamL;
out vec4 outColor;
${EQUIRECT_GLSL}
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
${LIGHT_GLSL}
vec3 deckLight(float mu, float psi) {
  float m = clamp(mu, 0.0, 1.0);
  float y = sqrt(max(1.0 - sqrt(max(1.0 - m * m, 0.0)), 0.0));
  vec2 uv = vec2((clamp(psi / uDeckLightSize.z * 0.5 + 0.5, 0.0, 1.0) * (uDeckLightSize.x - 1.0) + 0.5) / uDeckLightSize.x, (y * (uDeckLightSize.y - 1.0) + 0.5) / uDeckLightSize.y);
  return textureLod(uDeckLight, uv, 0.0).rgb;
}
vec3 shadeAt(vec3 d) {
  return textureLod(uShade, vec2(atan(d.x, d.z) / (2.0 * PI) + 0.5, asin(clamp(d.y, -1.0, 1.0)) / PI + 0.5), 0.0).rgb;
}
vec3 spinY(vec3 d, float a) {
  float c = cos(a), s = sin(a);
  return vec3(c * d.x - s * d.z, d.y, s * d.x + c * d.z);
}
float rate(vec4 k, float lat) {
  return k.x + k.y * sin(k.z * lat + k.w);
}
vec3 flowed(vec3 nd) {
  vec3 pS = uDeckCentre + uDeckRadius * nd;
  float alongF = dot(pS, uDeckF0) * uDeckFlowDir.y + dot(pS, uDeckR0) * uDeckFlowDir.x;
  float acrossF = dot(pS, uDeckF0) * uDeckFlowDir.x - dot(pS, uDeckR0) * uDeckFlowDir.y;
  float kF = uDeckTime * (uDeckFlow.x + uDeckFlow.y * sin(acrossF * uDeckFlow.z + uDeckFlow.w) + 0.4 * uDeckFlow.y * sin(acrossF * uDeckFlow.z * 2.7 + alongF * 0.11 + 1.3));
  return normalize(pS - (uDeckF0 * uDeckFlowDir.y + uDeckR0 * uDeckFlowDir.x) * kF - uDeckCentre);
}
${TOPS_GLSL}
void main() {
  vec3 d0 = normalize(vLocal);
  float lat = asin(clamp(d0.y, -1.0, 1.0));
  float bandTurn = uTime * rate(uBandRate, lat);
  float cloudTurn = uCloudTime * rate(uCloudRate, lat);
  vec3 d = spinY(d0, uSpin + bandTurn);
  vec3 dc = spinY(d0, uSpin + cloudTurn);
  vec3 n = normalize(vWorldN);
  float mu = clamp(dot(d0, normalize(vCamL - d0)), 0.0, 1.0);
  float ndl = dot(n, uSunW);
  float texels = diagTexelsDir(d, uMapWidth);
  vec3 ax = dFdx(d);
  vec3 ay = dFdy(d);
  float aa = dot(ax, ax) + dot(ay, ay);
  float ad = length(cross(ax, ay));
  float lean = max(2.0 * ad / max(aa + sqrt(max(aa * aa - 4.0 * ad * ad, 0.0)), 1e-20), 1.0 / 16.0);
  float seen = lean * uFrame;
  float close = 1.0 - smoothstep(uPatchFade.x, uPatchFade.y, texels * seen);
  float grad = max(uGrad, close * uWrapSoft / max(texels * lean, 1e-3));
  vec3 enc = equirectGrad(uMap, d, grad).rgb;
  enc = max(enc + (1.0 - close) * (uSharp.x + uSharp.y * (1.0 - mu)) * (enc - equirectGrad(uMap, d, max(uGrad * uFrame, close * uWrapSoft / max(texels * lean, 1e-3)) * 4.0).rgb), vec3(0.0));
  vec3 wide = inverseFilmic(enc);
  float dn = dot(d, uSpotN);
  vec2 g = vec2(dot(d, uSpotE), dot(d, uSpotU)) / max(dn, 0.05);
  vec2 gx = dFdx(g);
  vec2 gy = dFdy(g);
  float gd = sqrt(max(dot(gx, gx), dot(gy, gy)));
  gx *= uGrad;
  gy *= uGrad;
  float parent = texels;
  for (int k = 0; k < (dn > 0.3 && texels * seen < uPatchFade.y ? 1 : 0); k++) {
${PATCH_LEVELS}
  }
  vec3 nd = uPlaceRot * spinY(d0, uSpin + (uTime - uPlaceRef) * rate(uBandRate, lat));
  vec3 pS = uDeckCentre + uDeckRadius * nd;
  float alongF = dot(pS, uDeckF0) * uDeckFlowDir.y + dot(pS, uDeckR0) * uDeckFlowDir.x;
  float acrossF = dot(pS, uDeckF0) * uDeckFlowDir.x - dot(pS, uDeckR0) * uDeckFlowDir.y;
  float kF = uDeckTime * (uDeckFlow.x + uDeckFlow.y * sin(acrossF * uDeckFlow.z + uDeckFlow.w) + 0.4 * uDeckFlow.y * sin(acrossF * uDeckFlow.z * 2.7 + alongF * 0.11 + 1.3));
  vec3 na = normalize(pS - (uDeckF0 * uDeckFlowDir.y + uDeckR0 * uDeckFlowDir.x) * kF - uDeckCentre);
  float pn = dot(na, uPlaceN);
  vec2 pg = vec2(dot(na, uPlaceE), dot(na, uPlaceU)) / max(pn, 0.05);
  vec2 px = dFdx(pg);
  vec2 py = dFdy(pg);
  float pgd = sqrt(max(dot(px, px), dot(py, py)));
  px *= uGrad;
  py *= uGrad;
  vec3 aP = vec3(0.0);
  vec4 field = vec4(1.0, 1.0, 1.0, 0.0);
  float wP = 0.0;
  float texP = 0.0;
  for (int k = 0; k < (pn > 0.5 ? 1 : 0); k++) {
${PLATE_LEVELS}
  }
  texels = mix(texels, texP, step(0.5, wP));
  vec3 parentAlbedo = inverseFilmic(enc);
  vec3 albedo = mix(parentAlbedo, aP * field.rgb, wP);
  vec3 aEff = mix(parentAlbedo / field.rgb, aP, wP);
  vec3 pD = uPlaceRot * spinY(d0, uSpin);
  vec3 dvD = normalize(pD - uPlaceEye);
  float muD = dot(pD, -dvD);
  vec3 lD = deckLight(muD, atan(dot(dvD, uDeckR0), dot(dvD, uDeckF0)));
  vec2 cloud = vec2(equirectGrad(uCloud, dc, uGrad).r, equirectGrad(uShadow, dc, uGrad).r) * (1.0 - wP);
  cloud.r = clamp(cloud.r * (1.0 + uCloudFine * (dot(albedo, vec3(1.0)) / max(dot(wide, vec3(1.0)), 1e-3) - 1.0)), 0.0, 1.0);
  vec2 fq = vec2(dot(d, uFaceE), dot(d, uFaceU)) * sqrt(2.0 / max(1.0 + dot(d, uFaceN), 0.05));
  vec2 fx = dFdx(fq) * (uFace.y * uGrad);
  vec2 fy = dFdy(fq) * (uFace.y * uGrad);
  for (int k = 0; k < (uFace.x > 0.0 ? 1 : 0); k++) {
    float w = uFace.x * (1.0 - smoothstep(uFace.z, uFace.w, length(fq))) * smoothstep(uPatchFade.x, uPatchFade.y, texels * seen);
    albedo *= exp2((textureGrad(uFaceMap, fq * uFace.y + 0.5, fx, fy).rgb - 128.0 / 255.0) * (uFaceGain * w));
  }
  vec3 light = lightAt(ndl, mu);
  for (int k = 0; k < (uSoft > 0.0 ? 1 : 0); k++) {
    light = vec3(0.0);
    for (int i = 0; i < 9; i++) light += lightAt(ndl + uSoft * (float(i) / 4.0 - 1.0), mu);
    light /= 9.0;
  }
  light *= mix(vec3(1.0), shadeAt(d0), uShadeMix);
  vec3 col = albedo * light * max(vec3(1.0) - cloud.g * uShadowTint, vec3(0.04));
  float lit = smoothstep(-0.02, 0.32, ndl);
  col = mix(col, uCloudWhite * (0.02 + 0.98 * lit), cloud.r);
  float sn = dot(uRingSun, uRingN);
  float along = -dot(vRing, uRingN) / (abs(sn) > 1e-4 ? sn : 1e-4);
  float ru = (length(vRing + along * uRingSun) - uRingShade.y) / (uRingShade.z - uRingShade.y);
  vec2 rg = vec2(dFdx(ru), dFdy(ru));
  for (int k = 0; k < (uRingShade.x > 0.0 && along > 0.0 && ru > 0.0 && ru < 1.0 ? 1 : 0); k++) col *= 1.0 - uRingShade.x * lit * textureGrad(uRingProfile, vec2(ru, 0.5), vec2(rg.x, 0.0), vec2(rg.y, 0.0)).r;
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  vec3 own = col * uNear;
  vec3 relit = aEff * lD;
  vec3 luma = vec3(0.2126, 0.7152, 0.0722);
  float lift = log2(max(dot(relit, luma), 1e-5) / max(dot(own, luma), 1e-5));
  vec3 tops = vec3(0.0);
  float topShare = 0.0;
  for (int k = 0; k < (pn > 0.5 ? 1 : 0); k++) topShare = topsAt(pg, px, py);
  for (int k = 0; k < (topShare > 0.0 ? 1 : 0); k++) tops = topsLight(topShare, dot(pD, uTopSun), muD, topsSeen(uDeckCentre + uDeckRadius * pD, pD));
  col = mix(own, relit, mix(uRelit.y, uRelit.x, smoothstep(-uRelit.z, uRelit.z, lift)) * (1.0 - smoothstep(uSteep.x, uSteep.y, muD))) + uNear * tops;
  col *= uGain * uWeight / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = diagOut(vec4(col, 1.0), texels, 1.0, vec3(0.15, 0.45, 0.9), vec2(bandTurn, cloudTurn) * 4.0, length(vView));
}`

export interface GlobeOptions {
  map: THREE.Texture
  cloud: THREE.Texture
  shadow: THREE.Texture
  light: THREE.Texture
  shade: THREE.Texture
  lightSize: [number, number]
  cloudWhite: number
  shadowTint: [number, number, number]
  bandRate: [number, number, number, number]
  cloudRate: [number, number, number, number]
  cloudFine: number
  sharp: [number, number]
  wrapSoft: number
  patches: { textures: THREE.Texture[]; widthsDeg: number[]; spot: THREE.Vector3; feather: number; fade: [number, number] }
  face: { map: THREE.Texture; centre: [number, number, number]; reachDeg: number; fadeDeg: [number, number]; gain: number }
  place: PlaceOptions
}

export interface PlaceOptions {
  textures: THREE.Texture[]
  halfTans: number[]
  frame: { n: number[]; e: number[]; u: number[] }
  rot: THREE.Quaternion
  field: THREE.Texture
  clockRef: number
  aMax: number
  steep: [number, number]
  relitSoft: number
  topLight: { sun: [number, number]; white: [number, number, number]; fine: [number, number]; haze: [number, number, number]; path: THREE.Vector3[] }
  feather: number
  deck: { centre: number[]; radius: number; f0: number[]; r0: number[]; sun: number[]; flow: [number, number, number, number]; flowAngle: number; light: THREE.Texture; lightSize: number[]; psiMax: number }
}

export class Globe {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(o: GlobeOptions) {
    const p = o.patches
    if (p.textures.length !== PATCH_COUNT) throw new Error('patch levels: ' + p.textures.length)
    const spot = p.spot.clone().normalize()
    const east = new THREE.Vector3(0, 1, 0).cross(spot).normalize()
    const north = spot.clone().cross(east)
    const faceN = new THREE.Vector3().fromArray(o.face.centre).normalize()
    const faceE = new THREE.Vector3(0, 1, 0).cross(faceN).normalize()
    const lambert = (deg: number): number => 2 * Math.sin(THREE.MathUtils.degToRad(deg) / 2)
    const pl = o.place
    if (pl.textures.length !== PLATE_COUNT) throw new Error('plate levels: ' + pl.textures.length)
    const v3 = (a: number[]): THREE.Vector3 => new THREE.Vector3().fromArray(a)
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: SPHERE_VERT,
      fragmentShader: FRAG,
      uniforms: {
        uMap: { value: o.map }, uCloud: { value: o.cloud }, uShadow: { value: o.shadow }, uLight: { value: o.light }, uShade: { value: o.shade }, uLightSize: { value: new THREE.Vector2().fromArray(o.lightSize) },
        uMapWidth: { value: (o.map.image as unknown as { width: number }).width },
        ...Object.fromEntries(p.textures.map((t, i) => ['uPatch' + i, { value: t }])),
        uPatchScale: { value: p.widthsDeg.map((w) => 1 / (2 * Math.tan(THREE.MathUtils.degToRad(w) / 2))) },
        uPatchSize: { value: p.textures.map((t) => (t.image as unknown as { width: number }).width) },
        uFeather: { value: p.feather }, uPatchRim: { value: new THREE.Vector2(p.feather, 0) }, uPatchFade: { value: new THREE.Vector2().fromArray(p.fade) },
        uSpotN: { value: spot }, uSpotE: { value: east }, uSpotU: { value: north },
        uSpin: { value: 0 }, uTime: { value: 0 }, uGain: { value: 1 }, uWeight: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uNear: { value: new THREE.Vector3(1, 1, 1) }, uSoft: { value: 0 }, uSharp: { value: new THREE.Vector2(o.sharp[0], o.sharp[1]) }, uWrapSoft: { value: o.wrapSoft }, uToRing: { value: new THREE.Matrix4() }, uRingProfile: { value: null }, uRingShade: { value: new THREE.Vector3(0, 1, 2) }, uRingN: { value: new THREE.Vector3(0, 1, 0) }, uRingSun: { value: new THREE.Vector3(0, 1, 0) }, uShadeMix: { value: 1 },
        uSunW: { value: new THREE.Vector3(1, 0, 0) },
        uCloudWhite: { value: new THREE.Vector3(o.cloudWhite, o.cloudWhite, o.cloudWhite) },
        uShadowTint: { value: new THREE.Vector3().fromArray(o.shadowTint) },
        uBandRate: { value: new THREE.Vector4().fromArray(o.bandRate) },
        uCloudRate: { value: new THREE.Vector4().fromArray(o.cloudRate) },
        uCloudFine: { value: o.cloudFine },
        uFaceMap: { value: o.face.map }, uFace: { value: new THREE.Vector4(0, 0.5 / lambert(o.face.reachDeg), lambert(o.face.fadeDeg[0]), lambert(o.face.fadeDeg[1])) }, uFaceGain: { value: o.face.gain },
        uFaceN: { value: faceN }, uFaceE: { value: faceE }, uFaceU: { value: faceN.clone().cross(faceE) },
        ...Object.fromEntries(pl.textures.map((t, i) => ['uPlate' + i, { value: t }])),
        uPlateScale: { value: pl.halfTans.map((t) => 1 / (2 * t)) },
        uPlateSize: { value: pl.textures.map((t) => (t.image as unknown as { width: number }).width) },
        uPlace: { value: new THREE.Vector2(pl.feather, pl.aMax) }, uRelit: { value: new THREE.Vector3(0, 0, pl.relitSoft) }, uSteep: { value: new THREE.Vector2().fromArray(pl.steep) }, uTops: { value: new THREE.Vector2().fromArray(pl.topLight.sun) }, uTopWhite: { value: new THREE.Vector3().fromArray(pl.topLight.white) }, uTopHaze: { value: new THREE.Vector3().fromArray(pl.topLight.haze) }, uTopSun: { value: v3(pl.deck.sun) }, uTopPath: { value: pl.topLight.path }, uTopFine: { value: new THREE.Vector2().fromArray(pl.topLight.fine) }, uPlaceField: { value: pl.field }, uPlaceRef: { value: pl.clockRef }, uPlaceEye: { value: new THREE.Vector3(0, 1, 0) }, uCloudTime: { value: 0 },
        uPlaceRot: { value: new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(pl.rot)) },
        uPlaceN: { value: v3(pl.frame.n) }, uPlaceE: { value: v3(pl.frame.e) }, uPlaceU: { value: v3(pl.frame.u) },
        uDeckCentre: { value: v3(pl.deck.centre) }, uDeckRadius: { value: pl.deck.radius }, uDeckF0: { value: v3(pl.deck.f0) }, uDeckR0: { value: v3(pl.deck.r0) },
        uDeckFlow: { value: new THREE.Vector4().fromArray(pl.deck.flow) }, uDeckFlowDir: { value: new THREE.Vector2(Math.cos(pl.deck.flowAngle), Math.sin(pl.deck.flowAngle)) }, uDeckTime: { value: 0 },
        uDeckLight: { value: pl.deck.light }, uDeckLightSize: { value: new THREE.Vector3(pl.deck.lightSize[0], pl.deck.lightSize[1], pl.deck.psiMax) },
        uDiag: diagUniform, uGrad: gradUniform, uFrame: frameUniform,
      },
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 384, 192), this.material)
  }

  update(sun: THREE.Vector3, spin: number, time: number, clock: number, gain: number, weight: number, vignette: number, aspect: number): void {
    const u = this.material.uniforms
    ;(u.uSunW!.value as THREE.Vector3).copy(sun)
    u.uSpin!.value = spin
    u.uTime!.value = clock
    u.uCloudTime!.value = time
    u.uGain!.value = gain
    u.uWeight!.value = weight
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
  }

  soften(width: number, shade: number): void {
    this.material.uniforms.uSoft!.value = width
    this.material.uniforms.uShadeMix!.value = shade
  }

  ringShade(profile: THREE.Texture, range: [number, number], normal: THREE.Vector3): void {
    const u = this.material.uniforms
    u.uRingProfile!.value = profile
    ;(u.uRingShade!.value as THREE.Vector3).set(0, range[0], range[1])
    ;(u.uRingN!.value as THREE.Vector3).copy(normal)
  }

  shadeRings(strength: number, ring: THREE.Object3D, sunLocal: THREE.Vector3): void {
    const u = this.material.uniforms
    ;(u.uRingShade!.value as THREE.Vector3).x = strength
    this.mesh.updateWorldMatrix(true, false)
    ;(u.uToRing!.value as THREE.Matrix4).copy(ring.matrixWorld).invert().multiply(this.mesh.matrixWorld)
    ;(u.uRingSun!.value as THREE.Vector3).copy(sunLocal)
  }

  rim(on: number, feather: number, wave: number): void {
    const u = this.material.uniforms
    const base = u.uFeather!.value as number
    ;(u.uPatchRim!.value as THREE.Vector2).set(base + (feather - base) * on, wave * on)
  }

  place(up: number, down: number, deckTime: number, eye: THREE.Vector3, steep: [number, number]): void {
    const u = this.material.uniforms
    ;(u.uSteep!.value as THREE.Vector2).set(steep[0], steep[1])
    ;(u.uPlaceEye!.value as THREE.Vector3).copy(eye)
    ;(u.uRelit!.value as THREE.Vector3).x = up
    ;(u.uRelit!.value as THREE.Vector3).y = down
    u.uDeckTime!.value = deckTime
  }

  plates(): Record<string, THREE.IUniform> {
    const u = this.material.uniforms
    const out: Record<string, THREE.IUniform> = { uPlateScale: u.uPlateScale!, uPlateSize: u.uPlateSize!, uPlace: u.uPlace!, uPlaceField: u.uPlaceField!, uPlaceN: u.uPlaceN!, uPlaceE: u.uPlaceE!, uPlaceU: u.uPlaceU! }
    for (const name of ['uTops', 'uTopWhite', 'uTopFine', 'uTopHaze', 'uTopSun', 'uTopPath']) out[name] = u[name]!
    for (let i = 0; i < PLATE_COUNT; i++) out['uPlate' + i] = u['uPlate' + i]!
    return out
  }

  tops(sun: THREE.Vector3): void {
    ;(this.material.uniforms.uTopSun!.value as THREE.Vector3).copy(sun)
  }

  face(weight: number): void {
    ;(this.material.uniforms.uFace!.value as THREE.Vector4).x = weight
  }

  near(tint: [number, number, number], amount: number): void {
    ;(this.material.uniforms.uNear!.value as THREE.Vector3).set(1 + (tint[0] - 1) * amount, 1 + (tint[1] - 1) * amount, 1 + (tint[2] - 1) * amount)
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
