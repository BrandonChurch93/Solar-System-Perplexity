import * as THREE from 'three'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { EQUIRECT_GLSL } from '../../space/sky'

export interface GlobeLight {
  curve: number[][]
  limb: number[][]
  limbTo: number
  night: [number, number, number]
  wrap: number
  relief: number
  reliefNear: number
  reliefDay: number
  reliefRange: [number, number]
  edge: number
  rim: { color: [number, number, number]; width: number; wide: number; wideGain: number }
}

export interface GlobePatches {
  textures: THREE.Texture[]
  widthsDeg: number[]
  spot: THREE.Vector3
  feather: number
  fade: [number, number]
  nearDeg: number
}

export interface GlobeOptions {
  map: THREE.Texture
  mapWidth: number
  height: THREE.Texture
  heightWidth: number
  light: GlobeLight
  patches?: GlobePatches
}

export const SHELL = 1.3
export const MAX_PATCHES = 6

const VERT = /* glsl */ `
out vec3 vPos;
out vec3 vClip;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
  vClip = gl_Position.xyw;
}`

const PATCH_SAMPLERS = Array.from({ length: MAX_PATCHES }, (_, i) => 'uniform sampler2D uPatch' + i + ';').join('\n')

const PATCH_LEVELS = Array.from({ length: MAX_PATCHES }, (_, i) => `    if (uPatchCount > ${i}.5) {
      vec2 q = g * uPatchScale[${i}];
      float w = front * smoothstep(0.5, 0.5 - uFeather, max(abs(q.x), abs(q.y))) * (1.0 - smoothstep(uPatchFade.x, uPatchFade.y, parent));
      if (w > 0.0) albedo = mix(albedo, textureGrad(uPatch${i}, q + 0.5, gx * uPatchScale[${i}], gy * uPatchScale[${i}]).rgb, w);
      parent = gd * uPatchScale[${i}] * uPatchSize[${i}];
      texels = mix(texels, parent, step(0.5, w));
      near = max(near, w * uPatchNear[${i}]);
    }`).join('\n')

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform sampler2D uHeight;
${PATCH_SAMPLERS}
uniform float uPatchScale[${MAX_PATCHES}];
uniform float uPatchSize[${MAX_PATCHES}];
uniform float uPatchNear[${MAX_PATCHES}];
uniform float uPatchCount;
uniform float uFeather;
uniform vec2 uPatchFade;
uniform vec3 uSpotN;
uniform vec3 uSpotE;
uniform vec3 uSpotU;
uniform float uMapWidth;
uniform float uGrad;
uniform float uHeightStep;
uniform float uSpin;
uniform float uGain;
uniform float uWeight;
uniform vec3 uTint;
uniform float uWrap;
uniform vec3 uCurve[33];
uniform vec3 uLimb[17];
uniform float uLimbTo;
uniform vec3 uNight;
uniform vec4 uRelief;
uniform vec2 uReliefRange;
uniform float uEdge;
uniform vec3 uRimColor;
uniform float uRimWide;
uniform vec3 uRimDir;
uniform vec2 uRimWidth;
uniform mat3 uBodyToWorld;
uniform vec3 uCenter;
uniform vec3 uSunW;
uniform float uVignette;
uniform float uAspect;
in vec3 vPos;
in vec3 vClip;
out vec4 outColor;
${EQUIRECT_GLSL}
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
vec3 spinY(vec3 d, float a) {
  float c = cos(a), s = sin(a);
  return vec3(c * d.x - s * d.z, d.y, s * d.x + c * d.z);
}
float heightAt(vec3 d) {
  float u = atan(d.x, d.z) / (2.0 * PI) + 0.5;
  float v = asin(clamp(d.y, -1.0, 1.0)) / PI + 0.5;
  return textureLod(uHeight, vec2(u, v), 0.0).r;
}
vec3 curveAt(float ndl) {
  float x = clamp(ndl * 0.5 + 0.5, 0.0, 1.0) * 32.0;
  int i = int(min(floor(x), 31.0));
  return mix(uCurve[i], uCurve[i + 1], x - float(i));
}
vec3 limbAt(float mu) {
  float x = clamp(mu / uLimbTo, 0.0, 1.0) * 16.0;
  int i = int(min(floor(x), 15.0));
  return mix(uLimb[i], uLimb[i + 1], x - float(i));
}
void main() {
  vec3 ray = normalize(vPos);
  vec3 oc = -uCenter;
  float b = dot(oc, ray);
  float c = dot(oc, oc) - 1.0;
  float s = sqrt(max(dot(oc, oc) - b * b, 0.0));
  float px = max(fwidth(s), 1e-7);
  float cov = c > 0.0 ? clamp(0.5 + (1.0 - s) / (px * uEdge), 0.0, 1.0) : 1.0;
  if (c > 0.0 && b > 0.0) cov = 0.0;
  float h = b * b - c;
  float t = -b - sqrt(max(h, 0.0));
  vec3 n = normalize(oc + ray * t);
  float out1 = max(s - 1.0, 0.0);
  float ndlRim = dot(n, uSunW);
  vec3 rim = vec3(0.0);
  vec3 d = spinY(n * uBodyToWorld, uSpin);
  if (c > 0.0 && b < 0.0 && cov < 1.0) {
    vec3 lit = max(curveAt(dot(n, uRimDir)) - uNight, vec3(0.0)) * smoothstep(0.0, 0.35, ndlRim);
    float fall = exp(-out1 / uRimWidth.x) + uRimWide * exp(-out1 / uRimWidth.y);
    rim = uRimColor * lit * fall * (1.0 - cov);
  }
  float mu = clamp(dot(n, -ray), 0.0, 1.0);
  vec3 albedo = equirectGrad(uMap, d, uGrad).rgb;
  float texels = diagTexelsDir(d, uMapWidth);
  float dn = dot(d, uSpotN);
  float near = 0.0;
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
  vec3 east = cross(vec3(0.0, 1.0, 0.0), d);
  float el = length(east);
  east = el > 1e-4 ? east / el : vec3(1.0, 0.0, 0.0);
  vec3 north = cross(d, east);
  float e = uHeightStep;
  float hE = heightAt(normalize(d + east * e)) - heightAt(normalize(d - east * e));
  float hN = heightAt(normalize(d + north * e)) - heightAt(normalize(d - north * e));
  vec3 slope = (east * hE + north * hN) / (2.0 * e);
  vec3 slopeW = uBodyToWorld * spinY(slope, -uSpin);
  float ndl0 = dot(n, uSunW);
  float dusk = 1.0 - smoothstep(uReliefRange.x, uReliefRange.y, ndl0);
  float strength = mix(mix(uRelief.z, uRelief.x, dusk), uRelief.y, near) * smoothstep(0.0, 0.12, mu);
  vec3 np = normalize(n - slopeW * strength);
  float ndl = dot(np, uSunW);
  float lift = clamp((ndl - ndl0) / max(ndl0 + uWrap, 0.06), -0.85, 1.6);
  vec3 shade = max(curveAt(ndl0) - uNight, vec3(0.0)) * limbAt(mu) * (1.0 + lift) + uNight;
  vec3 col = inverseFilmic(albedo) * shade * uTint;
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  float k = uGain * uWeight / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  vec4 beauty = vec4((col * cov + rim) * k, cov);
  if (uDiag >= 2 ? cov < 0.5 : cov <= 0.0 && dot(rim, vec3(1.0)) < 1e-6) discard;
  outColor = diagOut(beauty, texels, 1.0, vec3(0.55, 0.5, 0.45), vec2(0.0), t);
}`

export class Globe {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly bodyToWorld = new THREE.Matrix3()
  private readonly m4 = new THREE.Matrix4()
  private readonly center = new THREE.Vector3()
  private readonly edge: number
  private readonly rim: [number, number]
  private readonly axis = new THREE.Vector3()

  constructor(o: GlobeOptions) {
    const p = o.patches
    const l = o.light
    this.edge = l.edge
    this.rim = [l.rim.width, l.rim.wide]
    if ((p?.textures.length ?? 0) > MAX_PATCHES) throw new Error('too many patch levels')
    const tex = (i: number): THREE.Texture | null => p?.textures[i] ?? p?.textures[0] ?? null
    const scale = (i: number): number => {
      const w = p?.widthsDeg[i]
      return w ? 1 / (2 * Math.tan(THREE.MathUtils.degToRad(w) / 2)) : 1
    }
    const size = (i: number): number => (p?.textures[i]?.image as unknown as { width: number } | undefined)?.width ?? 1
    const levels = Array.from({ length: MAX_PATCHES }, (_, i) => i)
    const spot = p?.spot.clone().normalize() ?? new THREE.Vector3(0, 0, 1)
    const east = new THREE.Vector3(0, 1, 0).cross(spot).normalize()
    const north = spot.clone().cross(east)
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      side: THREE.BackSide,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      uniforms: {
        uMap: { value: o.map }, uHeight: { value: o.height },
        ...Object.fromEntries(levels.map((i) => ['uPatch' + i, { value: tex(i) }])),
        uPatchScale: { value: levels.map(scale) }, uPatchSize: { value: levels.map(size) },
        uPatchNear: { value: levels.map((i) => ((p?.widthsDeg[i] ?? 360) <= (p?.nearDeg ?? 0) ? 1 : 0)) },
        uPatchCount: { value: p?.textures.length ?? 0 },
        uFeather: { value: p?.feather ?? 0.12 }, uPatchFade: { value: new THREE.Vector2(p?.fade[0] ?? 1.1, p?.fade[1] ?? 1.7) },
        uSpotN: { value: spot }, uSpotE: { value: east }, uSpotU: { value: north },
        uMapWidth: { value: o.mapWidth }, uHeightStep: { value: (2 * Math.PI) / o.heightWidth },
        uSpin: { value: 0 }, uGain: { value: 1 }, uWeight: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uTint: { value: new THREE.Vector3(1, 1, 1) },
        uWrap: { value: l.wrap }, uCurve: { value: l.curve.map((k) => new THREE.Vector3(k[0], k[1], k[2])) }, uLimb: { value: l.limb.map((k) => new THREE.Vector3(k[0], k[1], k[2])) }, uLimbTo: { value: l.limbTo }, uNight: { value: new THREE.Vector3().fromArray(l.night) },
        uRelief: { value: new THREE.Vector4(l.relief, l.reliefNear, l.reliefDay, 0) }, uReliefRange: { value: new THREE.Vector2().fromArray(l.reliefRange) },
        uEdge: { value: l.edge },
        uRimColor: { value: new THREE.Vector3().fromArray(l.rim.color) },
        uRimWide: { value: l.rim.wideGain }, uRimDir: { value: new THREE.Vector3(1, 0, 0) }, uRimWidth: { value: new THREE.Vector2(l.rim.width, l.rim.wide) },
        uBodyToWorld: { value: this.bodyToWorld }, uCenter: { value: this.center }, uSunW: { value: new THREE.Vector3(1, 0, 0) },
        uDiag: diagUniform, uGrad: gradUniform,
      },
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(SHELL, 96, 48), this.material)
    this.mesh.frustumCulled = false
  }

  update(sun: THREE.Vector3, glare: THREE.Vector3, spin: number, gain: number, weight: number, rim: number, vignette: number, aspect: number): void {
    const u = this.material.uniforms
    ;(u.uSunW!.value as THREE.Vector3).copy(sun)
    u.uSpin!.value = spin
    u.uGain!.value = gain
    u.uWeight!.value = weight
    ;(u.uRimWidth!.value as THREE.Vector2).set(this.rim[0] * rim, this.rim[1] * rim)
    u.uEdge!.value = this.edge * Math.max(gradUniform.value, 0.35)
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
    this.mesh.updateWorldMatrix(true, false)
    this.center.setFromMatrixPosition(this.mesh.matrixWorld)
    this.bodyToWorld.setFromMatrix4(this.m4.extractRotation(this.mesh.matrixWorld))
    const axis = this.axis.copy(this.center).normalize()
    const dir = u.uRimDir!.value as THREE.Vector3
    dir.copy(glare).addScaledVector(axis, -glare.dot(axis))
    if (dir.lengthSq() < 1e-6) dir.copy(sun).addScaledVector(axis, -sun.dot(axis))
    dir.normalize()
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
