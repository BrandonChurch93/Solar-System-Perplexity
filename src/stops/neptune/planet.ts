import * as THREE from 'three'
import type { Ending } from './ending'
import type { LimbField } from './field'
import { AIR_GLSL, airUniforms, type AirParams } from './air'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { EQUIRECT_GLSL } from '../../space/sky'

export const KNOTS = 33
export const MAX_LEVELS = 6

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
  spot: THREE.Vector3
  feather: number
  fade: [number, number]
}

export interface NeptuneOptions {
  map: THREE.Texture
  mapWidth: number
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

const WEIGHTS = Array.from({ length: MAX_LEVELS }, (_, i) => `    if (uPatchCount > ${i}.5) {
      vec2 q = g * uPatchScale[${i}];
      w${i} = front * smoothstep(0.5, 0.5 - uFeather, max(abs(q.x), abs(q.y))) * (1.0 - smoothstep(uPatchFade.x, uPatchFade.y, parent));
      parent = gd * uPatchScale[${i}] * uPatchSize[${i}];
      texels = mix(texels, parent, step(0.5, w${i}));
    }`).join('\n')

const FETCHES = Array.from({ length: MAX_LEVELS }, (_, n) => MAX_LEVELS - 1 - n).map((i) => `  float k${i} = w${i} * rest;
  rest *= 1.0 - w${i};
  for (int k = 0; k < (k${i} > 0.0 ? 1 : 0); k++) c += k${i} * textureGrad(uPatch${i}, g * uPatchScale[${i}] + 0.5, gx * uPatchScale[${i}], gy * uPatchScale[${i}]);`).join('\n')

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
${SAMPLERS}
uniform float uPatchScale[${MAX_LEVELS}];
uniform float uPatchSize[${MAX_LEVELS}];
uniform float uPatchCount;
uniform float uFeather;
uniform vec2 uPatchFade;
uniform vec3 uSpotN;
uniform vec3 uSpotE;
uniform vec3 uSpotU;
uniform float uMapWidth;
uniform float uGrad;
uniform float uCode;
uniform float uSpin;
uniform float uStream;
uniform vec2 uShear;
uniform vec3 uStormAxis;
uniform float uStormRadius;
uniform float uStormAngle;
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
uniform float uAspect;
uniform vec3 uRim;
uniform vec3 uRimShape;
uniform vec3 uRimDir;
uniform float uRimMu;
uniform vec4 uCut;
uniform vec2 uCutEdge;
uniform vec3 uCutDir;
uniform vec3 uLimbDark;
uniform vec3 uVeilDir;
uniform vec3 uTwi;
uniform vec4 uTwiSun;
uniform vec4 uAirShade;
uniform sampler2D uField;
uniform vec4 uFieldRange;
uniform vec4 uFieldSide;
uniform vec2 uDarkEdge;
uniform vec3 uEnd;
uniform vec2 uEndCloud;
uniform vec3 uDarkDir;
uniform vec4 uVeil;
uniform vec2 uVeilMu;
uniform vec3 uVeilSun;
uniform vec3 uForward;
uniform vec2 uForwardShape;
uniform vec4 uNear;
uniform vec4 uNearTint;
uniform vec2 uMelt;
uniform vec4 uNight;
in vec3 vClip;
in vec3 vLocal;
in vec3 vWorldN;
in vec3 vPos;
in vec3 vView;
out vec4 outColor;
${EQUIRECT_GLSL}
${DIAG_GLSL}
${AIR_GLSL}
vec3 spinY(vec3 d, float a) {
  float c = cos(a), s = sin(a);
  return vec3(c * d.x - s * d.z, d.y, s * d.x + c * d.z);
}
vec3 turnAbout(vec3 d, vec3 axis, float a) {
  float c = cos(a), s = sin(a);
  return d * c + cross(axis, d) * s + axis * dot(axis, d) * (1.0 - c);
}
vec3 knot(vec3 k[${KNOTS}], float ndl) {
  float x = clamp(ndl * 0.5 + 0.5, 0.0, 1.0) * ${KNOTS - 1}.0;
  int i = int(min(floor(x), ${KNOTS - 2}.0));
  return mix(k[i], k[i + 1], x - float(i));
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
vec4 layerAt(vec3 dd, float soft, out float texels) {
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
  float parent = texels;
${Array.from({ length: MAX_LEVELS }, (_, i) => '  float w' + i + ' = 0.0;').join('\n')}
${WEIGHTS}
  float rest = 1.0;
  vec4 c = vec4(0.0);
${FETCHES}
  for (int k = 0; k < (rest > 0.0 ? 1 : 0); k++) c += rest * textureGrad(uMap, vec2(u, v), mx, my);
  return c;
}
void main() {
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
  vec4 deckTexel = layerAt(dd, 1.0, texels);
  float alpha = layerAt(dcl, uCloudSoft, texelsCloud).a;
  float reach = uCloudHeight / max(ndl, uShadow.z);
  vec3 ps = normalize(p + sunL * reach);
  vec3 ps2 = normalize(p + sunL * reach * 1.6);
  float shadow = 0.6 * layerAt(cloudDir(ps), uShadow.y, texelsShadow).a + 0.4 * layerAt(cloudDir(ps2), uShadow.y * 1.8, texelsShadow).a;
  float lit = smoothstep(0.0, 0.2, ndl);
  vec3 albedo = deckTexel.rgb / uCode;
  float flatten = uNight.x * (1.0 - smoothstep(uNight.y, uNight.z, ndl));
  for (int k = 0; k < (flatten > 0.0 ? 1 : 0); k++) {
    albedo = mix(albedo, textureLod(uMap, vec2(atan(dd.x, dd.z) / (2.0 * PI) + 0.5, asin(clamp(dd.y, -1.0, 1.0)) / PI + 0.5), uNight.w).rgb / uCode, flatten);
  }
  vec3 deck = albedo * knot(uDeck, ndl) * (1.0 - uShadow.x * shadow * lit * (1.0 - alpha));
  float ndlc = dot(normalize(uBodyToWorld * pc), uSunW);
  vec3 col = mix(deck, knot(uCloud, ndlc), alpha * smoothstep(-0.09, -0.03, ndlc)) * uTint;
  vec3 nearCol = mix(vec3(dot(col, vec3(0.3, 0.5, 0.2))), col, uNear.w);
  col = mix(col, uNearTint.rgb * uNearTint.a * pow(nearCol / uNearTint.a, vec3(uNear.z)) * uNear.y, uNear.x);
  float fwd = pow(max(dot(dir, uSunW), 0.0), uForwardShape.y);
  float graze = exp(-mu / uForwardShape.x);
  col = mix(col, mix(deck * uTint, col, smoothstep(uEndCloud.x, uEndCloud.y, mu)), uEnd.x);
  col = mix(col, uVeil.rgb, uVeil.a * (1.0 - smoothstep(uVeilMu.x, uVeilMu.y, mu)) * pow(smoothstep(uVeilSun.x, uVeilSun.y, dot(n, uVeilDir)), uVeilSun.z));
  col *= 1.0 - uTwi.x * (1.0 - smoothstep(uTwi.y, uTwi.z, mu)) * smoothstep(uTwiSun.x, uTwiSun.y, ndl) * (1.0 - smoothstep(uTwiSun.z, uTwiSun.w, ndl));
  col *= 1.0 - uCut.x * uCut.w * smoothstep(uCutEdge.x, uCutEdge.y, dot(n, uCutDir)) * (1.0 - smoothstep(uCut.y - uCut.z, uCut.y + uCut.z, mu));
  col += uForward * graze * fwd * mix(smoothstep(-0.25, 0.1, ndl), smoothstep(uEnd.y, uEnd.z, ndl), uEnd.x);
  vec4 sky = air(dir, true);
  sky.rgb *= mix(1.0, smoothstep(uAirShade.x, uAirShade.y, ndl), uAirShade.w * smoothstep(0.0, uAirShade.z, mu));
  col = col * exp(-sky.a * uExtinction) + sky.rgb;
  float dw = smoothstep(uDarkEdge.x, uDarkEdge.y, dot(n, uDarkDir));
  float dm = 0.6 + 0.4 * dw;
  col *= 1.0 - uLimbDark.x * pow(dw, 0.7) * (1.0 - smoothstep(uLimbDark.y * dm, uLimbDark.z * dm, mu));
  vec2 fuv = vec2(clamp(mu / uFieldRange.x, 0.5 / uFieldRange.z, 1.0 - 0.5 / uFieldRange.z) * 0.5, (ndl - uFieldRange.y) / (1.0 - uFieldRange.y));
  vec3 fa = textureLod(uField, fuv, 0.0).rgb;
  vec3 fb = textureLod(uField, fuv + vec2(0.5, 0.0), 0.0).rgb;
  vec3 field = exp2((mix(fa, fb, smoothstep(-0.06, 0.06, dot(n, uFieldSide.xyz))) - 0.5) * uFieldRange.w);
  col *= mix(vec3(1.0), field, uFieldSide.w);
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain * uWeight / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  float melt = uMelt.y * (1.0 - smoothstep(0.0, uMelt.x, mu));
  for (int k = 0; k < (melt > 0.0 ? 1 : 0); k++) {
    vec3 ax = -normalize(uCam);
    vec3 side = normalize(dir - ax * dot(dir, ax));
    float st = min(1.0006 / length(uCam), 1.0);
    col = mix(col, air(ax * sqrt(1.0 - st * st) + side * st, false).rgb * uGain * uWeight, melt);
  }
  col += uRim * exp(-abs(mu - uRimMu * uCut.w) / uRimShape.x) * smoothstep(uRimShape.y, uRimShape.z, dot(n, uRimDir)) * uGain * uWeight;
  float moved = uStream + stormTurn(spinY(p, uSpin)) * 4.0;
  outColor = diagOut(vec4(col, 1.0), texels, 1.0, mix(vec3(0.1, 0.3, 0.9), vec3(0.95, 0.95, 0.9), alpha), vec2(moved * 8.0 * alpha, shadow), length(vView));
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
    const spot = p?.spot.clone().normalize() ?? new THREE.Vector3(0, 0, 1)
    const east = new THREE.Vector3(0, 1, 0).cross(spot).normalize()
    const north = spot.clone().cross(east)
    const l = o.limb
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        ...airUniforms(o.air),
        uMap: { value: o.map }, uMapWidth: { value: o.mapWidth }, uCode: { value: o.code },
        ...Object.fromEntries(levels.map((i) => ['uPatch' + i, { value: tex(i) }])),
        uPatchScale: { value: levels.map(scale) }, uPatchSize: { value: levels.map(size) },
        uPatchCount: { value: p?.textures.length ?? 0 },
        uFeather: { value: p?.feather ?? 0.12 }, uPatchFade: { value: new THREE.Vector2(p?.fade[0] ?? 1.1, p?.fade[1] ?? 1.7) },
        uSpotN: { value: spot }, uSpotE: { value: east }, uSpotU: { value: north },
        uSpin: { value: 0 }, uStream: { value: 0 }, uShear: { value: new THREE.Vector2(o.clouds.shear, o.clouds.shearBands) },
        uStormAxis: { value: o.storm.axis.clone().normalize() }, uStormRadius: { value: THREE.MathUtils.degToRad(o.storm.radiusDeg) }, uStormAngle: { value: 0 },
        uCloudHeight: { value: o.clouds.height }, uCloudSoft: { value: o.clouds.soft }, uShadow: { value: new THREE.Vector3(o.clouds.shadow, o.clouds.shadowSoft, 0.12) },
        uGain: { value: 1 }, uWeight: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uTint: { value: new THREE.Vector3(1, 1, 1) },
        uDeck: { value: knots(o.deck) }, uCloud: { value: knots(o.cloud) },
        uExtinction: { value: o.air.extinction },
        uRim: { value: new THREE.Vector3().fromArray(l.rim) }, uRimShape: { value: new THREE.Vector3(l.rimWidth, l.rimFrom, l.rimTo) }, uRimDir: { value: new THREE.Vector3(1, 0, 0) },
        uRimMu: { value: l.rimMu }, uCut: { value: new THREE.Vector4(l.cut, l.cutMu[0], l.cutMu[1], 0) }, uCutEdge: { value: new THREE.Vector2(l.cutFrom, l.cutTo) }, uCutDir: { value: new THREE.Vector3(1, 0, 0) },
        uLimbDark: { value: new THREE.Vector3(l.dark, l.darkMu[0], l.darkMu[1]) }, uDarkEdge: { value: new THREE.Vector2(l.darkFrom, l.darkTo) }, uDarkDir: { value: new THREE.Vector3(1, 0, 0) },
        uVeil: { value: new THREE.Vector4(l.veil[0], l.veil[1], l.veil[2], l.veilAmount) }, uVeilMu: { value: new THREE.Vector2().fromArray(l.veilMu) }, uVeilSun: { value: new THREE.Vector3().fromArray(l.veilSun) }, uVeilDir: { value: new THREE.Vector3(1, 0, 0) },
        uTwi: { value: new THREE.Vector3().fromArray(l.twilight) }, uTwiSun: { value: new THREE.Vector4().fromArray(l.twilightSun) }, uAirShade: { value: new THREE.Vector4(l.shade[0], l.shade[1], l.shade[2], 1) },
        uForward: { value: new THREE.Vector3().fromArray(l.forward) }, uForwardShape: { value: new THREE.Vector2(l.forwardWidth, l.forwardPower) },
        uNear: { value: new THREE.Vector4(0, 1, o.near.power, o.near.saturation) }, uNearTint: { value: new THREE.Vector4(o.near.tint[0], o.near.tint[1], o.near.tint[2], o.near.pivot) },
        uField: { value: o.field.texture }, uFieldRange: { value: new THREE.Vector4(o.field.muMax, o.field.ndlMin, o.field.width, o.field.span) }, uFieldSide: { value: new THREE.Vector4(1, 0, 0, 0) }, uMelt: { value: new THREE.Vector2(l.melt[0], l.melt[2]) }, uNight: { value: new THREE.Vector4(0, o.night.edge[0], o.night.edge[1], Math.log2(o.mapWidth / o.night.texels)) },
        uBodyToWorld: { value: this.bodyToWorld },
        uDiag: diagUniform, uGrad: gradUniform,
      },
    })
    const seg = o.segments ?? 320
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, seg, seg / 2), this.material)
    this.material.uniforms.uEnd = { value: new THREE.Vector3(0, 0, 0.2) }
    this.material.uniforms.uEndCloud = { value: new THREE.Vector2(0.2, 0.5) }
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

  ending(end: number, limb: LimbParams, cloud: number[][], deck: number[][], texels: number, e: Ending['limb']): void {
    const u = this.material.uniforms
    const width = u.uMapWidth!.value as number
    ;(u.uNight!.value as THREE.Vector4).w = Math.log2(width / texels) + (Math.log2(width / e.night) - Math.log2(width / texels)) * end
    ;(u.uRim!.value as THREE.Vector3).fromArray(limb.rim).multiplyScalar(1 - end)
    ;(u.uTwi!.value as THREE.Vector3).x = limb.twilight[0]! * (1 - end)
    ;(u.uForward!.value as THREE.Vector3).fromArray(limb.forward).multiplyScalar(1 - end * (1 - e.forward))
    ;(u.uEnd!.value as THREE.Vector3).set(end, e.lit[0]!, e.lit[1]!)
    ;(u.uEndCloud!.value as THREE.Vector2).set(e.cloudLimb[0]!, e.cloudLimb[1]!)
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
