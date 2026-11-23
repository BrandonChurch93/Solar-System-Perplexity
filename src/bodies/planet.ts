import * as THREE from 'three'
import { DIAG_GLSL, diagUniform, gradUniform } from '../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../post/chain'
import { implicitUniform } from '../core/texel'
import { EQUIRECT_GLSL } from '../space/sky'
import { hazeGlsl, hazeUniforms, setHazeGlow, type HazeParams } from './haze'
import { setHazeAir, type GlobeAir } from './air'

export interface PlanetLight {
  wrap: number
  power: number
  gain: number
  night: [number, number, number]
  sun: [number, number, number]
  relief: number
  reliefNear: number
  limb: number
  curve?: number[][]
  nightFlat?: [number, number, number]
}

export const CURVE_KNOTS = 33

export interface PatchSet {
  textures: THREE.Texture[]
  widthsDeg: number[]
  spot: THREE.Vector3
  feather: number
  fade: [number, number]
  nearDeg: number
  own?: boolean[]
  ownGain?: boolean
  fadeMinor?: boolean
}

export interface StormParams {
  mask: THREE.Texture
  axis: THREE.Vector3
  radius: number
}

export interface GrazingHaze {
  depth: number
  width: number
  duskWidth: number
  power: number
  dayFrom: number
  dayTo: number
  fill: [number, number, number]
  highlight: [number, number, number]
  dusk: [number, number, number]
  highlightFrom: number
  highlightTo: number
  sideFrom: number
  sideTo: number
  detailFrom: number
  detailTo: number
  detailBlur: number
}

export interface PlanetOptions {
  map: THREE.Texture
  mapWidth: number
  height: THREE.Texture
  heightWidth: number
  light: PlanetLight
  haze: HazeParams
  grazing?: GrazingHaze
  patches?: PatchSet
  storm?: StormParams
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

export const MAX_PATCHES = 10
export const BASE_PATCHES = 6

export function patchSlots(levels: number): number {
  if (levels > MAX_PATCHES) throw new Error('too many patch levels')
  return Math.max(BASE_PATCHES, levels)
}

const patchSamplers = (slots: number): string => Array.from({ length: slots }, (_, i) => 'uniform sampler2D uPatch' + i + ';').join('\n')

export interface PatchShader { slots: number; own: boolean; gain: boolean; minor: boolean; glow: boolean }

const patchRead = (i: number): string => `textureGrad(uPatch${i}, q + 0.5, gx * uPatchScale[${i}], gy * uPatchScale[${i}]).rgb`

const patchLevels = (o: PatchShader): string => Array.from({ length: o.slots }, (_, i) => `    if (uPatchCount > ${i}.5) {
      vec2 q = g * uPatchScale[${i}];
      float w = front * smoothstep(0.5, 0.5 - uFeather, max(abs(q.x), abs(q.y))) * (1.0 - smoothstep(uPatchFade.x, uPatchFade.y, ${o.minor ? 'fine' : 'parent'}));
      ${o.own ? `if (w > 0.0) {
        vec3 t = ${patchRead(i)};
        float o = uPatchOwn[${i}];
        albedo = mix(albedo, t, w * (1.0 - o));
        ownSum = ownSum * (1.0 - w) + t * (w * o);
        own = own * (1.0 - w) + w * o;
      }` : `if (w > 0.0) albedo = mix(albedo, ${patchRead(i)}, w);`}
      parent = gd * uPatchScale[${i}] * uPatchSize[${i}];${o.minor ? `
      float thin = ga * uPatchScale[${i}] * uPatchSize[${i}];
      float cap = gd / uPatchAniso[${i}] * uPatchScale[${i}] * uPatchSize[${i}];
      fine = max(thin, cap);
      drawn = mix(drawn, thin / max(cap, 1.0), step(0.5, w));` : ''}
      texels = mix(texels, parent, step(0.5, w));
      near = max(near, w * uPatchNear[${i}]);
    }`).join('\n')

const frag = (o: PatchShader): string => /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform sampler2D uHeight;
uniform sampler2D uStorm;
${patchSamplers(o.slots)}
uniform float uPatchScale[${o.slots}];
uniform float uPatchSize[${o.slots}];
uniform float uPatchNear[${o.slots}];${o.own ? `
uniform float uPatchOwn[${o.slots}];` : ''}${o.gain ? `
uniform vec3 uOwnGain;` : ''}${o.minor ? `
uniform float uPatchAniso[${o.slots}];
uniform float uMapAniso;` : ''}
uniform float uPatchCount;
uniform float uFeather;
uniform vec2 uPatchFade;
uniform vec3 uSpotN;
uniform vec3 uSpotE;
uniform vec3 uSpotU;
uniform vec3 uStormAxis;
uniform float uStormRadius;
uniform float uStormAngle;
uniform float uHasStorm;
uniform float uMapWidth;
uniform float uGrad;
uniform float uHeightStep;
uniform float uSpin;
uniform float uGain;
uniform float uWeight;
uniform vec3 uTint;
uniform float uWrap;
uniform vec3 uCurve[33];
uniform vec3 uNight;
uniform vec3 uNightFlat;
uniform float uRelief;
uniform float uReliefNear;
uniform float uLimb;
uniform float uExtinction;
uniform mat3 uBodyToWorld;
uniform float uVignette;
uniform float uAspect;
uniform vec4 uGrazingShape;
uniform vec2 uGrazingDay;
uniform vec3 uGrazingFill;
uniform vec3 uGrazingHighlight;
uniform vec3 uGrazingDusk;
uniform vec3 uGrazingSun;
uniform vec2 uGrazingRange;
uniform vec3 uGrazingSide;
uniform vec2 uGrazingSideRange;
uniform vec4 uGrazingDetail;
in vec3 vClip;
in vec3 vLocal;
in vec3 vWorldN;
in vec3 vPos;
in vec3 vView;
out vec4 outColor;
${EQUIRECT_GLSL}
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
${hazeGlsl(o.glow)}
vec3 spinY(vec3 d, float a) {
  float c = cos(a), s = sin(a);
  return vec3(c * d.x - s * d.z, d.y, s * d.x + c * d.z);
}
float heightAt(vec3 d) {
  float u = atan(d.x, d.z) / (2.0 * PI) + 0.5;
  float v = asin(clamp(d.y, -1.0, 1.0)) / PI + 0.5;
  return textureLod(uHeight, vec2(u, v), 0.0).r;
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
void main() {
  vec3 d = spinY(normalize(vLocal), uSpin);
  vec3 dc = d;
  float flow = 0.0;
  if (uHasStorm > 0.5) {
    float m = equirect(uStorm, d).r;
    float ang = acos(clamp(dot(d, uStormAxis), -1.0, 1.0)) / uStormRadius;
    flow = uStormAngle * m / (0.35 + ang * ang);
    dc = turnAbout(d, uStormAxis, flow);
  }
  vec3 n = normalize(vWorldN);
  vec3 dir = normalize(vPos);
  float mu = clamp(dot(n, -dir), 0.0, 1.0);
  float ndl0 = dot(n, uSunW);
  float grazingDay = smoothstep(uGrazingDay.x, uGrazingDay.y, ndl0);
  float grazingSide = smoothstep(uGrazingSideRange.x, uGrazingSideRange.y, dot(n, uGrazingSide));
  float detail = (1.0 - smoothstep(uGrazingDetail.x, uGrazingDetail.y, mu)) * grazingDay * grazingSide * uGrazingDetail.w;
  vec3 albedo = equirectGrad(uMap, dc, uGrad * (1.0 + uGrazingDetail.z * detail)).rgb;
  float texels = diagTexelsDir(d, uMapWidth);
  float dn = dot(d, uSpotN);
  float near = 0.0;${o.own ? `
  float own = 0.0;
  vec3 ownSum = vec3(0.0);` : ''}${o.minor ? `
  float drawn = 0.0;` : ''}
  if (uPatchCount > 0.5) {
    float inv = 1.0 / max(dn, 0.05);
    vec2 g = vec2(dot(d, uSpotE), dot(d, uSpotU)) * inv;
    vec2 gx = dFdx(g);
    vec2 gy = dFdy(g);
    float gd = sqrt(max(dot(gx, gx), dot(gy, gy)));${o.minor ? `
    float ga = abs(gx.x * gy.y - gx.y * gy.x) / max(gd, 1e-20);
    vec3 wx = dFdx(d);
    vec3 wy = dFdy(d);
    float wd = sqrt(max(dot(wx, wx), dot(wy, wy)));
    float thin = length(cross(wx, wy)) / max(wd, 1e-20) * uMapWidth / (2.0 * PI);
    float cap = wd / uMapAniso * uMapWidth / (2.0 * PI);
    float fine = max(thin, cap);
    drawn = thin / max(cap, 1.0);` : ''}
    gx *= uGrad;
    gy *= uGrad;
    float front = step(0.3, dn);
    float parent = texels;
${patchLevels(o)}
  }
  vec3 east = cross(vec3(0.0, 1.0, 0.0), d);
  float el = length(east);
  east = el > 1e-4 ? east / el : vec3(1.0, 0.0, 0.0);
  vec3 north = cross(d, east);
  float e = uHeightStep;
  float hE = heightAt(normalize(d + east * e)) - heightAt(normalize(d - east * e));
  float hN = heightAt(normalize(d + north * e)) - heightAt(normalize(d - north * e));
  vec3 slope = (east * hE + north * hN) / (2.0 * e);
  vec3 slopeW = uBodyToWorld * spinY(slope, -uSpin);
  float strength = mix(uRelief, uReliefNear, near) * (1.0 - detail);
  vec3 np = normalize(n - slopeW * strength);
  float ndl = dot(np, uSunW);
  float lift = clamp((ndl - ndl0) / max(ndl0 + uWrap, 0.06), -0.85, 1.6);
  vec3 shade = max(curveAt(ndl0) - uNight, vec3(0.0)) * (1.0 + lift) * mix(1.0, pow(mu, 0.35), uLimb) + uNight;
  vec3 lin = inverseFilmic(albedo);
  if (uNightFlat.x > 0.0) {
    float dark = 1.0 - smoothstep(uNightFlat.y, uNightFlat.z, ndl0);
    float l = dot(lin, vec3(0.2126, 0.7152, 0.0722));
    lin *= mix(1.0, 2.0 / (1.0 + l / uNightFlat.x), dark);
  }
  vec3 col = lin * shade * uTint;${o.own ? `
  if (own > 0.0) col = mix(col, inverseFilmic(ownSum / own)${o.gain ? ' * uOwnGain' : ''}, own);` : ''}
  vec3 at;
  float tau = hazeDepth(dir, true, at);
  col = col * exp(-tau * uExtinction) + hazeLight(n, dir) * (1.0 - exp(-tau));
  if (uGrazingShape.x > 0.0) {
    float width = mix(uGrazingShape.z, uGrazingShape.y, grazingDay);
    float path = exp(-pow(mu / width, uGrazingShape.w));
    float transmit = exp(-uGrazingShape.x * path * grazingDay * grazingSide);
    float highlight = smoothstep(uGrazingRange.x, uGrazingRange.y, dot(n, uGrazingSun));
    vec3 pale = mix(uGrazingDusk, uGrazingFill + uGrazingHighlight * highlight, grazingDay) * hazeForward(dir);
    col = mix(pale, col, transmit);
  }
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain * uWeight / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = diagOut(vec4(col, 1.0), texels, 1.0, vec3(0.15, 0.45, 0.9), vec2(flow * 8.0, 0.0), length(vView));${o.minor ? `
  if (uDiag == 2 && uPatchCount > 0.5) outColor.b = clamp(drawn * 0.5, 0.0, 1.0);` : ''}
}`

function curve(l: PlanetLight): THREE.Vector3[] {
  const out: THREE.Vector3[] = []
  for (let i = 0; i < CURVE_KNOTS; i++) {
    const given = l.curve?.[i]
    if (given) {
      out.push(new THREE.Vector3(given[0], given[1], given[2]))
      continue
    }
    const ndl = (i / (CURVE_KNOTS - 1)) * 2 - 1
    const base = Math.pow(Math.min(Math.max((ndl + l.wrap) / (1 + l.wrap), 0), 1), l.power) * l.gain
    out.push(new THREE.Vector3(l.sun[0] * base + l.night[0], l.sun[1] * base + l.night[1], l.sun[2] * base + l.night[2]))
  }
  return out
}

export class Planet {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly bodyToWorld = new THREE.Matrix3()
  private readonly m4 = new THREE.Matrix4()

  constructor(o: PlanetOptions) {
    const p = o.patches
    const g = o.grazing
    const tex = (i: number): THREE.Texture | null => p?.textures[i] ?? p?.textures[0] ?? null
    const scale = (i: number): number => {
      const w = p?.widthsDeg[i]
      return w ? 1 / (2 * Math.tan(THREE.MathUtils.degToRad(w) / 2)) : 1
    }
    const size = (i: number): number => (p?.textures[i]?.image as unknown as { width: number } | undefined)?.width ?? 1
    const slots = patchSlots(p?.textures.length ?? 0)
    const levels = Array.from({ length: slots }, (_, i) => i)
    if (p?.own && p.own.length !== p.textures.length) throw new Error('own needs one entry per patch level')
    const own = p?.own?.some((x) => x) === true
    const gain = p?.ownGain === true
    if (gain && !own) throw new Error('ownGain needs an own level')
    const minor = p?.fadeMinor === true
    const aniso = (t: THREE.Texture | undefined): number => Math.max(t?.anisotropy ?? 1, 1)
    const spot = p?.spot.clone().normalize() ?? new THREE.Vector3(0, 0, 1)
    const east = new THREE.Vector3(0, 1, 0).cross(spot).normalize()
    const north = spot.clone().cross(east)
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: frag({ slots, own, gain, minor, glow: o.haze.glow === true }),
      uniforms: {
        ...hazeUniforms(o.haze),
        uGrazingShape: { value: new THREE.Vector4(g?.depth ?? 0, g?.width ?? 1, g?.duskWidth ?? 1, g?.power ?? 1) },
        uGrazingDay: { value: new THREE.Vector2(g?.dayFrom ?? 0, g?.dayTo ?? 1) },
        uGrazingFill: { value: new THREE.Vector3().fromArray(g?.fill ?? [0, 0, 0]) },
        uGrazingHighlight: { value: new THREE.Vector3().fromArray(g?.highlight ?? [0, 0, 0]) },
        uGrazingDusk: { value: new THREE.Vector3().fromArray(g?.dusk ?? [0, 0, 0]) },
        uGrazingSun: { value: new THREE.Vector3() },
        uGrazingRange: { value: new THREE.Vector2(g?.highlightFrom ?? 0, g?.highlightTo ?? 1) },
        uGrazingSide: { value: new THREE.Vector3() },
        uGrazingSideRange: { value: new THREE.Vector2(g?.sideFrom ?? 0, g?.sideTo ?? 1) },
        uGrazingDetail: { value: new THREE.Vector4(g?.detailFrom ?? 0, g?.detailTo ?? 1, g?.detailBlur ?? 0, 0) },
        uMap: { value: o.map }, uHeight: { value: o.height }, uStorm: { value: o.storm?.mask ?? o.map },
        ...Object.fromEntries(levels.map((i) => ['uPatch' + i, { value: tex(i) }])),
        uPatchScale: { value: levels.map(scale) }, uPatchSize: { value: levels.map(size) },
        uPatchNear: { value: levels.map((i) => ((p?.widthsDeg[i] ?? 360) <= (p?.nearDeg ?? 0) ? 1 : 0)) },
        uPatchCount: { value: p?.textures.length ?? 0 },
        ...(own ? { uPatchOwn: { value: levels.map((i) => (p?.own?.[i] ? 1 : 0)) } } : {}),
        ...(gain ? { uOwnGain: { value: new THREE.Vector3(1, 1, 1) } } : {}),
        ...(minor ? { uPatchAniso: { value: levels.map((i) => aniso(p?.textures[i])) }, uMapAniso: { value: aniso(o.map) } } : {}),
        uFeather: { value: p?.feather ?? 0.12 }, uPatchFade: { value: new THREE.Vector2(p?.fade[0] ?? 1.1, p?.fade[1] ?? 1.7) },
        uSpotN: { value: spot }, uSpotE: { value: east }, uSpotU: { value: north },
        uStormAxis: { value: o.storm?.axis.clone().normalize() ?? new THREE.Vector3(0, 1, 0) },
        uStormRadius: { value: o.storm?.radius ?? 1 }, uStormAngle: { value: 0 }, uHasStorm: { value: o.storm ? 1 : 0 },
        uMapWidth: { value: o.mapWidth }, uHeightStep: { value: (2 * Math.PI) / o.heightWidth },
        uSpin: { value: 0 }, uGain: { value: 1 }, uWeight: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uTint: { value: new THREE.Vector3(1, 1, 1) },
        uWrap: { value: o.light.wrap }, uCurve: { value: curve(o.light) }, uNight: { value: new THREE.Vector3().fromArray(o.light.night) },
        uNightFlat: { value: new THREE.Vector3().fromArray(o.light.nightFlat ?? [0, 0, 0]) },
        uRelief: { value: o.light.relief }, uReliefNear: { value: o.light.reliefNear }, uLimb: { value: o.light.limb },
        uExtinction: { value: o.haze.extinction },
        uBodyToWorld: { value: this.bodyToWorld },
        uDiag: diagUniform, uGrad: gradUniform, uImplicit: implicitUniform,
      },
    })
    const seg = o.segments ?? 320
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, seg, seg / 2), this.material)
  }

  update(camera: THREE.Vector3, sun: THREE.Vector3, spin: number, gain: number, weight: number): void {
    const u = this.material.uniforms
    ;(u.uCam!.value as THREE.Vector3).copy(camera)
    ;(u.uSunW!.value as THREE.Vector3).copy(sun)
    u.uSpin!.value = spin
    u.uGain!.value = gain
    u.uWeight!.value = weight
    this.mesh.updateWorldMatrix(true, false)
    this.bodyToWorld.setFromMatrix4(this.m4.extractRotation(this.mesh.matrixWorld))
  }

  setAir(air: GlobeAir): void {
    const u = this.material.uniforms
    u.uLimb!.value = air.limb
    ;(u.uTint!.value as THREE.Vector3).fromArray(air.tint)
    setHazeAir(u, air.haze)
  }

  setOwnGain(gain: [number, number, number]): void {
    const u = this.material.uniforms.uOwnGain
    if (!u) throw new Error('this planet has no own gain')
    ;(u.value as THREE.Vector3).fromArray(gain)
  }

  setGlow(direction: THREE.Vector3, colour: [number, number, number], power: number): void {
    setHazeGlow(this.material.uniforms, direction, colour, power)
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
