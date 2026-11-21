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
  twinkle: [number, number, number, number]
  bloomPre: [number, number, number]
  ripple: [number, number, number]
  dusk: { zone: number[]; fade: number; centre: number[] }
  away: { tone: number[]; land: number[]; landAt: number[]; flat: number[]; soft: number; dim: number; gate: number[]; fine: number[]; far: { light: number[]; cap: number[]; rim: number[]; gold: number[]; ring: number[]; zone: number[]; east: number[] } }
}

export interface GlobeOptions {
  map: THREE.Texture
  mapWidth: number
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

const PATCH_SAMPLERS = Array.from({ length: MAX_PATCHES }, (_, i) => 'uniform sampler2D uPatch' + i + ';').join('\n')

const PATCH_LEVELS = Array.from({ length: MAX_PATCHES }, (_, i) => `    if (uPatchCount > ${i}.5) {
      vec2 q = g * uPatchScale[${i}];
      float w = front * smoothstep(0.5, 0.5 - uFeather, max(abs(q.x), abs(q.y))) * (1.0 - smoothstep(uPatchFade.x, uPatchFade.y, parent));
      for (int k = 0; k < (w > 0.0 ? 1 : 0); k++) albedo = mix(albedo, textureGrad(uPatch${i}, q + 0.5, gx * uPatchScale[${i}], gy * uPatchScale[${i}]).rgb, w);
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
uniform vec2 uLandAt;
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
  vec3 n = uBodyToWorld * normalize(vLocal);
  float mu = clamp(dot(n, normalize(uEye - n)), 0.0, 1.0);
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
    farLights = far.a * far.a;
  }
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
  float deep = uAway * ramp(uNightFlat.xy, ndl) * past;
  vec3 lin = inverseFilmic(albedo);
  vec3 nightLin = inverseFilmic(mix(uNightTone, uNightLand, smoothstep(uLandAt.x, uLandAt.y, lin.r / max(lin.b, 0.002))));
  lin = mix(lin, nightLin, deep);
  float dim = 1.0 - uNightFlat.w * uAway * ramp(uNightFlat.xy, ndl) * fade;
  float live = uCloudOn * (1.0 - baked);
  vec3 q = cloudDir(d);
  vec4 cloud = equirectGrad(uCloud, q, uGrad * (1.0 + uNightFlat.z * bad));
  cloud.rgb = mix(cloud.rgb, vec3(dot(cloud.rgb, vec3(1.0 / 3.0))), bad);
  for (int k = 0; k < (uAway > 0.0 ? 1 : 0); k++) {
    vec4 fc = equirectGrad(uFarCloud, q, uGrad);
    float fine = fc.a - textureLod(uFarCloud, lonLat(q), uFine.y).a;
    cloud *= 1.0 + uAway * uFine.x * fine * (1.0 - drift);
    cloud = mix(cloud, fc, drift);
  }
  float a = cloud.a * live;
  vec3 sunM = spinY(uSunW * uBodyToWorld, uSpin);
  vec3 toward = sunM - d * ndl;
  vec3 p = normalize(d + toward * (uShadow.x / max(ndl, uShadow.w)));
  float thrown = textureLod(uCloud, lonLat(cloudDir(p)), uShadow.z - uFine.w * uAway).a * (1.0 - drift);
  float shadow = 1.0 - mix(uShadow.y, uFine.z, uAway) * thrown * smoothstep(-0.05, 0.1, ndl) * live;
  vec3 shade = curveAt(ndl);
  vec3 col = (lin * shadow * (1.0 - a) + inverseFilmic(cloud.rgb) * live * dim) * shade * uTint;
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
  col += e.rgb * (uPeak * mix(gate * twinkle * uTwinkle.w, dusk, zone * (1.0 - uRise)));
  float wave = uRipple.z * uv.x * 6.2831853 + 5.0 * noise(uv * vec2(2.0, 1.0) * uRipple.w);
  float ripple = 1.0 + uRipple.x * (sin(uRipple.y * uClock + wave) - sin(wave));
  col += uAuroraColor * (e.a * e.a * uPeak * ramp(uAuroraGate, ndl) * ripple * (1.0 - uAway));
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
        uMap: { value: o.map }, uCloud: { value: o.cloud }, uEmissive: { value: o.emissive }, uFar: { value: o.far }, uFarCloud: { value: o.farCloud }, uRise: { value: 0 }, uFine: { value: new THREE.Vector4().fromArray(l.away.fine) }, uFarRing: { value: new THREE.Vector3().fromArray(l.away.far.ring) },
        ...Object.fromEntries(levels.map((i) => ['uPatch' + i, { value: tex(i) }])),
        uPatchScale: { value: levels.map(scale) }, uPatchSize: { value: levels.map(size) },
        uPatchCount: { value: p?.textures.length ?? 0 },
        uFeather: { value: p?.feather ?? 0.12 }, uPatchFade: { value: new THREE.Vector2(p?.fade[0] ?? 1.1, p?.fade[1] ?? 1.7) },
        uSpotN: { value: spot }, uSpotE: { value: east }, uSpotU: { value: north },
        uMapWidth: { value: o.mapWidth },
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
        uNight: { value: new THREE.Vector2(l.night[0], l.night[1]) }, uAuroraGate: { value: new THREE.Vector2(l.auroraGate[0], l.auroraGate[1]) },
        uPeak: { value: l.emissivePeak }, uBloomPre: { value: new THREE.Vector4(0, l.bloomPre[0], l.bloomPre[1], l.bloomPre[2]) }, uAuroraColor: { value: new THREE.Vector3().fromArray(l.auroraColor) },
        uTwinkle: { value: new THREE.Vector4().fromArray(l.twinkle) }, uRipple: { value: new THREE.Vector4(l.ripple[0], l.ripple[1], l.ripple[2], 40) },
        uClock: { value: 0 }, uCloudOn: { value: 1 },
        uSunHold: { value: o.sunHold.clone().normalize() }, uCentreHold: { value: direction(l.dusk.centre[0]!, l.dusk.centre[1]!) },
        uDuskZone: { value: new THREE.Vector4().fromArray(l.dusk.zone) }, uDuskFade: { value: l.dusk.fade },
        uAway: { value: 0 }, uNightTone: { value: new THREE.Vector3().fromArray(l.away.tone) }, uNightFlat: { value: new THREE.Vector4(l.away.flat[0], l.away.flat[1], l.away.soft, l.away.dim) }, uNightGate: { value: new THREE.Vector2(l.away.gate[0], l.away.gate[1]) },
        uFarLight: { value: new THREE.Vector4(l.away.far.light[0], l.away.far.light[1], Math.cos(rad(l.away.far.cap[4]!)), Math.cos(rad(l.away.far.cap[3]!))) },
        uFarCap: { value: new THREE.Vector4(...direction(l.away.far.cap[0]!, l.away.far.cap[1]!).toArray(), l.away.far.cap[2]) },
        uFarRim: { value: new THREE.Vector2(l.away.far.rim[0], l.away.far.rim[1]) }, uFarZone: { value: new THREE.Vector2(l.away.far.zone[0], l.away.far.zone[1]) }, uFarEast: { value: direction(l.away.far.east[0]! + 90, 0) }, uFarEdge: { value: new THREE.Vector4(l.away.far.east[1], l.away.far.east[2], l.away.far.east[3], l.away.far.east[4]) }, uGold: { value: new THREE.Vector3().fromArray(l.away.far.gold) },
        uNightLand: { value: new THREE.Vector3().fromArray(l.away.land) }, uLandAt: { value: new THREE.Vector2(l.away.landAt[0], l.away.landAt[1]) },
        uDiag: diagUniform, uGrad: gradUniform,
      },
    })
    const seg = o.segments ?? 320
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, seg, seg / 2), this.material)
  }

  update(sun: THREE.Vector3, eye: THREE.Vector3, rotation: THREE.Quaternion, spin: number, gain: number, weight: number, flow: number, clock: number, away: number, rise: number): void {
    const u = this.material.uniforms
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
