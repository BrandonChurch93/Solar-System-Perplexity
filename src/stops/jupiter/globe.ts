import * as THREE from 'three'
import { HAZE_GLSL, hazeUniforms, type HazeParams } from '../../bodies/haze'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { EQUIRECT_GLSL } from '../../space/sky'
import { PALL_GLSL, pallUniforms } from './pall'

export const CURVE_KNOTS = 33
export const LIMB_KNOTS = 17
export const JET_KNOTS = 129
export const MAX_PATCHES = 6

export interface PatchSet {
  center: THREE.Vector3
  textures: THREE.Texture[]
  widthsDeg: number[]
  feather: number
  fade: [number, number]
}

export interface SpotShape {
  center: THREE.Vector3
  axesDeg: [number, number]
  core: number
  reach: number
}

export interface WispParams {
  texture: THREE.Texture
  repeats: number
  latScale: number
  amount: number
  shadow: number
  shadowLength: number
  shadowBlur: number
  polarFrom: number
  polarTo: number
  fine: number
}

export interface GlobeOptions {
  map: THREE.Texture
  mapWidth: number
  curve: number[][]
  limb: number[][]
  jet: number[]
  shadeKnee: [number, number]
  night: [number, number, number]
  nightAlbedo: [number, number, number, number]
  shadow: [number, number, number]
  shadowFade: [number, number]
  shadowTip?: [number, number, number, number]
  shadowToe?: [number, number, number]
  shadowHaze: [number, number]
  nightRim: { glow: [number, number, number]; power: number; air: number; from: number; to: number; out: number; bulge: number }
  litEdge: [number, number, number, number]
  haze: HazeParams
  spot: SpotShape
  wisp: WispParams
  patches?: PatchSet
  veil: { color: [number, number, number]; height: number; repeats: number }
  limbLit: [number, number, number]
  edge: { pixels: number; inset: number; rim: number; cap: number; air: [number, number, number, number]; soft: [number, number]; low?: { sun: [number, number, number, number]; pixels: number; air: number; scale: number } }
  pallShell: [number, number]
  segments?: number
}

const VERT = /* glsl */ `
out vec3 vPos;
out vec3 vView;
out vec3 vClip;
void main() {
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
      float w = front * smoothstep(0.5, 0.5 - uFeather, max(abs(q.x), abs(q.y))) * (1.0 - smoothstep(uPatchFade.x, uPatchFade.y, parent));
      if (w > 0.0) albedo = mix(albedo, textureGrad(uPatch${i}, q + 0.5, gx * uPatchScale[${i}], gy * uPatchScale[${i}]).rgb, w);
      parent = gd * uPatchScale[${i}] * uPatchSize[${i}];
      texels = mix(texels, parent, step(0.5, w));
    }`).join('\n')

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform sampler2D uWisp;
${PATCH_SAMPLERS}
uniform float uPatchScale[${MAX_PATCHES}];
uniform float uPatchSize[${MAX_PATCHES}];
uniform float uPatchCount;
uniform vec4 uVeil;
uniform vec3 uVeilColor;
uniform vec3 uPatchN;
uniform vec3 uPatchE;
uniform vec3 uPatchU;
uniform float uFeather;
uniform vec2 uPatchFade;
uniform vec3 uSpotN;
uniform vec3 uSpotE;
uniform vec3 uSpotU;
uniform vec4 uSpotShape;
uniform float uMapWidth;
uniform float uGrad;
uniform float uSpin;
uniform float uGain;
uniform float uWeight;
uniform vec3 uTint;
uniform vec3 uCurve[${CURVE_KNOTS}];
uniform vec3 uLimb[${LIMB_KNOTS}];
uniform float uJet[${JET_KNOTS}];
uniform vec3 uNight;
uniform vec4 uNightRef;
uniform float uLimbAmount;
uniform vec2 uLimbSoft;
uniform vec3 uLimbLit;
uniform vec2 uShadeKnee;
uniform vec4 uMoon;
uniform vec3 uShadow;
uniform vec2 uShadowFade;
uniform vec4 uShadowTip;
uniform vec3 uShadowToe;
uniform float uShadowTipScale;
uniform vec2 uShadowHaze;
uniform vec4 uShadowAt;
uniform vec4 uNightRim;
uniform vec3 uNightAir;
uniform vec2 uNightOut;
uniform vec4 uLitEdge;
uniform vec3 uShadowSun;
uniform vec3 uSunMap;
uniform float uFlowT;
uniform float uSwirlT;
uniform float uWispT;
uniform vec4 uWispShape;
uniform vec4 uWispShadow;
uniform vec2 uWispPolar;
uniform float uExtinction;
uniform mat3 uToBody;
uniform vec4 uEdge;
uniform vec4 uAir;
uniform vec4 uLowSun;
uniform vec3 uLowEdge;
uniform float uVignette;
uniform float uAspect;
in vec3 vClip;
in vec3 vPos;
in vec3 vView;
out vec4 outColor;
${EQUIRECT_GLSL}
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
${HAZE_GLSL}
${PALL_GLSL}
vec3 spinY(vec3 d, float a) {
  float c = cos(a), s = sin(a);
  return vec3(c * d.x - s * d.z, d.y, s * d.x + c * d.z);
}
vec3 curveAt(float ndl) {
  float x = clamp(sign(ndl) * sqrt(abs(ndl)) * 0.5 + 0.5, 0.0, 1.0) * ${CURVE_KNOTS - 1}.0;
  int i = int(min(floor(x), ${CURVE_KNOTS - 2}.0));
  return mix(uCurve[i], uCurve[i + 1], x - float(i));
}
vec3 limbAt(float mu) {
  float x = clamp(mu, 0.0, 1.0) * ${LIMB_KNOTS - 1}.0;
  int i = int(min(floor(x), ${LIMB_KNOTS - 2}.0));
  return mix(uLimb[i], uLimb[i + 1], x - float(i));
}
float jetAt(float lat) {
  float x = clamp(lat / PI + 0.5, 0.0, 1.0) * ${JET_KNOTS - 1}.0;
  int i = int(min(floor(x), ${JET_KNOTS - 2}.0));
  return mix(uJet[i], uJet[i + 1], x - float(i));
}
vec3 knee(vec3 x) {
  vec3 over = max(x - uShadeKnee.x, vec3(0.0));
  float span = uShadeKnee.y - uShadeKnee.x;
  return min(x, vec3(uShadeKnee.x)) + span * (1.0 - exp(-over / span));
}
vec3 flowed(vec3 d, out vec3 fl) {
  vec2 p = vec2(dot(d, uSpotE), dot(d, uSpotU));
  float front = step(0.0, dot(d, uSpotN));
  float r = length(p / uSpotShape.xy);
  float inside = front * (1.0 - smoothstep(uSpotShape.w * 0.75, uSpotShape.w * 1.4, r));
  float jet = jetAt(asin(clamp(d.y, -1.0, 1.0))) * (1.0 - inside);
  vec3 o = spinY(d, jet * uFlowT);
  float turn = 0.0;
  if (inside > 0.0) {
    p = vec2(dot(o, uSpotE), dot(o, uSpotU));
    vec2 q = p / uSpotShape.xy;
    r = length(q);
    turn = (1.0 - smoothstep(uSpotShape.z, uSpotShape.w, r)) * mix(0.55, 1.0, smoothstep(0.0, uSpotShape.z, r));
    float a = turn * uSwirlT;
    float c = cos(a), s = sin(a);
    q = vec2(c * q.x - s * q.y, s * q.x + c * q.y);
    p = q * uSpotShape.xy;
    o = normalize(uSpotN * sqrt(max(1.0 - dot(p, p), 0.0)) + uSpotE * p.x + uSpotU * p.y);
  }
  fl = vec3(jet, turn, inside);
  return o;
}
float moonShadow(vec3 p, float ndl) {
  vec3 m = uMoon.xyz - p;
  float t = dot(m, uShadowSun);
  if (t <= 0.0 || uMoon.w <= 0.0) return 0.0;
  float deep = dot(p - uShadowAt.xyz, uShadowSun);
  float far = deep * uShadowAt.w;
  float off = length(vec2(length(m - uShadowSun * t), far));
  float along = -deep * uShadowTipScale;
  float tip = smoothstep(uShadowTip.z, uShadowTip.w, along);
  float toe = 1.0 - uShadowToe.z * smoothstep(uShadowToe.x, uShadowToe.y, along);
  return (1.0 - smoothstep(uMoon.w * mix(uShadow.x, uShadowTip.x, tip), uMoon.w * mix(uShadow.y, uShadowTip.y, tip), off)) * toe * uShadow.z * smoothstep(uShadowFade.x, uShadowFade.y, ndl);
}
void main() {
  vec3 dir = normalize(vPos);
  float along = -dot(uCam, dir);
  vec3 nearest = uCam + dir * along;
  float rt = length(nearest);
  vec3 n = normalize(rt < 1.0 ? uCam + dir * (along - sqrt(max(1.0 - rt * rt, 0.0))) : nearest);
  float dusk = 1.0 - smoothstep(uNightAir.x, uNightAir.y, dot(n, uSunW));
  float axial = (uToBody * n).y;
  float round2 = max(1.0 - axial * axial, 0.0);
  float over = rt - 1.0 + uEdge.y + (1.0 - dusk) * (uLitEdge.x - uLitEdge.y * pow(round2, uLitEdge.z)) - dusk * uNightOut.x * pow(round2, uNightOut.y);
  float low = smoothstep(uLowSun.x, uLowSun.y, dot(n, uSunW)) * (1.0 - smoothstep(uLowSun.z, uLowSun.w, dot(n, uSunW)));
  float wide = mix(uEdge.x, uLowEdge.x, low);
  float inside = 1.0 - smoothstep(-wide, wide, over / max(fwidth(rt), 1e-7));
  float beyond = max(over, 0.0);
  bool gone = uDiag >= 2 && inside < 0.5;
  float air = (uAir.x * exp(-beyond / uAir.y) + uLowEdge.y * low * exp(-beyond / uLowEdge.z) + uAir.z * mix(uLitEdge.w, 1.0, dusk) * exp(-beyond / mix(uAir.w, uNightAir.z, dusk))) * (1.0 - smoothstep(0.6 * uEdge.z, uEdge.z, over));
  vec3 d = spinY(uToBody * n, uSpin);
  vec3 fl;
  vec3 df = flowed(d, fl);
  float mu = clamp(dot(n, -dir), 0.0, 1.0);
  float ndl = dot(n, uSunW);
  float soft = 1.0 - smoothstep(0.0, uLimbSoft.x, mu);
  vec3 albedo = mix(equirectGrad(uMap, df, uGrad).rgb, textureLod(uMap, vec2(atan(df.x, df.z) / (2.0 * PI) + 0.5, asin(clamp(df.y, -1.0, 1.0)) / PI + 0.5), uLimbSoft.y).rgb, soft);
  float texels = diagTexelsDir(d, uMapWidth);
  float dn = dot(df, uPatchN);
  if (uPatchCount > 0.5) {
    float inv = 1.0 / max(dn, 0.05);
    vec2 g = vec2(dot(df, uPatchE), dot(df, uPatchU)) * inv;
    vec2 gx = dFdx(g);
    vec2 gy = dFdy(g);
    float gd = sqrt(max(dot(gx, gx), dot(gy, gy)));
    gx *= uGrad;
    gy *= uGrad;
    float front = step(0.3, dn);
    float parent = texels;
${PATCH_LEVELS}
  }
  vec3 lin = inverseFilmic(albedo);
  float lat = asin(clamp(df.y, -1.0, 1.0));
  float lon = atan(df.x, df.z);
  float band = clamp(fl.x * uWispShape.w, -1.0, 1.0);
  float steady = smoothstep(0.55, 1.0, abs(band)) * (1.0 - fl.z);
  float calm = 1.0 - smoothstep(uWispPolar.x, uWispPolar.y, abs(lat));
  vec2 wuv = vec2(lon / (2.0 * PI) * uWispShape.x - sign(band) * uWispT * (1.0 - fl.z), lat * uWispShape.y + 0.5);
  float lon2 = fract(lon / (2.0 * PI) + 0.5) - 0.5;
  float lu = lon / (2.0 * PI);
  vec2 lud = vec2(dFdx(lu), dFdy(lu));
  vec2 l2d = vec2(dFdx(lon2), dFdy(lon2));
  vec2 wdx = vec2((abs(lud.x) < abs(l2d.x) ? lud.x : l2d.x) * uWispShape.x, dFdx(lat) * uWispShape.y);
  vec2 wdy = vec2((abs(lud.y) < abs(l2d.y) ? lud.y : l2d.y) * uWispShape.x, dFdy(lat) * uWispShape.y);
  vec3 east = cross(vec3(0.0, 1.0, 0.0), df);
  float el = length(east);
  east = el > 1e-4 ? east / el : vec3(1.0, 0.0, 0.0);
  vec3 north = cross(df, east);
  vec3 sunT = uSunMap - df * dot(uSunMap, df);
  vec2 toSun = vec2(dot(sunT, east) / max(cos(lat), 0.25) / (2.0 * PI) * uWispShape.x, dot(sunT, north) * uWispShape.y) * uWispShadow.y;
  vec2 fine = textureGrad(uWisp, wuv, wdx * uGrad, wdy * uGrad).rg;
  float body = fine.r + (fine.g - 0.5) * uWispShadow.w;
  float shade2 = textureGrad(uWisp, wuv + toSun, wdx * uWispShadow.z, wdy * uWispShadow.z).r;
  float wisp = ((body - 0.5) * uWispShape.z - (shade2 - 0.5) * uWispShadow.x) * max(steady, fl.z * 0.6) * calm;
  lin *= max(1.0 + wisp * (1.0 - soft), 0.0);
  vec3 direct = curveAt(ndl) * mix(vec3(1.0), limbAt(mu), uLimbAmount * mix(uLimbLit.x, 1.0, smoothstep(uLimbLit.y, uLimbLit.z, ndl)));
  float umbra = moonShadow(n, ndl);
  vec3 col = (lin * knee(direct) * (1.0 - umbra) + uNight * (1.0 - uShadowHaze.y * umbra) * mix(1.0, dot(lin, vec3(0.2126, 0.7152, 0.0722)) / dot(uNightRef.rgb, vec3(0.2126, 0.7152, 0.0722)), uNightRef.a)) * uTint;
  float vfoot = length(fwidth(d));
  for (int k = 0; k < (uVeil.x > 0.0 ? 1 : 0); k++) {
    vec3 hd = spinY(uToBody * normalize(n - dir * (uVeil.y / max(mu, 0.3))), uSpin);
    float hlon = atan(hd.x, hd.z) / (2.0 * PI);
    float hlat = asin(clamp(hd.y, -1.0, 1.0)) / (2.0 * PI) * uVeil.z;
    float hl = log2(max(vfoot * 2048.0 / (2.0 * PI), 1e-6));
    float hv = 0.6 * textureLod(uWisp, vec2(hlon * 4.0 + uVeil.w, hlat), hl + 3.0).r + 0.4 * textureLod(uWisp, vec2(hlon * 12.0 - 2.0 * uVeil.w, hlat * 3.0) + 0.37, hl + 4.2).r;
    float ha = 1.0 - exp(-uVeil.x * (0.35 + 1.3 * smoothstep(0.3, 0.7, hv)) / max(mu, 0.25));
    col = mix(col, uVeilColor * knee(direct) * uTint, ha);
  }
  vec3 at;
  float tau = hazeDepth(dir, true, at);
  col = col * exp(-tau * uExtinction) + hazeLight(n, dir) * (1.0 - exp(-tau)) * (1.0 - uShadowHaze.x * umbra);
  col += uNightRim.rgb * dusk * pow(1.0 - mu, uNightRim.w);
  float cover = inside + (1.0 - inside) * air;
  col *= mix(min(1.0, uEdge.w / max(dot(col, vec3(0.2126, 0.7152, 0.0722)), 1e-5)), 1.0, inside);
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain * uWeight / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  for (int k = 0; k < (uPall.x > 0.0 ? 1 : 0); k++) {
    vec4 cloud = pall(vClip.xy / vClip.z);
    cloud.rgb *= max(smoothstep(uPallLit.x, uPallLit.y, ndl), uPallLit.z);
    float pa = cloud.a * (1.0 - smoothstep(uPallShell.x, uPallShell.y, rt));
    cover = mix(inside, cover, (1.0 - uPall.x) * (1.0 - uPall.x));
    float total = pa + cover * (1.0 - pa);
    col = (cloud.rgb * uGain * uWeight * pa + col * cover * (1.0 - pa)) / max(total, 1e-5);
    cover = total;
  }
  outColor = diagOut(vec4(col, cover), texels, 1.0, vec3(0.9, 0.6, 0.3), vec2(fl.x * uFlowT * 40.0 + sign(band) * steady * 0.3, fl.y * uSwirlT * 4.0), length(vView));
  if (gone) discard;
}`

export class Globe {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly bodyToWorld = new THREE.Matrix3()
  private readonly toBody = new THREE.Matrix3()
  private readonly rim: number
  private readonly m4 = new THREE.Matrix4()
  private readonly sunMap = new THREE.Vector3()

  constructor(o: GlobeOptions) {
    const p = o.patches
    const tex = (i: number): THREE.Texture | null => p?.textures[i] ?? p?.textures[0] ?? null
    const scale = (i: number): number => {
      const w = p?.widthsDeg[i]
      return w ? 1 / (2 * Math.tan(THREE.MathUtils.degToRad(w) / 2)) : 1
    }
    const size = (i: number): number => (p?.textures[i]?.image as unknown as { width: number } | undefined)?.width ?? 1
    const levels = Array.from({ length: MAX_PATCHES }, (_, i) => i)
    if ((p?.textures.length ?? 0) > MAX_PATCHES) throw new Error('too many patch levels')
    if (o.curve.length !== CURVE_KNOTS || o.limb.length !== LIMB_KNOTS || o.jet.length !== JET_KNOTS) throw new Error('light table size')
    const spot = o.spot.center.clone().normalize()
    const east = new THREE.Vector3(0, 1, 0).cross(spot).normalize()
    const north = spot.clone().cross(east)
    const pn = (p?.center ?? o.spot.center).clone().normalize()
    const pe = new THREE.Vector3(0, 1, 0).cross(pn).normalize()
    const pu = pn.clone().cross(pe)
    const rad = THREE.MathUtils.degToRad
    const w = o.wisp
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        ...hazeUniforms(o.haze),
        uMap: { value: o.map }, uWisp: { value: w.texture },
        ...Object.fromEntries(levels.map((i) => ['uPatch' + i, { value: tex(i) }])),
        uPatchScale: { value: levels.map(scale) }, uPatchSize: { value: levels.map(size) },
        uPatchCount: { value: p?.textures.length ?? 0 },
        uPatchN: { value: pn }, uPatchE: { value: pe }, uPatchU: { value: pu },
        uVeil: { value: new THREE.Vector4(0, o.veil.height, o.veil.repeats, 0) }, uVeilColor: { value: new THREE.Vector3().fromArray(o.veil.color) },
        uFeather: { value: p?.feather ?? 0.12 }, uPatchFade: { value: new THREE.Vector2(p?.fade[0] ?? 1.1, p?.fade[1] ?? 1.7) },
        uSpotN: { value: spot }, uSpotE: { value: east }, uSpotU: { value: north },
        uSpotShape: { value: new THREE.Vector4(Math.sin(rad(o.spot.axesDeg[0])), Math.sin(rad(o.spot.axesDeg[1])), o.spot.core, o.spot.reach) },
        uMapWidth: { value: o.mapWidth },
        uSpin: { value: 0 }, uGain: { value: 1 }, uWeight: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uTint: { value: new THREE.Vector3(1, 1, 1) },
        uCurve: { value: o.curve.map((c) => new THREE.Vector3(c[0], c[1], c[2])) },
        uLimb: { value: o.limb.map((c) => new THREE.Vector3(c[0], c[1], c[2])) },
        uJet: { value: o.jet.slice() },
        uNight: { value: new THREE.Vector3().fromArray(o.night) }, uNightRef: { value: new THREE.Vector4().fromArray(o.nightAlbedo) },
        uLimbAmount: { value: 1 }, uLimbLit: { value: new THREE.Vector3().fromArray(o.limbLit) }, uLimbSoft: { value: new THREE.Vector2(o.edge.soft[0], Math.max(Math.log2(Math.max(o.mapWidth, 1) / o.edge.soft[1]), 0)) }, uShadeKnee: { value: new THREE.Vector2().fromArray(o.shadeKnee) },
        uMoon: { value: new THREE.Vector4(0, 0, 0, 0) }, uShadow: { value: new THREE.Vector3().fromArray(o.shadow) }, uShadowFade: { value: new THREE.Vector2().fromArray(o.shadowFade) }, uShadowTip: { value: new THREE.Vector4().fromArray(o.shadowTip ?? [o.shadow[0], o.shadow[1], 1, 2]) }, uShadowToe: { value: new THREE.Vector3().fromArray(o.shadowToe ?? [1, 2, 0]) }, uShadowTipScale: { value: 0 }, uShadowHaze: { value: new THREE.Vector2().fromArray(o.shadowHaze) }, uShadowAt: { value: new THREE.Vector4(0, 0, 0, 0) }, uNightRim: { value: new THREE.Vector4(o.nightRim.glow[0], o.nightRim.glow[1], o.nightRim.glow[2], o.nightRim.power) }, uNightAir: { value: new THREE.Vector3(o.nightRim.from, o.nightRim.to, o.nightRim.air) }, uNightOut: { value: new THREE.Vector2(o.nightRim.out, o.nightRim.bulge) }, uLitEdge: { value: new THREE.Vector4().fromArray(o.litEdge) }, uShadowSun: { value: new THREE.Vector3(1, 0, 0) },
        uSunMap: { value: this.sunMap },
        uFlowT: { value: 0 }, uSwirlT: { value: 0 }, uWispT: { value: 0 },
        uWispShape: { value: new THREE.Vector4(w.repeats, w.latScale, w.amount, 1) },
        uWispShadow: { value: new THREE.Vector4(w.shadow, w.shadowLength, w.shadowBlur, w.fine) },
        uWispPolar: { value: new THREE.Vector2(rad(w.polarFrom), rad(w.polarTo)) },
        uExtinction: { value: o.haze.extinction },
        uToBody: { value: this.toBody }, uEdge: { value: new THREE.Vector4(o.edge.pixels, o.edge.inset, o.edge.rim, o.edge.cap) }, uAir: { value: new THREE.Vector4().fromArray(o.edge.air) }, uLowSun: { value: new THREE.Vector4().fromArray(o.edge.low?.sun ?? [2, 3, 2, 3]) }, uLowEdge: { value: new THREE.Vector3(o.edge.low?.pixels ?? o.edge.pixels, o.edge.low?.air ?? 0, o.edge.low?.scale ?? 1) },
        uDiag: diagUniform, uGrad: gradUniform,
        ...pallUniforms(o.pallShell),
      },
      transparent: true,
      depthWrite: false,
    })
    const peak = o.jet.reduce((m, v) => Math.max(m, Math.abs(v)), 1e-6)
    ;(this.material.uniforms.uWispShape!.value as THREE.Vector4).w = 2.2 / peak
    const seg = o.segments ?? 320
    this.rim = o.edge.rim
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, seg, seg / 2), this.material)
  }

  update(camera: THREE.Vector3, sun: THREE.Vector3, spin: number, gain: number, weight: number): void {
    const u = this.material.uniforms
    ;(u.uCam!.value as THREE.Vector3).copy(camera)
    ;(u.uSunW!.value as THREE.Vector3).copy(sun)
    u.uSpin!.value = spin
    u.uGain!.value = gain
    u.uWeight!.value = weight
    const rim = Math.max(Math.min(this.rim, 0.4 * (camera.length() - 1)), 0)
    ;(u.uEdge!.value as THREE.Vector4).z = Math.max(rim, 1e-5)
    this.mesh.scale.setScalar(1 + rim)
    this.mesh.updateWorldMatrix(true, false)
    this.bodyToWorld.setFromMatrix4(this.m4.extractRotation(this.mesh.matrixWorld))
    this.toBody.copy(this.bodyToWorld).transpose()
    const s = this.sunMap.copy(sun).applyMatrix3(this.toBody)
    const c = Math.cos(spin)
    const k = Math.sin(spin)
    s.set(c * s.x - k * s.z, s.y, k * s.x + c * s.z)
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
