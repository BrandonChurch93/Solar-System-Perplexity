import * as THREE from 'three'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { EQUIRECT_GLSL } from '../../space/sky'

export interface GlobePatches {
  textures: THREE.Texture[]
  widthsDeg: number[]
  spot: THREE.Vector3
  feather: number
  fade: [number, number]
}

export interface GlobeLook {
  curve: number[][]
  limb: { pale: number[]; night: number[]; depth: number[]; width: number; power: number; gamma: number; dayFrom: number; dayTo: number }
  drift: { degPerSecond: number; ease: number }
  storm: { lon: number; lat: number; degPerSecond: number; coreDeg: number; fadeDeg: number[] }
  shadow: { height: number; strength: number; lod: number; floor: number }
  night: number[]
  auroraGate: number[]
  emissivePeak: number
  auroraColor: [number, number, number]
  twinkle: [number, number, number]
  ripple: [number, number, number]
}

export interface GlobeOptions {
  map: THREE.Texture
  mapWidth: number
  cloud: THREE.Texture
  emissive: THREE.Texture
  look: GlobeLook
  patches?: GlobePatches
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

export const MAX_PATCHES = 6

const PATCH_SAMPLERS = Array.from({ length: MAX_PATCHES }, (_, i) => 'uniform sampler2D uPatch' + i + ';').join('\n')

const PATCH_LEVELS = Array.from({ length: MAX_PATCHES }, (_, i) => `    if (uPatchCount > ${i}.5) {
      vec2 q = g * uPatchScale[${i}];
      float w = front * smoothstep(0.5, 0.5 - uFeather, max(abs(q.x), abs(q.y))) * (1.0 - smoothstep(uPatchFade.x, uPatchFade.y, parent));
      if (w > 0.0) albedo = mix(albedo, textureGrad(uPatch${i}, q + 0.5, gx * uPatchScale[${i}], gy * uPatchScale[${i}]).rgb, w);
      parent = gd * uPatchScale[${i}] * uPatchSize[${i}];
      texels = mix(texels, parent, step(0.5, w));
      baked = max(baked, w);
    }`).join('\n')

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform sampler2D uCloud;
uniform sampler2D uEmissive;
${PATCH_SAMPLERS}
uniform float uPatchScale[${MAX_PATCHES}];
uniform float uPatchSize[${MAX_PATCHES}];
uniform float uPatchCount;
uniform float uFeather;
uniform vec2 uPatchFade;
uniform vec3 uSpotN;
uniform vec3 uSpotE;
uniform vec3 uSpotU;
uniform float uMapWidth;
uniform float uGrad;
uniform float uSpin;
uniform float uGain;
uniform float uWeight;
uniform vec3 uTint;
uniform vec3 uCurve[33];
uniform mat3 uBodyToWorld;
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
uniform vec3 uAuroraColor;
uniform vec4 uTwinkle;
uniform vec4 uRipple;
uniform float uClock;
uniform float uCloudOn;
in vec3 vClip;
in vec3 vLocal;
in vec3 vWorldN;
in vec3 vPos;
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
void main() {
  vec3 d = spinY(normalize(vLocal), uSpin);
  vec3 n = normalize(vWorldN);
  vec3 dir = normalize(vPos);
  float mu = clamp(dot(n, -dir), 0.0, 1.0);
  float ndl = dot(n, uSunW);
  vec3 albedo = equirectGrad(uMap, d, uGrad).rgb;
  float texels = diagTexelsDir(d, uMapWidth);
  float dn = dot(d, uSpotN);
  float baked = 0.0;
  if (uPatchCount > 0.5) {
    float inv = 1.0 / max(dn, 0.05);
    vec2 g = vec2(dot(d, uSpotE), dot(d, uSpotU)) * inv;
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
  float live = uCloudOn * (1.0 - baked);
  vec3 q = cloudDir(d);
  vec4 cloud = equirectGrad(uCloud, q, uGrad);
  float a = cloud.a * live;
  vec3 sunM = spinY(uSunW * uBodyToWorld, uSpin);
  vec3 toward = sunM - d * ndl;
  vec3 p = normalize(d + toward * (uShadow.x / max(ndl, uShadow.w)));
  float thrown = textureLod(uCloud, lonLat(cloudDir(p)), uShadow.z).a;
  float shadow = 1.0 - uShadow.y * thrown * smoothstep(-0.05, 0.1, ndl) * live;
  vec3 shade = curveAt(ndl);
  vec3 col = (lin * shadow * (1.0 - a) + inverseFilmic(cloud.rgb) * a) * shade * uTint;
  float f = exp(-pow(mu / uLimbShape.x, uLimbShape.y));
  vec3 through = exp(-uLimbDepth * f);
  float lit = pow(shade.g * 0.5, uLimbShape.z) * ramp(uLimbDay, ndl);
  col = col * through + (uLimbPale * lit + uLimbNight) * (1.0 - through);
  vec4 e = equirectGrad(uEmissive, d, uGrad);
  vec2 uv = lonLat(d);
  float phase = 6.2831853 * noise(uv * vec2(2.0, 1.0) * uTwinkle.z);
  float twinkle = 1.0 + uTwinkle.x * (sin(uTwinkle.y * uClock + phase) - sin(phase));
  col += e.rgb * (uPeak * ramp(uNight, ndl) * twinkle);
  float wave = uRipple.z * uv.x * 6.2831853 + 5.0 * noise(uv * vec2(2.0, 1.0) * uRipple.w);
  float ripple = 1.0 + uRipple.x * (sin(uRipple.y * uClock + wave) - sin(wave));
  col += uAuroraColor * (e.a * e.a * uPeak * ramp(uAuroraGate, ndl) * ripple);
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
  private readonly stormHome: THREE.Vector3
  private readonly look: GlobeLook

  constructor(o: GlobeOptions) {
    const p = o.patches
    const l = o.look
    this.look = l
    const tex = (i: number): THREE.Texture | null => p?.textures[i] ?? p?.textures[0] ?? null
    const scale = (i: number): number => {
      const w = p?.widthsDeg[i]
      return w ? 1 / (2 * Math.tan(THREE.MathUtils.degToRad(w) / 2)) : 1
    }
    const size = (i: number): number => (p?.textures[i]?.image as unknown as { width: number } | undefined)?.width ?? 1
    const levels = Array.from({ length: MAX_PATCHES }, (_, i) => i)
    if ((p?.textures.length ?? 0) > MAX_PATCHES) throw new Error('too many patch levels')
    const spot = p?.spot.clone().normalize() ?? new THREE.Vector3(0, 0, 1)
    const east = new THREE.Vector3(0, 1, 0).cross(spot).normalize()
    const north = spot.clone().cross(east)
    this.stormHome = direction(l.storm.lon, l.storm.lat)
    const rad = THREE.MathUtils.degToRad
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uMap: { value: o.map }, uCloud: { value: o.cloud }, uEmissive: { value: o.emissive },
        ...Object.fromEntries(levels.map((i) => ['uPatch' + i, { value: tex(i) }])),
        uPatchScale: { value: levels.map(scale) }, uPatchSize: { value: levels.map(size) },
        uPatchCount: { value: p?.textures.length ?? 0 },
        uFeather: { value: p?.feather ?? 0.12 }, uPatchFade: { value: new THREE.Vector2(p?.fade[0] ?? 1.1, p?.fade[1] ?? 1.7) },
        uSpotN: { value: spot }, uSpotE: { value: east }, uSpotU: { value: north },
        uMapWidth: { value: o.mapWidth },
        uSpin: { value: 0 }, uGain: { value: 1 }, uWeight: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uTint: { value: new THREE.Vector3(1, 1, 1) },
        uCurve: { value: l.curve.map((c) => new THREE.Vector3(c[0], c[1], c[2])) },
        uBodyToWorld: { value: this.bodyToWorld },
        uSunW: { value: new THREE.Vector3(1, 0, 0) },
        uFlow: { value: 0 }, uDrift: { value: rad(l.drift.degPerSecond) },
        uStormAxis: { value: this.stormHome.clone() },
        uStorm: { value: new THREE.Vector4(rad(l.storm.degPerSecond), rad(l.storm.coreDeg), rad(l.storm.fadeDeg[0]!), rad(l.storm.fadeDeg[1]!)) },
        uShadow: { value: new THREE.Vector4(l.shadow.height, l.shadow.strength, l.shadow.lod + Math.log2(o.mapWidth / 8192), l.shadow.floor) },
        uLimbPale: { value: new THREE.Vector3().fromArray(l.limb.pale) }, uLimbNight: { value: new THREE.Vector3().fromArray(l.limb.night) }, uLimbDepth: { value: new THREE.Vector3().fromArray(l.limb.depth) },
        uLimbShape: { value: new THREE.Vector4(l.limb.width, l.limb.power, l.limb.gamma, 0) }, uLimbDay: { value: new THREE.Vector2(l.limb.dayFrom, l.limb.dayTo) },
        uNight: { value: new THREE.Vector2(l.night[0], l.night[1]) }, uAuroraGate: { value: new THREE.Vector2(l.auroraGate[0], l.auroraGate[1]) },
        uPeak: { value: l.emissivePeak }, uAuroraColor: { value: new THREE.Vector3().fromArray(l.auroraColor) },
        uTwinkle: { value: new THREE.Vector4(l.twinkle[0], l.twinkle[1], l.twinkle[2], 0) }, uRipple: { value: new THREE.Vector4(l.ripple[0], l.ripple[1], l.ripple[2], 40) },
        uClock: { value: 0 }, uCloudOn: { value: 1 },
        uDiag: diagUniform, uGrad: gradUniform,
      },
    })
    const seg = o.segments ?? 320
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, seg, seg / 2), this.material)
  }

  update(sun: THREE.Vector3, spin: number, gain: number, weight: number, flow: number, clock: number): void {
    const u = this.material.uniforms
    ;(u.uSunW!.value as THREE.Vector3).copy(sun)
    u.uSpin!.value = spin
    u.uGain!.value = gain
    u.uWeight!.value = weight
    u.uFlow!.value = flow
    u.uClock!.value = clock
    const home = this.stormHome
    const lat = Math.asin(Math.min(Math.max(home.y, -1), 1))
    const a = -THREE.MathUtils.degToRad(this.look.drift.degPerSecond) * -Math.cos(3 * lat) * flow
    const c = Math.cos(a)
    const s = Math.sin(a)
    ;(u.uStormAxis!.value as THREE.Vector3).set(c * home.x - s * home.z, home.y, s * home.x + c * home.z)
    this.mesh.updateWorldMatrix(true, false)
    this.bodyToWorld.setFromMatrix4(this.m4.extractRotation(this.mesh.matrixWorld))
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
